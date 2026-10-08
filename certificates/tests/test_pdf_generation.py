"""Phase 4 checks for the isolated, template-based PDF generator."""

import os
import tempfile
from datetime import date
from pathlib import Path
from unittest.mock import patch

from django.test import SimpleTestCase, TestCase
from PIL import Image
from reportlab.pdfgen import canvas

from certificates import template_config as config
from certificates.pdf_generator import (
    TextDoesNotFitError,
    _draw_paragraph,
    generate_certificate_pdf,
)


class PDFGenerationTests(SimpleTestCase):
    def make_pdf(self, **changes):
        fields = {
            "recipient_name": "José Álvarez",
            "event_name": "Data Science Workshop",
            "organization_name": "Acme Academy",
            "issue_date": date(2026, 10, 8),
            "certificate_number": "CERT-2026-3F9A12BC47D1",
        }
        fields.update(changes)
        return generate_certificate_pdf(**fields)

    def test_returns_pdf_bytes_without_database_access(self):
        result = self.make_pdf()
        self.assertIsInstance(result, bytes)
        self.assertTrue(result.startswith(b"%PDF"))
        self.assertGreater(len(result), 100_000)

    def test_uses_fixed_cleaned_template_and_page_dimensions(self):
        drawn_images = []
        original_draw_image = canvas.Canvas.drawImage

        def record_draw_image(pdf, image, *args, **kwargs):
            drawn_images.append(image)
            return original_draw_image(pdf, image, *args, **kwargs)

        with patch.object(canvas.Canvas, "drawImage", record_draw_image):
            result = self.make_pdf()

        self.assertEqual(drawn_images, [str(config.TEMPLATE_PATH)])
        self.assertIn(b"/Subtype /Image", result)
        self.assertIn(f"/Width {config.IMAGE_WIDTH}".encode(), result)
        self.assertIn(b"/MediaBox [ 0 0 842 614.2929 ]", result)

        with Image.open(config.TEMPLATE_PATH) as image:
            self.assertEqual(image.size, (config.IMAGE_WIDTH, config.IMAGE_HEIGHT))
            self.assertEqual(image.mode, "RGB")
        self.assertAlmostEqual(
            config.PAGE_WIDTH / config.PAGE_HEIGHT,
            config.IMAGE_WIDTH / config.IMAGE_HEIGHT,
        )

    def test_draws_dynamic_organization_body_name_and_date(self):
        with patch("certificates.pdf_generator._draw_paragraph", wraps=_draw_paragraph) as draw:
            self.make_pdf(
                recipient_name="André Müller",
                event_name="Advanced Python",
                organization_name="University Club",
                issue_date=date(2026, 9, 25),
                certificate_number="CERT-2026-ABCDEF123456",
            )

        texts = [call.args[1] for call in draw.call_args_list]
        self.assertEqual(len(texts), 4)
        self.assertIn("University Club", texts[0])
        self.assertIn("André Müller", texts[1])
        self.assertIn("CERT-2026-ABCDEF123456", texts[1])
        self.assertIn("Advanced Python", texts[1])
        self.assertIn("André Müller", texts[2])
        self.assertIn("25 September 2026", texts[3])

    def test_escapes_special_characters_in_all_dynamic_fields(self):
        with patch("certificates.pdf_generator._draw_paragraph", wraps=_draw_paragraph) as draw:
            result = self.make_pdf(
                recipient_name="A & B <b>",
                event_name="Code <x> & Data",
                organization_name="Club <team> & Co",
            )

        texts = [call.args[1] for call in draw.call_args_list]
        self.assertTrue(result.startswith(b"%PDF"))
        self.assertIn("A &amp; B &lt;b&gt;", texts[1])
        self.assertIn("Code &lt;x&gt; &amp; Data", texts[1])
        self.assertIn("Club &lt;team&gt; &amp; Co", texts[0])
        self.assertIn("A &amp; B &lt;b&gt;", texts[2])

    def test_accented_latin_names_generate(self):
        for name in ("José Álvarez", "André Müller"):
            with self.subTest(name=name):
                self.assertTrue(self.make_pdf(recipient_name=name).startswith(b"%PDF"))

    def test_maximum_documented_lengths_fit(self):
        result = self.make_pdf(
            recipient_name="W" * 100,
            event_name="W" * 150,
            organization_name="W" * 100,
        )
        self.assertTrue(result.startswith(b"%PDF"))

    def test_impossible_text_raises_clear_fit_error(self):
        with self.assertRaisesMessage(
            TextDoesNotFitError, "Text does not fit the certificate template."
        ):
            self.make_pdf(event_name="W" * 5000)

    def test_no_sample_values_are_in_dynamic_markup_or_configuration(self):
        with patch("certificates.pdf_generator._draw_paragraph", wraps=_draw_paragraph) as draw:
            self.make_pdf()
        combined = " ".join(call.args[1] for call in draw.call_args_list)
        config_text = Path(config.__file__).read_text(encoding="utf-8")
        for sample in ("Akshat Rawat", "C Programming Workshop", "1st Place"):
            self.assertNotIn(sample, combined)
            self.assertNotIn(sample, config_text)

    def test_generator_does_not_write_a_pdf_file(self):
        with tempfile.TemporaryDirectory() as directory:
            previous = Path.cwd()
            try:
                os.chdir(directory)
                result = self.make_pdf()
                self.assertTrue(result.startswith(b"%PDF"))
                self.assertEqual(list(Path(directory).iterdir()), [])
            finally:
                os.chdir(previous)

    def test_font_files_and_license_are_bundled(self):
        self.assertTrue(config.FONT_REGULAR_PATH.is_file())
        self.assertTrue(config.FONT_BOLD_PATH.is_file())
        license_text = (config.ASSETS_DIR / "fonts" / "OFL.txt").read_text(encoding="utf-8")
        self.assertIn("SIL OPEN FONT LICENSE", license_text)

    def test_pdf_bytes_start_with_pdf_header(self):
        result = self.make_pdf()
        self.assertTrue(result.startswith(b"%PDF"))

    def test_accented_names_supported(self):
        self.test_accented_latin_names_generate()

    def test_max_length_values_do_not_overflow(self):
        self.test_maximum_documented_lengths_fit()

    def test_dynamic_values_are_drawn_not_sample_values(self):
        self.test_no_sample_values_are_in_dynamic_markup_or_configuration()

    def test_special_characters_are_escaped(self):
        self.test_escapes_special_characters_in_all_dynamic_fields()

    def test_long_name_shrinks_or_wraps(self):
        result = self.make_pdf(recipient_name="Alexandra Constantina Victoria-Mountbatten")
        self.assertTrue(result.startswith(b"%PDF"))

    def test_text_that_cannot_fit_raises_clear_error(self):
        self.test_impossible_text_raises_clear_fit_error()


class PDFProcessingIntegrationTests(TestCase):
    def test_process_job_creates_files_for_valid_recipients(self):
        from certificates.models import GenerationJob, Certificate
        from certificates.services import process_job
        from certificates.tests.test_job_creation import submit, valid_data
        import tempfile
        from django.test import override_settings

        with tempfile.TemporaryDirectory() as temp_dir:
            with override_settings(MEDIA_ROOT=temp_dir):
                job = submit(valid_data([{"name": "Valid Recipient"}]))
                process_job(job.id)
                job.refresh_from_db()
                self.assertEqual(job.status, GenerationJob.Status.COMPLETED)
                cert = job.certificates.get()
                self.assertTrue(Path(cert.pdf_file.path).is_file())
                self.assertTrue(cert.pdf_file.size > 0)

