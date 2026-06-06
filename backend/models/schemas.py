from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel


class DocumentOut(BaseModel):
    id: UUID
    filename: str
    status: str
    page_count: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


class QueryRequest(BaseModel):
    document_id: UUID
    question: str


class Citation(BaseModel):
    chunk_id: UUID
    content: str
    page_number: Optional[int] = None


class QueryResponse(BaseModel):
    answer: str
    citations: list[Citation]


class ChatMessageOut(BaseModel):
    role: str
    content: str

    class Config:
        from_attributes = True


class HealthResponse(BaseModel):
    status: str = "ok"
