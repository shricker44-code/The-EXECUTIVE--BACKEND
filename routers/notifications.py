from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime
from zoneinfo import ZoneInfo
from database import get_db
from models import User, Verdict
import os
import json
import random
from pywebpush import webpush, WebPushException

router = APIRouter()

VAPID_PRIVATE_KEY = os.environ.get("VAPID_PRIVATE_KEY")
VAPID_PUBLIC_KEY = os.environ.get("VAPID_PUBLIC_KEY")
VAPID_CLAIMS = {"sub": os.environ.get("VAPID_CLAIMS_EMAIL", "mailto:admin@theexecutive.app")}

CRON_SECRET = os.environ.get("CRON_SECRET")

# Fallback pool — used when a user has history but no clean pending/completed signal
DAILY_BRIEFINGS = [
    "Your competition posted 3 times yesterday. My office. Now.",
    "Engagement dropped? I warned you about consistency. Fix it today.",
    "The algorithm rewards the bold. What are you posting today?",
    "Winners show up every day. Are you showing up?",
    "Your hook is your handshake. Make it count today.",
    "3 seconds. That's all you get. Make today's content count.",
    "You're either growing or you're dying. Which is it today?",
]

ONBOARDING_NUDGES = [
    "Your boardroom seat is empty. Upload a screenshot of your analytics and let's see where you actually stand.",
    "You signed up. You haven't shown up. Upload your first screenshot — the boardroom is waiting.",
]

COMPLETED_CHECKINS = [
    "You executed. Good. Keep the momentum — post again and bring me the next screenshot.",
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


class PushStatusUpdate(BaseModel):
    user_id: str
    status: str  # "success" or "failed"


@router.post("/subscription-status")
async def update_subscription_status(request: PushStatusUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == request.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.push_subscription_status = request.status
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

def build_status_message(user, db) -> str | None:
    """
    Decides what to send (if anything) based on assignment status:
    - No verdict history at all -> onboarding nudge
    - Pending assignment, 2-3 days old -> named follow-up referencing the assignment
    - Recently completed (posted_after=True within last 3 days) -> skip
    - Otherwise -> fall back to the generic briefing pool
    Returns None to skip sending entirely.
    """
    last_verdict = (
        db.query(Verdict)
        .filter(Verdict.user_id == user.id)
        .order_by(Verdict.created_at.desc())
        .first()
    )

    if not last_verdict:
        return random.choice(ONBOARDING_NUDGES)

    days_since = (datetime.utcnow() - last_verdict.created_at).days
    has_assignment = last_verdict.assignment and last_verdict.assignment.lower() != "none"

    if has_assignment and last_verdict.posted_after is None:
        if 2 <= days_since <= 3:
            return (
                f"It's been {days_since} days since I gave you your assignment: {last_verdict.assignment}. "
                f"Upload your next screenshot and I'll show you if it's working."
            )
        return None

    if last_verdict.posted_after is True and days_since <= 3:
        return None

    return random.choice(DAILY_BRIEFINGS)


@router.post("/send-daily-briefings")
async def send_daily_briefings(secret: str, db: Session = Depends(get_db)):
    if secret != CRON_SECRET:
        raise HTTPException(status_code=403, detail="Forbidden")

    sent = []
    skipped = []
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
                message = build_status_message(user, db)

                if message is None:
                    skipped.append(user.id)
                    continue

                subscription = json.loads(user.push_subscription)
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

    return {"sent": sent, "skipped": skipped, "failed": failed}


@router.get("/vapid-key")
async def get_vapid_key():
    return {"public_key": VAPID_PUBLIC_KEY}