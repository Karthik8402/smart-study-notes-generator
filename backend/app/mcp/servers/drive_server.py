"""
MCP Drive Server - Cloud-like File Storage (Simulated Google Drive)
Uses the official MCP Python SDK (FastMCP)

Run this server: python -m app.mcp.servers.drive_server
Exposes tools: upload_file, download_file, list_files, search, share, create_folder
"""

from mcp.server.fastmcp import FastMCP
from pathlib import Path
import os
import json
import uuid
import base64
import shutil
from datetime import datetime

# Initialize MCP Server
mcp = FastMCP("Drive Server")

# Storage directory (simulated cloud storage)
DRIVE_DIR = Path("./uploads/mcp_drive")
DRIVE_DIR.mkdir(parents=True, exist_ok=True)


def _get_user_drive(user_id: str) -> Path:
    """Get user's drive directory."""
    user_drive = DRIVE_DIR / user_id
    user_drive.mkdir(parents=True, exist_ok=True)
    
    # Create default folders
    for folder in ["Documents", "Notes", "PDFs", "Shared"]:
        (user_drive / folder).mkdir(exist_ok=True)
    
    return user_drive


def _get_metadata_file(user_id: str) -> Path:
    """Get metadata file path."""
    return _get_user_drive(user_id) / ".metadata.json"


def _load_metadata(user_id: str) -> dict:
    """Load drive metadata."""
    meta_file = _get_metadata_file(user_id)
    if not meta_file.exists():
        return {"files": {}, "shared": {}}
    try:
        return json.loads(meta_file.read_text(encoding="utf-8"))
    except:
        return {"files": {}, "shared": {}}


def _save_metadata(user_id: str, metadata: dict):
    """Save drive metadata."""
    meta_file = _get_metadata_file(user_id)
    meta_file.write_text(json.dumps(metadata, indent=2, default=str), encoding="utf-8")


def _get_mime_type(filename: str) -> str:
    """Get MIME type from extension."""
    ext = Path(filename).suffix.lower()
    types = {
        ".pdf": "application/pdf",
        ".txt": "text/plain",
        ".md": "text/markdown",
        ".json": "application/json",
        ".doc": "application/msword",
        ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ".ppt": "application/vnd.ms-powerpoint",
        ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".gif": "image/gif"
    }
    return types.get(ext, "application/octet-stream")


@mcp.tool()
def upload_file(
    filename: str,
    content: str,
    folder: str = "Documents",
    is_base64: bool = False,
    description: str = "",
    user_id: str = "default"
) -> str:
    """
    Upload a file to Drive.
    
    Args:
        filename: Name of the file
        content: File content (text or base64 encoded)
        folder: Destination folder
        is_base64: True if content is base64 encoded (for binary files)
        description: File description
        user_id: User identifier
        
    Returns:
        Uploaded file details
    """
    try:
        user_drive = _get_user_drive(user_id)
        folder_path = user_drive / folder
        folder_path.mkdir(parents=True, exist_ok=True)
        
        file_id = str(uuid.uuid4())
        file_path = folder_path / filename
        
        # Handle duplicate names
        base = Path(filename).stem
        ext = Path(filename).suffix
        counter = 1
        while file_path.exists():
            filename = f"{base}_{counter}{ext}"
            file_path = folder_path / filename
            counter += 1
        
        # Write content
        if is_base64:
            file_path.write_bytes(base64.b64decode(content))
        else:
            file_path.write_text(content, encoding="utf-8")
        
        # Update metadata
        metadata = _load_metadata(user_id)
        file_info = {
            "id": file_id,
            "filename": filename,
            "folder": folder,
            "path": str(file_path.relative_to(user_drive)),
            "size": file_path.stat().st_size,
            "mime_type": _get_mime_type(filename),
            "description": description,
            "created_at": datetime.utcnow().isoformat(),
            "modified_at": datetime.utcnow().isoformat(),
            "shared": False
        }
        metadata["files"][file_id] = file_info
        _save_metadata(user_id, metadata)
        
        return json.dumps({
            "success": True,
            "message": f"Uploaded: {filename}",
            "file": file_info
        })
    except Exception as e:
        return json.dumps({"error": str(e)})


