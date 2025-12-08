"""ChromaDB Vector Database Module - Lazy Loading Version"""

import chromadb
from chromadb.config import Settings as ChromaSettings
from typing import List, Optional
import os

from app.config import settings


class VectorDB:
    client: Optional[chromadb.Client] = None
    collection: Optional[chromadb.Collection] = None
    _embedding_model = None
    
    @property
    def embedding_model(self):
        """Lazy load embedding model to avoid startup issues."""
        if self._embedding_model is None:
            from sentence_transformers import SentenceTransformer
            self._embedding_model = SentenceTransformer(settings.embedding_model)
        return self._embedding_model


vector_db = VectorDB()


def initialize_vector_db():
    """Initialize ChromaDB client and collection."""
    os.makedirs(settings.chroma_persist_directory, exist_ok=True)
    
    vector_db.client = chromadb.PersistentClient(
        path=settings.chroma_persist_directory,
        settings=ChromaSettings(anonymized_telemetry=False)
    )
    
    vector_db.collection = vector_db.client.get_or_create_collection(
        name="study_documents",
        metadata={"description": "Study materials for RAG"}
    )
    
    print(f"✅ ChromaDB initialized with {vector_db.collection.count()} documents")


def get_collection() -> chromadb.Collection:
    if vector_db.collection is None:
        raise RuntimeError("VectorDB not initialized")
    return vector_db.collection


def get_embedding_model():
    """Get the embedding model (lazy loaded)."""
    return vector_db.embedding_model


def create_embeddings(texts: List[str]) -> List[List[float]]:
    model = get_embedding_model()
    embeddings = model.encode(texts, convert_to_numpy=True)
    return embeddings.tolist()


def add_documents(documents: List[str], metadatas: List[dict], ids: List[str]) -> None:
    collection = get_collection()
    embeddings = create_embeddings(documents)
    collection.add(documents=documents, embeddings=embeddings, metadatas=metadatas, ids=ids)


def search_documents(query: str, n_results: int = 5, filter_metadata: Optional[dict] = None) -> dict:
    collection = get_collection()
    query_embedding = create_embeddings([query])[0]
    
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=n_results,
        where=filter_metadata,
        include=["documents", "metadatas", "distances"]
    )
    return results


def delete_documents(ids: List[str]) -> None:
    collection = get_collection()
    collection.delete(ids=ids)


def get_document_count() -> int:
    return get_collection().count()
