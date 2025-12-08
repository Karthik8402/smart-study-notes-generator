"""MCP Tools Router - Calendar, File Storage, and Drive Operations"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
import os
import json
import uuid
import aiofiles

from app.config import settings
from app.routers.auth import get_current_user

router = APIRouter()

# ========== Pydantic Models ==========

class ReminderCreate(BaseModel):
    title: str
    description: Optional[str] = None
    due_date: datetime
    subject: Optional[str] = None
    priority: str = "medium"  # low, medium, high

class ReminderResponse(BaseModel):
    id: str
    title: str
    description: Optional[str]
    due_date: datetime
    subject: Optional[str]
    priority: str
    completed: bool
    created_at: datetime

class StudyScheduleRequest(BaseModel):
    subjects: List[str]
    start_date: datetime
    days: int = 7
    hours_per_day: int = 4

class SavedFileResponse(BaseModel):
    filename: str
    category: str
    size: int
    created_at: datetime
    path: str


# ========== Helper Functions ==========

def get_reminders_file(user_id: str) -> str:
    """Get path to user's reminders JSON file."""
    user_dir = os.path.join(settings.upload_directory, "mcp_data", user_id)
    os.makedirs(user_dir, exist_ok=True)
    return os.path.join(user_dir, "reminders.json")


def get_saved_notes_dir(user_id: str) -> str:
    """Get path to user's saved notes directory."""
    user_dir = os.path.join(settings.upload_directory, "saved_notes", user_id)
    os.makedirs(user_dir, exist_ok=True)
    return user_dir


async def load_reminders(user_id: str) -> List[dict]:
    """Load reminders from JSON file."""
    file_path = get_reminders_file(user_id)
    if not os.path.exists(file_path):
        return []
    try:
        async with aiofiles.open(file_path, 'r') as f:
            content = await f.read()
            return json.loads(content)
    except:
        return []


async def save_reminders(user_id: str, reminders: List[dict]):
    """Save reminders to JSON file."""
    file_path = get_reminders_file(user_id)
    async with aiofiles.open(file_path, 'w') as f:
        await f.write(json.dumps(reminders, default=str, indent=2))


# ========== Calendar/Reminder Endpoints ==========

