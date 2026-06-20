from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import List, Dict, Any
from datetime import datetime, timezone, timedelta
from secrets import token_urlsafe
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from dateutil.relativedelta import relativedelta
import os
from groq import Groq
from . import db
from dotenv import load_dotenv
load_dotenv()
app = FastAPI(title="Donor Hub Backend")
scheduler = AsyncIOScheduler()

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
    scheduler.add_job(
        process_recurring_donations,
        "cron",
        hour=0,
        minute=5,
        id="recurring_donations",
        replace_existing=True,
    )
    scheduler.start()


@app.on_event("shutdown")
async def shutdown_event():
    await db.close_mongo_connection()
    scheduler.shutdown(wait=False)


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
        "message": None,
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


# =========================
# HELPERS — matching against the new "list of items" donation shape
# =========================

def _single_item(details: Dict[str, Any], list_key: str) -> str | None:
    """
    The new donation form stores a list of named items (e.g. details['bloodGroups']
    or details['medicines']) instead of one fixed field. For matching purposes we
    only treat a donation as usable if that list has exactly one entry — donations
    with multiple items aren't matched against a single recipient request.
    Returns the single item (stripped) or None if the list is empty/has >1 entries.
    """
    items = details.get(list_key) or []
    items = [i for i in items if isinstance(i, str) and i.strip()]
    if len(items) != 1:
        return None
    return items[0].strip()


