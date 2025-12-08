"""
MCP Drive Tool - Cloud-like File Storage

This tool provides Google Drive-like functionality for the Smart Study Notes app.
It simulates cloud storage with local file system, supporting upload, download,
folder management, and file organization.
"""

import os
import json
import uuid
import shutil
from datetime import datetime
from typing import List, Optional, Dict, Any
import aiofiles


class DriveTool:
    """MCP Tool for simulated cloud drive storage."""
    
    def __init__(self, base_directory: str = "./uploads"):
        self.base_directory = base_directory
        self.drive_dir = os.path.join(base_directory, "mcp_drive")
        os.makedirs(self.drive_dir, exist_ok=True)
    
    def _get_user_drive(self, user_id: str) -> str:
        """Get the path to a user's drive directory."""
        user_drive = os.path.join(self.drive_dir, user_id)
        os.makedirs(user_drive, exist_ok=True)
        
        # Create default folders
        for folder in ["Documents", "PDFs", "Notes", "Shared"]:
            os.makedirs(os.path.join(user_drive, folder), exist_ok=True)
        
        return user_drive
    
    def _get_metadata_file(self, user_id: str) -> str:
        """Get path to user's drive metadata file."""
        return os.path.join(self._get_user_drive(user_id), ".metadata.json")
    
    async def _load_metadata(self, user_id: str) -> Dict:
        """Load drive metadata."""
        meta_file = self._get_metadata_file(user_id)
        if not os.path.exists(meta_file):
            return {"files": {}, "folders": {}}
        try:
            async with aiofiles.open(meta_file, 'r', encoding='utf-8') as f:
                content = await f.read()
                return json.loads(content)
        except (json.JSONDecodeError, IOError):
            return {"files": {}, "folders": {}}
    
    async def _save_metadata(self, user_id: str, metadata: Dict) -> None:
        """Save drive metadata."""
        meta_file = self._get_metadata_file(user_id)
        async with aiofiles.open(meta_file, 'w', encoding='utf-8') as f:
            await f.write(json.dumps(metadata, indent=2, default=str))
    
    # ========== File Operations ==========
    
    async def upload_file(
        self,
        user_id: str,
        filename: str,
        content: bytes,
        folder: str = "Documents",
        description: Optional[str] = None,
        tags: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Upload a file to the drive.
        
        Args:
            user_id: User's unique identifier
            filename: Name of the file
            content: File content as bytes
            folder: Destination folder
            description: Optional file description
            tags: Optional list of tags
            
        Returns:
            File info including ID and path
        """
        user_drive = self._get_user_drive(user_id)
        folder_path = os.path.join(user_drive, folder)
        os.makedirs(folder_path, exist_ok=True)
        
        file_id = str(uuid.uuid4())
        file_path = os.path.join(folder_path, filename)
        
        # Handle duplicate filenames
        base, ext = os.path.splitext(filename)
        counter = 1
        while os.path.exists(file_path):
            filename = f"{base}_{counter}{ext}"
            file_path = os.path.join(folder_path, filename)
            counter += 1
        
        async with aiofiles.open(file_path, 'wb') as f:
            await f.write(content)
        
        # Update metadata
        metadata = await self._load_metadata(user_id)
        metadata["files"][file_id] = {
            "id": file_id,
            "filename": filename,
            "folder": folder,
            "size": len(content),
            "mime_type": self._get_mime_type(filename),
            "description": description,
            "tags": tags or [],
            "created_at": datetime.utcnow().isoformat(),
            "modified_at": datetime.utcnow().isoformat()
        }
        await self._save_metadata(user_id, metadata)
        
        return metadata["files"][file_id]
    
    async def upload_text_file(
        self,
        user_id: str,
        filename: str,
        content: str,
        folder: str = "Notes",
        **kwargs
    ) -> Dict[str, Any]:
        """Upload a text file to the drive."""
        return await self.upload_file(
            user_id=user_id,
            filename=filename,
            content=content.encode('utf-8'),
            folder=folder,
            **kwargs
        )
    
    async def download_file(
        self,
        user_id: str,
        file_id: str
    ) -> Optional[Dict[str, Any]]:
        """
        Download a file from the drive.
        
        Returns:
            Dict with filename and content, or None if not found
        """
        metadata = await self._load_metadata(user_id)
        file_info = metadata["files"].get(file_id)
        
        if not file_info:
            return None
        
        user_drive = self._get_user_drive(user_id)
        file_path = os.path.join(user_drive, file_info["folder"], file_info["filename"])
        
        if not os.path.exists(file_path):
            return None
        
        async with aiofiles.open(file_path, 'rb') as f:
            content = await f.read()
        
        return {
            "filename": file_info["filename"],
            "content": content,
            "mime_type": file_info.get("mime_type"),
            "size": len(content)
        }
    
    async def get_file_info(
        self,
        user_id: str,
        file_id: str
    ) -> Optional[Dict[str, Any]]:
        """Get file information by ID."""
        metadata = await self._load_metadata(user_id)
        return metadata["files"].get(file_id)
    
    async def delete_file(
        self,
        user_id: str,
        file_id: str
    ) -> bool:
        """Delete a file from the drive."""
        metadata = await self._load_metadata(user_id)
        file_info = metadata["files"].get(file_id)
        
        if not file_info:
            return False
        
        user_drive = self._get_user_drive(user_id)
        file_path = os.path.join(user_drive, file_info["folder"], file_info["filename"])
        
        if os.path.exists(file_path):
            os.remove(file_path)
        
        del metadata["files"][file_id]
        await self._save_metadata(user_id, metadata)
        
        return True
    
    async def move_file(
        self,
        user_id: str,
        file_id: str,
        new_folder: str
    ) -> Optional[Dict[str, Any]]:
        """Move a file to a different folder."""
        metadata = await self._load_metadata(user_id)
        file_info = metadata["files"].get(file_id)
        
        if not file_info:
            return None
        
        user_drive = self._get_user_drive(user_id)
        old_path = os.path.join(user_drive, file_info["folder"], file_info["filename"])
        
        new_folder_path = os.path.join(user_drive, new_folder)
        os.makedirs(new_folder_path, exist_ok=True)
        new_path = os.path.join(new_folder_path, file_info["filename"])
        
        if os.path.exists(old_path):
            shutil.move(old_path, new_path)
        
        file_info["folder"] = new_folder
        file_info["modified_at"] = datetime.utcnow().isoformat()
        metadata["files"][file_id] = file_info
        await self._save_metadata(user_id, metadata)
        
        return file_info
    
    async def rename_file(
        self,
        user_id: str,
        file_id: str,
        new_filename: str
    ) -> Optional[Dict[str, Any]]:
        """Rename a file."""
        metadata = await self._load_metadata(user_id)
        file_info = metadata["files"].get(file_id)
        
        if not file_info:
            return None
        
        user_drive = self._get_user_drive(user_id)
        old_path = os.path.join(user_drive, file_info["folder"], file_info["filename"])
        new_path = os.path.join(user_drive, file_info["folder"], new_filename)
        
        if os.path.exists(old_path):
            os.rename(old_path, new_path)
        
        file_info["filename"] = new_filename
        file_info["modified_at"] = datetime.utcnow().isoformat()
        metadata["files"][file_id] = file_info
        await self._save_metadata(user_id, metadata)
        
        return file_info
    
    # ========== Folder Operations ==========
    
    async def create_folder(
        self,
        user_id: str,
        folder_name: str,
        parent_folder: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create a new folder."""
        user_drive = self._get_user_drive(user_id)
        
        if parent_folder:
            folder_path = os.path.join(user_drive, parent_folder, folder_name)
        else:
            folder_path = os.path.join(user_drive, folder_name)
        
        os.makedirs(folder_path, exist_ok=True)
        
        folder_id = str(uuid.uuid4())
        
        metadata = await self._load_metadata(user_id)
        if "folders" not in metadata:
            metadata["folders"] = {}
        
        metadata["folders"][folder_id] = {
            "id": folder_id,
            "name": folder_name,
            "parent": parent_folder,
            "created_at": datetime.utcnow().isoformat()
        }
        await self._save_metadata(user_id, metadata)
        
        return metadata["folders"][folder_id]
    
    async def delete_folder(
        self,
        user_id: str,
        folder_name: str
    ) -> bool:
        """Delete a folder and all its contents."""
        user_drive = self._get_user_drive(user_id)
        folder_path = os.path.join(user_drive, folder_name)
        
        # Prevent deletion of root folders
        if folder_name in ["Documents", "PDFs", "Notes", "Shared"]:
            return False
        
        if os.path.exists(folder_path):
            shutil.rmtree(folder_path)
            
            # Clean up metadata
            metadata = await self._load_metadata(user_id)
            metadata["files"] = {
                k: v for k, v in metadata["files"].items()
                if v.get("folder") != folder_name
            }
            await self._save_metadata(user_id, metadata)
            
            return True
        return False
    
    async def list_folder(
        self,
        user_id: str,
        folder: Optional[str] = None
    ) -> Dict[str, Any]:
        """List contents of a folder."""
        user_drive = self._get_user_drive(user_id)
        
        if folder:
            target_path = os.path.join(user_drive, folder)
        else:
            target_path = user_drive
        
        if not os.path.exists(target_path):
            return {"folders": [], "files": []}
        
        folders = []
        files = []
        
        for item in os.listdir(target_path):
            if item.startswith('.'):
                continue
            
            item_path = os.path.join(target_path, item)
            
            if os.path.isdir(item_path):
                folders.append({
                    "name": item,
                    "type": "folder",
                    "path": os.path.join(folder or "", item)
                })
            else:
                stat = os.stat(item_path)
                files.append({
                    "name": item,
                    "type": "file",
                    "size": stat.st_size,
                    "modified_at": datetime.fromtimestamp(stat.st_mtime).isoformat()
                })
        
        return {
            "current_folder": folder or "root",
            "folders": sorted(folders, key=lambda x: x["name"]),
            "files": sorted(files, key=lambda x: x["name"])
        }
    
    async def list_all_files(self, user_id: str) -> List[Dict[str, Any]]:
        """List all files across all folders."""
        metadata = await self._load_metadata(user_id)
        return list(metadata["files"].values())
    
    # ========== Search & Statistics ==========
    
    async def search_files(
        self,
        user_id: str,
        query: str
    ) -> List[Dict[str, Any]]:
        """Search files by name or tags."""
        metadata = await self._load_metadata(user_id)
        query_lower = query.lower()
        
        results = []
        for file_info in metadata["files"].values():
            if query_lower in file_info["filename"].lower():
                results.append(file_info)
            elif query_lower in " ".join(file_info.get("tags", [])).lower():
                results.append(file_info)
            elif file_info.get("description") and query_lower in file_info["description"].lower():
                results.append(file_info)
        
        return results
    
    async def get_storage_stats(self, user_id: str) -> Dict[str, Any]:
        """Get storage statistics."""
        metadata = await self._load_metadata(user_id)
        
        total_files = len(metadata["files"])
        total_size = sum(f.get("size", 0) for f in metadata["files"].values())
        
        by_folder = {}
        by_type = {}
        
        for file_info in metadata["files"].values():
            folder = file_info.get("folder", "Unknown")
            if folder not in by_folder:
                by_folder[folder] = {"count": 0, "size": 0}
            by_folder[folder]["count"] += 1
            by_folder[folder]["size"] += file_info.get("size", 0)
            
            mime = file_info.get("mime_type", "unknown")
            if mime not in by_type:
                by_type[mime] = 0
            by_type[mime] += 1
        
        return {
            "total_files": total_files,
            "total_size": total_size,
            "total_size_formatted": self._format_size(total_size),
            "by_folder": by_folder,
            "by_type": by_type
        }
    
    def _get_mime_type(self, filename: str) -> str:
        """Get MIME type from filename extension."""
        ext = os.path.splitext(filename)[1].lower()
        mime_types = {
            ".pdf": "application/pdf",
            ".doc": "application/msword",
            ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            ".txt": "text/plain",
            ".md": "text/markdown",
            ".ppt": "application/vnd.ms-powerpoint",
            ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".png": "image/png",
            ".gif": "image/gif",
            ".json": "application/json"
        }
        return mime_types.get(ext, "application/octet-stream")
    
    def _format_size(self, bytes: int) -> str:
        """Format bytes to human readable string."""
        if bytes < 1024:
            return f"{bytes} B"
        elif bytes < 1024 * 1024:
            return f"{bytes / 1024:.1f} KB"
        else:
            return f"{bytes / (1024 * 1024):.1f} MB"


# Singleton instance
drive_tool = DriveTool()
