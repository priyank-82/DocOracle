from uuid import UUID
from sqlalchemy import text
from sqlalchemy.orm import Session

from models.schemas import Citation


def find_similar_chunks(
    db_session: Session, document_id: UUID, embedding: list[float], top_k: int = 5
) -> list[Citation]:
    vector_str = "[" + ",".join(str(x) for x in embedding) + "]"
    query = text(f"""
        SELECT id, content, page_number
        FROM chunks
        WHERE document_id = :doc_id
        ORDER BY embedding <=> '{vector_str}'::vector
        LIMIT :top_k
    """)
    rows = db_session.execute(
        query,
        {
            "doc_id": document_id,
            "top_k": top_k,
        },
    ).fetchall()

    return [
        Citation(chunk_id=row[0], content=row[1], page_number=row[2])
        for row in rows
    ]
