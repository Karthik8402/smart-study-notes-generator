"""
MCP Google Drive Server - Real Google Drive Integration
Uses the official MCP Python SDK (FastMCP) with Google Drive API

Run this server: python -m app.mcp.servers.google_drive_server
Exposes tools: upload_file, download_file, list_files, search, delete_file, create_folder, share_file
"""

from mcp.server.fastmcp import FastMCP
import json
import base64
import io
from datetime import datetime
from typing import Optional

from googleapiclient.http import MediaIoBaseUpload, MediaIoBaseDownload

# Import Google Auth
try:
    from .google_auth import get_drive_service, check_auth_status, GoogleAuthError
except ImportError:
    from google_auth import get_drive_service, check_auth_status, GoogleAuthError

# Initialize MCP Server
mcp = FastMCP("Google Drive Server")

# MIME type mappings
MIME_TYPES = {
    ".pdf": "application/pdf",
    ".txt": "text/plain",
    ".md": "text/markdown",
    ".json": "application/json",
    ".doc": "application/msword",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".ppt": "application/vnd.ms-powerpoint",
    ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ".xls": "application/vnd.ms-excel",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".mp3": "audio/mpeg",
    ".mp4": "video/mp4",
    ".zip": "application/zip",
}

# Smart Study Notes folder name
APP_FOLDER_NAME = "Smart Study Notes"


def _get_mime_type(filename: str) -> str:
    """Get MIME type from filename extension."""
    import os
    ext = os.path.splitext(filename)[1].lower()
    return MIME_TYPES.get(ext, "application/octet-stream")


def _format_file(file: dict) -> dict:
    """Format Google Drive file metadata for response."""
    file_name = file.get("name", "Untitled")
    return {
        "id": file.get("id"),
        "name": file_name,
        "filename": file_name,  # Alias for frontend compatibility
        "mime_type": file.get("mimeType"),
        "size": int(file.get("size", 0)),
        "created_time": file.get("createdTime"),
        "modified_time": file.get("modifiedTime"),
        "web_view_link": file.get("webViewLink"),
        "web_content_link": file.get("webContentLink"),
        "parents": file.get("parents", []),
        "shared": file.get("shared", False),
        "starred": file.get("starred", False),
        "trashed": file.get("trashed", False)
    }


def _get_or_create_app_folder(service, user_id: str) -> str:
    """Get or create the Smart Study Notes folder in Drive."""
    # Search for existing folder
    query = f"name='{APP_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false"
    results = service.files().list(
        q=query,
        spaces='drive',
        fields='files(id, name)'
    ).execute()
    
    files = results.get('files', [])
    if files:
        return files[0]['id']
    
    # Create folder
    folder_metadata = {
        'name': APP_FOLDER_NAME,
        'mimeType': 'application/vnd.google-apps.folder'
    }
    folder = service.files().create(
        body=folder_metadata,
        fields='id'
    ).execute()
    
    return folder['id']


@mcp.tool()
def authenticate_google(user_id: str = "default") -> str:
    """
    Authenticate with Google Drive. Opens a browser for OAuth consent.
    
    Args:
        user_id: User identifier
        
    Returns:
        Authentication status
    """
    try:
        service = get_drive_service(user_id)
        # Test the connection
        service.files().list(pageSize=1).execute()
        return json.dumps({
            "success": True,
            "message": "Successfully connected to Google Drive!"
        })
    except GoogleAuthError as e:
        return json.dumps({"error": str(e)})
    except Exception as e:
        return json.dumps({"error": f"Authentication failed: {str(e)}"})


@mcp.tool()
def check_connection(user_id: str = "default") -> str:
    """
    Check if user is connected to Google Drive.
    
    Args:
        user_id: User identifier
        
    Returns:
        Connection status
    """
    status = check_auth_status(user_id, "drive")
    return json.dumps(status)


