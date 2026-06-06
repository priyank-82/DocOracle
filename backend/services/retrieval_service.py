from uuid import UUID
from sqlalchemy import text
from sqlalchemy.orm import Session

from models.schemas import Citation


def find_similar_chunks(
    db_session: Session, document_id: UUID, embedding: list[float], top_k: int = 5
) -> list[Citation]:
    query = text("""
        SELECT id, content, page_number
        FROM chunks
        WHERE document_id = :doc_id
        ORDER BY embedding <=> :embedding::vector
        LIMIT :top_k
    """)
    rows = db_session.execute(
        query,
        {
            "doc_id": document_id,
            "embedding": embedding,
            "top_k": top_k,
        },
    ).fetchall()

    return [
        Citation(chunk_id=row[0], content=row[1], page_number=row[2])
        for row in rows
    ]
