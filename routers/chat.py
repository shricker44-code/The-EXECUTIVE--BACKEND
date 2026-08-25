from fastapi import APIRouter, Depends, Header
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.orm import Session
from database import get_db
from models import User, Verdict
from services.claude import get_executive_response, get_executive_response_stream, get_assignment_summary
from services.tts import synthesize_speech
from middleware import (
    check_chat_limit, increment_chat_count,
    check_trial_message, get_cached_response, cache_response,
    get_model_for_user
)
import uuid
from datetime import datetime

router = APIRouter()

GAP_THRESHOLD_DAYS = 5

POSTED_YES_PHRASE = "I posted since my last verdict."
POSTED_NO_PHRASE = "I haven't posted since my last verdict yet."


class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]
    user_id: Optional[str] = None


def build_history_summary(user, db, limit=5):
    past_verdicts = (
        db.query(Verdict)
        .filter(Verdict.user_id == user.id)
        .order_by(Verdict.created_at.desc())
        .limit(limit)
        .all()
    )
    if not past_verdicts:
        return ""

    lines = []
    for v in reversed(past_verdicts):
        date_str = v.created_at.strftime("%b %d")
        snippet = v.content[:200].replace("\n", " ")
        lines.append(f"[{date_str}] {snippet}...")
    return "\n".join(lines)


def handle_posted_after_update(last_message: str, user, db):
    """If the user just answered the posted/not-posted prompt, record it on their most recent verdict."""
    last_verdict = (
        db.query(Verdict)
        .filter(Verdict.user_id == user.id)
        .order_by(Verdict.created_at.desc())
        .first()
    )
    if not last_verdict:
        return

    if last_message.strip() == POSTED_YES_PHRASE:
        last_verdict.posted_after = True
        db.commit()
    elif last_message.strip() == POSTED_NO_PHRASE:
        last_verdict.posted_after = False
        db.commit()


def get_gap_context(user, db) -> str:
    """
    Returns a note for the system prompt when the user is returning after a
    meaningful gap (5+ days), optionally combined with a still-pending assignment.
    Returns "" when the gap is under threshold — no mention wanted on normal returns.
    """
    last_verdict = (
        db.query(Verdict)
        .filter(Verdict.user_id == user.id)
        .order_by(Verdict.created_at.desc())
        .first()
    )
    if not last_verdict:
        return ""

    days_since = (datetime.utcnow() - last_verdict.created_at).days
    if days_since < GAP_THRESHOLD_DAYS:
        return ""

    pending = last_verdict.assignment and last_verdict.assignment.lower() != "none" and last_verdict.posted_after is None

    if pending:
        return (
            f"TIME GAP NOTE: It has been {days_since} days since the creator's last session. "
            f"Their pending assignment from that session was: \"{last_verdict.assignment}\" — status unknown, never confirmed. "
            f"Acknowledge the time gap explicitly, matter-of-fact not scolding, AND check on that specific assignment in the same response — do not send two separate messages for this."
        )

    return (
        f"TIME GAP NOTE: It has been {days_since} days since the creator's last session. "
        f"Acknowledge this gap explicitly and matter-of-factly before addressing their new data — do not treat this as a blank-slate first session."
    )


