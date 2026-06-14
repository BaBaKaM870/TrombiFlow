import os
import boto3
from botocore.config import Config

from ..config.storage import STORAGE_TYPE, UPLOAD_DIR
from .image_service import resize_photo

_S3_BUCKET = os.environ.get("S3_BUCKET", "trombiflow")
_S3_ENDPOINT = os.environ.get("S3_ENDPOINT", "")
_S3_KEY = os.environ.get("S3_KEY", "")
_S3_SECRET = os.environ.get("S3_SECRET", "")
_S3_REGION = os.environ.get("S3_REGION", "eu-west-1")


def _s3_client():
    return boto3.client(
        "s3",
        endpoint_url=_S3_ENDPOINT,
        aws_access_key_id=_S3_KEY,
        aws_secret_access_key=_S3_SECRET,
        region_name=_S3_REGION,
        config=Config(signature_version="s3v4"),
    )


def save_photo(tmp_path: str) -> str:
    """Resize and store photo. Returns the public URL or relative path."""
    final_path = resize_photo(tmp_path)
    filename = os.path.basename(final_path)

    if STORAGE_TYPE == "s3":
        with open(final_path, "rb") as f:
            _s3_client().upload_fileobj(
                f,
                _S3_BUCKET,
                filename,
                ExtraArgs={"ContentType": "image/jpeg"},
            )
        os.unlink(final_path)
        base = _S3_ENDPOINT.rstrip("/").removesuffix("/s3")
        return f"{base}/object/public/{_S3_BUCKET}/{filename}"

    return "uploads/" + filename