@mcp.tool()
def upload_file(
    filename: str,
    content: str,
    folder_name: str = None,
    is_base64: bool = False,
    description: str = "",
    user_id: str = "default"
) -> str:
    """
    Upload a file to Google Drive.
    
    Args:
        filename: Name of the file
        content: File content (text or base64 encoded)
        folder_name: Subfolder name within Smart Study Notes (optional)
        is_base64: True if content is base64 encoded (for binary files)
        description: File description
        user_id: User identifier
        
    Returns:
        Uploaded file details
    """
    try:
        service = get_drive_service(user_id)
        
        # Get or create app folder
        app_folder_id = _get_or_create_app_folder(service, user_id)
        parent_id = app_folder_id
        
        # Create subfolder if specified
        if folder_name:
            query = f"name='{folder_name}' and '{app_folder_id}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false"
            results = service.files().list(q=query, fields='files(id)').execute()
            files = results.get('files', [])
            
            if files:
                parent_id = files[0]['id']
            else:
                # Create subfolder
                folder_meta = {
                    'name': folder_name,
                    'mimeType': 'application/vnd.google-apps.folder',
                    'parents': [app_folder_id]
                }
                folder = service.files().create(body=folder_meta, fields='id').execute()
                parent_id = folder['id']
        
        # Prepare file content
        if is_base64:
            file_content = base64.b64decode(content)
        else:
            file_content = content.encode('utf-8')
        
        mime_type = _get_mime_type(filename)
        
        # File metadata
        file_metadata = {
            'name': filename,
            'parents': [parent_id],
            'description': description
        }
        
        # Upload
        media = MediaIoBaseUpload(
            io.BytesIO(file_content),
            mimetype=mime_type,
            resumable=True
        )
        
        file = service.files().create(
            body=file_metadata,
            media_body=media,
            fields='id, name, mimeType, size, createdTime, webViewLink'
        ).execute()
        
        return json.dumps({
            "success": True,
            "message": f"Uploaded: {filename} to Google Drive",
            "file": _format_file(file)
        })
        
    except GoogleAuthError as e:
        return json.dumps({"error": str(e), "need_auth": True})
    except Exception as e:
        return json.dumps({"error": str(e)})


@mcp.tool()
def download_file(file_id: str, user_id: str = "default") -> str:
    """
    Download a file from Google Drive.
    
    Args:
        file_id: Google Drive file ID
        user_id: User identifier
        
    Returns:
        File content (base64 encoded for binary, text for text files)
    """
    try:
        service = get_drive_service(user_id)
        
        # Get file metadata
        file_meta = service.files().get(
            fileId=file_id,
            fields='id, name, mimeType, size'
        ).execute()
        
        # Download content
        request = service.files().get_media(fileId=file_id)
        file_content = io.BytesIO()
        downloader = MediaIoBaseDownload(file_content, request)
        
        done = False
        while not done:
            status, done = downloader.next_chunk()
        
        file_content.seek(0)
        content_bytes = file_content.read()
        
        # Determine if text or binary
        mime_type = file_meta.get('mimeType', '')
        is_text = mime_type.startswith('text/') or mime_type in ['application/json', 'text/markdown']
        
        if is_text:
            try:
                content = content_bytes.decode('utf-8')
                is_base64 = False
            except UnicodeDecodeError:
                content = base64.b64encode(content_bytes).decode('ascii')
                is_base64 = True
        else:
            content = base64.b64encode(content_bytes).decode('ascii')
            is_base64 = True
        
        return json.dumps({
            "filename": file_meta.get('name'),
            "content": content,
            "is_base64": is_base64,
            "mime_type": mime_type,
            "size": len(content_bytes)
        })
        
    except GoogleAuthError as e:
        return json.dumps({"error": str(e), "need_auth": True})
    except Exception as e:
        return json.dumps({"error": str(e)})


