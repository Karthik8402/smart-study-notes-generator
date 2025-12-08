"""MCP Tools Router - Using proper MCP Tool Classes"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import os

from app.config import settings
from app.routers.auth import get_current_user

# Import MCP Tools
from app.mcp.tools.calendar_tool import calendar_tool
from app.mcp.tools.file_tool import file_tool
from app.mcp.tools.drive_tool import drive_tool

router = APIRouter()

# ========== Pydantic Models ==========

class ReminderCreate(BaseModel):
    title: str
    description: Optional[str] = None
    due_date: datetime
    subject: Optional[str] = None
    priority: str = "medium"
    tags: Optional[List[str]] = None

class ReminderUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    subject: Optional[str] = None
    priority: Optional[str] = None

class StudyScheduleRequest(BaseModel):
    subjects: List[str]
    start_date: datetime
    days: int = 7
    hours_per_day: int = 4
    time_of_day: str = "18:00"

class SaveNoteRequest(BaseModel):
    title: str
    content: str
    note_type: str = "other"

class CreateFolderRequest(BaseModel):
    folder_name: str
    parent_folder: Optional[str] = None


# ========== Calendar Tool Endpoints ==========

@router.post("/calendar/reminders")
async def create_reminder(
    reminder: ReminderCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new study reminder using MCP Calendar Tool."""
    user_id = str(current_user["_id"])
    
    result = await calendar_tool.create_reminder(
        user_id=user_id,
        title=reminder.title,
        due_date=reminder.due_date,
        description=reminder.description,
        subject=reminder.subject,
        priority=reminder.priority,
        tags=reminder.tags
    )
    
    return {"status": "success", "reminder": result}


@router.get("/calendar/reminders")
async def get_reminders(
    current_user: dict = Depends(get_current_user)
):
    """Get all reminders for the current user."""
    user_id = str(current_user["_id"])
    reminders = await calendar_tool.get_all_reminders(user_id)
    return {"reminders": reminders, "count": len(reminders)}


@router.get("/calendar/reminders/upcoming")
async def get_upcoming_reminders(
    days: int = 7,
    current_user: dict = Depends(get_current_user)
):
    """Get upcoming reminders within specified days."""
    user_id = str(current_user["_id"])
    reminders = await calendar_tool.get_upcoming_reminders(user_id, days)
    return {"reminders": reminders, "count": len(reminders)}


@router.get("/calendar/reminders/overdue")
async def get_overdue_reminders(
    current_user: dict = Depends(get_current_user)
):
    """Get all overdue reminders."""
    user_id = str(current_user["_id"])
    reminders = await calendar_tool.get_overdue_reminders(user_id)
    return {"reminders": reminders, "count": len(reminders)}


