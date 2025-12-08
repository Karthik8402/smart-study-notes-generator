"""MongoDB Atlas Connection Module"""

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from typing import Optional

from app.config import settings


class MongoDB:
    client: Optional[AsyncIOMotorClient] = None
    database: Optional[AsyncIOMotorDatabase] = None


db = MongoDB()


async def connect_to_mongo():
    """Connect to MongoDB Atlas."""
    db.client = AsyncIOMotorClient(settings.mongodb_url)
    db.database = db.client[settings.database_name]
    
    try:
        await db.client.admin.command('ping')
        print(f"✅ Connected to MongoDB: {settings.database_name}")
    except Exception as e:
        print(f"❌ Failed to connect to MongoDB: {e}")
        raise


async def close_mongo_connection():
    """Close MongoDB connection."""
    if db.client:
        db.client.close()
        print("✅ MongoDB connection closed")


def get_database() -> AsyncIOMotorDatabase:
    if db.database is None:
        raise RuntimeError("Database not initialized")
    return db.database


def get_users_collection():
    return get_database()["users"]


def get_documents_collection():
    return get_database()["documents"]


def get_notes_collection():
    return get_database()["notes"]


def get_chat_history_collection():
    return get_database()["chat_history"]