@mcp.tool()
def list_files(
    folder_name: str = None,
    max_results: int = 50,
    include_trashed: bool = False,
    user_id: str = "default"
) -> str:
    """
    List files in Google Drive (within Smart Study Notes folder).
    
    Args:
        folder_name: Subfolder to list (None for all files in app folder)
        max_results: Maximum number of files to return
        include_trashed: Include trashed files
        user_id: User identifier
        
    Returns:
        List of files
    """
    try:
        service = get_drive_service(user_id)
        
        # Get app folder
        app_folder_id = _get_or_create_app_folder(service, user_id)
        parent_id = app_folder_id
        
        # Build query - exclude folders from results
        query_parts = []
        
        if folder_name:
            # Find subfolder by name
            folder_query = f"name='{folder_name}' and '{app_folder_id}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false"
            results = service.files().list(q=folder_query, fields='files(id)').execute()
            folders = results.get('files', [])
            if folders:
                parent_id = folders[0]['id']
        
        # Query files in the parent folder (exclude folders themselves)
        query_parts.append(f"'{parent_id}' in parents")
        query_parts.append("mimeType!='application/vnd.google-apps.folder'")
        
        if not include_trashed:
            query_parts.append("trashed=false")
        
        query = " and ".join(query_parts)
        
        results = service.files().list(
            q=query,
            pageSize=max_results,
            fields='files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, shared, starred, trashed, parents)',
            orderBy='modifiedTime desc'
        ).execute()
        
        files = results.get('files', [])
        
        return json.dumps({
            "folder": folder_name or APP_FOLDER_NAME,
            "count": len(files),
            "files": [_format_file(f) for f in files]
        })
        
    except GoogleAuthError as e:
        return json.dumps({"error": str(e), "need_auth": True})
    except Exception as e:
        return json.dumps({"error": str(e)})



@mcp.tool()
def search_drive(query: str, max_results: int = 20, user_id: str = "default") -> str:
    """
    Search files in Google Drive by name or content.
    
    Args:
        query: Search query
        max_results: Maximum number of results
        user_id: User identifier
        
    Returns:
        Matching files
    """
    try:
        service = get_drive_service(user_id)
        
        # Search query
        search_query = f"name contains '{query}' and trashed=false"
        
        results = service.files().list(
            q=search_query,
            pageSize=max_results,
            fields='files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink, parents)',
            orderBy='modifiedTime desc'
        ).execute()
        
        files = results.get('files', [])
        
        return json.dumps({
            "query": query,
            "count": len(files),
            "results": [_format_file(f) for f in files]
        })
        
    except GoogleAuthError as e:
        return json.dumps({"error": str(e), "need_auth": True})
    except Exception as e:
        return json.dumps({"error": str(e)})


@mcp.tool()
def delete_file(file_id: str, permanent: bool = False, user_id: str = "default") -> str:
    """
    Delete a file from Google Drive.
    
    Args:
        file_id: File ID to delete
        permanent: If True, permanently delete; otherwise move to trash
        user_id: User identifier
        
    Returns:
        Success/error message
    """
    try:
        service = get_drive_service(user_id)
        
        if permanent:
            service.files().delete(fileId=file_id).execute()
            message = "File permanently deleted"
        else:
            service.files().update(
                fileId=file_id,
                body={'trashed': True}
            ).execute()
            message = "File moved to trash"
        
        return json.dumps({
            "success": True,
            "message": message
        })
        
    except GoogleAuthError as e:
        return json.dumps({"error": str(e), "need_auth": True})
    except Exception as e:
        return json.dumps({"error": str(e)})


