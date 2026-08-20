from fastapi import APIRouter, UploadFile, File, Form, Depends
from typing import Optional
from sqlalchemy.orm import Session
from database import get_db
from models import User, Verdict
from services.scanner import scan_content
from middleware import check_verdict_limit
import uuid
from datetime import datetime
from pydantic import BaseModel

router = APIRouter()

@router.post("/")
async def scan(
    user_id: Optional[str] = Form(None),
    tiktok_url: Optional[str] = Form(None),
    manual_input: Optional[str] = Form(None),
    screenshot: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
):
    if not user_id:
        return {"verdict": "Please sign in to request a scan.", "limited": True}

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return {"verdict": "Account not found. Please sign in again.", "limited": True}

    allowed, limit_message = check_verdict_limit(user, db)
    if not allowed:
        return {"verdict": limit_message, "limited": True}

    result = await scan_content(
        tiktok_url=tiktok_url,
        manual_input=manual_input,
        screenshot=screenshot,
    )

    verdict = Verdict(
        id=str(uuid.uuid4()),
        user_id=user.id,
        content=result,
        created_at=datetime.utcnow()
    )
    db.add(verdict)
    db.commit()

    return {"verdict": result, "limited": False}

class QuickScanRequest(BaseModel):
    niche: str
    followers: str
    views: str

@router.post("/quick")
async def quick_scan(request: QuickScanRequest):
    from services.claude import get_quick_scan_hook
    hook = await get_quick_scan_hook(request.niche, request.followers, request.views)
    return {"hook": hook}