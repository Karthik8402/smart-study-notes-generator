"""
MCP Tools Package

This package contains MCP (Model Context Protocol) tool implementations
for the Smart Study Notes Generator application.

Available Tools:
- CalendarTool: Study reminders and schedule management
- FileTool: Study notes file storage and organization  
- DriveTool: Cloud-like file storage (simulated Google Drive)
"""

from app.mcp.tools.calendar_tool import calendar_tool, CalendarTool
from app.mcp.tools.file_tool import file_tool, FileTool
from app.mcp.tools.drive_tool import drive_tool, DriveTool

__all__ = [
    'calendar_tool',
    'CalendarTool',
    'file_tool', 
    'FileTool',
    'drive_tool',
    'DriveTool'
]