async def _allocate_request_to_donation(request_doc: Dict[str, Any]) -> Dict[str, Any]:
    category = request_doc.get("category")
    details = request_doc.get("details", {})

    if category == "Food":
        available = await db.get_donations_by_category("Food")
        match = next(iter(available), None)
        if not match:
            raise HTTPException(status_code=404, detail="No food packages currently available")

        await db.mark_donation_fulfilled(match["id"])

        return {
            "matchedDonationId": match["id"],
            "message": "1 food package granted",
            "details": {
                "items":           match["details"].get("items", []),
                "expiryDate":      match["details"].get("expiryDate"),
                "frozen":          match["details"].get("frozen", False),
                "packagesGranted": 1,
                "city":            match["details"].get("city"),
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

        # pick city from the first source donation that has one
        funds_city = next(
            (d["details"].get("city") for d in available if d["details"].get("city")),
            None,
        )

        return {
            "matchedDonationId": sources[0]["donationId"] if sources else None,
            "message": f"PKR {allocated} allocated to recipient account",
            "details": {
                "amountGranted": allocated,
                "bankDetails":   bank_details,
                "sources":       sources,
                "city":          funds_city,
            },
        }

    elif category == "Education":
        subject = details.get("subject")
        grade = details.get("grade")
        if not subject or not grade:
            raise HTTPException(status_code=400, detail="Subject and grade are required")

        available = await db.get_donations_by_category("Education")

        def matches(d):
            d_grade    = d["details"].get("grade")
            d_subjects = [s.lower() for s in d["details"].get("subjects", [])]
            grade_match   = (d_grade == grade) or (d_grade == "All levels")
            subject_match = (not d_subjects) or (subject.lower() in d_subjects)
            return grade_match and subject_match

        match = next((d for d in available if matches(d)), None)
        if not match:
            raise HTTPException(status_code=404, detail="No matching books currently available")

        await db.mark_donation_fulfilled(match["id"])

        return {
            "matchedDonationId": match["id"],
            "message": "1 book package granted",
            "details": {
                "subjects":         match["details"].get("subjects", []),
                "grade":            match["details"].get("grade"),
                "requestedSubject": subject,
                "requestedGrade":   grade,
                "city":             match["details"].get("city"),
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

        def matched_group(d):
            return _single_item(d["details"], "bloodGroups")

        match = None
        for d in available:
            group = matched_group(d)
            if group and group in compatible_donors:
                match = d
                break

        if not match:
            raise HTTPException(
                status_code=404,
                detail=f"No compatible blood donor currently available for {recipient_blood}"
            )

        await db.mark_donation_fulfilled(match["id"])
        donor_group = matched_group(match)

        return {
            "matchedDonationId": match["id"],
            "message": f"Compatible donor found ({donor_group})",
            "details": {
                "recipientBloodGroup": recipient_blood,
                "donorBloodGroup":     donor_group,
                "city":                match["details"].get("city"),
                "hospitalPreference":  match["details"].get("hospitalPreference"),
            },
        }

    elif category == "Clothes":
        clothes_type = details.get("type")
        size = details.get("size")
        if not clothes_type:
            raise HTTPException(status_code=400, detail="Clothing type is required")

        available = await db.get_donations_by_category("Clothes")

        def matches(d):
            d_type     = d["details"].get("type")
            type_match = (d_type == clothes_type) or (d_type == "All-season")
            size_match = (not size) or (d["details"].get("size") == size) or (d["details"].get("size") == "Mixed")
            return type_match and size_match

        match = next((d for d in available if matches(d)), None)
        if not match:
            raise HTTPException(status_code=404, detail="No matching clothes currently available")

        await db.mark_donation_fulfilled(match["id"])

        return {
            "matchedDonationId": match["id"],
            "message": "1 clothing package granted",
            "details": {
                "items": match["details"].get("items", []),
                "type":  match["details"].get("type"),
                "size":  match["details"].get("size"),
                "city":  match["details"].get("city"),
            },
        }

    elif category == "Medicine":
        medicine_name = details.get("medicineName")
        if not medicine_name:
            raise HTTPException(status_code=400, detail="Medicine name is required")

        available = await db.get_donations_by_category("Medicine")

        def matched_medicine(d):
            return _single_item(d["details"], "medicines")

        match  = None
        target = medicine_name.strip().lower()
        for d in available:
            name = matched_medicine(d)
            if name and name.lower() == target:
                match = d
                break

        if not match:
            raise HTTPException(status_code=404, detail=f"'{medicine_name}' is not currently available")

        await db.mark_donation_fulfilled(match["id"])
        matched_name = matched_medicine(match)

        return {
            "matchedDonationId": match["id"],
            "message": f"{matched_name} package granted",
            "details": {
                "medicineName": matched_name,
                "expiryDate":   match["details"].get("expiryDate"),
                "city":         match["details"].get("city"),
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
        update_data["message"] = None

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


# =========================
# DONATION PLAN MODELS
# =========================

class DonationPlanIn(BaseModel):
    donorId: str
    category: str
    title: str
    description: str
    details: Dict[str, Any]
    frequency: str          # "daily" | "weekly" | "monthly"
    startDate: str          # "YYYY-MM-DD"
    endDate: str | None = None


class DonationPlanOut(DonationPlanIn):
    id: str
    status: str             # "active" | "paused" | "cancelled"
    nextRunDate: str
    createdAt: str


# =========================
# SCHEDULER LOGIC
# =========================

def _calc_next_run(current: str, frequency: str) -> str:
    """Given a date string and frequency, return the next run date string."""
    dt = datetime.strptime(current, "%Y-%m-%d").date()
    if frequency == "daily":
        next_dt = dt + timedelta(days=1)
    elif frequency == "weekly":
        next_dt = dt + timedelta(weeks=1)
    elif frequency == "monthly":
        next_dt = dt + relativedelta(months=1)
    else:
        next_dt = dt + timedelta(weeks=1)   # fallback
    return next_dt.strftime("%Y-%m-%d")


async def process_recurring_donations():
    """
    Runs daily. For each active plan whose nextRunDate <= today,
    creates a real donation and advances the nextRunDate.
    If endDate is set and passed, marks the plan as cancelled.
    """
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    plans = await db.get_active_plans()

    for plan in plans:
        # Check if plan has expired
        end_date = plan.get("endDate")
        if end_date and end_date < today_str:
            await db.update_plan(plan["id"], {"status": "cancelled"})
            continue

        next_run = plan.get("nextRunDate", "")
        if next_run > today_str:
            continue    # not due yet

        # Create the actual donation from the plan
        donation_data = {
            "donorId":      plan["donorId"],
            "category":     plan["category"],
            "title":        plan["title"],
            "description":  plan["description"],
            "details":      plan["details"],
            "planId":       plan["id"],
        }
        await db.create_donation(donation_data)

        # Advance nextRunDate
        new_next = _calc_next_run(today_str, plan["frequency"])
        await db.update_plan(plan["id"], {"nextRunDate": new_next})


# =========================
# DONATION PLAN ROUTES
# =========================

@app.post("/donation-plans", response_model=DonationPlanOut)
async def create_donation_plan(plan: DonationPlanIn):
    plan_dict = plan.dict()

    # nextRunDate = startDate (first run happens on the start date)
    plan_dict["nextRunDate"] = plan_dict["startDate"]

    new_plan = await db.create_donation_plan(plan_dict)
    if not new_plan:
        raise HTTPException(status_code=500, detail="Failed to create donation plan")
    return new_plan


@app.get("/donation-plans/donor/{donor_id}", response_model=List[DonationPlanOut])
async def get_donor_plans(donor_id: str):
    return await db.get_plans_by_donor(donor_id)


@app.patch("/donation-plans/{plan_id}/status")
async def update_plan_status(plan_id: str, payload: Dict[str, str]):
    status = payload.get("status")
    if status not in {"active", "paused", "cancelled"}:
        raise HTTPException(status_code=400, detail="Status must be active, paused, or cancelled")

    updated = await db.update_plan(plan_id, {"status": status})
    if not updated:
        raise HTTPException(status_code=404, detail="Plan not found")
    return updated


@app.delete("/donation-plans/{plan_id}")
async def delete_donation_plan(plan_id: str):
    deleted = await db.delete_plan(plan_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Plan not found")
    return {"message": "Plan cancelled and deleted"}


@app.post("/donation-plans/process")
async def trigger_process():
    """Manual trigger for testing — remove or protect in production."""
    await process_recurring_donations()
    return {"message": "Recurring donations processed"}


# =========================
# CHATBOT (add these imports at the top of main.py)
# =========================
# import os
# from groq import Groq

# =========================
# CHATBOT MODEL
# =========================

class ChatMessageIn(BaseModel):
    message: str
    history: List[Dict[str, str]] = []   # [{"role": "user"/"assistant", "content": "..."}]


# =========================
# CHATBOT ROUTE
# =========================

@app.post("/chatbot")
async def chatbot(payload: ChatMessageIn):
    """
    Recipient-side FAQ chatbot powered by Groq.
    Reads GROQ_API_KEY from environment (.env file via python-dotenv).
    """
    import os
    try:
        from groq import Groq
    except ImportError:
        raise HTTPException(status_code=500, detail="groq package not installed. Run: pip install groq")

    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY not set in environment")

    client = Groq(api_key=api_key)

    SYSTEM_PROMPT = """You are AidBridge Assistant, a friendly and helpful support bot for AidBridge — a donation and aid matching platform. You help RECIPIENTS (people receiving aid) navigate the platform.

You only answer questions related to AidBridge features. If asked about anything unrelated, politely redirect the conversation.

Here is everything you know about what recipients can do on AidBridge:

## Making a Request
- Recipients can submit a new aid request by clicking "New Request" from the sidebar or dashboard.
- Available categories: Food, Medicine, Blood, Clothes, Education, Funds.
- Each category has its own form fields (e.g., blood group for Blood, medicine name for Medicine).
- After submitting, the request status starts as "Pending" and is reviewed by an admin.

## Tracking Requests
- Recipients can view all their requests under "My Requests" in the sidebar.
- They can also go to "Track Requests" to see detailed status updates.
- Possible statuses: Pending (waiting for admin review), Granted (matched with a donation), Rejected (not fulfilled at this time).

## Giving Feedback
- Recipients can submit feedback about their experience by clicking "Feedback" in the sidebar.
- Feedback can be submitted anonymously if preferred.
- Feedback helps improve the platform and is shared with donors.

## Account / Settings
- Recipients can update their profile (name, email, phone, city, bio) under "Settings".
- Notification and privacy preferences can also be managed in Settings.
- To sign out, click the "Sign Out" button at the bottom of the sidebar.

## Request Status Meanings
- Pending: Your request has been submitted and is awaiting admin review.
- Granted: Great news! Your request has been matched with an available donation.
- Rejected: Your request could not be fulfilled at this time. You can submit a new request later.

## General
- AidBridge connects people in need with verified donors.
- All donations are manually reviewed and matched by admins.
- If you have an urgent need, submit a request and our team will prioritize it.
- For technical issues, contact support through the Settings page.

Keep responses concise, warm, and helpful. Use simple language. If unsure, say "I'm not sure about that — please contact our support team through the Settings page."
"""

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    # Include conversation history (last 10 messages max to stay within context)
    for msg in payload.history[-10:]:
        if msg.get("role") in ("user", "assistant") and msg.get("content"):
            messages.append({"role": msg["role"], "content": msg["content"]})

    messages.append({"role": "user", "content": payload.message})

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            max_tokens=300,
            temperature=0.5,
        )
        reply = response.choices[0].message.content.strip()
        return {"reply": reply}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Groq API error: {str(e)}")
    
# =========================
# DONOR CHATBOT ROUTE
# Add this to main.py after the existing /chatbot route
# =========================

@app.post("/chatbot/donor")
async def donor_chatbot(payload: ChatMessageIn):
    """
    Donor-side FAQ chatbot powered by Groq.
    Reuses the ChatMessageIn model already defined for the recipient chatbot.
    """
    import os
    try:
        from groq import Groq
    except ImportError:
        raise HTTPException(status_code=500, detail="groq package not installed. Run: pip install groq")

    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY not set in environment")

    client = Groq(api_key=api_key)

    DONOR_SYSTEM_PROMPT = """You are AidBridge Assistant, a support chatbot embedded inside the AidBridge donor portal. Your ONLY job is to help donors use the AidBridge platform. You have no knowledge of, and must not answer questions about, anything outside of AidBridge — including weather, food definitions, general knowledge, news, coding, math, recipes, or any other topic.

STRICT RULE: If the user asks about ANYTHING not directly related to using the AidBridge platform, respond with exactly:
"I'm only able to help with AidBridge-related questions. Try asking me about creating a donation, managing your plans, or tracking your impact!"

Do NOT attempt to answer off-topic questions even if you know the answer. Do NOT apologize excessively. Just redirect clearly and offer a useful AidBridge prompt.

---

You are talking to a DONOR — someone who gives aid through the platform. Here is your complete knowledge base:

=== WHAT IS AIDBRIDGE? ===
AidBridge is a donation and aid matching platform. Donors list items or resources they want to give. Admins review recipient requests and match them with available donor listings. Donors do NOT choose who receives their donation — admins handle matching.

=== DONATION CATEGORIES ===
AidBridge supports 6 donation categories. When a donor clicks "New Donation", they choose one of these:

1. FOOD
   - What it is: Packaged food items you want to donate (e.g. rice, canned goods, bread).
   - Form fields: List of food items, expiry date, whether the food is frozen (yes/no), city, quantity/packages.
   - After submission: Status shows "Available" (shown as "Pending" on dashboard) until matched with a recipient who requested food.
   - Note: Food donations can expire — if the expiry date passes before matching, status becomes "Expired".

2. MEDICINE
   - What it is: Medicines or medical supplies you want to donate.
   - Form fields: Medicine name(s), expiry date, city.
   - Note: Medicine donations can also expire before being matched.

3. BLOOD
   - What it is: Blood donation availability — you register your willingness to donate blood.
   - Form fields: Blood group(s) you can donate (e.g. O+, A-, B+, AB+), hospital preference, city.
   - How matching works: The system matches your blood group against what recipients need, respecting compatibility rules.

4. CLOTHES
   - What it is: Clothing items you want to donate.
   - Form fields: Type (Winter / Summer / All-season), size (S / M / L / XL / Mixed), list of items, city.

5. EDUCATION
   - What it is: Books or educational materials you want to donate.
   - Form fields: Subjects covered, grade level (e.g. Grade 5, O-Level, All levels), city.

6. FUNDS
   - What it is: Monetary donation in PKR.
   - Form fields: Amount (PKR), your bank/transfer details, city.
   - How it works: Admin allocates up to PKR 5,000 per recipient request from available fund donations.

=== DONATION STATUSES ===
- Available (shown as "Pending" on dashboard): Your donation is listed and waiting to be matched.
- Fulfilled: Your donation has been matched and given to a recipient.
- Expired: Applies to Food and Medicine only — the expiry date passed before the donation was matched.

=== HOW TO CREATE A DONATION ===
1. Click "New Donation" in the sidebar or the "+ New Donation" button on your dashboard.
2. Select a category (Food, Medicine, Blood, Clothes, Education, or Funds).
3. Fill in the form fields for that category (see above).
4. Submit — your donation is now listed as Available.

=== MANAGING YOUR DONATIONS ===
- Go to "My Donations" in the sidebar to see all your donations and their statuses.
- You can DELETE a donation that is still Available (not yet fulfilled) by clicking the delete/trash icon.
- You CANNOT edit a donation after submitting it. If you made a mistake, delete it and create a new one.

=== RECURRING DONATION PLANS ===
- Go to "My Plans" in the sidebar to set up or manage recurring donations.
- When creating a plan, choose: category, donation details, frequency (Daily / Weekly / Monthly), start date, and an optional end date.
- The system automatically creates a real donation on each scheduled date.
- Plan statuses:
  - Active: Running as scheduled — donations are being created automatically.
  - Paused: Temporarily stopped — no donations are created until you resume it.
  - Cancelled: Permanently stopped — cannot be restarted.
- You can Pause, Resume, or Cancel a plan at any time from the My Plans page.

=== YOUR IMPACT ===
- Your dashboard shows: Total Donations made, Fulfilled count, Pending count, and feedback received from recipients.
- Go to "Impact" in the sidebar for a detailed breakdown.

=== FEEDBACK ===
- Recipients can leave feedback about the aid they received, which may be linked to your donation.
- You can view this feedback on your dashboard or under "Feedback" in the sidebar.
- Feedback may be anonymous — the recipient's name might not be shown.

=== ACCOUNT & SETTINGS ===
- Click "Settings" in the sidebar to update your profile: name, email, phone, city, bio.
- You can also manage notification preferences and privacy settings there.
- To sign out, click "Sign Out" at the bottom of the sidebar.

=== NAVIGATION (sidebar links) ===
- Overview / Dashboard: Home screen with stats and recent activity.
- New Donation: Create a new donation listing.
- My Donations: View all your donations and their statuses.
- My Plans: Set up and manage recurring donation schedules.
- Impact: See your overall contribution stats.
- Feedback: Read what recipients said about your donations.
- Settings: Edit your profile and preferences.
- Sign Out: Log out of the platform.

---

RESPONSE STYLE:
- Be warm, concise, and clear.
- Use simple language — no jargon.
- Keep answers short unless the question needs detail.
- If the user seems confused, offer the next logical step.
- Never make up features that are not listed above.
- If something is not covered above, say: "I don't have details on that — please reach out to support via the Settings page."
"""

    messages = [{"role": "system", "content": DONOR_SYSTEM_PROMPT}]

    # Include conversation history (last 10 messages max to stay within context)
    for msg in payload.history[-10:]:
        if msg.get("role") in ("user", "assistant") and msg.get("content"):
            messages.append({"role": msg["role"], "content": msg["content"]})

    messages.append({"role": "user", "content": payload.message})

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            max_tokens=300,
            temperature=0.3,
        )
        reply = response.choices[0].message.content.strip()
        return {"reply": reply}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Groq API error: {str(e)}")