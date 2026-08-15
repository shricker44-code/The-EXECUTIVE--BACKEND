from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db
from models import User
import os
import json
from pywebpush import webpush, WebPushException

router = APIRouter()

VAPID_PRIVATE_KEY = os.environ.get("VAPID_PRIVATE_KEY")
VAPID_PUBLIC_KEY = os.environ.get("VAPID_PUBLIC_KEY")
VAPID_CLAIMS = {"sub": os.environ.get("VAPID_CLAIMS_EMAIL", "mailto:admin@theexecutive.app")}

DAILY_BRIEFINGS = [
    "Your competition posted 3 times yesterday. My office. Now.",
    "Engagement dropped? I warned you about consistency. Fix it today.",
    "The algorithm rewards the bold. What are you posting today?",
    "Winners show up every day. Are you showing up?",
    "Your hook is your handshake. Make it count today.",
    "3 seconds. That's all you get. Make today's content count.",
    "You're either growing or you're dying. Which is it today?",
]

class PushSubscription(BaseModel):
    user_id: str
    subscription: dict

class SendNotificationRequest(BaseModel):
    user_id: str
    title: str
    body: str

@router.post("/subscribe")
async def subscribe(request: PushSubscription, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == request.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Store subscription in user record
    import json
    user.device_fingerprint = json.dumps(request.subscription)
    db.commit()
    
    return {"success": True}

@router.post("/send")
async def send_notification(request: SendNotificationRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == request.user_id).first()
    if not user or not user.device_fingerprint:
        raise HTTPException(status_code=404, detail="No subscription found")

    try:
        subscription = json.loads(user.device_fingerprint)
        webpush(
            subscription_info=subscription,
            data=json.dumps({"title": request.title, "body": request.body}),
            vapid_private_key=VAPID_PRIVATE_KEY,
            vapid_claims=VAPID_CLAIMS,
        )
        return {"success": True}
    except WebPushException as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/vapid-key")
async def get_vapid_key():
    return {"public_key": VAPID_PUBLIC_KEY}