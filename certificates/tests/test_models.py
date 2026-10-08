"""Phase 2 tests for PostgreSQL model behavior and constraints."""

import uuid
from datetime import date

from django.db import IntegrityError, connection, transaction
from django.test import TestCase
from django.utils import timezone

from certificates.models import (
    Certificate,
    GenerationJob,
    build_certificate_number,
    certificate_upload_path,
)


class ModelTests(TestCase):
    def make_job(self, **overrides):
        fields = {
            "event_name": "Data Workshop",
            "organization_name": "Example Club",
            "issue_date": date(2026, 10, 8),
        }
        fields.update(overrides)
        return GenerationJob.objects.create(**fields)

    def make_certificate(self, job, row_number, **overrides):
        certificate_id = uuid.uuid4()
        fields = {
            "id": certificate_id,
            "job": job,
            "row_number": row_number,
            "recipient_name": "Ada Lovelace",
            "certificate_number": build_certificate_number(job.issue_date, certificate_id),
        }
        fields.update(overrides)
        return Certificate.objects.create(**fields)

    def test_job_defaults_and_uuid_primary_key(self):
        job = GenerationJob.objects.create(
            event_name="Data Workshop", organization_name="Example Club"
        )

        self.assertIsInstance(job.id, uuid.UUID)
        self.assertEqual(job.status, GenerationJob.Status.PENDING)
        self.assertIsInstance(job.issue_date, date)
        self.assertTrue(timezone.is_aware(job.created_at))
        self.assertIsNone(job.started_at)
        self.assertIsNone(job.finished_at)

    def test_documented_status_and_error_choices(self):
        self.assertEqual(
            set(GenerationJob.Status.values),
            {"PENDING", "PROCESSING", "COMPLETED", "COMPLETED_WITH_ERRORS", "FAILED"},
        )
        self.assertEqual(set(Certificate.Status.values), {"PENDING", "GENERATED", "FAILED"})
        self.assertEqual(set(Certificate.ErrorType.values), {"VALIDATION", "GENERATION"})

    def test_empty_job_progress_is_zero(self):
        job = self.make_job()

        with self.assertNumQueries(1):
            progress = job.get_progress()

        self.assertEqual(
            progress,
            {"total": 0, "generated": 0, "failed": 0, "pending": 0, "percent_complete": 0},
        )

    def test_progress_is_derived_from_certificate_rows_in_one_query(self):
        job = self.make_job()
        first = self.make_certificate(job, 1, status=Certificate.Status.GENERATED)
        self.make_certificate(job, 2, status=Certificate.Status.FAILED)
        self.make_certificate(job, 3)

        with self.assertNumQueries(1):
            progress = job.get_progress()

        self.assertEqual(progress["total"], 3)
        self.assertEqual(progress["generated"], 1)
        self.assertEqual(progress["failed"], 1)
        self.assertEqual(progress["pending"], 1)
        self.assertAlmostEqual(progress["percent_complete"], 200 / 3)

        first.status = Certificate.Status.PENDING
        first.save(update_fields=["status"])
        self.assertEqual(job.get_progress()["generated"], 0)

    def test_certificate_defaults_relation_and_ordering(self):
        job = self.make_job()
        second = self.make_certificate(job, 2)
        first = self.make_certificate(job, 1)

        self.assertEqual(list(job.certificates.values_list("id", flat=True)), [first.id, second.id])
        self.assertEqual(first.status, Certificate.Status.PENDING)
        self.assertEqual(first.error_type, "")
        self.assertIsNone(first.generated_at)
        self.assertTrue(timezone.is_aware(first.created_at))

    def test_row_number_is_unique_within_job_but_not_across_jobs(self):
        first_job = self.make_job()
        other_job = self.make_job()
        self.make_certificate(first_job, 1)
        self.make_certificate(other_job, 1)

        with self.assertRaises(IntegrityError), transaction.atomic():
            self.make_certificate(first_job, 1)

    def test_certificate_number_is_unique_across_jobs(self):
        first_job = self.make_job()
        other_job = self.make_job()
        first = self.make_certificate(first_job, 1)

        with self.assertRaises(IntegrityError), transaction.atomic():
            self.make_certificate(other_job, 1, certificate_number=first.certificate_number)

    def test_certificate_number_uses_issue_year_and_uuid_prefix(self):
        first_id = uuid.UUID("3f9a12bc-47d1-4abb-8bee-97b273314fc0")
        other_id = uuid.UUID("4a9a12bc-47d1-4abb-8bee-97b273314fc0")

        self.assertEqual(
            build_certificate_number(date(2026, 10, 8), first_id),
            "CERT-2026-3F9A12BC47D1",
        )
        self.assertNotEqual(
            build_certificate_number(date(2026, 10, 8), first_id),
            build_certificate_number(date(2026, 10, 8), other_id),
        )

    def test_upload_path_uses_only_job_and_certificate_uuids(self):
        job = self.make_job()
        certificate = self.make_certificate(job, 1, recipient_name="../../unsafe")

        self.assertEqual(
            certificate_upload_path(certificate, "../user-supplied.pdf"),
            f"certificates/{job.id}/{certificate.id}.pdf",
        )

    def test_deleting_job_cascades_to_certificate_rows(self):
        job = self.make_job()
        certificate = self.make_certificate(job, 1)

        job.delete()

        self.assertFalse(Certificate.objects.filter(pk=certificate.pk).exists())

    def test_documented_indexes_exist_in_postgresql(self):
        with connection.cursor() as cursor:
            job_indexes = connection.introspection.get_constraints(
                cursor, GenerationJob._meta.db_table
            )
            certificate_indexes = connection.introspection.get_constraints(
                cursor, Certificate._meta.db_table
            )

        self.assertTrue(
            any(item["index"] and item["columns"] == ["status"] for item in job_indexes.values())
        )
        self.assertTrue(
            any(
                item["index"] and item["columns"] == ["job_id", "status"]
                for item in certificate_indexes.values()
            )
        )
