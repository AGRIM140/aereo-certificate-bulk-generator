"""Phase 1 checks for the selected database and application configuration."""

from django.conf import settings
from django.db import connection
from django.test import SimpleTestCase, TestCase

from config.celery import app as celery_app


class ConfigurationTests(SimpleTestCase):
    def test_project_uses_postgresql_and_json_api(self):
        self.assertEqual(settings.DATABASES["default"]["ENGINE"], "django.db.backends.postgresql")
        self.assertIn("certificates", settings.INSTALLED_APPS)
        self.assertIn("rest_framework", settings.INSTALLED_APPS)
        self.assertEqual(
            settings.REST_FRAMEWORK["DEFAULT_PARSER_CLASSES"],
            ["rest_framework.parsers.JSONParser"],
        )
        self.assertTrue(settings.USE_TZ)

    def test_celery_has_redis_broker_and_no_result_backend(self):
        self.assertTrue(settings.CELERY_BROKER_URL.startswith("redis://"))
        self.assertIsNone(settings.CELERY_RESULT_BACKEND)
        self.assertTrue(settings.CELERY_TASK_IGNORE_RESULT)
        self.assertEqual(celery_app.conf.broker_url, settings.CELERY_BROKER_URL)
        self.assertIsNone(celery_app.conf.result_backend)


class PostgreSQLConnectionTests(TestCase):
    def test_test_database_is_postgresql(self):
        with connection.cursor() as cursor:
            cursor.execute("SELECT current_database()")
            database_name = cursor.fetchone()[0]

        self.assertEqual(connection.vendor, "postgresql")
        self.assertTrue(database_name.startswith("test_"))