@router.post("/reminders", response_model=ReminderResponse)
async def create_reminder(
    reminder: ReminderCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new study reminder."""
    user_id = str(current_user["_id"])
    
    reminders = await load_reminders(user_id)
    
    new_reminder = {
        "id": str(uuid.uuid4()),
        "title": reminder.title,
        "description": reminder.description,
        "due_date": reminder.due_date.isoformat(),
        "subject": reminder.subject,
        "priority": reminder.priority,
        "completed": False,
        "created_at": datetime.utcnow().isoformat()
    }
    
    reminders.append(new_reminder)
    await save_reminders(user_id, reminders)
    
    return ReminderResponse(
        id=new_reminder["id"],
        title=new_reminder["title"],
        description=new_reminder["description"],
        due_date=datetime.fromisoformat(new_reminder["due_date"]),
        subject=new_reminder["subject"],
        priority=new_reminder["priority"],
        completed=new_reminder["completed"],
        created_at=datetime.fromisoformat(new_reminder["created_at"])
    )


@router.get("/reminders", response_model=List[ReminderResponse])
async def get_reminders(
    current_user: dict = Depends(get_current_user)
):
    """Get all reminders for the current user."""
    user_id = str(current_user["_id"])
    reminders = await load_reminders(user_id)
    
    return [
        ReminderResponse(
            id=r["id"],
            title=r["title"],
            description=r.get("description"),
            due_date=datetime.fromisoformat(r["due_date"]),
            subject=r.get("subject"),
            priority=r.get("priority", "medium"),
            completed=r.get("completed", False),
            created_at=datetime.fromisoformat(r["created_at"])
        )
        for r in reminders
    ]


@router.get("/reminders/upcoming", response_model=List[ReminderResponse])
async def get_upcoming_reminders(
    days: int = 7,
    current_user: dict = Depends(get_current_user)
):
    """Get upcoming reminders within specified days."""
    user_id = str(current_user["_id"])
    reminders = await load_reminders(user_id)
    
    now = datetime.utcnow()
    cutoff = now + timedelta(days=days)
    
    upcoming = []
    for r in reminders:
        if r.get("completed"):
            continue
        due = datetime.fromisoformat(r["due_date"])
        if now <= due <= cutoff:
            upcoming.append(ReminderResponse(
                id=r["id"],
                title=r["title"],
                description=r.get("description"),
                due_date=due,
                subject=r.get("subject"),
                priority=r.get("priority", "medium"),
                completed=r.get("completed", False),
                created_at=datetime.fromisoformat(r["created_at"])
            ))
    
    return sorted(upcoming, key=lambda x: x.due_date)


@router.put("/reminders/{reminder_id}/complete")
async def complete_reminder(
    reminder_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Mark a reminder as complete."""
    user_id = str(current_user["_id"])
    reminders = await load_reminders(user_id)
    
    for r in reminders:
        if r["id"] == reminder_id:
            r["completed"] = True
            await save_reminders(user_id, reminders)
            return {"status": "success", "message": "Reminder marked as complete"}
    
    raise HTTPException(status_code=404, detail="Reminder not found")


@router.delete("/reminders/{reminder_id}")
async def delete_reminder(
    reminder_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a reminder."""
    user_id = str(current_user["_id"])
    reminders = await load_reminders(user_id)
    
    original_count = len(reminders)
    reminders = [r for r in reminders if r["id"] != reminder_id]
    
    if len(reminders) == original_count:
        raise HTTPException(status_code=404, detail="Reminder not found")
    
    await save_reminders(user_id, reminders)
    return {"status": "success", "message": "Reminder deleted"}


@router.post("/schedule")
async def create_study_schedule(
    request: StudyScheduleRequest,
    current_user: dict = Depends(get_current_user)
):
    """Generate a study schedule and create reminders."""
    user_id = str(current_user["_id"])
    reminders = await load_reminders(user_id)
    
    created = []
    current_date = request.start_date
    
    for day in range(request.days):
        # Rotate through subjects
        subject = request.subjects[day % len(request.subjects)]
        
        reminder = {
            "id": str(uuid.uuid4()),
            "title": f"Study: {subject}",
            "description": f"Scheduled study session for {subject} ({request.hours_per_day} hours)",
            "due_date": current_date.isoformat(),
            "subject": subject,
            "priority": "medium",
            "completed": False,
            "created_at": datetime.utcnow().isoformat()
        }
        
        reminders.append(reminder)
        created.append(reminder["title"])
        current_date += timedelta(days=1)
    
    await save_reminders(user_id, reminders)
    
    return {
        "status": "success",
        "message": f"Created {len(created)} study sessions",
        "reminders": created
    }


# ========== Saved Files Endpoints ==========

@router.get("/saved-files", response_model=List[SavedFileResponse])
async def get_saved_files(
    category: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """List all saved notes/files."""
    user_id = str(current_user["_id"])
    notes_dir = get_saved_notes_dir(user_id)
    
    files = []
    
    # Check category folders
    categories = ["summaries", "mcqs", "explanations", "topics", "other"]
    if category:
        categories = [category]
    
    for cat in categories:
        cat_dir = os.path.join(notes_dir, cat)
        if not os.path.exists(cat_dir):
            continue
        
        for filename in os.listdir(cat_dir):
            file_path = os.path.join(cat_dir, filename)
            if os.path.isfile(file_path):
                stat = os.stat(file_path)
                files.append(SavedFileResponse(
                    filename=filename,
                    category=cat,
                    size=stat.st_size,
                    created_at=datetime.fromtimestamp(stat.st_ctime),
                    path=f"{cat}/{filename}"
                ))
    
    return sorted(files, key=lambda x: x.created_at, reverse=True)


@router.get("/saved-files/{category}/{filename}")
async def download_saved_file(
    category: str,
    filename: str,
    current_user: dict = Depends(get_current_user)
):
    """Get content of a saved file."""
    user_id = str(current_user["_id"])
    notes_dir = get_saved_notes_dir(user_id)
    file_path = os.path.join(notes_dir, category, filename)
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    async with aiofiles.open(file_path, 'r', encoding='utf-8') as f:
        content = await f.read()
    
    return {"filename": filename, "category": category, "content": content}


@router.delete("/saved-files/{category}/{filename}")
async def delete_saved_file(
    category: str,
    filename: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a saved file."""
    user_id = str(current_user["_id"])
    notes_dir = get_saved_notes_dir(user_id)
    file_path = os.path.join(notes_dir, category, filename)
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    os.remove(file_path)
    return {"status": "success", "message": "File deleted"}


@router.post("/save-note")
async def save_note_to_file(
    title: str,
    content: str,
    note_type: str = "other",
    current_user: dict = Depends(get_current_user)
):
    """Save a generated note to local files."""
    user_id = str(current_user["_id"])
    notes_dir = get_saved_notes_dir(user_id)
    
    # Map note type to category
    category_map = {
        "summary": "summaries",
        "mcq": "mcqs",
        "explanation": "explanations",
        "topic": "topics"
    }
    category = category_map.get(note_type, "other")
    
    # Create category directory
    cat_dir = os.path.join(notes_dir, category)
    os.makedirs(cat_dir, exist_ok=True)
    
    # Generate filename
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    safe_title = "".join(c for c in title if c.isalnum() or c in " _-").strip()[:50]
    filename = f"{safe_title}_{timestamp}.md"
    
    file_path = os.path.join(cat_dir, filename)
    
    async with aiofiles.open(file_path, 'w', encoding='utf-8') as f:
        await f.write(f"# {title}\n\n")
        await f.write(f"*Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M')}*\n\n")
        await f.write("---\n\n")
        await f.write(content)
    
    return {
        "status": "success",
        "message": "Note saved successfully",
        "path": f"{category}/{filename}"
    }


# ========== Stats Endpoint ==========

@router.get("/stats")
async def get_mcp_stats(current_user: dict = Depends(get_current_user)):
    """Get MCP usage statistics."""
    user_id = str(current_user["_id"])
    
    # Count reminders
    reminders = await load_reminders(user_id)
    total_reminders = len(reminders)
    completed_reminders = len([r for r in reminders if r.get("completed")])
    pending_reminders = total_reminders - completed_reminders
    
    # Count saved files
    notes_dir = get_saved_notes_dir(user_id)
    total_files = 0
    for cat in ["summaries", "mcqs", "explanations", "topics", "other"]:
        cat_dir = os.path.join(notes_dir, cat)
        if os.path.exists(cat_dir):
            total_files += len(os.listdir(cat_dir))
    
    # Upcoming reminders
    now = datetime.utcnow()
    upcoming = len([
        r for r in reminders
        if not r.get("completed") and datetime.fromisoformat(r["due_date"]) > now
    ])
    
    return {
        "reminders": {
            "total": total_reminders,
            "completed": completed_reminders,
            "pending": pending_reminders,
            "upcoming": upcoming
        },
        "files": {
            "total": total_files
        }
    }
