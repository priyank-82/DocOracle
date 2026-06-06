import os
import logging
from datetime import datetime, timezone
import psycopg2
from psycopg2.extras import execute_values

logger = logging.getLogger()
logger.setLevel(logging.INFO)

DATABASE_URL = os.environ["DATABASE_URL"]


def get_connection():
    return psycopg2.connect(DATABASE_URL)


def ensure_document(document_id: str, s3_key: str) -> None:
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO documents (id, filename, s3_key, status, created_at) VALUES (%s, %s, %s, 'processing', NOW()) ON CONFLICT DO NOTHING",
                (document_id, s3_key.split("/")[-1], s3_key),
            )
        conn.commit()
        logger.info(f"Ensured document {document_id} exists")
    except Exception as e:
        logger.error(f"Failed to ensure document {document_id}: {e}")
        conn.rollback()
    finally:
        conn.close()


def insert_chunks(chunks: list[dict]) -> None:
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            execute_values(
                cur,
                """
                INSERT INTO chunks (id, document_id, chunk_index, content, embedding, page_number)
                VALUES %s
                """,
                [
                    (
                        c["id"],
                        c["document_id"],
                        c["chunk_index"],
                        c["content"],
                        c["embedding"],
                        c["page_number"],
                    )
                    for c in chunks
                ],
            )
        conn.commit()
    finally:
        conn.close()


def update_document_status(document_id: str, status: str, page_count: int | None = None) -> None:
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            if page_count is not None:
                cur.execute(
                    "UPDATE documents SET status = %s, page_count = %s WHERE id = %s",
                    (status, page_count, document_id),
                )
            else:
                cur.execute(
                    "UPDATE documents SET status = %s WHERE id = %s",
                    (status, document_id),
                )
        conn.commit()
    finally:
        conn.close()
