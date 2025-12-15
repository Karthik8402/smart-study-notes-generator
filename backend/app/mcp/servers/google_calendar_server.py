"""
MCP Google Calendar Server - Real Google Calendar Integration
Uses the official MCP Python SDK (FastMCP) with Google Calendar API

Run this server: python -m app.mcp.servers.google_calendar_server
Exposes tools: create_event, list_events, update_event, delete_event, get_upcoming, create_study_schedule
"""

from mcp.server.fastmcp import FastMCP
import json
from datetime import datetime, timedelta
from typing import Optional

# Import Google Auth
try:
    from .google_auth import get_calendar_service, check_auth_status, GoogleAuthError
except ImportError:
    from google_auth import get_calendar_service, check_auth_status, GoogleAuthError

# Initialize MCP Server
mcp = FastMCP("Google Calendar Server")


def _parse_datetime(dt_str: str, all_day: bool = False) -> dict:
    """Convert datetime string to Google Calendar format.
    
    Handles browser datetime-local format (YYYY-MM-DDTHH:MM) by normalizing to full ISO.
    """
    if all_day:
        return {"date": dt_str[:10]}  # YYYY-MM-DD
    
    # Normalize datetime string to full ISO format
    # Browser datetime-local gives: "2025-12-15T16:40"
    # Google needs: "2025-12-15T16:40:00+05:30" or with timezone dict
    
    # Remove any existing timezone info for reparsing
    dt_str_clean = dt_str.replace('Z', '').replace('+00:00', '').replace('+05:30', '')
    
    # Make sure we have seconds
    if len(dt_str_clean) == 16:  # YYYY-MM-DDTHH:MM
        dt_str_clean += ":00"
    
    return {"dateTime": dt_str_clean, "timeZone": "Asia/Kolkata"}


def _format_event(event: dict) -> dict:
    """Format Google Calendar event for response."""
    start = event.get("start", {})
    end = event.get("end", {})
    
    return {
        "id": event.get("id"),
        "title": event.get("summary", "Untitled"),
        "description": event.get("description", ""),
        "location": event.get("location", ""),
        "start_time": start.get("dateTime") or start.get("date"),
        "end_time": end.get("dateTime") or end.get("date"),
        "status": event.get("status", "confirmed"),
        "html_link": event.get("htmlLink"),
        "created": event.get("created"),
        "updated": event.get("updated"),
        "all_day": "date" in start
    }


@mcp.tool()
def authenticate_google(user_id: str = "default") -> str:
    """
    Authenticate with Google Calendar. Opens a browser for OAuth consent.
    
    Args:
        user_id: User identifier
        
    Returns:
        Authentication status
    """
    try:
        # This will trigger OAuth flow if not authenticated
        service = get_calendar_service(user_id)
        # Test the connection
        service.calendarList().list(maxResults=1).execute()
        return json.dumps({
            "success": True,
            "message": "Successfully connected to Google Calendar!"
        })
    except GoogleAuthError as e:
        return json.dumps({"error": str(e)})
    except Exception as e:
        return json.dumps({"error": f"Authentication failed: {str(e)}"})


@mcp.tool()
def check_connection(user_id: str = "default") -> str:
    """
    Check if user is connected to Google Calendar.
    
    Args:
        user_id: User identifier
        
    Returns:
        Connection status
    """
    status = check_auth_status(user_id, "calendar")
    return json.dumps(status)


