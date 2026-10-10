"""Production configuration fails closed while local storage stays available."""

import os
import runpy
from unittest.mock import patch

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.test import SimpleTestCase


class DeploymentSettingsTests(SimpleTestCase):
    def configuration(self, **changes):
        environment = {
            "DJANGO_DEBUG": "false", "DJANGO_SECRET_KEY": "synthetic-test-secret",
            "DATABASE_URL": "postgresql://test:test@localhost/test",
            "CELERY_BROKER_URL": "redis://localhost:6379/0",
            "CERTIFICATE_STORAGE": "filesystem",
        }
        environment.update(changes)
        with patch.dict(os.environ, environment):
            return runpy.run_path(str(settings.BASE_DIR / "config/settings.py"))

    def test_local_storage_and_static_backend(self):
        config = self.configuration()
        self.assertEqual(config["STORAGES"]["default"]["BACKEND"], "django.core.files.storage.FileSystemStorage")
        self.assertIn("whitenoise", config["STORAGES"]["staticfiles"]["BACKEND"])
        self.assertFalse(config["DEBUG"])
        self.assertTrue(config["SESSION_COOKIE_SECURE"])

    def test_s3_requires_complete_credentials(self):
        with self.assertRaises(ImproperlyConfigured):
            self.configuration(CERTIFICATE_STORAGE="s3", AWS_ENDPOINT_URL="")

    def bucket_configuration(self, **changes):
        environment = {
            "CERTIFICATE_STORAGE": "s3", "AWS_ENDPOINT_URL": "https://bucket.example",
            "AWS_S3_BUCKET_NAME": "synthetic-test", "AWS_ACCESS_KEY_ID": "test-access",
            "AWS_SECRET_ACCESS_KEY": "test-secret", "AWS_DEFAULT_REGION": "test-region",
            "AWS_S3_URL_STYLE": "virtual",
        }
        environment.update(changes)
        return self.configuration(**environment)

    def test_s3_uses_private_options_and_provider_url_style(self):
        options = self.bucket_configuration(AWS_S3_URL_STYLE="path")["STORAGES"]["default"]["OPTIONS"]
        self.assertIsNone(options["default_acl"])
        self.assertTrue(options["querystring_auth"])
        self.assertTrue(options["file_overwrite"])
        self.assertEqual(options["addressing_style"], "path")

    def test_bad_storage_mode_endpoint_or_style_is_rejected(self):
        with self.assertRaises(ImproperlyConfigured):
            self.configuration(CERTIFICATE_STORAGE="unknown")
        for changes in ({"AWS_ENDPOINT_URL": "http://bucket.example"}, {"AWS_S3_URL_STYLE": "unknown"}):
            with self.subTest(changes=changes), self.assertRaises(ImproperlyConfigured):
                self.bucket_configuration(**changes)

    def test_trusted_proxy_and_origin_are_explicit(self):
        config = self.configuration(DJANGO_TRUST_PROXY="true", CSRF_TRUSTED_ORIGINS="https://frontend.example")
        self.assertEqual(config["SECURE_PROXY_SSL_HEADER"], ("HTTP_X_FORWARDED_PROTO", "https"))
        self.assertEqual(config["CSRF_TRUSTED_ORIGINS"], ["https://frontend.example"])