@mcp.tool()
def download_file(file_id: str, user_id: str = "default") -> str:
    """
    Download a file from Drive.
    
    Args:
        file_id: File ID
        user_id: User identifier
        
    Returns:
        File content (base64 encoded for binary, text for text files)
    """
    try:
        metadata = _load_metadata(user_id)
        file_info = metadata["files"].get(file_id)
        
        if not file_info:
            return json.dumps({"error": "File not found"})
        
        user_drive = _get_user_drive(user_id)
        file_path = user_drive / file_info["path"]
        
        if not file_path.exists():
            return json.dumps({"error": "File not found on disk"})
        
        # Read content
        if file_info["mime_type"].startswith("text/"):
            content = file_path.read_text(encoding="utf-8")
            is_base64 = False
        else:
            content = base64.b64encode(file_path.read_bytes()).decode("ascii")
            is_base64 = True
        
        return json.dumps({
            "filename": file_info["filename"],
            "content": content,
            "is_base64": is_base64,
            "mime_type": file_info["mime_type"],
            "size": file_info["size"]
        })
    except Exception as e:
        return json.dumps({"error": str(e)})


@mcp.tool()
def list_files(folder: str = None, user_id: str = "default") -> str:
    """
    List files in Drive, optionally filtered by folder.
    
    Args:
        folder: Folder to list (None for all files)
        user_id: User identifier
        
    Returns:
        List of files
    """
    try:
        metadata = _load_metadata(user_id)
        files = list(metadata["files"].values())
        
        if folder:
            files = [f for f in files if f.get("folder") == folder]
        
        files = sorted(files, key=lambda x: x.get("modified_at", ""), reverse=True)
        
        return json.dumps({
            "folder": folder,
            "count": len(files),
            "files": files
        })
    except Exception as e:
        return json.dumps({"error": str(e)})


@mcp.tool()
def list_folders(user_id: str = "default") -> str:
    """
    List all folders in Drive.
    
    Args:
        user_id: User identifier
        
    Returns:
        List of folders
    """
    try:
        user_drive = _get_user_drive(user_id)
        
        folders = []
        for item in user_drive.iterdir():
            if item.is_dir() and not item.name.startswith("."):
                file_count = len([f for f in item.rglob("*") if f.is_file()])
                folders.append({
                    "name": item.name,
                    "file_count": file_count
                })
        
        return json.dumps({
            "count": len(folders),
            "folders": sorted(folders, key=lambda x: x["name"])
        })
    except Exception as e:
        return json.dumps({"error": str(e)})


@mcp.tool()
def create_folder(name: str, parent: str = None, user_id: str = "default") -> str:
    """
    Create a new folder in Drive.
    
    Args:
        name: Folder name
        parent: Parent folder (optional)
        user_id: User identifier
        
    Returns:
        Created folder details
    """
    try:
        user_drive = _get_user_drive(user_id)
        
        if parent:
            folder_path = user_drive / parent / name
        else:
            folder_path = user_drive / name
        
        folder_path.mkdir(parents=True, exist_ok=True)
        
        return json.dumps({
            "success": True,
            "message": f"Created folder: {name}",
            "path": str(folder_path.relative_to(user_drive))
        })
    except Exception as e:
        return json.dumps({"error": str(e)})


@mcp.tool()
def delete_file(file_id: str, user_id: str = "default") -> str:
    """
    Delete a file from Drive.
    
    Args:
        file_id: File ID
        user_id: User identifier
        
    Returns:
        Success/error message
    """
    try:
        metadata = _load_metadata(user_id)
        file_info = metadata["files"].get(file_id)
        
        if not file_info:
            return json.dumps({"error": "File not found"})
        
        user_drive = _get_user_drive(user_id)
        file_path = user_drive / file_info["path"]
        
        if file_path.exists():
            file_path.unlink()
        
        del metadata["files"][file_id]
        _save_metadata(user_id, metadata)
        
        return json.dumps({
            "success": True,
            "message": f"Deleted: {file_info['filename']}"
        })
    except Exception as e:
        return json.dumps({"error": str(e)})