@mcp.tool()
def create_event(
    title: str,
    start_time: str,
    end_time: str = None,
    description: str = "",
    location: str = "",
    all_day: bool = False,
    reminder_minutes: int = 30,
    user_id: str = "default"
) -> str:
    """
    Create a new event in Google Calendar.
    
    Args:
        title: Event title
        start_time: Start time (ISO format: YYYY-MM-DDTHH:MM:SS or YYYY-MM-DD for all-day)
        end_time: End time (ISO format, optional - defaults to 1 hour after start)
        description: Event description
        location: Event location
        all_day: True for all-day event
        reminder_minutes: Minutes before event for reminder
        user_id: User identifier
        
    Returns:
        Created event details
    """
    try:
        service = get_calendar_service(user_id)
        
        # Calculate end time if not provided
        if not end_time:
            if all_day:
                end_time = start_time  # Same day for all-day
            else:
                start_dt = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
                end_dt = start_dt + timedelta(hours=1)
                end_time = end_dt.isoformat()
        
        event_body = {
            "summary": title,
            "description": description,
            "location": location,
            "start": _parse_datetime(start_time, all_day),
            "end": _parse_datetime(end_time, all_day),
            "reminders": {
                "useDefault": False,
                "overrides": [
                    {"method": "popup", "minutes": reminder_minutes}
                ]
            }
        }
        
        event = service.events().insert(
            calendarId='primary',
            body=event_body
        ).execute()
        
        return json.dumps({
            "success": True,
            "message": f"Created event: {title}",
            "event": _format_event(event)
        })
        
    except GoogleAuthError as e:
        return json.dumps({"error": str(e), "need_auth": True})
    except Exception as e:
        return json.dumps({"error": str(e)})


@mcp.tool()
def list_events(
    start_date: str = None,
    end_date: str = None,
    max_results: int = 50,
    user_id: str = "default"
) -> str:
    """
    List calendar events, optionally filtered by date range.
    
    Args:
        start_date: Start date filter (ISO format: YYYY-MM-DD)
        end_date: End date filter (ISO format: YYYY-MM-DD)
        max_results: Maximum number of events to return
        user_id: User identifier
        
    Returns:
        List of events
    """
    try:
        service = get_calendar_service(user_id)
        
        # Build query parameters
        params = {
            "calendarId": "primary",
            "maxResults": max_results,
            "singleEvents": True,
            "orderBy": "startTime"
        }
        
        if start_date:
            params["timeMin"] = f"{start_date}T00:00:00Z"
        else:
            # Default to now
            params["timeMin"] = datetime.utcnow().isoformat() + "Z"
        
        if end_date:
            params["timeMax"] = f"{end_date}T23:59:59Z"
        
        events_result = service.events().list(**params).execute()
        events = events_result.get("items", [])
        
        return json.dumps({
            "count": len(events),
            "events": [_format_event(e) for e in events]
        })
        
    except GoogleAuthError as e:
        return json.dumps({"error": str(e), "need_auth": True})
    except Exception as e:
        return json.dumps({"error": str(e)})


