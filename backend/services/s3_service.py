import os
import boto3
from botocore.exceptions import ClientError

s3_client = boto3.client("s3", region_name=os.environ.get("AWS_REGION", "us-east-1"))


def bucket_name() -> str:
    return os.environ["S3_BUCKET_NAME"]


def upload_file(file_bytes: bytes, s3_key: str) -> str:
    try:
        s3_client.put_object(Bucket=bucket_name(), Key=s3_key, Body=file_bytes)
        return f"s3://{bucket_name()}/{s3_key}"
    except ClientError as e:
        raise RuntimeError(f"S3 upload failed: {e}")


def download_file(s3_key: str) -> bytes:
    try:
        obj = s3_client.get_object(Bucket=bucket_name(), Key=s3_key)
        return obj["Body"].read()
    except ClientError as e:
        raise RuntimeError(f"S3 download failed: {e}")


def delete_file(s3_key: str) -> None:
    try:
        s3_client.delete_object(Bucket=bucket_name(), Key=s3_key)
    except ClientError as e:
        raise RuntimeError(f"S3 delete failed: {e}")