@router.get("/calendar/reminders/{reminder_id}")
async def get_reminder(
    reminder_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific reminder by ID."""
    user_id = str(current_user["_id"])
    reminder = await calendar_tool.get_reminder(user_id, reminder_id)
    
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
    
    return reminder


@router.put("/calendar/reminders/{reminder_id}")
async def update_reminder(
    reminder_id: str,
    updates: ReminderUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update a reminder."""
    user_id = str(current_user["_id"])
    
    update_data = {k: v for k, v in updates.dict().items() if v is not None}
    result = await calendar_tool.update_reminder(user_id, reminder_id, **update_data)
    
    if not result:
        raise HTTPException(status_code=404, detail="Reminder not found")
    
    return {"status": "success", "reminder": result}


@router.put("/calendar/reminders/{reminder_id}/complete")
async def complete_reminder(
    reminder_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Mark a reminder as complete."""
    user_id = str(current_user["_id"])
    result = await calendar_tool.mark_complete(user_id, reminder_id)
    
    if not result:
        raise HTTPException(status_code=404, detail="Reminder not found")
    
    return {"status": "success", "message": "Reminder marked as complete"}


@router.delete("/calendar/reminders/{reminder_id}")
async def delete_reminder(
    reminder_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a reminder."""
    user_id = str(current_user["_id"])
    deleted = await calendar_tool.delete_reminder(user_id, reminder_id)
    
    if not deleted:
        raise HTTPException(status_code=404, detail="Reminder not found")
    
    return {"status": "success", "message": "Reminder deleted"}


@router.post("/calendar/schedule")
async def generate_study_schedule(
    request: StudyScheduleRequest,
    current_user: dict = Depends(get_current_user)
):
    """Generate a study schedule using MCP Calendar Tool."""
    user_id = str(current_user["_id"])
    
    reminders = await calendar_tool.generate_study_schedule(
        user_id=user_id,
        subjects=request.subjects,
        start_date=request.start_date,
        days=request.days,
        hours_per_day=request.hours_per_day,
        time_of_day=request.time_of_day
    )
    
    return {
        "status": "success",
        "message": f"Created {len(reminders)} study sessions",
        "reminders": reminders
    }


@router.get("/calendar/stats")
async def get_calendar_stats(
    current_user: dict = Depends(get_current_user)
):
    """Get calendar/reminder statistics."""
    user_id = str(current_user["_id"])
    stats = await calendar_tool.get_statistics(user_id)
    return stats


# ========== File Tool Endpoints ==========

@router.post("/files/save")
async def save_note(
    request: SaveNoteRequest,
    current_user: dict = Depends(get_current_user)
):
    """Save a note using MCP File Tool."""
    user_id = str(current_user["_id"])
    
    result = await file_tool.save_notes(
        user_id=user_id,
        title=request.title,
        content=request.content,
        note_type=request.note_type
    )
    
    return {"status": "success", "file": result}


@router.get("/files/list")
async def list_files(
    category: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """List all saved files."""
    user_id = str(current_user["_id"])
    files = await file_tool.list_files(user_id, category)
    return {"files": files, "count": len(files)}


@router.get("/files/get/{category}/{filename}")
async def get_file(
    category: str,
    filename: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific file's content."""
    user_id = str(current_user["_id"])
    file_data = await file_tool.get_file(user_id, category, filename)
    
    if not file_data:
        raise HTTPException(status_code=404, detail="File not found")
    
    return file_data


@router.delete("/files/{category}/{filename}")
async def delete_file(
    category: str,
    filename: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a saved file."""
    user_id = str(current_user["_id"])
    deleted = await file_tool.delete_file(user_id, category, filename)
    
    if not deleted:
        raise HTTPException(status_code=404, detail="File not found")
    
    return {"status": "success", "message": "File deleted"}


@router.get("/files/search")
async def search_files(
    q: str,
    current_user: dict = Depends(get_current_user)
):
    """Search files by query."""
    user_id = str(current_user["_id"])
    results = await file_tool.search_files(user_id, q)
    return {"results": results, "count": len(results)}


@router.get("/files/stats")
async def get_file_stats(
    current_user: dict = Depends(get_current_user)
):
    """Get file storage statistics."""
    user_id = str(current_user["_id"])
    stats = await file_tool.get_statistics(user_id)
    return stats


# ========== Drive Tool Endpoints ==========

@router.post("/drive/upload")
async def upload_to_drive(
    file: UploadFile = File(...),
    folder: str = Form("Documents"),
    description: Optional[str] = Form(None),
    current_user: dict = Depends(get_current_user)
):
    """Upload a file to MCP Drive."""
    user_id = str(current_user["_id"])
    content = await file.read()
    
    result = await drive_tool.upload_file(
        user_id=user_id,
        filename=file.filename,
        content=content,
        folder=folder,
        description=description
    )
    
    return {"status": "success", "file": result}


@router.post("/drive/upload-text")
async def upload_text_to_drive(
    filename: str,
    content: str,
    folder: str = "Notes",
    current_user: dict = Depends(get_current_user)
):
    """Upload text content as a file to MCP Drive."""
    user_id = str(current_user["_id"])
    
    result = await drive_tool.upload_text_file(
        user_id=user_id,
        filename=filename,
        content=content,
        folder=folder
    )
    
    return {"status": "success", "file": result}


@router.get("/drive/download/{file_id}")
async def download_from_drive(
    file_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Download a file from MCP Drive."""
    user_id = str(current_user["_id"])
    file_data = await drive_tool.download_file(user_id, file_id)
    
    if not file_data:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Return content as base64 for JSON response
    import base64
    return {
        "filename": file_data["filename"],
        "content": base64.b64encode(file_data["content"]).decode('utf-8'),
        "mime_type": file_data["mime_type"],
        "size": file_data["size"]
    }


@router.get("/drive/files")
async def list_drive_files(
    current_user: dict = Depends(get_current_user)
):
    """List all files in MCP Drive."""
    user_id = str(current_user["_id"])
    files = await drive_tool.list_all_files(user_id)
    return {"files": files, "count": len(files)}


@router.get("/drive/folder/{folder_path:path}")
async def list_folder_contents(
    folder_path: str = None,
    current_user: dict = Depends(get_current_user)
):
    """List contents of a folder in MCP Drive."""
    user_id = str(current_user["_id"])
    contents = await drive_tool.list_folder(user_id, folder_path)
    return contents


@router.post("/drive/folders")
async def create_folder(
    request: CreateFolderRequest,
    current_user: dict = Depends(get_current_user)
):
    """Create a new folder in MCP Drive."""
    user_id = str(current_user["_id"])
    
    result = await drive_tool.create_folder(
        user_id=user_id,
        folder_name=request.folder_name,
        parent_folder=request.parent_folder
    )
    
    return {"status": "success", "folder": result}


@router.delete("/drive/files/{file_id}")
async def delete_drive_file(
    file_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a file from MCP Drive."""
    user_id = str(current_user["_id"])
    deleted = await drive_tool.delete_file(user_id, file_id)
    
    if not deleted:
        raise HTTPException(status_code=404, detail="File not found")
    
    return {"status": "success", "message": "File deleted"}


@router.put("/drive/files/{file_id}/move")
async def move_drive_file(
    file_id: str,
    new_folder: str,
    current_user: dict = Depends(get_current_user)
):
    """Move a file to a different folder."""
    user_id = str(current_user["_id"])
    result = await drive_tool.move_file(user_id, file_id, new_folder)
    
    if not result:
        raise HTTPException(status_code=404, detail="File not found")
    
    return {"status": "success", "file": result}


@router.get("/drive/search")
async def search_drive(
    q: str,
    current_user: dict = Depends(get_current_user)
):
    """Search files in MCP Drive."""
    user_id = str(current_user["_id"])
    results = await drive_tool.search_files(user_id, q)
    return {"results": results, "count": len(results)}


@router.get("/drive/stats")
async def get_drive_stats(
    current_user: dict = Depends(get_current_user)
):
    """Get MCP Drive storage statistics."""
    user_id = str(current_user["_id"])
    stats = await drive_tool.get_storage_stats(user_id)
    return stats


# ========== Combined Stats Endpoint ==========

@router.get("/stats")
async def get_all_mcp_stats(
    current_user: dict = Depends(get_current_user)
):
    """Get combined statistics from all MCP tools."""
    user_id = str(current_user["_id"])
    
    calendar_stats = await calendar_tool.get_statistics(user_id)
    file_stats = await file_tool.get_statistics(user_id)
    drive_stats = await drive_tool.get_storage_stats(user_id)
    
    return {
        "calendar": calendar_stats,
        "files": file_stats,
        "drive": drive_stats
    }