@mcp.tool()
def create_folder(name: str, parent_folder: str = None, user_id: str = "default") -> str:
    """
    Create a new folder in Google Drive.
    
    Args:
        name: Folder name
        parent_folder: Parent folder name (optional, defaults to app folder)
        user_id: User identifier
        
    Returns:
        Created folder details
    """
    try:
        service = get_drive_service(user_id)
        
        # Get parent
        app_folder_id = _get_or_create_app_folder(service, user_id)
        parent_id = app_folder_id
        
        if parent_folder:
            query = f"name='{parent_folder}' and '{app_folder_id}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false"
            results = service.files().list(q=query, fields='files(id)').execute()
            folders = results.get('files', [])
            if folders:
                parent_id = folders[0]['id']
        
        folder_metadata = {
            'name': name,
            'mimeType': 'application/vnd.google-apps.folder',
            'parents': [parent_id]
        }
        
        folder = service.files().create(
            body=folder_metadata,
            fields='id, name, webViewLink'
        ).execute()
        
        return json.dumps({
            "success": True,
            "message": f"Created folder: {name}",
            "folder": {
                "id": folder['id'],
                "name": folder['name'],
                "web_link": folder.get('webViewLink')
            }
        })
        
    except GoogleAuthError as e:
        return json.dumps({"error": str(e), "need_auth": True})
    except Exception as e:
        return json.dumps({"error": str(e)})


@mcp.tool()
def list_folders(user_id: str = "default") -> str:
    """
    List all folders within Smart Study Notes.
    
    Args:
        user_id: User identifier
        
    Returns:
        List of folders
    """
    try:
        service = get_drive_service(user_id)
        
        app_folder_id = _get_or_create_app_folder(service, user_id)
        
        query = f"'{app_folder_id}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false"
        
        results = service.files().list(
            q=query,
            fields='files(id, name, createdTime, modifiedTime, webViewLink)',
            orderBy='name'
        ).execute()
        
        folders = results.get('files', [])
        
        # Get file count for each folder
        folder_data = []
        for folder in folders:
            # Count files in this folder (exclude subfolders)
            file_query = f"'{folder['id']}' in parents and mimeType!='application/vnd.google-apps.folder' and trashed=false"
            file_results = service.files().list(
                q=file_query,
                fields='files(id)',
                pageSize=1000
            ).execute()
            file_count = len(file_results.get('files', []))
            
            folder_data.append({
                "id": folder['id'],
                "name": folder['name'],
                "file_count": file_count,
                "created_time": folder.get('createdTime'),
                "web_link": folder.get('webViewLink')
            })
        
        return json.dumps({
            "count": len(folders),
            "folders": folder_data
        })
        
    except GoogleAuthError as e:
        return json.dumps({"error": str(e), "need_auth": True})
    except Exception as e:
        return json.dumps({"error": str(e)})


@mcp.tool()
def get_drive_stats(user_id: str = "default") -> str:
    """
    Get Google Drive storage statistics.
    
    Args:
        user_id: User identifier
        
    Returns:
        Storage stats
    """
    try:
        service = get_drive_service(user_id)
        
        # Get account storage info
        about = service.about().get(fields='storageQuota, user').execute()
        quota = about.get('storageQuota', {})
        user_info = about.get('user', {})
        
        # Get app folder
        app_folder_id = _get_or_create_app_folder(service, user_id)
        
        # Count ALL files recursively (not just top-level)
        # Search for all non-folder files in the app folder tree
        all_files = []
        next_page_token = None
        
        while True:
            query = f"'{app_folder_id}' in parents and trashed=false"
            results = service.files().list(
                q=query,
                fields='files(id, size, mimeType), nextPageToken',
                pageSize=1000,
                pageToken=next_page_token
            ).execute()
            
            all_files.extend(results.get('files', []))
            next_page_token = results.get('nextPageToken')
            if not next_page_token:
                break
        
        # Also get files in subfolders
        subfolders = [f for f in all_files if f.get('mimeType') == 'application/vnd.google-apps.folder']
        for subfolder in subfolders:
            subfolder_query = f"'{subfolder['id']}' in parents and trashed=false and mimeType!='application/vnd.google-apps.folder'"
            subfolder_results = service.files().list(
                q=subfolder_query,
                fields='files(id, size)',
                pageSize=1000
            ).execute()
            all_files.extend(subfolder_results.get('files', []))
        
        # Filter out folders and sum sizes
        files_only = [f for f in all_files if f.get('mimeType') != 'application/vnd.google-apps.folder']
        total_size = sum(int(f.get('size', 0)) for f in files_only)
        
        def format_bytes(b):
            for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
                if b < 1024:
                    return f"{b:.1f} {unit}"
                b /= 1024
            return f"{b:.1f} PB"
        
        return json.dumps({
            "user": user_info.get('displayName', 'Unknown'),
            "email": user_info.get('emailAddress'),
            "total_quota": format_bytes(int(quota.get('limit', 0))),
            "used": format_bytes(int(quota.get('usage', 0))),
            # Frontend compatible fields
            "total_files": len(files_only),
            "total_size": total_size,
            "total_size_formatted": format_bytes(total_size),
            # Legacy fields
            "app_files_count": len(files_only),
            "app_storage_used": format_bytes(total_size)
        })
        
    except GoogleAuthError as e:
        return json.dumps({"error": str(e), "need_auth": True})
    except Exception as e:
        return json.dumps({"error": str(e)})


