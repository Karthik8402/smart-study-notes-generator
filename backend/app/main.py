"""
FastAPI Main Application Entry Point
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from contextlib import asynccontextmanager
import os

from app.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events."""
    # Startup
    print("🚀 Starting Smart Study Notes Generator...")
    
    os.makedirs(settings.upload_directory, exist_ok=True)
    os.makedirs(settings.chroma_persist_directory, exist_ok=True)
    
    # Try to connect to MongoDB (optional - don't crash if unavailable)
    try:
        from app.database.mongodb import connect_to_mongo, close_mongo_connection
        await connect_to_mongo()
    except Exception as e:
        print(f"⚠️ MongoDB connection failed (optional): {e}")
    
    # Try to initialize VectorDB (optional - don't crash if unavailable)
    try:
        from app.database.vector_db import initialize_vector_db
        initialize_vector_db()
    except Exception as e:
        print(f"⚠️ VectorDB initialization failed (optional): {e}")
    
    print("🎉 Application started successfully!")
    
    yield
    
    # Shutdown
    try:
        from app.database.mongodb import close_mongo_connection
        await close_mongo_connection()
    except:
        pass


app = FastAPI(
    title="Smart Study Notes Generator",
    description="AI-powered study notes generator using RAG and MCP",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS - Allow all origins for cloud deployment
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for Render deployment
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Include routers
from app.routers import auth, upload, chat, notes, mcp
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(upload.router, prefix="/api/upload", tags=["File Upload"])
app.include_router(chat.router, prefix="/api/chat", tags=["Chat & RAG"])
app.include_router(notes.router, prefix="/api/notes", tags=["AI Notes Generation"])
app.include_router(mcp.router, prefix="/api/mcp", tags=["MCP Tools"])


@app.get("/", tags=["Health"])
async def root():
    return {"status": "healthy", "message": "Smart Study Notes Generator API"}


@app.get("/api/health", tags=["Health"])
async def health_check():
    return {"status": "healthy", "services": ["auth", "upload", "chat", "notes", "mcp"]}


# ==========================================
# Frontend Static File Serving (Production)
# ==========================================

# Mount the static directory only if it exists (it will be created in Docker)
if os.path.exists("app/static"):
    # Mount assets folder (files like index-Dx8s...css, etc.)
    # Vite builds to dist/assets by default
    if os.path.exists("app/static/assets"):
        app.mount("/assets", StaticFiles(directory="app/static/assets"), name="assets")

    # Catch-all route for SPA (Single Page Application)
    # This must be the LAST route defined
    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        # 1. API routes are already handled above.
        # 2. If path starts with 'api/', return 404 (don't serve HTML for broken API calls)
        if full_path.startswith("api"):
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="API endpoint not found")

        # 3. Check if a specific file exists (e.g., favicon.ico, manifest.json)
        file_path = os.path.join("app/static", full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)

        # 4. Otherwise, serve index.html (React Router handles the rest)
        return FileResponse("app/static/index.html")
