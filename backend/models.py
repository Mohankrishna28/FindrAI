import datetime
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, Date, ForeignKey, JSON
from sqlalchemy.orm import relationship
from backend.database import Base

class ItemReport(Base):
    __tablename__ = "item_reports"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(String(10), nullable=False, index=True) # "LOST" or "FOUND"
    title = Column(String(200), nullable=False, index=True)
    category = Column(String(50), nullable=False, index=True)
    brand = Column(String(100), nullable=True)
    color = Column(String(50), nullable=False)
    location = Column(String(200), nullable=False)
    date_lost_or_found = Column(Date, nullable=False)
    description = Column(Text, nullable=False)
    image_url = Column(String(500), nullable=True)
    text_embedding = Column(JSON, nullable=True) # Dense vector representation
    image_embedding = Column(JSON, nullable=True) # Dense vector representation (optional)
    status = Column(String(20), default="OPEN", index=True) # "OPEN", "CLAIM_PENDING", "RESOLVED"
    reporter_name = Column(String(100), nullable=True, default="Anonymous")
    reporter_contact = Column(String(150), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    lost_matches = relationship("MatchResult", foreign_keys="MatchResult.lost_item_id", back_populates="lost_item", cascade="all, delete-orphan")
    found_matches = relationship("MatchResult", foreign_keys="MatchResult.found_item_id", back_populates="found_item", cascade="all, delete-orphan")
    claims = relationship("ClaimRequest", back_populates="item", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "type": self.type,
            "title": self.title,
            "category": self.category,
            "brand": self.brand,
            "color": self.color,
            "location": self.location,
            "date_lost_or_found": self.date_lost_or_found.isoformat() if self.date_lost_or_found else None,
            "description": self.description,
            "image_url": self.image_url,
            "has_image": bool(self.image_url),
            "status": self.status,
            "reporter_name": self.reporter_name,
            "reporter_contact": self.reporter_contact,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

class MatchResult(Base):
    __tablename__ = "match_results"

    id = Column(Integer, primary_key=True, index=True)
    lost_item_id = Column(Integer, ForeignKey("item_reports.id"), nullable=False, index=True)
    found_item_id = Column(Integer, ForeignKey("item_reports.id"), nullable=False, index=True)
    total_score = Column(Float, nullable=False, index=True) # 0 to 100
    sub_scores = Column(JSON, nullable=False) # {desc, img, attr, loc, time, details}
    status = Column(String(20), default="SUGGESTED", index=True) # "SUGGESTED", "CONFIRMED", "REJECTED"
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    lost_item = relationship("ItemReport", foreign_keys=[lost_item_id], back_populates="lost_matches")
    found_item = relationship("ItemReport", foreign_keys=[found_item_id], back_populates="found_matches")
    claims = relationship("ClaimRequest", back_populates="match")

    def to_dict(self):
        return {
            "id": self.id,
            "lost_item_id": self.lost_item_id,
            "found_item_id": self.found_item_id,
            "lost_item": self.lost_item.to_dict() if self.lost_item else None,
            "found_item": self.found_item.to_dict() if self.found_item else None,
            "total_score": round(self.total_score, 1),
            "sub_scores": self.sub_scores,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

class ClaimRequest(Base):
    __tablename__ = "claim_requests"

    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("item_reports.id"), nullable=False, index=True)
    match_id = Column(Integer, ForeignKey("match_results.id"), nullable=True, index=True)
    claimant_name = Column(String(100), nullable=False)
    claimant_contact = Column(String(150), nullable=False)
    proof_description = Column(Text, nullable=False) # Identifying details, serial number, wallpaper, etc.
    admin_notes = Column(Text, nullable=True)
    status = Column(String(20), default="PENDING", index=True) # "PENDING", "APPROVED", "REJECTED"
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    item = relationship("ItemReport", back_populates="claims")
    match = relationship("MatchResult", back_populates="claims")

    def to_dict(self):
        return {
            "id": self.id,
            "item_id": self.item_id,
            "match_id": self.match_id,
            "item": self.item.to_dict() if self.item else None,
            "claimant_name": self.claimant_name,
            "claimant_contact": self.claimant_contact,
            "proof_description": self.proof_description,
            "admin_notes": self.admin_notes,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
