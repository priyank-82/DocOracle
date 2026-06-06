import uuid
import json
import os
import tempfile
import logging

os.environ.setdefault("TRANSFORMERS_CACHE", "/tmp")
os.environ.setdefault("SENTENCE_TRANSFORMERS_HOME", "/tmp")
os.environ.setdefault("HF_HOME", "/tmp")
os.environ.setdefault("HF_HUB_CACHE", "/tmp")
os.environ.setdefault("XDG_CACHE_HOME", "/tmp")

import boto3
from urllib.parse import unquote_plus

from chunker import process_pdf
from embedder import embed_chunks
from db import ensure_document, insert_chunks, update_document_status

logger = logging.getLogger()
logger.setLevel(logging.INFO)

s3 = boto3.client("s3")


def lambda_handler(event, context):
    for record in event.get("Records", []):
        bucket = record["s3"]["bucket"]["name"]
        key = unquote_plus(record["s3"]["object"]["key"])

        doc_id = extract_document_id(key)
        if not doc_id:
            logger.error(f"Could not extract document_id from key: {key}")
            continue

        try:
            ensure_document(doc_id, key)
            pdf_path = download_pdf(bucket, key)
            chunks_data, page_count = process_pdf(pdf_path)
            embeddings = embed_chunks(chunks_data)

            db_chunks = []
            for i, (chunk, embedding) in enumerate(zip(chunks_data, embeddings)):
                db_chunks.append(
                    {
                        "id": str(uuid.uuid4()),
                        "document_id": doc_id,
                        "chunk_index": i,
                        "content": chunk["content"],
                        "embedding": embedding,
                        "page_number": chunk["page_number"],
                    }
                )

            insert_chunks(db_chunks)
            update_document_status(doc_id, "ready", page_count)
            logger.info(f"Successfully processed document {doc_id} with {page_count} pages")

        except Exception as e:
            logger.error(f"Failed to process {key}: {e}")
            update_document_status(doc_id, "failed")


def extract_document_id(s3_key: str) -> str | None:
    basename = s3_key.split("/")[-1]
    doc_id = basename.split("_")[0]
    try:
        uuid.UUID(doc_id)
        return doc_id
    except ValueError:
        return None


def extract_user_id(s3_key: str) -> str | None:
    parts = s3_key.split("/")
    if len(parts) >= 2:
        return str(uuid.uuid5(uuid.NAMESPACE_DNS, f"user-{parts[0]}"))
    return None


def download_pdf(bucket: str, key: str) -> str:
    tmp_path = "/tmp/input.pdf"
    s3.download_file(bucket, key, tmp_path)
    return tmp_path
