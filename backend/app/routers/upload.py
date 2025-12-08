"""File Upload Router"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import os
import uuid
import aiofiles

from app.config import settings
from app.routers.auth import get_current_user
from app.database.mongodb import get_documents_collection
from app.services.extraction import (
    extract_pdf_text, extract_ppt_text, extract_image_text,
    extract_plain_text, extract_youtube_transcript, clean_extracted_text
)
from app.services.rag_engine import ingest_document, delete_document_chunks

router = APIRouter()


class DocumentResponse(BaseModel):
    id: str
    filename: str
    file_type: str
    chunks_count: int
    uploaded_at: datetime


class YouTubeRequest(BaseModel):
    url: str
    title: Optional[str] = None


class TextRequest(BaseModel):
    content: str
    title: str


@router.post("/file", response_model=DocumentResponse)
async def upload_file(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    user_id = str(current_user["_id"])
    
    # Get file extension
    filename = file.filename
    ext = filename.split(".")[-1].lower()
    
    allowed_extensions = ["pdf", "ppt", "pptx", "png", "jpg", "jpeg", "txt"]
    if ext not in allowed_extensions:
        raise HTTPException(status_code=400, detail=f"File type not supported. Allowed: {allowed_extensions}")
    
    # Save file
    user_upload_dir = os.path.join(settings.upload_directory, user_id)
    os.makedirs(user_upload_dir, exist_ok=True)
    
    file_id = str(uuid.uuid4())
    file_path = os.path.join(user_upload_dir, f"{file_id}_{filename}")
    
    async with aiofiles.open(file_path, 'wb') as f:
        content = await file.read()
        await f.write(content)
    
    # Extract text
    try:
        if ext == "pdf":
            text = await extract_pdf_text(file_path)
        elif ext in ["ppt", "pptx"]:
            text = await extract_ppt_text(file_path)
        elif ext in ["png", "jpg", "jpeg"]:
            text = await extract_image_text(file_path)
        else:
            text = await extract_plain_text(file_path)
        
        text = clean_extracted_text(text)
        
        if not text or len(text) < 50:
            raise HTTPException(status_code=400, detail="Could not extract sufficient text from file")
        
        # Ingest into vector database
        chunks_count = await ingest_document(
            text=text,
            document_id=file_id,
            user_id=user_id,
            filename=filename,
            file_type=ext
        )
        
        # Save to MongoDB
        documents = get_documents_collection()
        doc = {
            "_id": file_id,
            "user_id": user_id,
            "filename": filename,
            "file_type": ext,
            "file_path": file_path,
            "chunks_count": chunks_count,
            "uploaded_at": datetime.utcnow()
        }
        await documents.insert_one(doc)
        
        return DocumentResponse(
            id=file_id,
            filename=filename,
            file_type=ext,
            chunks_count=chunks_count,
            uploaded_at=doc["uploaded_at"]
        )
        
    except Exception as e:
        # Clean up on error
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/youtube", response_model=DocumentResponse)
async def upload_youtube(
    request: YouTubeRequest,
    current_user: dict = Depends(get_current_user)
):
    user_id = str(current_user["_id"])
    
    try:
        text, video_title = await extract_youtube_transcript(request.url)
        text = clean_extracted_text(text)
        
        if not text:
            raise HTTPException(status_code=400, detail="Could not extract transcript")
        
        file_id = str(uuid.uuid4())
        filename = request.title or video_title or "YouTube Video"
        
        chunks_count = await ingest_document(
            text=text,
            document_id=file_id,
            user_id=user_id,
            filename=filename,
            file_type="youtube"
        )
        
        documents = get_documents_collection()
        doc = {
            "_id": file_id,
            "user_id": user_id,
            "filename": filename,
            "file_type": "youtube",
            "source_url": request.url,
            "chunks_count": chunks_count,
            "uploaded_at": datetime.utcnow()
        }
        await documents.insert_one(doc)
        
        return DocumentResponse(
            id=file_id,
            filename=filename,
            file_type="youtube",
            chunks_count=chunks_count,
            uploaded_at=doc["uploaded_at"]
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/text", response_model=DocumentResponse)
async def upload_text(
    request: TextRequest,
    current_user: dict = Depends(get_current_user)
):
    user_id = str(current_user["_id"])
    
    try:
        text = clean_extracted_text(request.content)
        
        if len(text) < 50:
            raise HTTPException(status_code=400, detail="Text content too short (minimum 50 characters)")
        
        file_id = str(uuid.uuid4())
        
        chunks_count = await ingest_document(
            text=text,
            document_id=file_id,
            user_id=user_id,
            filename=request.title,
            file_type="text"
        )
        
        documents = get_documents_collection()
        doc = {
            "_id": file_id,
            "user_id": user_id,
            "filename": request.title,
            "file_type": "text",
            "chunks_count": chunks_count,
            "uploaded_at": datetime.utcnow()
        }
        await documents.insert_one(doc)
        
        return DocumentResponse(
            id=file_id,
            filename=request.title,
            file_type="text",
            chunks_count=chunks_count,
            uploaded_at=doc["uploaded_at"]
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload text: {str(e)}")


@router.get("/documents", response_model=List[DocumentResponse])
async def get_documents(current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    documents = get_documents_collection()
    
    cursor = documents.find({"user_id": user_id}).sort("uploaded_at", -1)
    docs = await cursor.to_list(length=100)
    
    return [
        DocumentResponse(
            id=d["_id"],
            filename=d["filename"],
            file_type=d["file_type"],
            chunks_count=d["chunks_count"],
            uploaded_at=d["uploaded_at"]
        )
        for d in docs
    ]


@router.delete("/documents/{document_id}")
async def delete_document(document_id: str, current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    documents = get_documents_collection()
    
    doc = await documents.find_one({"_id": document_id, "user_id": user_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Delete from vector DB
    await delete_document_chunks(document_id)
    
    # Delete from MongoDB
    await documents.delete_one({"_id": document_id})
    
    # Delete file if exists
    if doc.get("file_path") and os.path.exists(doc["file_path"]):
        os.remove(doc["file_path"])
    
    return {"status": "success", "message": "Document deleted"}
