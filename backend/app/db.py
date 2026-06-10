import os
from typing import Any, Dict, List, Optional
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

MONGO_URI = os.getenv("MONGO_URI")
MONGO_DB = os.getenv("MONGO_DB", "donorhub")

_client: Optional[AsyncIOMotorClient] = None
_db = None

async def connect_to_mongo():
    global _client, _db
    if _client is None:
        if MONGO_URI:
            _client = AsyncIOMotorClient(MONGO_URI)
        else:
            _client = AsyncIOMotorClient()
        _db = _client[MONGO_DB]

async def close_mongo_connection():
    global _client
    if _client is not None:
        _client.close()
        _client = None

async def get_donors() -> List[Dict[str, Any]]:
    await connect_to_mongo()
    cursor = _db.donors.find({})
    docs = []
    async for doc in cursor:
        doc["id"] = str(doc.get("_id"))
        doc.pop("_id", None)
        docs.append(doc)
    return docs

async def create_donor(donor: Dict[str, Any]) -> Dict[str, Any]:
    await connect_to_mongo()
    res = await _db.donors.insert_one(donor)
    new = await _db.donors.find_one({"_id": res.inserted_id})
    new["id"] = str(new.get("_id"))
    new.pop("_id", None)
    return new

async def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    await connect_to_mongo()
    doc = await _db.users.find_one({"email": email})
    if not doc:
        return None
    doc["id"] = str(doc.get("_id"))
    doc.pop("_id", None)
    doc.pop("password", None)
    return doc

async def get_user_document_by_email(email: str) -> Optional[Dict[str, Any]]:
    await connect_to_mongo()
    return await _db.users.find_one({"email": email})


def verify_password(plain_password: str, stored_password: str) -> bool:
    return plain_password == stored_password
