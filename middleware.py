import os
import hashlib
from datetime import datetime, date
from sqlalchemy.orm import Session
from models import User, ChatSession, Verdict, ResponseCache
import uuid

FREE_MONTHLY_VERDICT_LIMIT = 3
FREE_SESSION_TOKEN_CAP = 15000  # raised from 1000 — system prompt alone can exceed the old cap
TRIAL_DURATION_DAYS = 14

THROTTLE_MESSAGE = "High demand on The Executive right now. Your next session will be available in a few hours. In the meantime review your last verdict and implement before we reconvene."

TRIAL_EXPIRED_MESSAGE = "Your fourteen days are up. That was plenty of time to prove you were serious. If you want back in my boardroom, upgrade. The door reopens the moment you do."

TRIAL_MESSAGES = {
    1: "You have 14 days. Every day you don't post is a day wasted. Your first assignment is due tomorrow. Come back after you've posted and we'll assess.",
    3: "You're making progress. Lock in your strategy before your trial ends — upgrade now and keep the momentum going.",
    12: "2 days left in your trial. Your Executive Score is moving. Don't lose this momentum — your strategy is just starting to compound."
}

def get_trial_day(user: User) -> int:
    if not user.trial_start_date:
        return 1
    delta = datetime.utcnow() - user.trial_start_date
    return delta.days + 1

def check_trial_expired(user: User) -> bool:
    if user.is_paid:
        return False
    return get_trial_day(user) > TRIAL_DURATION_DAYS

def get_model_for_user(user: User) -> str:
    return "claude-opus-4-8" if user.is_paid else "claude-sonnet-5"

def get_day7_message(user: User) -> str:
    freq = user.posting_frequency or "3x per week"
    try:
        posts_per_week = int(''.join(filter(str.isdigit, freq.split('x')[0])))
        expected = round((posts_per_week / 7) * 7)
    except:
        expected = 3
    return f"We're halfway through your trial. Based on your posting schedule, you should have {expected} posts live by now. If you're behind — that's your biggest problem, not your strategy. What's stopping you?"

def check_trial_message(user: User) -> str | None:
    if user.is_paid:
        return None

    trial_day = get_trial_day(user)
    if trial_day == 7:
        return get_day7_message(user)
    return TRIAL_MESSAGES.get(trial_day)

def check_chat_limit(user: User, db: Session) -> tuple[bool, str | None]:
    if user.is_paid:
        return True, None

    if check_trial_expired(user):
        return False, TRIAL_EXPIRED_MESSAGE

    today = str(date.today())
    session = db.query(ChatSession).filter(
        ChatSession.user_id == user.id,
        ChatSession.date == today
    ).first()

    spend_pct = get_api_spend_percentage()
    if spend_pct >= 75:
        return False, THROTTLE_MESSAGE

    if session and session.tokens_used >= FREE_SESSION_TOKEN_CAP:
        return False, "You have your verdict. You have your assignment. My time is valuable. Come back when it's done."

    return True, None

def increment_chat_count(user: User, db: Session, tokens_used: int = 0):
    today = str(date.today())
    session = db.query(ChatSession).filter(
        ChatSession.user_id == user.id,
        ChatSession.date == today
    ).first()

    if session:
        session.session_count += 1
        session.tokens_used += tokens_used
        if not session.session_start:
            session.session_start = datetime.utcnow()
    else:
        session = ChatSession(
            id=str(uuid.uuid4()),
            user_id=user.id,
            date=today,
            session_count=1,
            session_start=datetime.utcnow(),
            tokens_used=tokens_used,
        )
        db.add(session)
    db.commit()

def get_session_tokens_remaining(user: User, db: Session) -> int | None:
    if user.is_paid:
        return None

    today = str(date.today())
    session = db.query(ChatSession).filter(
        ChatSession.user_id == user.id,
        ChatSession.date == today
    ).first()

    if not session:
        return FREE_SESSION_TOKEN_CAP

    return max(0, FREE_SESSION_TOKEN_CAP - session.tokens_used)

def check_verdict_limit(user: User, db: Session) -> tuple[bool, str | None]:
    if user.is_paid:
        return True, None

    if check_trial_expired(user):
        return False, TRIAL_EXPIRED_MESSAGE

    month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0)
    verdict_count = db.query(Verdict).filter(
        Verdict.user_id == user.id,
        Verdict.created_at >= month_start
    ).count()

    if verdict_count >= FREE_MONTHLY_VERDICT_LIMIT:
        return False, "You've used your 3 monthly verdicts. Upgrade to The Executive Plan for unlimited verdicts — your strategy can't wait."

    return True, None

def get_cached_response(prompt: str, db: Session) -> str | None:
    prompt_hash = hashlib.md5(prompt.encode()).hexdigest()
    cached = db.query(ResponseCache).filter(
        ResponseCache.prompt_hash == prompt_hash
    ).first()
    if cached:
        cached.hit_count += 1
        db.commit()
        return cached.response
    return None

def cache_response(prompt: str, response: str, db: Session):
    prompt_hash = hashlib.md5(prompt.encode()).hexdigest()
    existing = db.query(ResponseCache).filter(
        ResponseCache.prompt_hash == prompt_hash
    ).first()
    if not existing:
        cache = ResponseCache(
            id=str(uuid.uuid4()),
            prompt_hash=prompt_hash,
            response=response,
            hit_count=0
        )
        db.add(cache)
        db.commit()

def get_api_spend_percentage() -> float:
    try:
        spend = float(os.environ.get("CURRENT_API_SPEND", "0"))
        cap = float(os.environ.get("API_SPEND_CAP", "1500"))
        return (spend / cap) * 100
    except:
        return 0.0

def is_session_valid(user: User, device_fingerprint: str) -> bool:
    if not user.session_token or not user.session_device:
        return True  # no session set yet, treat as valid
    return user.session_device == device_fingerprint