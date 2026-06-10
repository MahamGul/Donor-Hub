from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import List
from secrets import token_urlsafe

from . import db

app = FastAPI(title="Donor Hub Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Health(BaseModel):
    status: str


class DonorIn(BaseModel):
    name: str
    email: str | None = None


class DonorOut(DonorIn):
    id: str


class AuthIn(BaseModel):
    email: EmailStr
    password: str
    role: str


class UserOut(BaseModel):
    id: str
    name: str
    email: EmailStr
    role: str | None = None


class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserOut


@app.on_event("startup")
async def startup_event():
    await db.connect_to_mongo()


@app.on_event("shutdown")
async def shutdown_event():
    await db.close_mongo_connection()


@app.get("/")
async def read_root():
    return {"message": "Donor Hub backend running"}


@app.get("/health", response_model=Health)
async def health():
    return {"status": "ok"}


@app.get("/donors", response_model=List[DonorOut])
async def list_donors():
    docs = await db.get_donors()
    return docs


@app.post("/donors", response_model=DonorOut)
async def create_donor(donor: DonorIn):
    doc = donor.dict()

    new = await db.create_donor(doc)

    if not new:
        raise HTTPException(
            status_code=500,
            detail="Failed to create donor"
        )

    return new


@app.post("/login", response_model=LoginResponse)
async def login(auth: AuthIn):

    user_doc = await db.get_user_document_by_email(
        auth.email
    )

    if not user_doc:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    password_hash = user_doc.get("password", "")

    if not db.verify_password(
        auth.password,
        password_hash
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if user_doc.get("role") != auth.role:
        raise HTTPException(
            status_code=401,
            detail="Wrong role selected"
        )

    user = await db.get_user_by_email(
        auth.email
    )

    if not user:
        raise HTTPException(
            status_code=500,
            detail="Failed to load user profile"
        )

    return {
        "access_token": token_urlsafe(32),
        "token_type": "bearer",
        "user": user,
    }