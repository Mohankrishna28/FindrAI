import os
import shutil
import uuid
import io
import base64
from datetime import datetime, date
from typing import Optional, List
from PIL import Image, ImageOps
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc

from backend.database import get_db
from backend.models import ItemReport, MatchResult, ClaimRequest, User
from backend.matcher import get_text_embedding, get_image_embedding, compute_all_matches_for_item, evaluate_match
import hashlib

router = APIRouter(prefix="/api")

AUTH_SALT = "findrai_secure_salt_v1"

def hash_password(password: str) -> str:
    return hashlib.sha256((AUTH_SALT + password).encode("utf-8")).hexdigest()

DEMO_ACCOUNTS = {
    "admin@campus.edu": {
        "email": "admin@campus.edu",
        "full_name": "Campus Security Officer",
        "role": "admin",
        "password": "admin123"
    },
    "student@campus.edu": {
        "email": "student@campus.edu",
        "full_name": "Alex Student",
        "role": "user",
        "password": "student123"
    }
}

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if os.environ.get("VERCEL"):
    UPLOAD_DIR = "/tmp/uploads"
else:
    UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.get("/health")
def health_check():
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}


@router.post("/auth/login")
def login(payload: dict, db: Session = Depends(get_db)):
    email = payload.get("email", "").strip().lower()
    password = payload.get("password", "").strip()
    target_role = payload.get("role") # optional requested role filter e.g. "admin" or "user"

    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password are required")

    user = db.query(User).filter(User.email == email).first()

    # Auto-seed demo accounts if they don't exist yet
    if not user and email in DEMO_ACCOUNTS:
        demo = DEMO_ACCOUNTS[email]
        user = User(
            email=demo["email"],
            full_name=demo["full_name"],
            role=demo["role"],
            password_hash=hash_password(demo["password"])
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if user.password_hash != hash_password(password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # If user selected Admin portal login, verify they have admin privileges
    if target_role == "admin" and user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Access Denied: This account does not possess Security Administrator privileges. Please use Student / User login."
        )

    token = f"token_{user.id}_{user.role}_{uuid.uuid4().hex[:12]}"

    return {
        "success": True,
        "token": token,
        "user": user.to_dict()
    }


@router.post("/auth/register")
def register(payload: dict, db: Session = Depends(get_db)):
    email = payload.get("email", "").strip().lower()
    password = payload.get("password", "").strip()
    full_name = payload.get("full_name", "").strip()
    role = payload.get("role", "user").strip().lower()

    if not email or not password or not full_name:
        raise HTTPException(status_code=400, detail="Email, password, and full name are required")

    if role not in ["user", "admin"]:
        role = "user"

    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists")

    new_user = User(
        email=email,
        full_name=full_name,
        role=role,
        password_hash=hash_password(password)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = f"token_{new_user.id}_{new_user.role}_{uuid.uuid4().hex[:12]}"

    return {
        "success": True,
        "token": token,
        "user": new_user.to_dict()
    }


@router.get("/auth/me")
def get_current_user(token: Optional[str] = Query(None), db: Session = Depends(get_db)):
    if not token:
        return {"authenticated": False, "user": None}
    # Parse mock token format token_{user_id}_{role}_{uuid}
    parts = token.split("_")
    if len(parts) >= 2 and parts[1].isdigit():
        user = db.query(User).filter(User.id == int(parts[1])).first()
        if user:
            return {"authenticated": True, "user": user.to_dict()}
    return {"authenticated": False, "user": None}


@router.post("/items")
async def report_item(
    type: str = Form(...), # "LOST" or "FOUND"
    title: str = Form(...),
    category: str = Form(...),
    brand: Optional[str] = Form(None),
    color: str = Form(...),
    location: str = Form(...),
    date_lost_or_found: str = Form(...),
    description: str = Form(...),
    reporter_name: Optional[str] = Form("Anonymous"),
    reporter_contact: str = Form(...),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    type_upper = type.strip().upper()
    if type_upper not in ["LOST", "FOUND"]:
        raise HTTPException(status_code=400, detail="Type must be either LOST or FOUND")

    try:
        parsed_date = datetime.fromisoformat(date_lost_or_found.replace("Z", "")).date()
    except Exception:
        parsed_date = date.today()

    # Handle image upload if provided with permanent Base64 persistence
    image_rel_path = None
    image_emb = None
    if image and image.filename:
        file_bytes = await image.read()
        if file_bytes:
            ext = os.path.splitext(image.filename)[1].lower() or ".jpg"
            filename = f"{uuid.uuid4().hex}{ext}"
            save_path = os.path.join(UPLOAD_DIR, filename)

            # Try to write to disk if environment permits
            try:
                with open(save_path, "wb") as buffer:
                    buffer.write(file_bytes)
            except Exception:
                pass

            # Convert to compressed web-optimized Base64 data URI
            try:
                img = Image.open(io.BytesIO(file_bytes))
                try:
                    img = ImageOps.exif_transpose(img)
                except Exception:
                    pass
                if img.mode != "RGB":
                    img = img.convert("RGB")
                img.thumbnail((750, 750), Image.Resampling.LANCZOS)
                buf = io.BytesIO()
                img.save(buf, format="JPEG", quality=80, optimize=True)
                b64_str = base64.b64encode(buf.getvalue()).decode("utf-8")
                image_rel_path = f"data:image/jpeg;base64,{b64_str}"
                image_emb = get_image_embedding(img)
            except Exception as e:
                print(f"Base64 image conversion error: {e}")
                # Safe fallback to raw bytes as base64 data URI
                try:
                    raw_b64 = base64.b64encode(file_bytes).decode("utf-8")
                    mime = "image/png" if ext == ".png" else "image/webp" if ext == ".webp" else "image/jpeg"
                    image_rel_path = f"data:{mime};base64,{raw_b64}"
                except Exception:
                    image_rel_path = f"/uploads/{filename}"

            if image_emb is None and os.path.exists(save_path):
                image_emb = get_image_embedding(save_path)

    # Compute semantic text embedding from rich composite description
    text_content = f"{title}. Category: {category}. Brand: {brand or 'unspecified'}. Color: {color}. Location: {location}. Details: {description}"
    text_emb = get_text_embedding(text_content)

    new_item = ItemReport(
        type=type_upper,
        title=title.strip(),
        category=category.strip(),
        brand=brand.strip() if brand else None,
        color=color.strip(),
        location=location.strip(),
        date_lost_or_found=parsed_date,
        description=description.strip(),
        image_url=image_rel_path,
        text_embedding=text_emb,
        image_embedding=image_emb,
        status="OPEN",
        reporter_name=reporter_name.strip() if reporter_name else "Anonymous",
        reporter_contact=reporter_contact.strip()
    )

    db.add(new_item)
    db.commit()
    db.refresh(new_item)

    # Trigger automatic matching against opposite items in the system
    matches = compute_all_matches_for_item(new_item, db, threshold=50.0)

    # Identify if high-confidence match found (>75%)
    high_confidence = [m for m in matches if m.total_score >= 75.0]

    return {
        "success": True,
        "item": new_item.to_dict(),
        "matches_count": len(matches),
        "high_confidence_detected": len(high_confidence) > 0,
        "top_match_score": max([m.total_score for m in matches], default=0.0)
    }


@router.get("/items")
def list_items(
    type: Optional[str] = None,
    category: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(ItemReport)

    if type and type.upper() in ["LOST", "FOUND"]:
        query = query.filter(ItemReport.type == type.upper())

    if category and category.lower() != "all":
        query = query.filter(ItemReport.category.ilike(f"%{category}%"))

    if status and status.lower() != "all":
        query = query.filter(ItemReport.status == status.upper())

    if search:
        term = f"%{search}%"
        query = query.filter(
            or_(
                ItemReport.title.ilike(term),
                ItemReport.description.ilike(term),
                ItemReport.location.ilike(term),
                ItemReport.color.ilike(term),
                ItemReport.brand.ilike(term),
            )
        )

    items = query.order_by(desc(ItemReport.created_at)).all()
    return [item.to_dict() for item in items]


@router.get("/items/{item_id}")
def get_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(ItemReport).filter(ItemReport.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    # Fetch all matches involving this item
    if item.type == "LOST":
        matches = db.query(MatchResult).filter(MatchResult.lost_item_id == item_id).order_by(desc(MatchResult.total_score)).all()
    else:
        matches = db.query(MatchResult).filter(MatchResult.found_item_id == item_id).order_by(desc(MatchResult.total_score)).all()

    return {
        "item": item.to_dict(),
        "matches": [m.to_dict() for m in matches]
    }


@router.delete("/items/{item_id}")
def delete_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(ItemReport).filter(ItemReport.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    db.query(MatchResult).filter(or_(MatchResult.lost_item_id == item_id, MatchResult.found_item_id == item_id)).delete()
    db.query(ClaimRequest).filter(ClaimRequest.item_id == item_id).delete()
    db.delete(item)
    db.commit()
    return {"success": True, "deleted_id": item_id}


@router.patch("/items/{item_id}/status")
def update_item_status(item_id: int, payload: dict, db: Session = Depends(get_db)):
    item = db.query(ItemReport).filter(ItemReport.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    new_status = payload.get("status", "").upper()
    if new_status:
        if new_status not in ["OPEN", "CLAIM_PENDING", "RESOLVED"]:
            raise HTTPException(status_code=400, detail="Invalid status")
        item.status = new_status

    if "approval_status" in payload:
        app_status = payload.get("approval_status", "").upper()
        if app_status in ["APPROVED", "REJECTED", "PENDING"]:
            try:
                item.approval_status = app_status
            except Exception:
                pass

    db.commit()
    return item.to_dict()


@router.patch("/items/{item_id}/approve")
def approve_item(item_id: int, payload: dict, db: Session = Depends(get_db)):
    item = db.query(ItemReport).filter(ItemReport.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    approval_status = payload.get("approval_status", "APPROVED").upper()
    if approval_status not in ["APPROVED", "REJECTED", "PENDING"]:
        raise HTTPException(status_code=400, detail="Invalid approval status")

    try:
        item.approval_status = approval_status
    except Exception:
        pass

    if payload.get("status"):
        new_status = payload.get("status").upper()
        if new_status in ["OPEN", "CLAIM_PENDING", "RESOLVED"]:
            item.status = new_status

    db.commit()
    return item.to_dict()



@router.get("/matches")
def list_matches(
    min_score: float = Query(0.0),
    status: Optional[str] = None,
    item_id: Optional[int] = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    query = db.query(MatchResult).filter(MatchResult.total_score >= min_score)

    if status and status.lower() != "all":
        query = query.filter(MatchResult.status == status.upper())

    if item_id:
        query = query.filter(
            or_(
                MatchResult.lost_item_id == item_id,
                MatchResult.found_item_id == item_id
            )
        )

    matches = query.order_by(desc(MatchResult.total_score)).limit(limit).all()
    return [m.to_dict() for m in matches]


@router.patch("/matches/{match_id}/status")
def update_match_status(match_id: int, payload: dict, db: Session = Depends(get_db)):
    match = db.query(MatchResult).filter(MatchResult.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    new_status = payload.get("status", "").upper()
    if new_status not in ["SUGGESTED", "CONFIRMED", "REJECTED"]:
        raise HTTPException(status_code=400, detail="Invalid status")

    match.status = new_status
    if new_status == "CONFIRMED":
        # Optionally update items to CLAIM_PENDING or RESOLVED
        if match.lost_item:
            match.lost_item.status = "RESOLVED"
        if match.found_item:
            match.found_item.status = "RESOLVED"

    db.commit()
    return match.to_dict()


@router.post("/claims")
def submit_claim(payload: dict, db: Session = Depends(get_db)):
    item_id = payload.get("item_id")
    match_id = payload.get("match_id")
    claimant_name = payload.get("claimant_name", "").strip()
    claimant_contact = payload.get("claimant_contact", "").strip()
    proof_description = payload.get("proof_description", "").strip()

    if not item_id or not claimant_name or not claimant_contact or not proof_description:
        raise HTTPException(status_code=400, detail="All claim fields are required")

    item = db.query(ItemReport).filter(ItemReport.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    claim = ClaimRequest(
        item_id=item_id,
        match_id=match_id,
        claimant_name=claimant_name,
        claimant_contact=claimant_contact,
        proof_description=proof_description,
        status="PENDING"
    )

    item.status = "CLAIM_PENDING"
    db.add(claim)
    db.commit()
    db.refresh(claim)
    return claim.to_dict()


@router.get("/claims")
def list_claims(status: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(ClaimRequest)
    if status and status.lower() != "all":
        query = query.filter(ClaimRequest.status == status.upper())

    claims = query.order_by(desc(ClaimRequest.created_at)).all()
    return [c.to_dict() for c in claims]


@router.patch("/claims/{claim_id}/review")
def review_claim(claim_id: int, payload: dict, db: Session = Depends(get_db)):
    claim = db.query(ClaimRequest).filter(ClaimRequest.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    new_status = payload.get("status", "").upper()
    admin_notes = payload.get("admin_notes", "")

    if new_status not in ["APPROVED", "REJECTED"]:
        raise HTTPException(status_code=400, detail="Status must be APPROVED or REJECTED")

    claim.status = new_status
    claim.admin_notes = admin_notes

    if new_status == "APPROVED":
        if claim.item:
            claim.item.status = "RESOLVED"
        if claim.match:
            claim.match.status = "CONFIRMED"
            if claim.match.lost_item:
                claim.match.lost_item.status = "RESOLVED"
            if claim.match.found_item:
                claim.match.found_item.status = "RESOLVED"
    elif new_status == "REJECTED":
        if claim.item and claim.item.status == "CLAIM_PENDING":
            claim.item.status = "OPEN"

    db.commit()
    return claim.to_dict()


@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    total_lost = db.query(ItemReport).filter(ItemReport.type == "LOST").count()
    total_found = db.query(ItemReport).filter(ItemReport.type == "FOUND").count()
    resolved_count = db.query(ItemReport).filter(ItemReport.status == "RESOLVED").count()
    high_match_count = db.query(MatchResult).filter(MatchResult.total_score >= 75.0).count()
    total_matches = db.query(MatchResult).count()
    pending_claims = db.query(ClaimRequest).filter(ClaimRequest.status == "PENDING").count()

    return {
        "total_lost": total_lost,
        "total_found": total_found,
        "total_reports": total_lost + total_found,
        "resolved_items": resolved_count,
        "high_confidence_matches": high_match_count,
        "total_matches": total_matches,
        "pending_claims": pending_claims,
    }


@router.post("/recompute-all")
def recompute_all_matches(db: Session = Depends(get_db)):
    """Recomputes similarity across all open lost and found pairs."""
    lost_items = db.query(ItemReport).filter(ItemReport.type == "LOST").all()
    total_generated = 0
    for lost in lost_items:
        matches = compute_all_matches_for_item(lost, db, threshold=40.0)
        total_generated += len(matches)
    return {"success": True, "recomputed_pairs": total_generated}


@router.post("/clear")
def clear_all_records(db: Session = Depends(get_db)):
    """Deletes all items, matches, and claims for a clean real-time database state."""
    db.query(ClaimRequest).delete()
    db.query(MatchResult).delete()
    db.query(ItemReport).delete()
    db.commit()
    return {"success": True, "message": "All database records purged"}

