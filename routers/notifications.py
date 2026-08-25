from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime
from zoneinfo import ZoneInfo
from database import get_db
from models import User
import os
import json
import random
from pywebpush import webpush, WebPushException

router = APIRouter()

VAPID_PRIVATE_KEY = os.environ.get("VAPID_PRIVATE_KEY")
VAPID_PUBLIC_KEY = os.environ.get("VAPID_PUBLIC_KEY")
VAPID_CLAIMS = {"sub": os.environ.get("VAPID_CLAIMS_EMAIL", "mailto:admin@theexecutive.app")}

CRON_SECRET = os.environ.get("CRON_SECRET")

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


class SetCheckInTime(BaseModel):
    user_id: str
    daily_report_time: str
    timezone: str


@router.post("/subscribe")
async def subscribe(request: PushSubscription, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == request.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.push_subscription = json.dumps(request.subscription)
    db.commit()

    return {"success": True}


@router.post("/set-checkin-time")
async def set_checkin_time(request: SetCheckInTime, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == request.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    try:
        ZoneInfo(request.timezone)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid timezone")

    user.daily_report_time = request.daily_report_time
    user.timezone = request.timezone
    db.commit()

    return {"success": True}


@router.post("/send")
async def send_notification(request: SendNotificationRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == request.user_id).first()
    if not user or not user.push_subscription:
        raise HTTPException(status_code=404, detail="No subscription found")

    try:
        subscription = json.loads(user.push_subscription)
        webpush(
            subscription_info=subscription,
            data=json.dumps({"title": request.title, "body": request.body}),
            vapid_private_key=VAPID_PRIVATE_KEY,
            vapid_claims=VAPID_CLAIMS,
        )
        return {"success": True}
    except WebPushException as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/send-daily-briefings")
async def send_daily_briefings(secret: str, db: Session = Depends(get_db)):
    if secret != CRON_SECRET:
        raise HTTPException(status_code=403, detail="Forbidden")

    sent = []
    failed = []

    users = db.query(User).filter(
        User.push_subscription.isnot(None),
        User.daily_report_time.isnot(None),
        User.timezone.isnot(None),
    ).all()

    for user in users:
        try:
            local_now = datetime.now(ZoneInfo(user.timezone))
            target_hour, target_minute = map(int, user.daily_report_time.split(":"))
            target_total = target_hour * 60 + target_minute
            current_total = local_now.hour * 60 + local_now.minute

            if 0 <= (target_total - current_total) < 15:
                subscription = json.loads(user.push_subscription)
                message = random.choice(DAILY_BRIEFINGS)
                webpush(
                    subscription_info=subscription,
                    data=json.dumps({"title": "THE EXECUTIVE", "body": message}),
                    vapid_private_key=VAPID_PRIVATE_KEY,
                    vapid_claims=VAPID_CLAIMS,
                )
                sent.append(user.id)
        except WebPushException as e:
            failed.append({"user_id": user.id, "error": str(e)})
        except Exception as e:
            failed.append({"user_id": user.id, "error": str(e)})

    return {"sent": sent, "failed": failed}


@router.get("/vapid-key")
async def get_vapid_key():
    return {"public_key": VAPID_PUBLIC_KEY}