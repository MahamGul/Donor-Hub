import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv(dotenv_path='backend/.env')

MONGO_URI = os.getenv("MONGO_URI")
MONGO_DB = os.getenv("MONGO_DB", "donorhub")

async def insert_user():
    client = AsyncIOMotorClient(MONGO_URI)
    db = client[MONGO_DB]
    
    user = {
        "name": "Ayesha",
        "email": "ayesha@gmail.com",
        "password": "ayesh",
        "role": "donor"
    }
    
    result = await db.users.insert_one(user)
    print(f"User inserted with ID: {result.inserted_id}")
    client.close()

asyncio.run(insert_user())
