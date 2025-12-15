"""
MCP Client - Connect to MCP Servers from Backend

This module provides a client to connect to running MCP servers
and call their tools from the main FastAPI backend.
Supports both simulated and real Google API servers.
"""

import httpx
import json
from typing import Optional, Any


class MCPClient:
    """Client to interact with MCP servers."""
    
    def __init__(self, server_url: str, name: str = "MCP"):
        self.server_url = server_url.rstrip("/")
        self.name = name
        self.connected = False
    
    async def call_tool(self, tool_name: str, **kwargs) -> dict:
        """
        Call a tool on the MCP server.
        
        Args:
            tool_name: Name of the tool to call
            **kwargs: Tool arguments
            
        Returns:
            Tool response as dict
        """
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                # MCP tool call format
                response = await client.post(
                    f"{self.server_url}/tools/{tool_name}",
                    json=kwargs
                )
                
                if response.status_code == 200:
                    result = response.json()
                    # Parse JSON string if returned as string
                    if isinstance(result, str):
                        return json.loads(result)
                    return result
                else:
                    return {"error": f"Server error: {response.status_code}"}
        except httpx.ConnectError:
            return {"error": f"Cannot connect to {self.name} server at {self.server_url}"}
        except Exception as e:
            return {"error": str(e)}
    
    async def list_tools(self) -> list:
        """Get list of available tools from the server."""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(f"{self.server_url}/tools")
                if response.status_code == 200:
                    return response.json()
                return []
        except:
            return []
    
    async def health_check(self) -> bool:
        """Check if the MCP server is running."""
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(f"{self.server_url}/health")
                return response.status_code == 200
        except:
            return False


# Pre-configured clients for each MCP server
class MCPClients:
    """Container for all MCP server clients."""
    
    # Local simulated servers
    filesystem = MCPClient("http://localhost:9000", "Filesystem")
    calendar = MCPClient("http://localhost:9001", "Calendar")
    drive = MCPClient("http://localhost:9002", "Drive")
    
    # Real Google API servers
    google_calendar = MCPClient("http://localhost:9010", "Google Calendar")
    google_drive = MCPClient("http://localhost:9011", "Google Drive")
    
    @classmethod
    async def check_all(cls) -> dict:
        """Check status of all MCP servers."""
        return {
            "filesystem": await cls.filesystem.health_check(),
            "calendar": await cls.calendar.health_check(),
            "drive": await cls.drive.health_check(),
            "google_calendar": await cls.google_calendar.health_check(),
            "google_drive": await cls.google_drive.health_check()
        }


# Convenience functions for common operations

async def call_filesystem_tool(tool: str, **kwargs) -> dict:
    """Call a filesystem MCP tool."""
    return await MCPClients.filesystem.call_tool(tool, **kwargs)


async def call_calendar_tool(tool: str, **kwargs) -> dict:
    """Call a calendar MCP tool (local simulated)."""
    return await MCPClients.calendar.call_tool(tool, **kwargs)


async def call_drive_tool(tool: str, **kwargs) -> dict:
    """Call a drive MCP tool (local simulated)."""
    return await MCPClients.drive.call_tool(tool, **kwargs)


async def call_google_calendar_tool(tool: str, **kwargs) -> dict:
    """Call a Google Calendar MCP tool (real API)."""
    return await MCPClients.google_calendar.call_tool(tool, **kwargs)


async def call_google_drive_tool(tool: str, **kwargs) -> dict:
    """Call a Google Drive MCP tool (real API)."""
    return await MCPClients.google_drive.call_tool(tool, **kwargs)


# Tool wrapper classes for clean API

class FilesystemTools:
    """Wrapper for filesystem MCP tools."""
    
    @staticmethod
    async def list_directory(path: str = ".", user_id: str = "default"):
        return await call_filesystem_tool("list_directory", path=path, user_id=user_id)
    
    @staticmethod
    async def read_file(path: str, user_id: str = "default"):
        return await call_filesystem_tool("read_file", path=path, user_id=user_id)
    
    @staticmethod
    async def write_file(path: str, content: str, user_id: str = "default"):
        return await call_filesystem_tool("write_file", path=path, content=content, user_id=user_id)
    
    @staticmethod
    async def delete_file(path: str, user_id: str = "default"):
        return await call_filesystem_tool("delete_file", path=path, user_id=user_id)
    
    @staticmethod
    async def search_files(query: str, path: str = ".", user_id: str = "default"):
        return await call_filesystem_tool("search_files", query=query, path=path, user_id=user_id)


class CalendarTools:
    """Wrapper for calendar MCP tools (local simulated)."""
    
    @staticmethod
    async def create_event(title: str, start_time: str, **kwargs):
        return await call_calendar_tool("create_event", title=title, start_time=start_time, **kwargs)
    
    @staticmethod
    async def list_events(start_date: str = None, end_date: str = None, user_id: str = "default"):
        return await call_calendar_tool("list_events", start_date=start_date, end_date=end_date, user_id=user_id)
    
    @staticmethod
    async def get_upcoming_events(days: int = 7, user_id: str = "default"):
        return await call_calendar_tool("get_upcoming_events", days=days, user_id=user_id)
    
    @staticmethod
    async def update_event(event_id: str, **kwargs):
        return await call_calendar_tool("update_event", event_id=event_id, **kwargs)
    
    @staticmethod
    async def delete_event(event_id: str, user_id: str = "default"):
        return await call_calendar_tool("delete_event", event_id=event_id, user_id=user_id)
    
    @staticmethod
    async def create_study_schedule(subjects: str, start_date: str, **kwargs):
        return await call_calendar_tool("create_study_schedule", subjects=subjects, start_date=start_date, **kwargs)


