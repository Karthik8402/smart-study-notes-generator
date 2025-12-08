"""AI Notes Generation Router"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from enum import Enum
import uuid

from app.config import settings
from app.routers.auth import get_current_user
from app.database.mongodb import get_notes_collection
from app.services.rag_engine import retrieve_context
from app.services.note_generator import (
    generate_summary, generate_topic_notes, generate_mcqs,
    generate_explanation, generate_definitions
)

router = APIRouter()


class NoteType(str, Enum):
    SUMMARY = "summary"
    TOPIC_NOTES = "topic_notes"
    MCQS = "mcqs"
    EXPLANATION = "explanation"
    DEFINITIONS = "definitions"


class GenerateNotesRequest(BaseModel):
    note_type: NoteType
    topic: Optional[str] = None
    document_ids: Optional[List[str]] = None
    num_items: int = 5


class MCQItem(BaseModel):
    question: str
    options: List[str]
    correct_answer: str
    explanation: Optional[str] = None


class GeneratedNote(BaseModel):
    id: str
    note_type: NoteType
    title: str
    content: str
    mcqs: Optional[List[MCQItem]] = None
    created_at: datetime
    topic: Optional[str] = None


@router.post("/generate", response_model=GeneratedNote)
async def generate_notes(request: GenerateNotesRequest, current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    note_id = str(uuid.uuid4())
    
    try:
        query = request.topic or "main concepts and key points"
        
        context_results = await retrieve_context(
            query=query,
            user_id=user_id,
            top_k=10,
            document_ids=request.document_ids
        )
        
        if not context_results["contexts"]:
            raise HTTPException(status_code=404, detail="No documents found. Upload some first.")
        
        combined_context = "\n\n".join(context_results["contexts"])
        
        title = ""
        content = ""
        mcqs = None
        
        if request.note_type == NoteType.SUMMARY:
            title = f"Summary: {request.topic or 'All Topics'}"
            content = await generate_summary(combined_context, request.topic)
            
        elif request.note_type == NoteType.TOPIC_NOTES:
            title = f"Topic Notes: {request.topic or 'All Topics'}"
            content = await generate_topic_notes(combined_context, request.topic)
            
        elif request.note_type == NoteType.MCQS:
            title = f"MCQs: {request.topic or 'All Topics'}"
            mcq_data = await generate_mcqs(combined_context, request.num_items)
            mcqs = [MCQItem(**mcq) for mcq in mcq_data]
            content = f"Generated {len(mcqs)} questions."
            
        elif request.note_type == NoteType.EXPLANATION:
            if not request.topic:
                raise HTTPException(status_code=400, detail="Topic required for explanation")
            title = f"Explanation: {request.topic}"
            content = await generate_explanation(combined_context, request.topic)
            
        elif request.note_type == NoteType.DEFINITIONS:
            title = f"Definitions: {request.topic or 'Key Terms'}"
            content = await generate_definitions(combined_context, request.topic)
        
        return GeneratedNote(
            id=note_id,
            note_type=request.note_type,
            title=title,
            content=content,
            mcqs=mcqs,
            created_at=datetime.utcnow(),
            topic=request.topic
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/save")
async def save_note(note: GeneratedNote, current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    notes_collection = get_notes_collection()
    
    note_doc = {
        "_id": note.id,
        "user_id": user_id,
        "note_type": note.note_type.value,
        "title": note.title,
        "content": note.content,
        "mcqs": [mcq.dict() for mcq in note.mcqs] if note.mcqs else None,
        "topic": note.topic,
        "created_at": note.created_at,
        "updated_at": datetime.utcnow()
    }
    
    await notes_collection.insert_one(note_doc)
    return {"id": note.id, "status": "success", "message": "Note saved"}


@router.get("/", response_model=List[GeneratedNote])
async def get_user_notes(note_type: Optional[NoteType] = None, current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    notes_collection = get_notes_collection()
    
    query = {"user_id": user_id}
    if note_type:
        query["note_type"] = note_type.value
    
    cursor = notes_collection.find(query).sort("created_at", -1)
    notes = await cursor.to_list(length=100)
    
    return [
        GeneratedNote(
            id=n["_id"],
            note_type=NoteType(n["note_type"]),
            title=n["title"],
            content=n["content"],
            mcqs=[MCQItem(**m) for m in n["mcqs"]] if n.get("mcqs") else None,
            created_at=n["created_at"],
            topic=n.get("topic")
        )
        for n in notes
    ]


@router.delete("/{note_id}")
async def delete_note(note_id: str, current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    notes_collection = get_notes_collection()
    
    result = await notes_collection.delete_one({"_id": note_id, "user_id": user_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Note not found")
    
    return {"status": "success", "message": "Note deleted"}
