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
    phone: str | None = None
    city: str | None = None
    bio: str | None = None
    notifs: Dict[str, bool] | None = None
    privacy: Dict[str, bool] | None = None


class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserOut


class SignupIn(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str


class UserUpdateIn(BaseModel):
    name: str | None = None
    email: EmailStr | None = None
    phone: str | None = None
    city: str | None = None
    bio: str | None = None
    notifs: Dict[str, bool] | None = None
    privacy: Dict[str, bool] | None = None


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


@app.get("/users/{user_id}", response_model=UserOut)
async def get_user(user_id: str):
    user = await db.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@app.put("/users/{user_id}", response_model=UserOut)
async def update_user(user_id: str, user_update: UserUpdateIn):
    updated = await db.update_user(user_id, user_update.dict(exclude_none=True))
    if not updated:
        raise HTTPException(status_code=404, detail="User not found")
    return updated


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

# =========================
# REQUEST MODELS
# =========================

class RequestIn(BaseModel):
    recipientId: str
    category: str
    details: Dict[str, Any]


class RequestOut(BaseModel):
    id: str
    recipientId: str
    category: str
    details: Dict[str, Any]
    status: str
    createdAt: str
    matchedDonationId: str | None = None
    message: str | None = None


# =========================
# BLOOD COMPATIBILITY
# =========================

# Maps recipient blood type -> list of donor blood types they can RECEIVE from
BLOOD_COMPATIBILITY = {
    "O-":  ["O-"],
    "O+":  ["O-", "O+"],
    "A-":  ["O-", "A-"],
    "A+":  ["O-", "O+", "A-", "A+"],
    "B-":  ["O-", "B-"],
    "B+":  ["O-", "O+", "B-", "B+"],
    "AB-": ["O-", "A-", "B-", "AB-"],
    "AB+": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
}


# =========================
# REQUEST ROUTES
# =========================

@app.get("/requests", response_model=List[RequestOut])
async def list_requests():
    return await db.get_requests()


@app.get("/requests/recipient/{recipient_id}", response_model=List[RequestOut])
async def list_recipient_requests(recipient_id: str):
    return await db.get_requests_by_recipient(recipient_id)


@app.post("/requests", response_model=RequestOut)
async def create_request(req: RequestIn):

    category = req.category
    details = req.details
    recipient_id = req.recipientId

    # ---------- FOOD ----------
    if category == "Food":
        available = await db.get_donations_by_category("Food")
        # pick first donation with quantity > 0
        match = next(
            (d for d in available if d["details"].get("quantity", 0) > 0),
            None
        )
        if not match:
            raise HTTPException(status_code=404, detail="No food packages currently available")

        await db.decrement_food_package(match["id"])

        granted_details = {
            "items": match["details"].get("items", []),
            "expiryDate": match["details"].get("expiryDate"),
            "frozen": match["details"].get("frozen", False),
            "packagesGranted": 1,
        }

        new_request = await db.create_request({
            "recipientId": recipient_id,
            "category": category,
            "details": granted_details,
            "matchedDonationId": match["id"],
            "message": "1 food package granted",
        })

    # ---------- FUNDS ----------
    elif category == "Funds":
        bank_details = details.get("bankDetails")
        if not bank_details:
            raise HTTPException(status_code=400, detail="Bank details are required")

        available = await db.get_donations_by_category("Funds")
        total_available = sum(d["details"].get("amount", 0) for d in available)

        if total_available <= 0:
            raise HTTPException(status_code=404, detail="No funds currently available")

        ALLOC_CAP = 5000
        allocated = min(ALLOC_CAP, total_available)
        remaining_to_allocate = allocated
        sources = []

        for d in available:
            if remaining_to_allocate <= 0:
                break
            d_amount = d["details"].get("amount", 0)
            if d_amount <= 0:
                continue

            take = min(d_amount, remaining_to_allocate)
            new_amount = d_amount - take
            await db.update_donation_amount(d["id"], new_amount)

            sources.append({"donationId": d["id"], "amount": take})
            remaining_to_allocate -= take

        granted_details = {
            "amountGranted": allocated,
            "bankDetails": bank_details,
            "sources": sources,
        }

        new_request = await db.create_request({
            "recipientId": recipient_id,
            "category": category,
            "details": granted_details,
            "matchedDonationId": sources[0]["donationId"] if sources else None,
            "message": f"PKR {allocated} allocated to your account",
        })

    # ---------- EDUCATION ----------
    elif category == "Education":
        subject = details.get("subject")
        grade = details.get("grade")
        if not subject or not grade:
            raise HTTPException(status_code=400, detail="Subject and grade are required")

        available = await db.get_donations_by_category("Education")

        def matches(d):
            d_grade = d["details"].get("grade")
            d_subjects = [s.lower() for s in d["details"].get("subjects", [])]
            grade_match = (d_grade == grade) or (d_grade == "All levels")
            subject_match = (not d_subjects) or (subject.lower() in d_subjects)
            return grade_match and subject_match

        match = next((d for d in available if matches(d)), None)

        if not match:
            raise HTTPException(status_code=404, detail="No matching books currently available")

        await db.mark_donation_fulfilled(match["id"])

        granted_details = {
            "bookCount": match["details"].get("bookCount"),
            "grade": match["details"].get("grade"),
            "subjects": match["details"].get("subjects", []),
            "requestedSubject": subject,
            "requestedGrade": grade,
        }

        new_request = await db.create_request({
            "recipientId": recipient_id,
            "category": category,
            "details": granted_details,
            "matchedDonationId": match["id"],
            "message": f"{match['details'].get('bookCount')} book(s) granted",
        })

    # ---------- BLOOD ----------
    elif category == "Blood":
        recipient_blood = details.get("bloodGroup")
        if not recipient_blood:
            raise HTTPException(status_code=400, detail="Blood group is required")

        compatible_donors = BLOOD_COMPATIBILITY.get(recipient_blood)
        if compatible_donors is None:
            raise HTTPException(status_code=400, detail="Invalid blood group")

        available = await db.get_donations_by_category("Blood")
        match = next(
            (d for d in available if d["details"].get("bloodGroup") in compatible_donors),
            None
        )

        if not match:
            raise HTTPException(
                status_code=404,
                detail=f"No compatible blood donor currently available for {recipient_blood}"
            )

        await db.mark_donation_fulfilled(match["id"])

        granted_details = {
            "recipientBloodGroup": recipient_blood,
            "donorBloodGroup": match["details"].get("bloodGroup"),
            "city": match["details"].get("city"),
            "hospitalPreference": match["details"].get("hospitalPreference"),
        }

        new_request = await db.create_request({
            "recipientId": recipient_id,
            "category": category,
            "details": granted_details,
            "matchedDonationId": match["id"],
            "message": f"Compatible donor found ({match['details'].get('bloodGroup')})",
        })

    # ---------- CLOTHES ----------
    elif category == "Clothes":
        clothes_type = details.get("type")  # e.g. "Winter"/"Summer"/gender etc
        size = details.get("size")
        if not clothes_type:
            raise HTTPException(status_code=400, detail="Clothing type (e.g. Winter/Summer/gender) is required")

        available = await db.get_donations_by_category("Clothes")

        def matches(d):
            d_type = d["details"].get("type")
            type_match = (d_type == clothes_type) or (d_type == "All-season")
            size_match = (not size) or (d["details"].get("size") == size) or (d["details"].get("size") == "Mixed")
            return type_match and size_match

        match = next((d for d in available if matches(d)), None)

        if not match:
            raise HTTPException(status_code=404, detail="No matching clothes currently available")

        await db.mark_donation_fulfilled(match["id"])

        granted_details = {
            "type": match["details"].get("type"),
            "size": match["details"].get("size"),
            "quantity": match["details"].get("quantity"),
        }

        new_request = await db.create_request({
            "recipientId": recipient_id,
            "category": category,
            "details": granted_details,
            "matchedDonationId": match["id"],
            "message": f"{match['details'].get('quantity')} item(s) granted",
        })

    # ---------- MEDICINE ----------
    elif category == "Medicine":
        medicine_name = details.get("medicineName")
        if not medicine_name:
            raise HTTPException(status_code=400, detail="Medicine name is required")

        available = await db.get_donations_by_category("Medicine")
        match = next(
            (d for d in available
             if d["details"].get("medicineName", "").strip().lower() == medicine_name.strip().lower()),
            None
        )

        if not match:
            raise HTTPException(status_code=404, detail=f"'{medicine_name}' is not currently available")

        await db.mark_donation_fulfilled(match["id"])

        granted_details = {
            "medicineName": match["details"].get("medicineName"),
            "quantity": match["details"].get("quantity"),
            "expiryDate": match["details"].get("expiryDate"),
        }

        new_request = await db.create_request({
            "recipientId": recipient_id,
            "category": category,
            "details": granted_details,
            "matchedDonationId": match["id"],
            "message": f"{match['details'].get('medicineName')} granted",
        })

    else:
        raise HTTPException(status_code=400, detail="Invalid category")

    if not new_request:
        raise HTTPException(status_code=500, detail="Failed to create request")

    return new_request