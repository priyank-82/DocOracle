import uuid
from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session

from models.database import Document, get_db
from models.schemas import DocumentOut
from services.s3_service import upload_file
from routers.auth import get_current_user

router = APIRouter(prefix="/api/documents", tags=["documents"])


@router.post("/upload", response_model=DocumentOut)
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user),
):
    content = await file.read()
    s3_key = f"{user_id}/{uuid.uuid4()}_{file.filename}"
    upload_file(content, s3_key)

    doc = Document(
        user_id=user_id,
        filename=file.filename or "untitled.pdf",
        s3_key=s3_key,
        status="processing",
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


@router.get("", response_model=list[DocumentOut])
def list_documents(
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user),
):
    return (
        db.query(Document)
        .filter(Document.user_id == user_id)
        .order_by(Document.created_at.desc())
        .all()
    )


@router.get("/{doc_id}/status", response_model=DocumentOut)
def get_status(
    doc_id: uuid.UUID,
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user),
):
    doc = db.query(Document).filter(Document.id == doc_id, Document.user_id == user_id).first()
    if not doc:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Document not found")
    return doc


@router.delete("/{doc_id}", status_code=204)
def delete_document(
    doc_id: uuid.UUID,
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user),
):
    doc = db.query(Document).filter(Document.id == doc_id, Document.user_id == user_id).first()
    if not doc:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Document not found")
    db.delete(doc)
    db.commit()
