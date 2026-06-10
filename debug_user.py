import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv(dotenv_path='backend/.env')

MONGO_URI = os.getenv("MONGO_URI")
MONGO_DB = os.getenv("MONGO_DB", "donorhub")

async def check_user():
    client = AsyncIOMotorClient(MONGO_URI)
    db = client[MONGO_DB]
    doc = await db.users.find_one({"email": "ayesha@gmail.com"})
    if doc:
        print(f"Name: {doc.get('name')}")
        print(f"Email: {doc.get('email')}")
        print(f"Password field: '{doc.get('password')}'")
        print(f"Role: {doc.get('role')}")
    else:
        print("User not found")
    client.close()

asyncio.run(check_user())
