"""
MCP Servers Package

Contains proper MCP servers using the official Python SDK (FastMCP).

Servers:
- filesystem_server: Local file operations (port 9000)
- calendar_server: Calendar & scheduling (port 9001)  
- drive_server: Cloud-like storage (port 9002)

Usage:
    # Start individual servers:
    python -m app.mcp.servers.filesystem_server
    python -m app.mcp.servers.calendar_server
    python -m app.mcp.servers.drive_server
    
    # Or use the start_all_servers.py script
"""

__all__ = [
    'filesystem_server',
    'calendar_server', 
    'drive_server'
]
