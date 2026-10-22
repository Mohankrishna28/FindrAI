import os
import shutil
import uuid
from datetime import datetime, date
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc

from backend.database import get_db
from backend.models import ItemReport, MatchResult, ClaimRequest
from backend.matcher import get_text_embedding, get_image_embedding, compute_all_matches_for_item, evaluate_match

router = APIRouter(prefix="/api")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if os.environ.get("VERCEL"):
    UPLOAD_DIR = "/tmp/uploads"
else:
    UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.get("/health")
def health_check():
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}


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

    # Handle image upload if provided
    image_rel_path = None
    image_emb = None
    if image and image.filename:
        ext = os.path.splitext(image.filename)[1].lower() or ".jpg"
        filename = f"{uuid.uuid4().hex}{ext}"
        save_path = os.path.join(UPLOAD_DIR, filename)

        with open(save_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)

        image_rel_path = f"/uploads/{filename}"
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


@router.patch("/items/{item_id}/status")
def update_item_status(item_id: int, payload: dict, db: Session = Depends(get_db)):
    item = db.query(ItemReport).filter(ItemReport.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    new_status = payload.get("status", "").upper()
    if new_status not in ["OPEN", "CLAIM_PENDING", "RESOLVED"]:
        raise HTTPException(status_code=400, detail="Invalid status")

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

