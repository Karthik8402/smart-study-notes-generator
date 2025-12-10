"""
MCP Calendar Server - Study Schedule & Reminders
Uses the official MCP Python SDK (FastMCP)

Run this server: python -m app.mcp.servers.calendar_server
Exposes tools: create_event, list_events, update_event, delete_event, get_upcoming
"""

from mcp.server.fastmcp import FastMCP
from pathlib import Path
import os
import json
import uuid
from datetime import datetime, timedelta

# Initialize MCP Server
mcp = FastMCP("Calendar Server")

# Storage directory
CALENDAR_DIR = Path("./uploads/mcp_calendar")
CALENDAR_DIR.mkdir(parents=True, exist_ok=True)


def _get_calendar_file(user_id: str) -> Path:
    """Get path to user's calendar file."""
    user_dir = CALENDAR_DIR / user_id
    user_dir.mkdir(parents=True, exist_ok=True)
    return user_dir / "events.json"


def _load_events(user_id: str) -> list:
    """Load events from file."""
    cal_file = _get_calendar_file(user_id)
    if not cal_file.exists():
        return []
    try:
        return json.loads(cal_file.read_text(encoding="utf-8"))
    except:
        return []


def _save_events(user_id: str, events: list):
    """Save events to file."""
    cal_file = _get_calendar_file(user_id)
    cal_file.write_text(json.dumps(events, indent=2, default=str), encoding="utf-8")


@mcp.tool()
def create_event(
    title: str,
    start_time: str,
    end_time: str = None,
    description: str = "",
    location: str = "",
    reminder_minutes: int = 30,
    user_id: str = "default"
) -> str:
    """
    Create a new calendar event.
    
    Args:
        title: Event title
        start_time: Start time (ISO format: YYYY-MM-DDTHH:MM)
        end_time: End time (ISO format, optional - defaults to 1 hour after start)
        description: Event description
        location: Event location
        reminder_minutes: Minutes before event for reminder
        user_id: User identifier
        
    Returns:
        Created event details
    """
    try:
        events = _load_events(user_id)
        
        # Parse times
        start = datetime.fromisoformat(start_time)
        if end_time:
            end = datetime.fromisoformat(end_time)
        else:
            end = start + timedelta(hours=1)
        
        event = {
            "id": str(uuid.uuid4()),
            "title": title,
            "description": description,
            "location": location,
            "start_time": start.isoformat(),
            "end_time": end.isoformat(),
            "reminder_minutes": reminder_minutes,
            "created_at": datetime.utcnow().isoformat(),
            "status": "scheduled"
        }
        
        events.append(event)
        _save_events(user_id, events)
        
        return json.dumps({
            "success": True,
            "message": f"Created event: {title}",
            "event": event
        })
    except Exception as e:
        return json.dumps({"error": str(e)})


@mcp.tool()
def list_events(
    start_date: str = None,
    end_date: str = None,
    user_id: str = "default"
) -> str:
    """
    List calendar events, optionally filtered by date range.
    
    Args:
        start_date: Start date filter (ISO format: YYYY-MM-DD)
        end_date: End date filter (ISO format: YYYY-MM-DD)
        user_id: User identifier
        
    Returns:
        List of events
    """
    try:
        events = _load_events(user_id)
        
        # Filter by date if provided
        if start_date:
            start = datetime.fromisoformat(start_date)
            events = [e for e in events if datetime.fromisoformat(e["start_time"]) >= start]
        
        if end_date:
            end = datetime.fromisoformat(end_date)
            events = [e for e in events if datetime.fromisoformat(e["start_time"]) <= end]
        
        # Sort by start time
        events = sorted(events, key=lambda x: x["start_time"])
        
        return json.dumps({
            "count": len(events),
            "events": events
        })
    except Exception as e:
        return json.dumps({"error": str(e)})


@mcp.tool()
def get_event(event_id: str, user_id: str = "default") -> str:
    """
    Get details of a specific event.
    
    Args:
        event_id: Event ID
        user_id: User identifier
        
    Returns:
        Event details
    """
    try:
        events = _load_events(user_id)
        
        for event in events:
            if event["id"] == event_id:
                return json.dumps(event)
        
        return json.dumps({"error": "Event not found"})
    except Exception as e:
        return json.dumps({"error": str(e)})


