"""Shared PostgreSQL test setup for Celery and temporary PDF storage."""

import tempfile

from django.test import TestCase, override_settings

from config.celery import app as celery_app


class CeleryEagerTestCase(TestCase):
    """Run tasks in-process and keep generated PDFs out of local media."""

    def setUp(self):
        super().setUp()
        media_directory = tempfile.TemporaryDirectory()
        self.addCleanup(media_directory.cleanup)
        media_override = override_settings(MEDIA_ROOT=media_directory.name)
        media_override.enable()
        self.addCleanup(media_override.disable)

        previous_eager = celery_app.conf.task_always_eager
        previous_propagates = celery_app.conf.task_eager_propagates
        celery_app.conf.update(task_always_eager=True, task_eager_propagates=True)
        self.addCleanup(
            celery_app.conf.update,
            task_always_eager=previous_eager,
            task_eager_propagates=previous_propagates,
        )