class DriveTools:
    """Wrapper for drive MCP tools (local simulated)."""
    
    @staticmethod
    async def upload_file(filename: str, content: str, folder: str = "Documents", **kwargs):
        return await call_drive_tool("upload_file", filename=filename, content=content, folder=folder, **kwargs)
    
    @staticmethod
    async def download_file(file_id: str, user_id: str = "default"):
        return await call_drive_tool("download_file", file_id=file_id, user_id=user_id)
    
    @staticmethod
    async def list_files(folder: str = None, user_id: str = "default"):
        return await call_drive_tool("list_files", folder=folder, user_id=user_id)
    
    @staticmethod
    async def search_drive(query: str, user_id: str = "default"):
        return await call_drive_tool("search_drive", query=query, user_id=user_id)
    
    @staticmethod
    async def delete_file(file_id: str, user_id: str = "default"):
        return await call_drive_tool("delete_file", file_id=file_id, user_id=user_id)
    
    @staticmethod
    async def get_stats(user_id: str = "default"):
        return await call_drive_tool("get_drive_stats", user_id=user_id)


class GoogleCalendarTools:
    """Wrapper for Google Calendar MCP tools (real API)."""
    
    @staticmethod
    async def authenticate(user_id: str = "default"):
        return await call_google_calendar_tool("authenticate_google", user_id=user_id)
    
    @staticmethod
    async def check_connection(user_id: str = "default"):
        return await call_google_calendar_tool("check_connection", user_id=user_id)
    
    @staticmethod
    async def create_event(title: str, start_time: str, **kwargs):
        return await call_google_calendar_tool("create_event", title=title, start_time=start_time, **kwargs)
    
    @staticmethod
    async def list_events(start_date: str = None, end_date: str = None, user_id: str = "default"):
        return await call_google_calendar_tool("list_events", start_date=start_date, end_date=end_date, user_id=user_id)
    
    @staticmethod
    async def get_upcoming_events(days: int = 7, user_id: str = "default"):
        return await call_google_calendar_tool("get_upcoming_events", days=days, user_id=user_id)
    
    @staticmethod
    async def get_today_events(user_id: str = "default"):
        return await call_google_calendar_tool("get_today_events", user_id=user_id)
    
    @staticmethod
    async def update_event(event_id: str, **kwargs):
        return await call_google_calendar_tool("update_event", event_id=event_id, **kwargs)
    
    @staticmethod
    async def delete_event(event_id: str, user_id: str = "default"):
        return await call_google_calendar_tool("delete_event", event_id=event_id, user_id=user_id)
    
    @staticmethod
    async def create_study_schedule(subjects: str, start_date: str, **kwargs):
        return await call_google_calendar_tool("create_study_schedule", subjects=subjects, start_date=start_date, **kwargs)
    
    @staticmethod
    async def quick_add_event(text: str, user_id: str = "default"):
        return await call_google_calendar_tool("quick_add_event", text=text, user_id=user_id)


class GoogleDriveTools:
    """Wrapper for Google Drive MCP tools (real API)."""
    
    @staticmethod
    async def authenticate(user_id: str = "default"):
        return await call_google_drive_tool("authenticate_google", user_id=user_id)
    
    @staticmethod
    async def check_connection(user_id: str = "default"):
        return await call_google_drive_tool("check_connection", user_id=user_id)
    
    @staticmethod
    async def upload_file(filename: str, content: str, folder_name: str = None, **kwargs):
        return await call_google_drive_tool("upload_file", filename=filename, content=content, folder_name=folder_name, **kwargs)
    
    @staticmethod
    async def download_file(file_id: str, user_id: str = "default"):
        return await call_google_drive_tool("download_file", file_id=file_id, user_id=user_id)
    
    @staticmethod
    async def list_files(folder_name: str = None, user_id: str = "default"):
        return await call_google_drive_tool("list_files", folder_name=folder_name, user_id=user_id)
    
    @staticmethod
    async def search_drive(query: str, user_id: str = "default"):
        return await call_google_drive_tool("search_drive", query=query, user_id=user_id)
    
    @staticmethod
    async def delete_file(file_id: str, user_id: str = "default"):
        return await call_google_drive_tool("delete_file", file_id=file_id, user_id=user_id)
    
    @staticmethod
    async def create_folder(name: str, user_id: str = "default"):
        return await call_google_drive_tool("create_folder", name=name, user_id=user_id)
    
    @staticmethod
    async def list_folders(user_id: str = "default"):
        return await call_google_drive_tool("list_folders", user_id=user_id)
    
    @staticmethod
    async def get_stats(user_id: str = "default"):
        return await call_google_drive_tool("get_drive_stats", user_id=user_id)
    
    @staticmethod
    async def share_file(file_id: str, email: str, role: str = "reader", user_id: str = "default"):
        return await call_google_drive_tool("share_file", file_id=file_id, email=email, role=role, user_id=user_id)
    
    @staticmethod
    async def move_file(file_id: str, new_folder_name: str, user_id: str = "default"):
        return await call_google_drive_tool("move_file", file_id=file_id, new_folder_name=new_folder_name, user_id=user_id)
