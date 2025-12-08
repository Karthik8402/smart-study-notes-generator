"""
MCP Calendar Tool - Study Reminders and Schedule Management

This tool provides calendar/reminder functionality for the Smart Study Notes app.
It stores reminders in JSON files per user and provides CRUD operations.
"""

import os
import json
import uuid
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
import aiofiles


class CalendarTool:
    """MCP Tool for managing study reminders and schedules."""
    
    def __init__(self, base_directory: str = "./uploads"):
        self.base_directory = base_directory
        self.data_dir = os.path.join(base_directory, "mcp_calendar")
        os.makedirs(self.data_dir, exist_ok=True)
    
    def _get_user_file(self, user_id: str) -> str:
        """Get the path to a user's reminders file."""
        user_dir = os.path.join(self.data_dir, user_id)
        os.makedirs(user_dir, exist_ok=True)
        return os.path.join(user_dir, "reminders.json")
    
    async def _load_reminders(self, user_id: str) -> List[Dict]:
        """Load all reminders for a user."""
        file_path = self._get_user_file(user_id)
        if not os.path.exists(file_path):
            return []
        try:
            async with aiofiles.open(file_path, 'r', encoding='utf-8') as f:
                content = await f.read()
                return json.loads(content) if content else []
        except (json.JSONDecodeError, IOError):
            return []
    
    async def _save_reminders(self, user_id: str, reminders: List[Dict]) -> None:
        """Save all reminders for a user."""
        file_path = self._get_user_file(user_id)
        async with aiofiles.open(file_path, 'w', encoding='utf-8') as f:
            await f.write(json.dumps(reminders, indent=2, default=str))
    
    # ========== CRUD Operations ==========
    
    async def create_reminder(
        self,
        user_id: str,
        title: str,
        due_date: datetime,
        description: Optional[str] = None,
        subject: Optional[str] = None,
        priority: str = "medium",
        tags: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Create a new study reminder.
        
        Args:
            user_id: User's unique identifier
            title: Reminder title
            due_date: When the reminder is due
            description: Optional description
            subject: Subject/topic related to reminder
            priority: low, medium, or high
            tags: Optional list of tags
            
        Returns:
            Created reminder object
        """
        reminders = await self._load_reminders(user_id)
        
        new_reminder = {
            "id": str(uuid.uuid4()),
            "title": title,
            "description": description,
            "due_date": due_date.isoformat(),
            "subject": subject,
            "priority": priority,
            "tags": tags or [],
            "completed": False,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        reminders.append(new_reminder)
        await self._save_reminders(user_id, reminders)
        
        return new_reminder
    
    async def get_all_reminders(self, user_id: str) -> List[Dict]:
        """Get all reminders for a user."""
        return await self._load_reminders(user_id)
    
    async def get_reminder(self, user_id: str, reminder_id: str) -> Optional[Dict]:
        """Get a specific reminder by ID."""
        reminders = await self._load_reminders(user_id)
        for r in reminders:
            if r["id"] == reminder_id:
                return r
        return None
    
    async def update_reminder(
        self,
        user_id: str,
        reminder_id: str,
        **updates
    ) -> Optional[Dict]:
        """Update a reminder's fields."""
        reminders = await self._load_reminders(user_id)
        
        for i, r in enumerate(reminders):
            if r["id"] == reminder_id:
                for key, value in updates.items():
                    if key in r and key not in ["id", "created_at"]:
                        if key == "due_date" and isinstance(value, datetime):
                            r[key] = value.isoformat()
                        else:
                            r[key] = value
                r["updated_at"] = datetime.utcnow().isoformat()
                reminders[i] = r
                await self._save_reminders(user_id, reminders)
                return r
        
        return None
    
    async def delete_reminder(self, user_id: str, reminder_id: str) -> bool:
        """Delete a reminder by ID."""
        reminders = await self._load_reminders(user_id)
        original_count = len(reminders)
        reminders = [r for r in reminders if r["id"] != reminder_id]
        
        if len(reminders) < original_count:
            await self._save_reminders(user_id, reminders)
            return True
        return False
    
    async def mark_complete(self, user_id: str, reminder_id: str) -> Optional[Dict]:
        """Mark a reminder as complete."""
        return await self.update_reminder(user_id, reminder_id, completed=True)
    
    async def mark_incomplete(self, user_id: str, reminder_id: str) -> Optional[Dict]:
        """Mark a reminder as incomplete."""
        return await self.update_reminder(user_id, reminder_id, completed=False)
    
    # ========== Query Operations ==========
    
    async def get_upcoming_reminders(
        self,
        user_id: str,
        days: int = 7
    ) -> List[Dict]:
        """Get reminders due within the specified number of days."""
        reminders = await self._load_reminders(user_id)
        now = datetime.utcnow()
        cutoff = now + timedelta(days=days)
        
        upcoming = []
        for r in reminders:
            if r.get("completed"):
                continue
            try:
                due = datetime.fromisoformat(r["due_date"])
                if now <= due <= cutoff:
                    upcoming.append(r)
            except (ValueError, KeyError):
                continue
        
        return sorted(upcoming, key=lambda x: x["due_date"])
    
    async def get_overdue_reminders(self, user_id: str) -> List[Dict]:
        """Get all overdue, incomplete reminders."""
        reminders = await self._load_reminders(user_id)
        now = datetime.utcnow()
        
        overdue = []
        for r in reminders:
            if r.get("completed"):
                continue
            try:
                due = datetime.fromisoformat(r["due_date"])
                if due < now:
                    overdue.append(r)
            except (ValueError, KeyError):
                continue
        
        return sorted(overdue, key=lambda x: x["due_date"])
    
    async def get_reminders_by_subject(
        self,
        user_id: str,
        subject: str
    ) -> List[Dict]:
        """Get all reminders for a specific subject."""
        reminders = await self._load_reminders(user_id)
        return [r for r in reminders if r.get("subject", "").lower() == subject.lower()]
    
    # ========== Schedule Generation ==========
    
    async def generate_study_schedule(
        self,
        user_id: str,
        subjects: List[str],
        start_date: datetime,
        days: int = 7,
        hours_per_day: int = 4,
        time_of_day: str = "18:00"
    ) -> List[Dict]:
        """
        Generate a study schedule with rotating subjects.
        
        Args:
            user_id: User's unique identifier
            subjects: List of subjects to study
            start_date: When to start the schedule
            days: Number of days to schedule
            hours_per_day: Hours per study session
            time_of_day: Time to set reminders (HH:MM format)
            
        Returns:
            List of created reminders
        """
        created_reminders = []
        hour, minute = map(int, time_of_day.split(":"))
        
        for day_offset in range(days):
            subject = subjects[day_offset % len(subjects)]
            reminder_date = start_date + timedelta(days=day_offset)
            reminder_date = reminder_date.replace(hour=hour, minute=minute, second=0)
            
            reminder = await self.create_reminder(
                user_id=user_id,
                title=f"Study Session: {subject}",
                due_date=reminder_date,
                description=f"Scheduled {hours_per_day}-hour study session for {subject}",
                subject=subject,
                priority="medium",
                tags=["auto-scheduled", "study-session"]
            )
            created_reminders.append(reminder)
        
        return created_reminders
    
    # ========== Statistics ==========
    
    async def get_statistics(self, user_id: str) -> Dict[str, Any]:
        """Get reminder statistics for a user."""
        reminders = await self._load_reminders(user_id)
        now = datetime.utcnow()
        
        total = len(reminders)
        completed = len([r for r in reminders if r.get("completed")])
        pending = total - completed
        
        overdue = 0
        upcoming_7_days = 0
        
        for r in reminders:
            if r.get("completed"):
                continue
            try:
                due = datetime.fromisoformat(r["due_date"])
                if due < now:
                    overdue += 1
                elif due <= now + timedelta(days=7):
                    upcoming_7_days += 1
            except (ValueError, KeyError):
                continue
        
        # Count by subject
        by_subject = {}
        for r in reminders:
            subject = r.get("subject") or "No Subject"
            by_subject[subject] = by_subject.get(subject, 0) + 1
        
        return {
            "total": total,
            "completed": completed,
            "pending": pending,
            "overdue": overdue,
            "upcoming_7_days": upcoming_7_days,
            "completion_rate": round(completed / total * 100, 1) if total > 0 else 0,
            "by_subject": by_subject
        }


# Singleton instance
calendar_tool = CalendarTool()