@mcp.tool()
def update_event(
    event_id: str,
    title: str = None,
    start_time: str = None,
    end_time: str = None,
    description: str = None,
    location: str = None,
    status: str = None,
    user_id: str = "default"
) -> str:
    """
    Update an existing calendar event.
    
    Args:
        event_id: Event ID to update
        title: New title (optional)
        start_time: New start time (optional)
        end_time: New end time (optional)
        description: New description (optional)
        location: New location (optional)
        status: New status: scheduled, completed, cancelled (optional)
        user_id: User identifier
        
    Returns:
        Updated event details
    """
    try:
        events = _load_events(user_id)
        
        for i, event in enumerate(events):
            if event["id"] == event_id:
                if title: event["title"] = title
                if start_time: event["start_time"] = start_time
                if end_time: event["end_time"] = end_time
                if description: event["description"] = description
                if location: event["location"] = location
                if status: event["status"] = status
                event["updated_at"] = datetime.utcnow().isoformat()
                
                events[i] = event
                _save_events(user_id, events)
                
                return json.dumps({
                    "success": True,
                    "message": "Event updated",
                    "event": event
                })
        
        return json.dumps({"error": "Event not found"})
    except Exception as e:
        return json.dumps({"error": str(e)})


@mcp.tool()
def delete_event(event_id: str, user_id: str = "default") -> str:
    """
    Delete a calendar event.
    
    Args:
        event_id: Event ID to delete
        user_id: User identifier
        
    Returns:
        Success/error message
    """
    try:
        events = _load_events(user_id)
        original_count = len(events)
        
        events = [e for e in events if e["id"] != event_id]
        
        if len(events) == original_count:
            return json.dumps({"error": "Event not found"})
        
        _save_events(user_id, events)
        
        return json.dumps({
            "success": True,
            "message": "Event deleted"
        })
    except Exception as e:
        return json.dumps({"error": str(e)})


@mcp.tool()
def get_upcoming_events(days: int = 7, user_id: str = "default") -> str:
    """
    Get upcoming events within the next N days.
    
    Args:
        days: Number of days to look ahead (default: 7)
        user_id: User identifier
        
    Returns:
        List of upcoming events
    """
    try:
        events = _load_events(user_id)
        
        now = datetime.utcnow()
        cutoff = now + timedelta(days=days)
        
        upcoming = []
        for event in events:
            if event.get("status") == "cancelled":
                continue
            start = datetime.fromisoformat(event["start_time"])
            if now <= start <= cutoff:
                upcoming.append(event)
        
        upcoming = sorted(upcoming, key=lambda x: x["start_time"])
        
        return json.dumps({
            "days": days,
            "count": len(upcoming),
            "events": upcoming
        })
    except Exception as e:
        return json.dumps({"error": str(e)})


@mcp.tool()
def create_study_schedule(
    subjects: str,
    start_date: str,
    days: int = 7,
    hours_per_session: int = 2,
    start_hour: int = 18,
    user_id: str = "default"
) -> str:
    """
    Create a study schedule with rotating subjects.
    
    Args:
        subjects: Comma-separated list of subjects (e.g., "Math, Physics, Chemistry")
        start_date: Start date (ISO format: YYYY-MM-DD)
        days: Number of days for schedule
        hours_per_session: Hours per study session
        start_hour: Hour of day to schedule (24h format)
        user_id: User identifier
        
    Returns:
        Created schedule details
    """
    try:
        subject_list = [s.strip() for s in subjects.split(",") if s.strip()]
        if not subject_list:
            return json.dumps({"error": "No subjects provided"})
        
        events = _load_events(user_id)
        created = []
        
        base_date = datetime.fromisoformat(start_date)
        
        for day in range(days):
            subject = subject_list[day % len(subject_list)]
            start = base_date + timedelta(days=day)
            start = start.replace(hour=start_hour, minute=0, second=0)
            end = start + timedelta(hours=hours_per_session)
            
            event = {
                "id": str(uuid.uuid4()),
                "title": f"Study Session: {subject}",
                "description": f"Scheduled {hours_per_session}-hour study session for {subject}",
                "location": "",
                "start_time": start.isoformat(),
                "end_time": end.isoformat(),
                "reminder_minutes": 30,
                "created_at": datetime.utcnow().isoformat(),
                "status": "scheduled",
                "tags": ["study", "auto-scheduled", subject.lower()]
            }
            
            events.append(event)
            created.append(event)
        
        _save_events(user_id, events)
        
        return json.dumps({
            "success": True,
            "message": f"Created {len(created)} study sessions",
            "schedule": created
        })
    except Exception as e:
        return json.dumps({"error": str(e)})


@mcp.tool()
def get_today_events(user_id: str = "default") -> str:
    """
    Get all events scheduled for today.
    
    Args:
        user_id: User identifier
        
    Returns:
        Today's events
    """
    try:
        events = _load_events(user_id)
        
        today = datetime.utcnow().date()
        today_events = []
        
        for event in events:
            if event.get("status") == "cancelled":
                continue
            start = datetime.fromisoformat(event["start_time"]).date()
            if start == today:
                today_events.append(event)
        
        today_events = sorted(today_events, key=lambda x: x["start_time"])
        
        return json.dumps({
            "date": today.isoformat(),
            "count": len(today_events),
            "events": today_events
        })
    except Exception as e:
        return json.dumps({"error": str(e)})


# Run server
if __name__ == "__main__":
    print("[Calendar] Starting MCP Server (stdio transport)...")
    mcp.run()