@mcp.tool()
def share_file(
    file_id: str,
    email: str,
    role: str = "reader",
    user_id: str = "default"
) -> str:
    """
    Share a file with another user.
    
    Args:
        file_id: File ID to share
        email: Email address to share with
        role: Permission role ('reader', 'writer', 'commenter')
        user_id: User identifier
        
    Returns:
        Sharing status
    """
    try:
        service = get_drive_service(user_id)
        
        permission = {
            'type': 'user',
            'role': role,
            'emailAddress': email
        }
        
        result = service.permissions().create(
            fileId=file_id,
            body=permission,
            sendNotificationEmail=True
        ).execute()
        
        return json.dumps({
            "success": True,
            "message": f"Shared file with {email} as {role}",
            "permission_id": result.get('id')
        })
        
    except GoogleAuthError as e:
        return json.dumps({"error": str(e), "need_auth": True})
    except Exception as e:
        return json.dumps({"error": str(e)})


@mcp.tool()
def move_file(file_id: str, new_folder_name: str, user_id: str = "default") -> str:
    """
    Move a file to a different folder.
    
    Args:
        file_id: File ID to move
        new_folder_name: Destination folder name
        user_id: User identifier
        
    Returns:
        Updated file details
    """
    try:
        service = get_drive_service(user_id)
        
        # Get app folder
        app_folder_id = _get_or_create_app_folder(service, user_id)
        
        # Find or create destination folder
        query = f"name='{new_folder_name}' and '{app_folder_id}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false"
        results = service.files().list(q=query, fields='files(id)').execute()
        folders = results.get('files', [])
        
        if folders:
            new_parent_id = folders[0]['id']
        else:
            # Create folder
            folder_meta = {
                'name': new_folder_name,
                'mimeType': 'application/vnd.google-apps.folder',
                'parents': [app_folder_id]
            }
            folder = service.files().create(body=folder_meta, fields='id').execute()
            new_parent_id = folder['id']
        
        # Get current parents
        file = service.files().get(fileId=file_id, fields='parents').execute()
        previous_parents = ",".join(file.get('parents', []))
        
        # Move file
        updated_file = service.files().update(
            fileId=file_id,
            addParents=new_parent_id,
            removeParents=previous_parents,
            fields='id, name, parents, webViewLink'
        ).execute()
        
        return json.dumps({
            "success": True,
            "message": f"Moved to folder: {new_folder_name}",
            "file": _format_file(updated_file)
        })
        
    except GoogleAuthError as e:
        return json.dumps({"error": str(e), "need_auth": True})
    except Exception as e:
        return json.dumps({"error": str(e)})


# Run server
if __name__ == "__main__":
    print("[Google Drive] Starting MCP Server (stdio transport)...")
    print("[Google Drive] Tools: authenticate_google, check_connection, upload_file, download_file, list_files, search_drive, delete_file, create_folder, list_folders, get_drive_stats, share_file, move_file")
    mcp.run()