@router.post("/")
async def chat(request: ChatRequest, db: Session = Depends(get_db)):
    user_id = request.user_id
    user = None

    if user_id:
        user = db.query(User).filter(User.id == user_id).first()

    if not user:
        return {"reply": "Please sign in to speak with The Executive.", "limited": True}

    allowed, limit_message = check_chat_limit(user, db)
    if not allowed:
        return {"reply": limit_message, "limited": True}

    messages = [m.dict() for m in request.messages]
    last_message = messages[-1]["content"] if messages else ""

    handle_posted_after_update(last_message, user, db)

    cached = get_cached_response(last_message, db)
    if cached:
        return {"reply": cached, "cached": True}

    model = get_model_for_user(user)
    print(f"MODEL LOG: user={user.id} model={model} timestamp={datetime.utcnow().isoformat()}")

    history_summary = build_history_summary(user, db)
    gap_context = get_gap_context(user, db)
    if gap_context:
        history_summary = f"{history_summary}\n\n{gap_context}" if history_summary else gap_context

    reply, tokens_used = await get_executive_response(messages, model=model, history_summary=history_summary)

    cache_response(last_message, reply, db)

    increment_chat_count(user, db, tokens_used=tokens_used)

    trial_message = check_trial_message(user)
    if trial_message:
        reply = f"{reply}\n\n---\n{trial_message}"

    try:
        assignment_summary = await get_assignment_summary(reply)
        if assignment_summary.lower() == "none":
            assignment_summary = None
    except Exception as e:
        print(f"Assignment extraction failed: {e}")
        assignment_summary = None

    verdict = Verdict(
        id=str(uuid.uuid4()),
        user_id=user.id,
        content=reply,
        assignment=assignment_summary,
        created_at=datetime.utcnow()
    )
    db.add(verdict)
    db.commit()

    audio_base64 = None
    if user.is_paid:
        try:
            audio_base64 = synthesize_speech(reply, user.voice_preference or 1)
        except Exception as e:
            print(f"TTS generation failed: {e}")

    return {"reply": reply, "limited": False, "audio": audio_base64}


@router.post("/stream")
async def chat_stream(request: ChatRequest, db: Session = Depends(get_db)):
    user_id = request.user_id
    user = None

    if user_id:
        user = db.query(User).filter(User.id == user_id).first()

    if not user:
        def error_gen():
            yield "Please sign in to speak with The Executive."
        return StreamingResponse(error_gen(), media_type="text/plain")

    allowed, limit_message = check_chat_limit(user, db)
    if not allowed:
        def limit_gen():
            yield limit_message
        return StreamingResponse(limit_gen(), media_type="text/plain")

    messages = [m.dict() for m in request.messages]
    last_message = messages[-1]["content"] if messages else ""

    handle_posted_after_update(last_message, user, db)

    cached = get_cached_response(last_message, db)
    if cached:
        def cached_gen():
            yield cached
        return StreamingResponse(cached_gen(), media_type="text/plain")

    model = get_model_for_user(user)
    print(f"MODEL LOG: user={user.id} model={model} timestamp={datetime.utcnow().isoformat()}")

    history_summary = build_history_summary(user, db)
    gap_context = get_gap_context(user, db)
    if gap_context:
        history_summary = f"{history_summary}\n\n{gap_context}" if history_summary else gap_context

    async def generate():
        full_reply = ""
        usage_tracker = {}
        async for chunk in get_executive_response_stream(messages, usage_tracker, model=model, history_summary=history_summary):
            full_reply += chunk
            yield chunk

        tokens_used = usage_tracker.get("tokens", 0)

        cache_response(last_message, full_reply, db)
        increment_chat_count(user, db, tokens_used=tokens_used)

        trial_message = check_trial_message(user)
        final_reply = full_reply
        if trial_message:
            final_reply = f"{full_reply}\n\n---\n{trial_message}"

        try:
            assignment_summary = await get_assignment_summary(final_reply)
            if assignment_summary.lower() == "none":
                assignment_summary = None
        except Exception as e:
            print(f"Assignment extraction failed: {e}")
            assignment_summary = None

        verdict = Verdict(
            id=str(uuid.uuid4()),
            user_id=user.id,
            content=final_reply,
            assignment=assignment_summary,
            created_at=datetime.utcnow()
        )
        db.add(verdict)
        db.commit()

        if trial_message:
            yield f"\n\n---\n{trial_message}"

    return StreamingResponse(generate(), media_type="text/plain")


class TTSRequest(BaseModel):
    text: str
    user_id: str

@router.post("/tts")
async def generate_tts(request: TTSRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == request.user_id).first()
    if not user or not user.is_paid:
        return {"audio": None, "error": "TTS is a paid feature"}

    try:
        audio_base64 = synthesize_speech(request.text, user.voice_preference or 1)
        return {"audio": audio_base64}
    except Exception as e:
        return {"audio": None, "error": str(e)}