@mcp.tool()
def move_file(file_id: str, new_folder: str, user_id: str = "default") -> str:
    """
    Move a file to a different folder.
    
    Args:
        file_id: File ID
        new_folder: Destination folder
        user_id: User identifier
        
    Returns:
        Updated file details
    """
    try:
        metadata = _load_metadata(user_id)
        file_info = metadata["files"].get(file_id)
        
        if not file_info:
            return json.dumps({"error": "File not found"})
        
        user_drive = _get_user_drive(user_id)
        old_path = user_drive / file_info["path"]
        
        new_folder_path = user_drive / new_folder
        new_folder_path.mkdir(parents=True, exist_ok=True)
        new_path = new_folder_path / file_info["filename"]
        
        if old_path.exists():
            shutil.move(str(old_path), str(new_path))
        
        file_info["folder"] = new_folder
        file_info["path"] = str(new_path.relative_to(user_drive))
        file_info["modified_at"] = datetime.utcnow().isoformat()
        metadata["files"][file_id] = file_info
        _save_metadata(user_id, metadata)
        
        return json.dumps({
            "success": True,
            "message": f"Moved to: {new_folder}",
            "file": file_info
        })
    except Exception as e:
        return json.dumps({"error": str(e)})


@mcp.tool()
def search_drive(query: str, user_id: str = "default") -> str:
    """
    Search files by name or description.
    
    Args:
        query: Search query
        user_id: User identifier
        
    Returns:
        Matching files
    """
    try:
        metadata = _load_metadata(user_id)
        query_lower = query.lower()
        
        matches = []
        for file_info in metadata["files"].values():
            if (query_lower in file_info["filename"].lower() or
                query_lower in file_info.get("description", "").lower()):
                matches.append(file_info)
        
        return json.dumps({
            "query": query,
            "count": len(matches),
            "results": matches
        })
    except Exception as e:
        return json.dumps({"error": str(e)})


@mcp.tool()
def get_drive_stats(user_id: str = "default") -> str:
    """
    Get Drive storage statistics.
    
    Args:
        user_id: User identifier
        
    Returns:
        Storage stats
    """
    try:
        metadata = _load_metadata(user_id)
        
        total_files = len(metadata["files"])
        total_size = sum(f.get("size", 0) for f in metadata["files"].values())
        
        by_folder = {}
        by_type = {}
        
        for f in metadata["files"].values():
            folder = f.get("folder", "Unknown")
            by_folder[folder] = by_folder.get(folder, 0) + 1
            
            mime = f.get("mime_type", "unknown").split("/")[0]
            by_type[mime] = by_type.get(mime, 0) + 1
        
        # Format size
        if total_size < 1024:
            size_str = f"{total_size} B"
        elif total_size < 1024 * 1024:
            size_str = f"{total_size / 1024:.1f} KB"
        else:
            size_str = f"{total_size / (1024 * 1024):.1f} MB"
        
        return json.dumps({
            "total_files": total_files,
            "total_size": total_size,
            "total_size_formatted": size_str,
            "by_folder": by_folder,
            "by_type": by_type
        })
    except Exception as e:
        return json.dumps({"error": str(e)})


@mcp.tool()
def share_file(file_id: str, share_with: str, user_id: str = "default") -> str:
    """
    Share a file with another user (simulated).
    
    Args:
        file_id: File ID to share
        share_with: User ID to share with
        user_id: Owner's user ID
        
    Returns:
        Sharing status
    """
    try:
        metadata = _load_metadata(user_id)
        file_info = metadata["files"].get(file_id)
        
        if not file_info:
            return json.dumps({"error": "File not found"})
        
        # Record sharing
        if "shared_with" not in file_info:
            file_info["shared_with"] = []
        
        if share_with not in file_info["shared_with"]:
            file_info["shared_with"].append(share_with)
        
        file_info["shared"] = True
        metadata["files"][file_id] = file_info
        _save_metadata(user_id, metadata)
        
        return json.dumps({
            "success": True,
            "message": f"Shared '{file_info['filename']}' with {share_with}",
            "file": file_info
        })
    except Exception as e:
        return json.dumps({"error": str(e)})


# Run server
if __name__ == "__main__":
    print("[Drive] Starting MCP Server (stdio transport)...")
    mcp.run()
