"""RAG Engine Module"""

from typing import List, Dict, Optional
from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.config import settings
from app.database.vector_db import add_documents, search_documents, delete_documents, get_collection


async def ingest_document(
    text: str,
    document_id: str,
    user_id: str,
    filename: str,
    file_type: str
) -> int:
    """
    Ingest a document into the vector database.
    Returns the number of chunks created.
    """
    # Split text into chunks
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=settings.chunk_size,
        chunk_overlap=settings.chunk_overlap,
        separators=["\n\n", "\n", ". ", " ", ""]
    )
    
    chunks = splitter.split_text(text)
    
    if not chunks:
        return 0
    
    # Prepare documents for vector DB
    documents = []
    metadatas = []
    ids = []
    
    for i, chunk in enumerate(chunks):
        chunk_id = f"{document_id}_chunk_{i}"
        
        documents.append(chunk)
        metadatas.append({
            "document_id": document_id,
            "user_id": user_id,
            "filename": filename,
            "file_type": file_type,
            "chunk_index": i
        })
        ids.append(chunk_id)
    
    # Add to vector database
    add_documents(documents=documents, metadatas=metadatas, ids=ids)
    
    return len(chunks)


async def retrieve_context(
    query: str,
    user_id: str,
    top_k: int = 5,
    document_ids: Optional[List[str]] = None
) -> Dict:
    """
    Retrieve relevant context from the vector database.
    """
    # Build filter
    filter_metadata = {"user_id": user_id}
    
    if document_ids:
        filter_metadata["document_id"] = {"$in": document_ids}
    
    # Search
    results = search_documents(
        query=query,
        n_results=top_k,
        filter_metadata=filter_metadata
    )
    
    # Process results
    contexts = []
    sources = []
    
    if results["documents"] and results["documents"][0]:
        for i, doc in enumerate(results["documents"][0]):
            contexts.append(doc)
            
            metadata = results["metadatas"][0][i] if results["metadatas"] else {}
            distance = results["distances"][0][i] if results["distances"] else 0
            
            sources.append({
                "content": doc,
                "filename": metadata.get("filename", "Unknown"),
                "document_id": metadata.get("document_id", ""),
                "score": 1 - distance  # Convert distance to similarity score
            })
    
    return {
        "contexts": contexts,
        "sources": sources
    }


async def delete_document_chunks(document_id: str) -> None:
    """Delete all chunks for a document."""
    collection = get_collection()
    
    # Get all chunk IDs for this document
    results = collection.get(
        where={"document_id": document_id},
        include=[]
    )
    
    if results["ids"]:
        delete_documents(results["ids"])


def get_stats() -> Dict:
    """Get vector database stats."""
    collection = get_collection()
    return {
        "total_documents": collection.count()
    }
