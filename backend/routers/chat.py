import json
import uuid
from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from models.database import ChatMessage, Chunk, get_db
from models.schemas import QueryRequest, QueryResponse, ChatMessageOut, Citation
from services.embedding_service import embed_text
from services.retrieval_service import find_similar_chunks
from services.groq_service import ask_groq
from routers.auth import get_current_user

router = APIRouter(prefix="/api/chat", tags=["chat"])


async def parse_query_request(request: Request) -> QueryRequest:
    body = await request.body()
    if not body:
        raise ValueError("Empty body")
    try:
        data = json.loads(body)
    except json.JSONDecodeError:
        raise ValueError("Invalid JSON")
    return QueryRequest(**data)


@router.post("/query", response_model=QueryResponse)
async def query_document(
    request: Request,
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user),
):
    req = await parse_query_request(request)
    question_embedding = embed_text(req.question)
    citations = find_similar_chunks(db, req.document_id, question_embedding)
    answer = ask_groq(req.question, citations)

    db.add(
        ChatMessage(document_id=req.document_id, user_id=user_id, role="user", content=req.question)
    )
    db.add(
        ChatMessage(
            document_id=req.document_id,
            user_id=user_id,
            role="assistant",
            content=answer,
            cited_chunk_ids=[c.chunk_id for c in citations],
        )
    )
    db.commit()

    return QueryResponse(answer=answer, citations=citations)


@router.get("/history/{doc_id}", response_model=list[ChatMessageOut])
def get_history(
    doc_id: uuid.UUID,
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user),
):
    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.document_id == doc_id, ChatMessage.user_id == user_id)
        .order_by(ChatMessage.created_at)
        .all()
    )
    result = []
    for msg in messages:
        citations = []
        if msg.cited_chunk_ids:
            chunks = (
                db.query(Chunk)
                .filter(Chunk.id.in_(msg.cited_chunk_ids))
                .all()
            )
            citations = [
                Citation(chunk_id=c.id, content=c.content, page_number=c.page_number)
                for c in chunks
            ]
        result.append(ChatMessageOut(
            role=msg.role,
            content=msg.content,
            citations=citations,
        ))
    return result
