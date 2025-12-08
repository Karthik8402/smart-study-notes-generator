"""
MCP File Tool - Study Notes File Management

This tool provides file storage and organization for the Smart Study Notes app.
It manages saved notes, MCQs, summaries, and other study materials.
"""

import os
import json
import uuid
import shutil
from datetime import datetime
from typing import List, Optional, Dict, Any
import aiofiles


class FileTool:
    """MCP Tool for managing saved study files and notes."""
    
    # File categories
    CATEGORIES = {
        "summary": "summaries",
        "mcq": "mcqs",
        "explanation": "explanations",
        "topic": "topics",
        "flashcard": "flashcards",
        "other": "other"
    }
    
    def __init__(self, base_directory: str = "./uploads"):
        self.base_directory = base_directory
        self.notes_dir = os.path.join(base_directory, "saved_notes")
        os.makedirs(self.notes_dir, exist_ok=True)
    
    def _get_user_dir(self, user_id: str) -> str:
        """Get the path to a user's notes directory."""
        user_dir = os.path.join(self.notes_dir, user_id)
        os.makedirs(user_dir, exist_ok=True)
        return user_dir
    
    def _get_category_dir(self, user_id: str, category: str) -> str:
        """Get the path to a category directory for a user."""
        cat_name = self.CATEGORIES.get(category, "other")
        cat_dir = os.path.join(self._get_user_dir(user_id), cat_name)
        os.makedirs(cat_dir, exist_ok=True)
        return cat_dir
    
    def _generate_filename(self, title: str, extension: str = "md") -> str:
        """Generate a safe filename from title."""
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        safe_title = "".join(c for c in title if c.isalnum() or c in " _-").strip()[:50]
        return f"{safe_title}_{timestamp}.{extension}"
    
    # ========== CRUD Operations ==========
    
    async def save_notes(
        self,
        user_id: str,
        title: str,
        content: str,
        note_type: str = "other",
        metadata: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """
        Save study notes to a file.
        
        Args:
            user_id: User's unique identifier
            title: Title of the notes
            content: Content to save
            note_type: Type of note (summary, mcq, explanation, etc.)
            metadata: Optional additional metadata
            
        Returns:
            File info including path and metadata
        """
        category_dir = self._get_category_dir(user_id, note_type)
        filename = self._generate_filename(title)
        file_path = os.path.join(category_dir, filename)
        
        # Build markdown content with frontmatter
        frontmatter = {
            "title": title,
            "type": note_type,
            "created": datetime.utcnow().isoformat(),
            "id": str(uuid.uuid4()),
            **(metadata or {})
        }
        
        full_content = f"""---
title: {title}
type: {note_type}
created: {frontmatter['created']}
id: {frontmatter['id']}
---

# {title}

{content}
"""
        
        async with aiofiles.open(file_path, 'w', encoding='utf-8') as f:
            await f.write(full_content)
        
        return {
            "id": frontmatter['id'],
            "filename": filename,
            "category": self.CATEGORIES.get(note_type, "other"),
            "path": file_path,
            "size": len(full_content.encode('utf-8')),
            "created_at": frontmatter['created']
        }
    
    async def save_mcqs(
        self,
        user_id: str,
        title: str,
        mcqs: List[Dict],
        source_document: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Save multiple choice questions to a formatted file.
        
        Args:
            user_id: User's unique identifier
            title: Title for the MCQ set
            mcqs: List of MCQ objects with question, options, answer
            source_document: Optional source document name
            
        Returns:
            File info including path and metadata
        """
        content_lines = []
        
        for i, mcq in enumerate(mcqs, 1):
            content_lines.append(f"## Question {i}")
            content_lines.append(f"\n**{mcq.get('question', '')}**\n")
            
            options = mcq.get('options', [])
            for j, option in enumerate(options):
                prefix = chr(65 + j)  # A, B, C, D...
                content_lines.append(f"- {prefix}) {option}")
            
            content_lines.append(f"\n**Answer:** {mcq.get('answer', '')}")
            
            if mcq.get('explanation'):
                content_lines.append(f"\n*Explanation: {mcq['explanation']}*")
            
            content_lines.append("\n---\n")
        
        content = "\n".join(content_lines)
        
        return await self.save_notes(
            user_id=user_id,
            title=title,
            content=content,
            note_type="mcq",
            metadata={"mcq_count": len(mcqs), "source": source_document}
        )
    
    async def get_file(
        self,
        user_id: str,
        category: str,
        filename: str
    ) -> Optional[Dict[str, Any]]:
        """Get a specific file's content and metadata."""
        cat_dir = self._get_category_dir(user_id, category)
        file_path = os.path.join(cat_dir, filename)
        
        if not os.path.exists(file_path):
            return None
        
        async with aiofiles.open(file_path, 'r', encoding='utf-8') as f:
            content = await f.read()
        
        stat = os.stat(file_path)
        
        return {
            "filename": filename,
            "category": category,
            "content": content,
            "size": stat.st_size,
            "created_at": datetime.fromtimestamp(stat.st_ctime).isoformat(),
            "modified_at": datetime.fromtimestamp(stat.st_mtime).isoformat()
        }
    
    async def list_files(
        self,
        user_id: str,
        category: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        List all files for a user, optionally filtered by category.
        
        Args:
            user_id: User's unique identifier
            category: Optional category filter
            
        Returns:
            List of file info objects
        """
        files = []
        user_dir = self._get_user_dir(user_id)
        
        categories = [self.CATEGORIES.get(category)] if category else self.CATEGORIES.values()
        
        for cat_name in categories:
            cat_dir = os.path.join(user_dir, cat_name)
            if not os.path.exists(cat_dir):
                continue
            
            for filename in os.listdir(cat_dir):
                file_path = os.path.join(cat_dir, filename)
                if os.path.isfile(file_path):
                    stat = os.stat(file_path)
                    files.append({
                        "filename": filename,
                        "category": cat_name,
                        "size": stat.st_size,
                        "created_at": datetime.fromtimestamp(stat.st_ctime).isoformat(),
                        "path": f"{cat_name}/{filename}"
                    })
        
        return sorted(files, key=lambda x: x["created_at"], reverse=True)
    
    async def delete_file(
        self,
        user_id: str,
        category: str,
        filename: str
    ) -> bool:
        """Delete a specific file."""
        cat_name = self.CATEGORIES.get(category, category)
        cat_dir = os.path.join(self._get_user_dir(user_id), cat_name)
        file_path = os.path.join(cat_dir, filename)
        
        if os.path.exists(file_path):
            os.remove(file_path)
            return True
        return False
    
    async def rename_file(
        self,
        user_id: str,
        category: str,
        old_filename: str,
        new_filename: str
    ) -> Optional[Dict[str, Any]]:
        """Rename a file."""
        cat_name = self.CATEGORIES.get(category, category)
        cat_dir = os.path.join(self._get_user_dir(user_id), cat_name)
        old_path = os.path.join(cat_dir, old_filename)
        new_path = os.path.join(cat_dir, new_filename)
        
        if not os.path.exists(old_path):
            return None
        
        os.rename(old_path, new_path)
        
        return {
            "old_filename": old_filename,
            "new_filename": new_filename,
            "category": cat_name
        }
    
    async def move_file(
        self,
        user_id: str,
        filename: str,
        from_category: str,
        to_category: str
    ) -> Optional[Dict[str, Any]]:
        """Move a file between categories."""
        from_cat = self.CATEGORIES.get(from_category, from_category)
        to_cat = self.CATEGORIES.get(to_category, to_category)
        
        from_dir = os.path.join(self._get_user_dir(user_id), from_cat)
        to_dir = self._get_category_dir(user_id, to_category)
        
        from_path = os.path.join(from_dir, filename)
        to_path = os.path.join(to_dir, filename)
        
        if not os.path.exists(from_path):
            return None
        
        shutil.move(from_path, to_path)
        
        return {
            "filename": filename,
            "from_category": from_cat,
            "to_category": to_cat
        }
    
    # ========== Search & Statistics ==========
    
    async def search_files(
        self,
        user_id: str,
        query: str
    ) -> List[Dict[str, Any]]:
        """Search files by filename or content."""
        all_files = await self.list_files(user_id)
        results = []
        query_lower = query.lower()
        
        for file_info in all_files:
            # Search in filename
            if query_lower in file_info["filename"].lower():
                results.append({**file_info, "match_type": "filename"})
                continue
            
            # Search in content
            file_data = await self.get_file(
                user_id,
                file_info["category"],
                file_info["filename"]
            )
            if file_data and query_lower in file_data["content"].lower():
                results.append({**file_info, "match_type": "content"})
        
        return results
    
    async def get_statistics(self, user_id: str) -> Dict[str, Any]:
        """Get file storage statistics for a user."""
        files = await self.list_files(user_id)
        
        total_files = len(files)
        total_size = sum(f["size"] for f in files)
        
        by_category = {}
        for f in files:
            cat = f["category"]
            if cat not in by_category:
                by_category[cat] = {"count": 0, "size": 0}
            by_category[cat]["count"] += 1
            by_category[cat]["size"] += f["size"]
        
        return {
            "total_files": total_files,
            "total_size": total_size,
            "total_size_formatted": self._format_size(total_size),
            "by_category": by_category
        }
    
    def _format_size(self, bytes: int) -> str:
        """Format bytes to human readable string."""
        if bytes < 1024:
            return f"{bytes} B"
        elif bytes < 1024 * 1024:
            return f"{bytes / 1024:.1f} KB"
        else:
            return f"{bytes / (1024 * 1024):.1f} MB"


# Singleton instance
file_tool = FileTool()
