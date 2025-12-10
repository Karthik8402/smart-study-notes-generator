"""
MCP Filesystem Server - Local File Operations
Uses the official MCP Python SDK (FastMCP)

Run this server: python -m app.mcp.servers.filesystem_server
Exposes tools: list_directory, read_file, write_file, delete_file, search_files
"""

from mcp.server.fastmcp import FastMCP
from pathlib import Path
import os
import json
from datetime import datetime

# Initialize MCP Server
mcp = FastMCP("Filesystem Server")

# Base directory for safe file operations
BASE_DIR = Path("./uploads/user_files")
BASE_DIR.mkdir(parents=True, exist_ok=True)


def _safe_path(path: str, user_id: str = "default") -> Path:
    """Ensure path stays within user's directory (security)."""
    user_dir = BASE_DIR / user_id
    user_dir.mkdir(parents=True, exist_ok=True)
    
    # Resolve and validate path
    resolved = (user_dir / path).resolve()
    if not str(resolved).startswith(str(user_dir.resolve())):
        raise ValueError("Path traversal not allowed")
    return resolved


@mcp.tool()
def list_directory(path: str = ".", user_id: str = "default") -> str:
    """
    List files and directories at the given path.
    
    Args:
        path: Relative path to list (default: root)
        user_id: User identifier for isolation
        
    Returns:
        JSON string with files and directories
    """
    try:
        target = _safe_path(path, user_id)
        if not target.exists():
            return json.dumps({"error": f"Path not found: {path}"})
        
        items = []
        for item in target.iterdir():
            stat = item.stat()
            items.append({
                "name": item.name,
                "type": "directory" if item.is_dir() else "file",
                "size": stat.st_size if item.is_file() else None,
                "modified": datetime.fromtimestamp(stat.st_mtime).isoformat()
            })
        
        return json.dumps({
            "path": path,
            "items": sorted(items, key=lambda x: (x["type"] != "directory", x["name"]))
        })
    except Exception as e:
        return json.dumps({"error": str(e)})


@mcp.tool()
def read_file(path: str, user_id: str = "default") -> str:
    """
    Read contents of a text file.
    
    Args:
        path: Path to the file to read
        user_id: User identifier for isolation
        
    Returns:
        File contents or error message
    """
    try:
        target = _safe_path(path, user_id)
        if not target.exists():
            return json.dumps({"error": f"File not found: {path}"})
        if not target.is_file():
            return json.dumps({"error": f"Not a file: {path}"})
        
        content = target.read_text(encoding="utf-8")
        return json.dumps({
            "path": path,
            "content": content,
            "size": len(content)
        })
    except UnicodeDecodeError:
        return json.dumps({"error": "File is not valid UTF-8 text"})
    except Exception as e:
        return json.dumps({"error": str(e)})


@mcp.tool()
def write_file(path: str, content: str, user_id: str = "default") -> str:
    """
    Write content to a file (creates directories if needed).
    
    Args:
        path: Path where to write the file
        content: Text content to write
        user_id: User identifier for isolation
        
    Returns:
        Success/error message
    """
    try:
        target = _safe_path(path, user_id)
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(content, encoding="utf-8")
        
        return json.dumps({
            "success": True,
            "path": path,
            "size": len(content),
            "message": f"Written {len(content)} bytes to {path}"
        })
    except Exception as e:
        return json.dumps({"error": str(e)})


@mcp.tool()
def delete_file(path: str, user_id: str = "default") -> str:
    """
    Delete a file.
    
    Args:
        path: Path to the file to delete
        user_id: User identifier for isolation
        
    Returns:
        Success/error message
    """
    try:
        target = _safe_path(path, user_id)
        if not target.exists():
            return json.dumps({"error": f"File not found: {path}"})
        if target.is_dir():
            return json.dumps({"error": "Use delete_directory for directories"})
        
        target.unlink()
        return json.dumps({
            "success": True,
            "message": f"Deleted file: {path}"
        })
    except Exception as e:
        return json.dumps({"error": str(e)})


@mcp.tool()
def create_directory(path: str, user_id: str = "default") -> str:
    """
    Create a new directory.
    
    Args:
        path: Path for the new directory
        user_id: User identifier for isolation
        
    Returns:
        Success/error message
    """
    try:
        target = _safe_path(path, user_id)
        target.mkdir(parents=True, exist_ok=True)
        
        return json.dumps({
            "success": True,
            "message": f"Created directory: {path}"
        })
    except Exception as e:
        return json.dumps({"error": str(e)})


@mcp.tool()
def search_files(query: str, path: str = ".", user_id: str = "default") -> str:
    """
    Search for files matching a query pattern.
    
    Args:
        query: Search pattern (filename contains this string)
        path: Directory to search in
        user_id: User identifier for isolation
        
    Returns:
        JSON list of matching files
    """
    try:
        target = _safe_path(path, user_id)
        if not target.exists():
            return json.dumps({"error": f"Path not found: {path}"})
        
        matches = []
        query_lower = query.lower()
        
        for item in target.rglob("*"):
            if item.is_file() and query_lower in item.name.lower():
                rel_path = item.relative_to(_safe_path(".", user_id))
                matches.append({
                    "path": str(rel_path),
                    "name": item.name,
                    "size": item.stat().st_size
                })
        
        return json.dumps({
            "query": query,
            "matches": matches[:50],  # Limit to 50 results
            "count": len(matches)
        })
    except Exception as e:
        return json.dumps({"error": str(e)})


@mcp.tool()
def get_file_info(path: str, user_id: str = "default") -> str:
    """
    Get detailed information about a file.
    
    Args:
        path: Path to the file
        user_id: User identifier for isolation
        
    Returns:
        File metadata as JSON
    """
    try:
        target = _safe_path(path, user_id)
        if not target.exists():
            return json.dumps({"error": f"Path not found: {path}"})
        
        stat = target.stat()
        return json.dumps({
            "path": path,
            "name": target.name,
            "type": "directory" if target.is_dir() else "file",
            "size": stat.st_size,
            "created": datetime.fromtimestamp(stat.st_ctime).isoformat(),
            "modified": datetime.fromtimestamp(stat.st_mtime).isoformat(),
            "extension": target.suffix if target.is_file() else None
        })
    except Exception as e:
        return json.dumps({"error": str(e)})


# Run server
if __name__ == "__main__":
    print("🗂️ Starting Filesystem MCP Server on port 9000...")
    mcp.run(transport="sse", host="0.0.0.0", port=9000)
