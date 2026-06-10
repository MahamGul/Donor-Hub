import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv(dotenv_path='backend/.env')

MONGO_URI = os.getenv("MONGO_URI")
MONGO_DB = os.getenv("MONGO_DB", "donorhub")

async def check_users():
    client = AsyncIOMotorClient(MONGO_URI)
    db = client[MONGO_DB]
    cursor = db.users.find({})
    docs = await cursor.to_list(length=None)
    if not docs:
        print("No users found")
    else:
        for doc in docs:
            print(f"Email: {doc.get('email')}, Password: '{doc.get('password')}'")
    client.close()

asyncio.run(check_users())
