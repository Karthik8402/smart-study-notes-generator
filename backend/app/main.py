"""
FastAPI Main Application Entry Point
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os

from app.config import settings
from app.database.mongodb import connect_to_mongo, close_mongo_connection
from app.database.vector_db import initialize_vector_db
from app.routers import auth, upload, chat, notes


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events."""
    # Startup
    print("🚀 Starting Smart Study Notes Generator...")
    
    os.makedirs(settings.upload_directory, exist_ok=True)
    os.makedirs(settings.chroma_persist_directory, exist_ok=True)
    
    await connect_to_mongo()
    initialize_vector_db()
    
    print("🎉 Application started successfully!")
    
    yield
    
    # Shutdown
    await close_mongo_connection()


app = FastAPI(
    title="Smart Study Notes Generator",
    description="AI-powered study notes generator using RAG and MCP",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(upload.router, prefix="/api/upload", tags=["File Upload"])
app.include_router(chat.router, prefix="/api/chat", tags=["Chat & RAG"])
app.include_router(notes.router, prefix="/api/notes", tags=["AI Notes Generation"])


@app.get("/", tags=["Health"])
async def root():
    return {"status": "healthy", "message": "Smart Study Notes Generator API"}


@app.get("/api/health", tags=["Health"])
async def health_check():
    return {"status": "healthy", "services": ["auth", "upload", "chat", "notes"]}
