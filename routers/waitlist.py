from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.orm import Session
from database import get_db
from models import WaitlistEntry
import uuid
import os
import requests
from datetime import datetime

router = APIRouter()

ADMIN_SECRET = os.environ.get("ADMIN_SECRET")
RESEND_API_KEY = os.environ.get("RESEND_API_KEY")
FROM_EMAIL = "The Executive <onboarding@theexecutive.app>"


class WaitlistJoinRequest(BaseModel):
    email: str
    tiktok_handle: Optional[str] = None


@router.post("/join")
async def join_waitlist(request: WaitlistJoinRequest, db: Session = Depends(get_db)):
    email = request.email.strip().lower()
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Enter a valid email.")

    existing = db.query(WaitlistEntry).filter(WaitlistEntry.email == email).first()
    if existing:
        return {"success": True, "already_on_list": True}

    entry = WaitlistEntry(
        id=str(uuid.uuid4()),
        email=email,
        tiktok_handle=request.tiktok_handle.strip() if request.tiktok_handle else None,
        status="waiting",
        created_at=datetime.utcnow(),
    )
    db.add(entry)
    db.commit()
    return {"success": True, "already_on_list": False}


def send_invite_email(to_email: str):
    if not RESEND_API_KEY:
        print("RESEND_API_KEY not set, skipping invite email send")
        return
    try:
        requests.post(
            "https://api.resend.com/emails",
            headers={"Authorization": f"Bearer {RESEND_API_KEY}"},
            json={
                "from": FROM_EMAIL,
                "to": [to_email],
                "subject": "You're in. The Executive is ready for you.",
                "html": (
                    "<p>Your spot just opened up.</p>"
                    "<p><a href='https://theexecutive.app'>Enter the Boardroom &rarr;</a></p>"
                    "<p>Your 14-day free trial starts the moment you sign up.</p>"
                ),
            },
            timeout=10,
        )
    except Exception as e:
        print(f"Failed to send invite email to {to_email}: {e}")


class InviteRequest(BaseModel):
    emails: Optional[List[str]] = None
    count: Optional[int] = None


@router.post("/admin/invite")
async def invite_batch(request: InviteRequest, secret: str = Query(...), db: Session = Depends(get_db)):
    if not ADMIN_SECRET or secret != ADMIN_SECRET:
        raise HTTPException(status_code=403, detail="Not authorized.")

    if request.emails:
        entries = db.query(WaitlistEntry).filter(
            WaitlistEntry.email.in_([e.strip().lower() for e in request.emails]),
            WaitlistEntry.status == "waiting"
        ).all()
    elif request.count:
        entries = (
            db.query(WaitlistEntry)
            .filter(WaitlistEntry.status == "waiting")
            .order_by(WaitlistEntry.created_at.asc())
            .limit(request.count)
            .all()
        )
    else:
        raise HTTPException(status_code=400, detail="Provide either emails or count.")

    invited = []
    for entry in entries:
        send_invite_email(entry.email)
        entry.status = "invited"
        entry.invited_at = datetime.utcnow()
        invited.append(entry.email)

    db.commit()
    return {"invited": invited, "count": len(invited)}


@router.get("/admin/list")
async def list_waitlist(secret: str = Query(...), status: Optional[str] = None, db: Session = Depends(get_db)):
    if not ADMIN_SECRET or secret != ADMIN_SECRET:
        raise HTTPException(status_code=403, detail="Not authorized.")

    query = db.query(WaitlistEntry)
    if status:
        query = query.filter(WaitlistEntry.status == status)
    entries = query.order_by(WaitlistEntry.created_at.asc()).all()

    return {
        "count": len(entries),
        "entries": [
            {
                "email": e.email,
                "tiktok_handle": e.tiktok_handle,
                "status": e.status,
                "created_at": e.created_at.isoformat() if e.created_at else None,
                "invited_at": e.invited_at.isoformat() if e.invited_at else None,
            }
            for e in entries
        ],
    }