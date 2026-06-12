import os
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

MONGO_URI = os.getenv("MONGO_URI")
MONGO_DB  = os.getenv("MONGO_DB", "donorhub")

_client: Optional[AsyncIOMotorClient] = None
_db = None


# =========================
# CONNECTION
# =========================

async def connect_to_mongo():
    global _client, _db
    if _client is None:
        _client = AsyncIOMotorClient(MONGO_URI) if MONGO_URI else AsyncIOMotorClient()
        _db = _client[MONGO_DB]


async def close_mongo_connection():
    global _client
    if _client is not None:
        _client.close()
        _client = None


# =========================
# HELPERS
# =========================

def _serialize(doc: Dict[str, Any]) -> Dict[str, Any]:
    """Convert _id ObjectId to string id and remove _id."""
    doc["id"] = str(doc.get("_id"))
    doc.pop("_id", None)
    return doc


# =========================
# DONORS
# =========================

async def get_donors() -> List[Dict[str, Any]]:
    await connect_to_mongo()
    cursor = _db.donors.find({})
    docs = []
    async for doc in cursor:
        docs.append(_serialize(doc))
    return docs


async def create_donor(donor: Dict[str, Any]) -> Dict[str, Any]:
    await connect_to_mongo()
    res = await _db.donors.insert_one(donor)
    new = await _db.donors.find_one({"_id": res.inserted_id})
    return _serialize(new)


# =========================
# USERS
# =========================

async def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    await connect_to_mongo()
    doc = await _db.users.find_one({"email": email})
    if not doc:
        return None
    doc = _serialize(doc)
    doc.pop("password", None)
    return doc


async def get_user_document_by_email(email: str) -> Optional[Dict[str, Any]]:
    """Returns the raw document including password hash — internal use only."""
    await connect_to_mongo()
    return await _db.users.find_one({"email": email})


def verify_password(plain_password: str, stored_password: str) -> bool:
    # TODO: replace with bcrypt.checkpw when you add hashing
    return plain_password == stored_password


async def create_user(user: Dict[str, Any]) -> Dict[str, Any]:
    await connect_to_mongo()
    res = await _db.users.insert_one(user)
    new = await _db.users.find_one({"_id": res.inserted_id})
    new = _serialize(new)
    new.pop("password", None)
    return new


# =========================
# DONATIONS
# =========================

async def create_donation(donation: Dict[str, Any]) -> Dict[str, Any]:
    await connect_to_mongo()
    donation.setdefault("status",    "available")
    donation.setdefault("createdAt", datetime.now(timezone.utc).strftime("%Y-%m-%d"))
    res = await _db.donations.insert_one(donation)
    new = await _db.donations.find_one({"_id": res.inserted_id})
    return _serialize(new)


async def get_donations() -> List[Dict[str, Any]]:
    await connect_to_mongo()
    cursor = _db.donations.find({})
    docs = []
    async for doc in cursor:
        docs.append(_serialize(doc))
    return docs


async def get_donations_by_donor(donor_id: str) -> List[Dict[str, Any]]:
    await connect_to_mongo()
    cursor = _db.donations.find({"donorId": donor_id})
    docs = []
    async for doc in cursor:
        docs.append(_serialize(doc))
    return docs


async def delete_donation(donation_id: str) -> bool:
    await connect_to_mongo()
    try:
        oid = ObjectId(donation_id)
    except Exception:
        return False
    result = await _db.donations.delete_one({"_id": oid})
    return result.deleted_count > 0