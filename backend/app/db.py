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


async def get_donations_by_category(category: str, status: str = "available") -> List[Dict[str, Any]]:
    await connect_to_mongo()
    cursor = _db.donations.find({"category": category, "status": status})
    docs = []
    async for doc in cursor:
        docs.append(_serialize(doc))
    return docs


async def decrement_food_package(donation_id: str) -> Optional[Dict[str, Any]]:
    """Decrement quantity by 1; if it hits 0, mark as fulfilled."""
    await connect_to_mongo()
    try:
        oid = ObjectId(donation_id)
    except Exception:
        return None

    donation = await _db.donations.find_one({"_id": oid})
    if not donation:
        return None

    current_qty = donation["details"].get("quantity", 0)
    if current_qty <= 0:
        return None

    new_qty = current_qty - 1
    update = {"$set": {"details.quantity": new_qty}}
    if new_qty == 0:
        update["$set"]["status"] = "fulfilled"

    await _db.donations.update_one({"_id": oid}, update)

    donation["details"]["quantity"] = new_qty
    if new_qty == 0:
        donation["status"] = "fulfilled"

    return _serialize(donation)


async def mark_donation_fulfilled(donation_id: str) -> None:
    await connect_to_mongo()
    try:
        oid = ObjectId(donation_id)
    except Exception:
        return
    await _db.donations.update_one(
        {"_id": oid},
        {"$set": {"status": "fulfilled"}}
    )


async def update_donation_amount(donation_id: str, new_amount: float) -> None:
    """For partial fund allocation: reduce remaining amount, mark fulfilled if zero."""
    await connect_to_mongo()
    try:
        oid = ObjectId(donation_id)
    except Exception:
        return
    update = {"$set": {"details.amount": new_amount}}
    if new_amount <= 0:
        update["$set"]["status"] = "fulfilled"
    await _db.donations.update_one({"_id": oid}, update)


# =========================
# REQUESTS
# =========================

async def get_requests() -> List[Dict[str, Any]]:
    await connect_to_mongo()
    cursor = _db.requests.find({})
    docs = []
    async for doc in cursor:
        docs.append(_serialize(doc))
    return docs


async def get_requests_by_recipient(recipient_id: str) -> List[Dict[str, Any]]:
    await connect_to_mongo()
    cursor = _db.requests.find({"recipientId": recipient_id})
    docs = []
    async for doc in cursor:
        docs.append(_serialize(doc))
    return docs


async def create_request(request_dict: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    await connect_to_mongo()
    request_dict.setdefault("status", "granted")
    request_dict.setdefault("createdAt", datetime.now(timezone.utc).strftime("%Y-%m-%d"))
    res = await _db.requests.insert_one(request_dict)
    new = await _db.requests.find_one({"_id": res.inserted_id})
    if new:
        return _serialize(new)
    return None