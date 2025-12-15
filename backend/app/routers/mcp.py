"""
MCP Tools Integration Router

This router exposes MCP tool functionality via REST API endpoints.
Instead of running separate MCP servers, we integrate the tools directly
into the FastAPI backend for simpler deployment.
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import json

from app.routers.auth import get_current_user

# Import MCP tool implementations
from app.mcp.servers.filesystem_server import (
    list_directory, read_file, write_file, delete_file,
    create_directory, search_files, get_file_info
)
from app.mcp.servers.calendar_server import (
    create_event, list_events, get_event, update_event, delete_event,
    get_upcoming_events, create_study_schedule, get_today_events
)
from app.mcp.servers.drive_server import (
    upload_file, download_file, list_files, list_folders,
    create_folder, delete_file as drive_delete_file, move_file,
    search_drive, share_file, get_drive_stats
)

# Import Google MCP tool implementations (Real Google API)
from app.mcp.servers.google_calendar_server import (
    create_event as google_create_event,
    list_events as google_list_events,
    get_event as google_get_event,
    update_event as google_update_event,
    delete_event as google_delete_event,
    get_upcoming_events as google_get_upcoming_events,
    create_study_schedule as google_create_study_schedule,
    get_today_events as google_get_today_events,
    authenticate_google as google_calendar_auth,
    check_connection as google_calendar_check,
    quick_add_event as google_quick_add_event
)
from app.mcp.servers.google_drive_server import (
    upload_file as google_upload_file,
    download_file as google_download_file,
    list_files as google_list_files,
    list_folders as google_list_folders,
    create_folder as google_create_folder,
    delete_file as google_drive_delete_file,
    move_file as google_move_file,
    search_drive as google_search_drive,
    share_file as google_share_file,
    get_drive_stats as google_get_drive_stats,
    authenticate_google as google_drive_auth,
    check_connection as google_drive_check
)

router = APIRouter()


# ==================== Request Models ====================

class CreateEventRequest(BaseModel):
    title: str
    start_time: str  # ISO format
    end_time: Optional[str] = None
    description: str = ""
    location: str = ""
    reminder_minutes: int = 30


class UpdateEventRequest(BaseModel):
    title: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    status: Optional[str] = None


class CreateScheduleRequest(BaseModel):
    subjects: str  # Comma-separated
    start_date: str
    days: int = 7
    hours_per_session: int = 2
    start_hour: int = 18


class WriteFileRequest(BaseModel):
    path: str
    content: str


class UploadToDriveRequest(BaseModel):
    filename: str
    content: str
    folder: str = "Documents"
    is_base64: bool = False
    description: str = ""


class CreateFolderRequest(BaseModel):
    name: str
    parent: Optional[str] = None


# ==================== Filesystem Endpoints ====================

@router.get("/filesystem/list")
async def api_list_directory(
    path: str = ".",
    current_user: dict = Depends(get_current_user)
):
    """List files and directories."""
    user_id = str(current_user["_id"])
    result = list_directory(path, user_id)
    return json.loads(result)


@router.get("/filesystem/read")
async def api_read_file(
    path: str,
    current_user: dict = Depends(get_current_user)
):
    """Read a file's contents."""
    user_id = str(current_user["_id"])
    result = read_file(path, user_id)
    return json.loads(result)


@router.post("/filesystem/write")
async def api_write_file(
    request: WriteFileRequest,
    current_user: dict = Depends(get_current_user)
):
    """Write content to a file."""
    user_id = str(current_user["_id"])
    result = write_file(request.path, request.content, user_id)
    return json.loads(result)


