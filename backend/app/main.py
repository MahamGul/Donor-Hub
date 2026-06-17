from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import List, Dict, Any
from datetime import datetime, timezone
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
async def create_donor(donor: DonorIn):
    donor_data = donor.dict()
    new_donor = await db.create_donor(donor_data)
    if not new_donor:
        raise HTTPException(status_code=500, detail="Failed to create donor")
    return new_donor


# =========================
# LOGIN
# =========================

@app.post("/login", response_model=LoginResponse)
async def login(auth: AuthIn):
    user_doc = await db.get_user_document_by_email(auth.email)
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    password_hash = user_doc.get("password", "")
    if not db.verify_password(auth.password, password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if user_doc.get("role") != auth.role:
        raise HTTPException(status_code=401, detail="Wrong role selected")

    user = await db.get_user_by_email(auth.email)
    if not user:
        raise HTTPException(status_code=500, detail="Failed to load user profile")

    return {
        "access_token": token_urlsafe(32),
        "token_type": "bearer",
        "user": user
    }


# =========================
# SIGNUP
# =========================

@app.post("/signup")
async def signup(user: SignupIn):
    existing_user = await db.get_user_document_by_email(user.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists with this email")

    user_dict = user.dict()
    user_dict["password"] = user.password

    new_user = await db.create_user(user_dict)
    if not new_user:
        raise HTTPException(status_code=500, detail="Failed to create user")

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
async def create_donation(donation: DonationIn):
    donation_dict = donation.dict()
    new_donation = await db.create_donation(donation_dict)
    if not new_donation:
        raise HTTPException(status_code=500, detail="Failed to create donation")
    return new_donation


@app.get("/donations")
async def get_donations():
    donations = await db.get_donations()
    return donations


@app.get("/donations/donor/{donor_id}")
async def get_donor_donations(donor_id: str):
    donations = await db.get_donations_by_donor(donor_id)
    return donations


@app.delete("/donations/{donation_id}")
async def delete_donation(donation_id: str):
    deleted = await db.delete_donation(donation_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Donation not found")
    return {"message": "Donation deleted"}


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
    request_data = {
        "recipientId": req.recipientId,
        "category": req.category,
        "details": req.details,
        "status": "pending",
        "message": None,  # no message until admin acts
    }

    new_request = await db.create_request(request_data)
    if not new_request:
        raise HTTPException(status_code=500, detail="Failed to create request")

    return new_request


# =========================
# FEEDBACK MODELS
# =========================

class FeedbackIn(BaseModel):
    recipientId: str
    donorId: str | None = None
    requestId: str | None = None
    comment: str
    anonymous: bool = False


class FeedbackOut(BaseModel):
    id: str
    recipientId: str
    donorId: str | None = None
    requestId: str | None = None
    comment: str
    anonymous: bool
    recipientName: str | None = None
    createdAt: str


# =========================
# FEEDBACK ROUTES
# =========================

@app.post("/feedback", response_model=FeedbackOut)
async def create_feedback(fb: FeedbackIn):
    if not fb.comment.strip():
        raise HTTPException(status_code=400, detail="Feedback comment cannot be empty")

    recipient_name = None
    if not fb.anonymous:
        recipient = await db.get_user_by_id(fb.recipientId)
        if recipient:
            recipient_name = recipient.get("name")

    donor_id = fb.donorId
    if not donor_id and fb.requestId:
        donor_id = await db.get_donor_id_for_request(fb.requestId)

    new_feedback = await db.create_feedback({
        "recipientId": fb.recipientId,
        "donorId": donor_id,
        "requestId": fb.requestId,
        "comment": fb.comment.strip(),
        "anonymous": fb.anonymous,
        "recipientName": recipient_name,
    })

    if not new_feedback:
        raise HTTPException(status_code=500, detail="Failed to submit feedback")

    return new_feedback


@app.get("/feedback/donor/{donor_id}", response_model=List[FeedbackOut])
async def list_donor_feedback(donor_id: str):
    return await db.get_feedback_by_donor(donor_id)


@app.get("/feedback/recipient/{recipient_id}", response_model=List[FeedbackOut])
async def list_recipient_feedback(recipient_id: str):
    return await db.get_feedback_by_recipient(recipient_id)


@app.get("/feedback", response_model=List[FeedbackOut])
async def list_all_feedback():
    return await db.get_all_feedback()


# =========================
# ADMIN ROUTES
# =========================

@app.get("/admin/stats")
async def admin_stats():
    donations = await db.get_donations()
    requests = await db.get_requests()

    try:
        users = await db.get_all_users()
        total_users = len(users)
    except:
        total_users = 0

    return {
        "totalDonations": len(donations),
        "availableDonations": len([
            d for d in donations if d.get("status") == "available"
        ]),
        "fulfilledDonations": len([
            d for d in donations if d.get("status") == "fulfilled"
        ]),
        "expiredDonations": len([
            d for d in donations if d.get("status") == "expired"
        ]),
        "totalRequests": len(requests),
        "pendingRequests": len([
            r for r in requests if r.get("status") == "pending"
        ]),
        "grantedRequests": len([
            r for r in requests if r.get("status") == "granted"
        ]),
        "totalUsers": total_users,
    }


@app.get("/admin/donations")
async def admin_donations(limit: int | None = None):
    donations = await db.get_donations()
    donations = sorted(
        donations,
        key=lambda x: x.get("createdAt", ""),
        reverse=True
    )
    if limit is None:
        return donations
    return donations[:limit]


@app.get("/admin/requests")
async def admin_requests(limit: int | None = None):
    requests = await db.get_requests()
    requests = sorted(
        requests,
        key=lambda x: x.get("createdAt", ""),
        reverse=True
    )
    if limit is None:
        return requests
    return requests[:limit]


@app.get("/admin/users")
async def admin_users():
    return await db.get_all_users()


@app.get("/admin/expiry")
async def admin_expiry():
    donations = await db.get_donations()
    expiry_items = []
    for donation in donations:
        details = donation.get("details", {})
        expiry_date = details.get("expiryDate")
        if not expiry_date:
            continue

        try:
            exp = datetime.strptime(expiry_date, "%Y-%m-%d").date()
            today = datetime.now(timezone.utc).date()
            days_until = (exp - today).days
        except Exception:
            continue

        if days_until <= 30:
            expiry_items.append({
                "id": donation.get("id") or donation.get("_id"),
                "title": donation.get("title"),
                "category": donation.get("category"),
                "donorId": donation.get("donorId"),
                "status": donation.get("status"),
                "expiryDate": expiry_date,
                "daysUntilExpiry": days_until,
            })

    expiry_items = sorted(expiry_items, key=lambda x: x["daysUntilExpiry"])
    return {"items": expiry_items}


@app.patch("/admin/donations/{donation_id}/status")
async def admin_update_donation_status(donation_id: str, payload: Dict[str, str]):
    status = payload.get("status")
    if not status:
        raise HTTPException(status_code=400, detail="Status is required")
    updated = await db.update_donation_status(donation_id, status)
    if not updated:
        raise HTTPException(status_code=404, detail="Donation not found")
    return updated


async def _allocate_request_to_donation(request_doc: Dict[str, Any]) -> Dict[str, Any]:
    category = request_doc.get("category")
    details = request_doc.get("details", {})

    if category == "Food":
        available = await db.get_donations_by_category("Food")
        match = next(
            (d for d in available if d["details"].get("quantity", 0) > 0),
            None
        )
        if not match:
            raise HTTPException(status_code=404, detail="No food packages currently available")

        await db.decrement_food_package(match["id"])

        return {
            "matchedDonationId": match["id"],
            "message": "1 food package granted",
            "details": {
                "items": match["details"].get("items", []),
                "expiryDate": match["details"].get("expiryDate"),
                "frozen": match["details"].get("frozen", False),
                "packagesGranted": 1,
            },
        }

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

        return {
            "matchedDonationId": sources[0]["donationId"] if sources else None,
            "message": f"PKR {allocated} allocated to recipient account",
            "details": {
                "amountGranted": allocated,
                "bankDetails": bank_details,
                "sources": sources,
            },
        }

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

        return {
            "matchedDonationId": match["id"],
            "message": f"{match['details'].get('bookCount')} book(s) granted",
            "details": {
                "bookCount": match["details"].get("bookCount"),
                "grade": match["details"].get("grade"),
                "subjects": match["details"].get("subjects", []),
                "requestedSubject": subject,
                "requestedGrade": grade,
            },
        }

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

        return {
            "matchedDonationId": match["id"],
            "message": f"Compatible donor found ({match['details'].get('bloodGroup')})",
            "details": {
                "recipientBloodGroup": recipient_blood,
                "donorBloodGroup": match["details"].get("bloodGroup"),
                "city": match["details"].get("city"),
                "hospitalPreference": match["details"].get("hospitalPreference"),
            },
        }

    elif category == "Clothes":
        clothes_type = details.get("type")
        size = details.get("size")
        if not clothes_type:
            raise HTTPException(status_code=400, detail="Clothing type is required")

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

        return {
            "matchedDonationId": match["id"],
            "message": f"{match['details'].get('quantity')} item(s) granted",
            "details": {
                "type": match["details"].get("type"),
                "size": match["details"].get("size"),
                "quantity": match["details"].get("quantity"),
            },
        }

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

        return {
            "matchedDonationId": match["id"],
            "message": f"{match['details'].get('medicineName')} granted",
            "details": {
                "medicineName": match["details"].get("medicineName"),
                "quantity": match["details"].get("quantity"),
                "expiryDate": match["details"].get("expiryDate"),
            },
        }

    else:
        raise HTTPException(status_code=400, detail="Invalid category")


@app.patch("/admin/requests/{request_id}/status")
async def admin_update_request_status(request_id: str, payload: Dict[str, str]):
    status = payload.get("status")
    if not status:
        raise HTTPException(status_code=400, detail="Status is required")

    request_doc = await db.get_request_by_id(request_id)
    if not request_doc:
        raise HTTPException(status_code=404, detail="Request not found")

    status = status.lower()
    if status not in {"pending", "granted", "rejected"}:
        raise HTTPException(status_code=400, detail="Invalid status")

    update_data = {"status": status}

    if status == "granted":
        if request_doc.get("status") == "granted":
            return request_doc
        allocation = await _allocate_request_to_donation(request_doc)
        update_data.update(allocation)
    elif status == "rejected":
        update_data["message"] = "Rejected by admin"
    elif status == "pending":
        update_data["message"] = None  # reset message when moved back to pending

    updated = await db.update_request(request_id, update_data)
    if not updated:
        raise HTTPException(status_code=404, detail="Request not found")
    return updated


@app.delete("/admin/requests/{request_id}")
async def admin_delete_request(request_id: str):
    deleted = await db.delete_request(request_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Request not found")
    return {"message": "Request deleted"}


@app.delete("/admin/donations/{donation_id}")
async def admin_delete_donation(donation_id: str):
    deleted = await db.delete_donation(donation_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Donation not found")
    return {"message": "Donation deleted"}