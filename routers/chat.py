from fastapi import APIRouter, Depends, Header
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.orm import Session
from database import get_db
from models import User, Verdict
from services.claude import get_executive_response, get_executive_response_stream
from services.tts import synthesize_speech
from middleware import (
    check_chat_limit, increment_chat_count,
    check_trial_message, get_cached_response, cache_response,
    get_model_for_user
)
import uuid
from datetime import datetime

router = APIRouter()

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

    cached = get_cached_response(last_message, db)
    if cached:
        return {"reply": cached, "cached": True}

    model = get_model_for_user(user)
    print(f"MODEL LOG: user={user.id} model={model} timestamp={datetime.utcnow().isoformat()}")

    history_summary = build_history_summary(user, db)

    reply, tokens_used = await get_executive_response(messages, model=model, history_summary=history_summary)

    cache_response(last_message, reply, db)

    increment_chat_count(user, db, tokens_used=tokens_used)

    trial_message = check_trial_message(user)
    if trial_message:
        reply = f"{reply}\n\n---\n{trial_message}"

    verdict = Verdict(
        id=str(uuid.uuid4()),
        user_id=user.id,
        content=reply,
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

    cached = get_cached_response(last_message, db)
    if cached:
        def cached_gen():
            yield cached
        return StreamingResponse(cached_gen(), media_type="text/plain")

    model = get_model_for_user(user)
    print(f"MODEL LOG: user={user.id} model={model} timestamp={datetime.utcnow().isoformat()}")

    history_summary = build_history_summary(user, db)

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

        verdict = Verdict(
            id=str(uuid.uuid4()),
            user_id=user.id,
            content=final_reply,
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