@router.delete("/filesystem/delete")
async def api_delete_file(
    path: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a file."""
    user_id = str(current_user["_id"])
    result = delete_file(path, user_id)
    return json.loads(result)


@router.post("/filesystem/mkdir")
async def api_create_directory(
    path: str,
    current_user: dict = Depends(get_current_user)
):
    """Create a directory."""
    user_id = str(current_user["_id"])
    result = create_directory(path, user_id)
    return json.loads(result)


@router.get("/filesystem/search")
async def api_search_files(
    query: str,
    path: str = ".",
    current_user: dict = Depends(get_current_user)
):
    """Search for files."""
    user_id = str(current_user["_id"])
    result = search_files(query, path, user_id)
    return json.loads(result)


@router.get("/filesystem/info")
async def api_get_file_info(
    path: str,
    current_user: dict = Depends(get_current_user)
):
    """Get file information."""
    user_id = str(current_user["_id"])
    result = get_file_info(path, user_id)
    return json.loads(result)


# ==================== Calendar Endpoints ====================

@router.post("/calendar/events")
async def api_create_event(
    request: CreateEventRequest,
    current_user: dict = Depends(get_current_user)
):
    """Create a calendar event."""
    user_id = str(current_user["_id"])
    result = create_event(
        title=request.title,
        start_time=request.start_time,
        end_time=request.end_time,
        description=request.description,
        location=request.location,
        reminder_minutes=request.reminder_minutes,
        user_id=user_id
    )
    return json.loads(result)


@router.get("/calendar/events")
async def api_list_events(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """List calendar events."""
    user_id = str(current_user["_id"])
    result = list_events(start_date, end_date, user_id)
    return json.loads(result)


@router.get("/calendar/events/today")
async def api_get_today_events(
    current_user: dict = Depends(get_current_user)
):
    """Get today's events."""
    user_id = str(current_user["_id"])
    result = get_today_events(user_id)
    return json.loads(result)


@router.get("/calendar/events/upcoming")
async def api_get_upcoming_events(
    days: int = 7,
    current_user: dict = Depends(get_current_user)
):
    """Get upcoming events."""
    user_id = str(current_user["_id"])
    result = get_upcoming_events(days, user_id)
    return json.loads(result)


@router.get("/calendar/events/{event_id}")
async def api_get_event(
    event_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific event."""
    user_id = str(current_user["_id"])
    result = get_event(event_id, user_id)
    return json.loads(result)


@router.put("/calendar/events/{event_id}")
async def api_update_event(
    event_id: str,
    request: UpdateEventRequest,
    current_user: dict = Depends(get_current_user)
):
    """Update an event."""
    user_id = str(current_user["_id"])
    result = update_event(
        event_id=event_id,
        title=request.title,
        start_time=request.start_time,
        end_time=request.end_time,
        description=request.description,
        location=request.location,
        status=request.status,
        user_id=user_id
    )
    return json.loads(result)


@router.delete("/calendar/events/{event_id}")
async def api_delete_event(
    event_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete an event."""
    user_id = str(current_user["_id"])
    result = delete_event(event_id, user_id)
    return json.loads(result)


@router.post("/calendar/schedule")
async def api_create_study_schedule(
    request: CreateScheduleRequest,
    current_user: dict = Depends(get_current_user)
):
    """Generate a study schedule."""
    user_id = str(current_user["_id"])
    result = create_study_schedule(
        subjects=request.subjects,
        start_date=request.start_date,
        days=request.days,
        hours_per_session=request.hours_per_session,
        start_hour=request.start_hour,
        user_id=user_id
    )
    return json.loads(result)


# ==================== Drive Endpoints ====================

@router.post("/drive/upload")
async def api_upload_to_drive(
    request: UploadToDriveRequest,
    current_user: dict = Depends(get_current_user)
):
    """Upload a file to Drive."""
    user_id = str(current_user["_id"])
    result = upload_file(
        filename=request.filename,
        content=request.content,
        folder=request.folder,
        is_base64=request.is_base64,
        description=request.description,
        user_id=user_id
    )
    return json.loads(result)


@router.get("/drive/download/{file_id}")
async def api_download_from_drive(
    file_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Download a file from Drive."""
    user_id = str(current_user["_id"])
    result = download_file(file_id, user_id)
    return json.loads(result)


@router.get("/drive/files")
async def api_list_drive_files(
    folder: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """List files in Drive."""
    user_id = str(current_user["_id"])
    result = list_files(folder, user_id)
    return json.loads(result)


@router.get("/drive/folders")
async def api_list_folders(
    current_user: dict = Depends(get_current_user)
):
    """List all folders."""
    user_id = str(current_user["_id"])
    result = list_folders(user_id)
    return json.loads(result)


@router.post("/drive/folders")
async def api_create_folder(
    request: CreateFolderRequest,
    current_user: dict = Depends(get_current_user)
):
    """Create a folder."""
    user_id = str(current_user["_id"])
    result = create_folder(request.name, request.parent, user_id)
    return json.loads(result)


@router.delete("/drive/files/{file_id}")
async def api_delete_drive_file(
    file_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a file from Drive."""
    user_id = str(current_user["_id"])
    result = drive_delete_file(file_id, user_id)
    return json.loads(result)


@router.put("/drive/files/{file_id}/move")
async def api_move_file(
    file_id: str,
    new_folder: str,
    current_user: dict = Depends(get_current_user)
):
    """Move a file to another folder."""
    user_id = str(current_user["_id"])
    result = move_file(file_id, new_folder, user_id)
    return json.loads(result)


@router.get("/drive/search")
async def api_search_drive(
    query: str,
    current_user: dict = Depends(get_current_user)
):
    """Search files in Drive."""
    user_id = str(current_user["_id"])
    result = search_drive(query, user_id)
    return json.loads(result)


@router.get("/drive/stats")
async def api_get_drive_stats(
    current_user: dict = Depends(get_current_user)
):
    """Get Drive statistics."""
    user_id = str(current_user["_id"])
    result = get_drive_stats(user_id)
    return json.loads(result)


@router.post("/drive/files/{file_id}/share")
async def api_share_file(
    file_id: str,
    share_with: str,
    current_user: dict = Depends(get_current_user)
):
    """Share a file with another user."""
    user_id = str(current_user["_id"])
    result = share_file(file_id, share_with, user_id)
    return json.loads(result)


# ==================== Saved Notes Endpoints ====================

import os
from pathlib import Path

NOTES_BASE_DIR = Path("./uploads/saved_notes")

@router.get("/notes/list")
async def api_list_saved_notes(
    category: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """List saved notes, optionally filtered by category."""
    user_id = str(current_user["_id"])
    user_dir = NOTES_BASE_DIR / user_id
    
    if not user_dir.exists():
        return {"files": [], "count": 0}
    
    files = []
    categories = ["summaries", "mcqs", "explanations", "topics", "flashcards", "other"]
    
    for cat in categories:
        if category and cat != category:
            continue
        cat_dir = user_dir / cat
        if not cat_dir.exists():
            continue
        
        for file in cat_dir.glob("*.md"):
            stat = file.stat()
            files.append({
                "filename": file.name,
                "category": cat,
                "size": stat.st_size,
                "created_at": datetime.fromtimestamp(stat.st_ctime).isoformat(),
                "modified_at": datetime.fromtimestamp(stat.st_mtime).isoformat()
            })
    
    # Sort by modified date, newest first
    files = sorted(files, key=lambda x: x["modified_at"], reverse=True)
    
    return {"files": files, "count": len(files)}


@router.get("/notes/read/{category}/{filename}")
async def api_read_saved_note(
    category: str,
    filename: str,
    current_user: dict = Depends(get_current_user)
):
    """Read the content of a saved note."""
    user_id = str(current_user["_id"])
    file_path = NOTES_BASE_DIR / user_id / category / filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Note not found")
    
    if not file_path.is_file():
        raise HTTPException(status_code=400, detail="Not a file")
    
    try:
        content = file_path.read_text(encoding="utf-8")
        return {
            "filename": filename,
            "category": category,
            "content": content,
            "size": len(content)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/notes/{category}/{filename}")
async def api_delete_saved_note(
    category: str,
    filename: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a saved note."""
    user_id = str(current_user["_id"])
    file_path = NOTES_BASE_DIR / user_id / category / filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Note not found")
    
    try:
        file_path.unlink()
        return {"success": True, "message": f"Deleted {filename}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== Combined Stats ====================

@router.get("/stats")
async def api_get_all_stats(
    current_user: dict = Depends(get_current_user)
):
    """Get combined MCP tool statistics."""
    user_id = str(current_user["_id"])
    
    drive_stats = json.loads(get_drive_stats(user_id))
    calendar_events = json.loads(list_events(user_id=user_id))
    
    return {
        "drive": drive_stats,
        "calendar": {
            "total_events": calendar_events.get("count", 0)
        }
    }


# ==================== Google Calendar Endpoints (Real API) ====================

@router.get("/google/calendar/auth")
async def api_google_calendar_auth(
    current_user: dict = Depends(get_current_user)
):
    """Authenticate with Google Calendar."""
    user_id = str(current_user["_id"])
    result = google_calendar_auth(user_id)
    return json.loads(result)


@router.get("/google/calendar/status")
async def api_google_calendar_status(
    current_user: dict = Depends(get_current_user)
):
    """Check Google Calendar connection status."""
    user_id = str(current_user["_id"])
    result = google_calendar_check(user_id)
    return json.loads(result)


@router.post("/google/calendar/events")
async def api_google_create_event(
    request: CreateEventRequest,
    current_user: dict = Depends(get_current_user)
):
    """Create a Google Calendar event."""
    user_id = str(current_user["_id"])
    result = google_create_event(
        title=request.title,
        start_time=request.start_time,
        end_time=request.end_time,
        description=request.description,
        location=request.location,
        reminder_minutes=request.reminder_minutes,
        user_id=user_id
    )
    return json.loads(result)


@router.get("/google/calendar/events")
async def api_google_list_events(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """List Google Calendar events."""
    user_id = str(current_user["_id"])
    result = google_list_events(start_date, end_date, user_id=user_id)
    return json.loads(result)


@router.get("/google/calendar/events/today")
async def api_google_get_today_events(
    current_user: dict = Depends(get_current_user)
):
    """Get today's Google Calendar events."""
    user_id = str(current_user["_id"])
    result = google_get_today_events(user_id)
    return json.loads(result)


@router.get("/google/calendar/events/upcoming")
async def api_google_get_upcoming_events(
    days: int = 7,
    current_user: dict = Depends(get_current_user)
):
    """Get upcoming Google Calendar events."""
    user_id = str(current_user["_id"])
    result = google_get_upcoming_events(days, user_id)
    return json.loads(result)


@router.get("/google/calendar/events/{event_id}")
async def api_google_get_event(
    event_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific Google Calendar event."""
    user_id = str(current_user["_id"])
    result = google_get_event(event_id, user_id)
    return json.loads(result)


@router.put("/google/calendar/events/{event_id}")
async def api_google_update_event(
    event_id: str,
    request: UpdateEventRequest,
    current_user: dict = Depends(get_current_user)
):
    """Update a Google Calendar event."""
    user_id = str(current_user["_id"])
    result = google_update_event(
        event_id=event_id,
        title=request.title,
        start_time=request.start_time,
        end_time=request.end_time,
        description=request.description,
        location=request.location,
        user_id=user_id
    )
    return json.loads(result)


@router.delete("/google/calendar/events/{event_id}")
async def api_google_delete_event(
    event_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a Google Calendar event."""
    user_id = str(current_user["_id"])
    result = google_delete_event(event_id, user_id)
    return json.loads(result)


@router.post("/google/calendar/schedule")
async def api_google_create_study_schedule(
    request: CreateScheduleRequest,
    current_user: dict = Depends(get_current_user)
):
    """Generate a study schedule in Google Calendar."""
    user_id = str(current_user["_id"])
    result = google_create_study_schedule(
        subjects=request.subjects,
        start_date=request.start_date,
        days=request.days,
        hours_per_session=request.hours_per_session,
        start_hour=request.start_hour,
        user_id=user_id
    )
    return json.loads(result)


@router.post("/google/calendar/quick-add")
async def api_google_quick_add_event(
    text: str,
    current_user: dict = Depends(get_current_user)
):
    """Quick add event using natural language."""
    user_id = str(current_user["_id"])
    result = google_quick_add_event(text, user_id)
    return json.loads(result)


# ==================== Google Drive Endpoints (Real API) ====================

@router.get("/google/drive/auth")
async def api_google_drive_auth(
    current_user: dict = Depends(get_current_user)
):
    """Authenticate with Google Drive."""
    user_id = str(current_user["_id"])
    result = google_drive_auth(user_id)
    return json.loads(result)


@router.get("/google/drive/status")
async def api_google_drive_status(
    current_user: dict = Depends(get_current_user)
):
    """Check Google Drive connection status."""
    user_id = str(current_user["_id"])
    result = google_drive_check(user_id)
    return json.loads(result)


@router.post("/google/drive/upload")
async def api_google_upload_to_drive(
    request: UploadToDriveRequest,
    current_user: dict = Depends(get_current_user)
):
    """Upload a file to Google Drive."""
    user_id = str(current_user["_id"])
    result = google_upload_file(
        filename=request.filename,
        content=request.content,
        folder_name=request.folder,
        is_base64=request.is_base64,
        description=request.description,
        user_id=user_id
    )
    return json.loads(result)


@router.get("/google/drive/download/{file_id}")
async def api_google_download_from_drive(
    file_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Download a file from Google Drive."""
    user_id = str(current_user["_id"])
    result = google_download_file(file_id, user_id)
    return json.loads(result)


@router.get("/google/drive/files")
async def api_google_list_drive_files(
    folder: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """List files in Google Drive."""
    user_id = str(current_user["_id"])
    result = google_list_files(folder, user_id=user_id)
    return json.loads(result)


@router.get("/google/drive/folders")
async def api_google_list_folders(
    current_user: dict = Depends(get_current_user)
):
    """List all Google Drive folders."""
    user_id = str(current_user["_id"])
    result = google_list_folders(user_id)
    return json.loads(result)


@router.post("/google/drive/folders")
async def api_google_create_folder(
    request: CreateFolderRequest,
    current_user: dict = Depends(get_current_user)
):
    """Create a folder in Google Drive."""
    user_id = str(current_user["_id"])
    result = google_create_folder(request.name, request.parent, user_id)
    return json.loads(result)


@router.delete("/google/drive/files/{file_id}")
async def api_google_delete_drive_file(
    file_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a file from Google Drive."""
    user_id = str(current_user["_id"])
    result = google_drive_delete_file(file_id, user_id=user_id)
    return json.loads(result)


@router.put("/google/drive/files/{file_id}/move")
async def api_google_move_file(
    file_id: str,
    new_folder: str,
    current_user: dict = Depends(get_current_user)
):
    """Move a file to another folder in Google Drive."""
    user_id = str(current_user["_id"])
    result = google_move_file(file_id, new_folder, user_id)
    return json.loads(result)


@router.get("/google/drive/search")
async def api_google_search_drive(
    query: str,
    current_user: dict = Depends(get_current_user)
):
    """Search files in Google Drive."""
    user_id = str(current_user["_id"])
    result = google_search_drive(query, user_id=user_id)
    return json.loads(result)


@router.get("/google/drive/stats")
async def api_google_get_drive_stats(
    current_user: dict = Depends(get_current_user)
):
    """Get Google Drive statistics."""
    user_id = str(current_user["_id"])
    result = google_get_drive_stats(user_id)
    return json.loads(result)


@router.post("/google/drive/files/{file_id}/share")
async def api_google_share_file(
    file_id: str,
    email: str,
    role: str = "reader",
    current_user: dict = Depends(get_current_user)
):
    """Share a file with another user on Google Drive."""
    user_id = str(current_user["_id"])
    result = google_share_file(file_id, email, role, user_id)
    return json.loads(result)

