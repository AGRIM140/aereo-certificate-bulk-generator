"""Private object storage with safe, predictable errors for application callers."""

from io import BytesIO

from botocore.exceptions import BotoCoreError, ClientError
from django.core.files.base import File
from storages.backends.s3 import S3Storage


class CertificateStorageUnavailable(OSError):
    """The object store could not complete an operation (not a missing PDF)."""


class PrivateCertificateStorage(S3Storage):
    """Retain UUID paths and translate provider errors without leaking details."""

    def _open(self, name, mode="rb"):
        try:
            # Fetch before HTTP headers: S3File otherwise downloads lazily.
            with super()._open(name, mode) as source:
                return File(BytesIO(source.read()), name=name)
        except ClientError as exc:
            if exc.response.get("ResponseMetadata", {}).get("HTTPStatusCode") == 404:
                raise FileNotFoundError("Certificate file not found.") from None
            raise CertificateStorageUnavailable("Certificate storage is unavailable.") from None
        except BotoCoreError:
            raise CertificateStorageUnavailable("Certificate storage is unavailable.") from None

    def _save(self, name, content):
        try:
            return super()._save(name, content)
        except (BotoCoreError, ClientError):
            raise CertificateStorageUnavailable("Certificate storage is unavailable.") from None

    def exists(self, name):
        try:
            return super().exists(name)
        except (BotoCoreError, ClientError):
            raise CertificateStorageUnavailable("Certificate storage is unavailable.") from None

    def delete(self, name):
        try:
            return super().delete(name)
        except (BotoCoreError, ClientError):
            raise CertificateStorageUnavailable("Certificate storage is unavailable.") from None
