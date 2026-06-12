from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import List, Dict, Any
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


# =========================
# MODELS
# =========================

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


class SignupIn(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str


# =========================
# DONATION MODELS
# =========================

class DonationIn(BaseModel):
    donorId: str
    category: str
    title: str
    description: str
    details: Dict[str, Any]


class DonationOut(DonationIn):
    id: str
    status: str
    createdAt: str


# =========================
# STARTUP / SHUTDOWN
# =========================

@app.on_event("startup")
async def startup_event():
    await db.connect_to_mongo()


@app.on_event("shutdown")
async def shutdown_event():
    await db.close_mongo_connection()


# =========================
# BASIC ROUTES
# =========================

@app.get("/")
async def read_root():
    return {
        "message": "Donor Hub backend running"
    }


@app.get("/health", response_model=Health)
async def health():
    return {
        "status": "ok"
    }


# =========================
# DONOR ROUTES
# =========================

@app.get("/donors", response_model=List[DonorOut])
async def list_donors():

    docs = await db.get_donors()

    return docs


@app.post("/donors", response_model=DonorOut)
async def create_donor(
    donor: DonorIn
):

    donor_data = donor.dict()

    new_donor = await db.create_donor(
        donor_data
    )

    if not new_donor:
        raise HTTPException(
            status_code=500,
            detail="Failed to create donor"
        )

    return new_donor


# =========================
# LOGIN
# =========================

@app.post(
    "/login",
    response_model=LoginResponse
)
async def login(
    auth: AuthIn
):

    user_doc = await db.get_user_document_by_email(
        auth.email
    )

    if not user_doc:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    password_hash = user_doc.get(
        "password",
        ""
    )

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
        "user": user
    }


# =========================
# SIGNUP
# =========================

@app.post("/signup")
async def signup(
    user: SignupIn
):

    existing_user = await db.get_user_document_by_email(
        user.email
    )

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="User already exists with this email"
        )

    user_dict = user.dict()

    user_dict["password"] = user.password

    new_user = await db.create_user(
        user_dict
    )

    if not new_user:
        raise HTTPException(
            status_code=500,
            detail="Failed to create user"
        )

    return {
        "message": "User created successfully",
        "user": new_user
    }


# =========================
# DONATIONS
# =========================

@app.post("/donations")
async def create_donation(
    donation: DonationIn
):

    donation_dict = donation.dict()

    new_donation = await db.create_donation(
        donation_dict
    )

    if not new_donation:
        raise HTTPException(
            status_code=500,
            detail="Failed to create donation"
        )

    return new_donation


@app.get("/donations")
async def get_donations():

    donations = await db.get_donations()

    return donations


@app.get("/donations/donor/{donor_id}")
async def get_donor_donations(
    donor_id: str
):

    donations = await db.get_donations_by_donor(
        donor_id
    )

    return donations


@app.delete("/donations/{donation_id}")
async def delete_donation(
    donation_id: str
):

    deleted = await db.delete_donation(
        donation_id
    )

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Donation not found"
        )

    return {
        "message": "Donation deleted"
    }