@mcp.tool()
def get_event(event_id: str, user_id: str = "default") -> str:
    """
    Get details of a specific event.
    
    Args:
        event_id: Google Calendar event ID
        user_id: User identifier
        
    Returns:
        Event details
    """
    try:
        service = get_calendar_service(user_id)
        event = service.events().get(
            calendarId='primary',
            eventId=event_id
        ).execute()
        
        return json.dumps(_format_event(event))
        
    except GoogleAuthError as e:
        return json.dumps({"error": str(e), "need_auth": True})
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
        user_id: User identifier
        
    Returns:
        Updated event details
    """
    try:
        service = get_calendar_service(user_id)
        
        # Get current event
        event = service.events().get(
            calendarId='primary',
            eventId=event_id
        ).execute()
        
        # Update fields
        if title:
            event['summary'] = title
        if description is not None:
            event['description'] = description
        if location is not None:
            event['location'] = location
        if start_time:
            event['start'] = _parse_datetime(start_time)
        if end_time:
            event['end'] = _parse_datetime(end_time)
        
        updated_event = service.events().update(
            calendarId='primary',
            eventId=event_id,
            body=event
        ).execute()
        
        return json.dumps({
            "success": True,
            "message": "Event updated",
            "event": _format_event(updated_event)
        })
        
    except GoogleAuthError as e:
        return json.dumps({"error": str(e), "need_auth": True})
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
        service = get_calendar_service(user_id)
        service.events().delete(
            calendarId='primary',
            eventId=event_id
        ).execute()
        
        return json.dumps({
            "success": True,
            "message": "Event deleted"
        })
        
    except GoogleAuthError as e:
        return json.dumps({"error": str(e), "need_auth": True})
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
        service = get_calendar_service(user_id)
        
        now = datetime.utcnow()
        time_min = now.isoformat() + "Z"
        time_max = (now + timedelta(days=days)).isoformat() + "Z"
        
        events_result = service.events().list(
            calendarId='primary',
            timeMin=time_min,
            timeMax=time_max,
            maxResults=100,
            singleEvents=True,
            orderBy='startTime'
        ).execute()
        
        events = events_result.get('items', [])
        
        return json.dumps({
            "days": days,
            "count": len(events),
            "events": [_format_event(e) for e in events]
        })
        
    except GoogleAuthError as e:
        return json.dumps({"error": str(e), "need_auth": True})
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
        service = get_calendar_service(user_id)
        
        today = datetime.utcnow().date()
        time_min = f"{today}T00:00:00Z"
        time_max = f"{today}T23:59:59Z"
        
        events_result = service.events().list(
            calendarId='primary',
            timeMin=time_min,
            timeMax=time_max,
            singleEvents=True,
            orderBy='startTime'
        ).execute()
        
        events = events_result.get('items', [])
        
        return json.dumps({
            "date": str(today),
            "count": len(events),
            "events": [_format_event(e) for e in events]
        })
        
    except GoogleAuthError as e:
        return json.dumps({"error": str(e), "need_auth": True})
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
    Create a study schedule with rotating subjects in Google Calendar.
    
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
        service = get_calendar_service(user_id)
        
        subject_list = [s.strip() for s in subjects.split(",") if s.strip()]
        if not subject_list:
            return json.dumps({"error": "No subjects provided"})
        
        created_events = []
        base_date = datetime.fromisoformat(start_date)
        
        for day in range(days):
            subject = subject_list[day % len(subject_list)]
            start = base_date + timedelta(days=day)
            start = start.replace(hour=start_hour, minute=0, second=0)
            end = start + timedelta(hours=hours_per_session)
            
            event_body = {
                "summary": f"📚 Study Session: {subject}",
                "description": f"Scheduled {hours_per_session}-hour study session for {subject}.\n\nGenerated by Smart Study Notes.",
                "start": {"dateTime": start.isoformat(), "timeZone": "Asia/Kolkata"},
                "end": {"dateTime": end.isoformat(), "timeZone": "Asia/Kolkata"},
                "reminders": {
                    "useDefault": False,
                    "overrides": [
                        {"method": "popup", "minutes": 30},
                        {"method": "popup", "minutes": 10}
                    ]
                },
                "colorId": str((day % 11) + 1)  # Rotating colors
            }
            
            event = service.events().insert(
                calendarId='primary',
                body=event_body
            ).execute()
            
            created_events.append(_format_event(event))
        
        return json.dumps({
            "success": True,
            "message": f"Created {len(created_events)} study sessions in Google Calendar!",
            "schedule": created_events
        })
        
    except GoogleAuthError as e:
        return json.dumps({"error": str(e), "need_auth": True})
    except Exception as e:
        return json.dumps({"error": str(e)})


@mcp.tool()
def quick_add_event(text: str, user_id: str = "default") -> str:
    """
    Quickly add an event using natural language.
    
    Args:
        text: Natural language event description (e.g., "Meeting tomorrow at 3pm")
        user_id: User identifier
        
    Returns:
        Created event details
    """
    try:
        service = get_calendar_service(user_id)
        
        event = service.events().quickAdd(
            calendarId='primary',
            text=text
        ).execute()
        
        return json.dumps({
            "success": True,
            "message": f"Created event from: '{text}'",
            "event": _format_event(event)
        })
        
    except GoogleAuthError as e:
        return json.dumps({"error": str(e), "need_auth": True})
    except Exception as e:
        return json.dumps({"error": str(e)})


# Run server
if __name__ == "__main__":
    print("[Google Calendar] Starting MCP Server (stdio transport)...")
    print("[Google Calendar] Tools: authenticate_google, check_connection, create_event, list_events, update_event, delete_event, get_upcoming_events, get_today_events, create_study_schedule, quick_add_event")
    mcp.run()
