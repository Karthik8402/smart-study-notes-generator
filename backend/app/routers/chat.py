"""Chat Router - RAG-powered chat"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import uuid

from app.config import settings
from app.routers.auth import get_current_user
from app.database.mongodb import get_chat_history_collection
from app.services.rag_engine import retrieve_context
from app.services.llm_service import generate_response

router = APIRouter()


class ChatMessage(BaseModel):
    role: str
    content: str
    timestamp: Optional[datetime] = None


class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None


class SourceDocument(BaseModel):
    content: str
    filename: str
    relevance_score: float


class ChatResponse(BaseModel):
    message: str
    session_id: str
    sources: List[SourceDocument] = []
    timestamp: datetime


@router.post("/", response_model=ChatResponse)
async def chat(request: ChatRequest, current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    session_id = request.session_id or str(uuid.uuid4())
    
    try:
        # Retrieve context
        context_results = await retrieve_context(
            query=request.message,
            user_id=user_id,
            top_k=settings.top_k_results
        )
        
        # Get chat history
        history = await get_session_history(session_id, user_id)
        
        # Generate response
        response_text = await generate_response(
            question=request.message,
            context=context_results["contexts"],
            chat_history=history
        )
        
        # Save to history
        now = datetime.utcnow()
        chat_history = get_chat_history_collection()
        
        await chat_history.update_one(
            {"session_id": session_id, "user_id": user_id},
            {
                "$push": {
                    "messages": {
                        "$each": [
                            {"role": "user", "content": request.message, "timestamp": now},
                            {"role": "assistant", "content": response_text, "timestamp": now}
                        ]
                    }
                },
                "$setOnInsert": {"session_id": session_id, "user_id": user_id, "created_at": now},
                "$set": {"updated_at": now}
            },
            upsert=True
        )
        
        # Build sources
        sources = []
        if context_results["sources"]:
            for source in context_results["sources"][:3]:
                sources.append(SourceDocument(
                    content=source["content"][:200] + "..." if len(source["content"]) > 200 else source["content"],
                    filename=source.get("filename", "Unknown"),
                    relevance_score=source.get("score", 0.0)
                ))
        
        return ChatResponse(
            message=response_text,
            session_id=session_id,
            sources=sources,
            timestamp=now
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


async def get_session_history(session_id: str, user_id: str) -> List[dict]:
    chat_history = get_chat_history_collection()
    session = await chat_history.find_one({"session_id": session_id, "user_id": user_id})
    
    if session and "messages" in session:
        return session["messages"][-10:]
    return []


@router.get("/history/{session_id}")
async def get_chat_history(session_id: str, current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    chat_history = get_chat_history_collection()
    
    session = await chat_history.find_one({"session_id": session_id, "user_id": user_id})
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return {
        "session_id": session_id,
        "messages": [
            ChatMessage(role=m["role"], content=m["content"], timestamp=m.get("timestamp"))
            for m in session.get("messages", [])
        ]
    }


@router.get("/sessions")
async def get_all_sessions(current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    chat_history = get_chat_history_collection()
    
    cursor = chat_history.find(
        {"user_id": user_id},
        {"session_id": 1, "created_at": 1, "updated_at": 1, "messages": {"$slice": 1}}
    ).sort("updated_at", -1)
    
    sessions = await cursor.to_list(length=50)
    
    return [
        {
            "session_id": s["session_id"],
            "created_at": s.get("created_at"),
            "updated_at": s.get("updated_at"),
            "preview": s["messages"][0]["content"][:100] if s.get("messages") else ""
        }
        for s in sessions
    ]


@router.delete("/sessions/{session_id}")
async def delete_session(session_id: str, current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    chat_history = get_chat_history_collection()
    
    result = await chat_history.delete_one({"session_id": session_id, "user_id": user_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return {"status": "success", "message": "Session deleted"}
