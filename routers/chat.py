from fastapi import APIRouter, Depends, Header
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.orm import Session
from database import get_db
from models import User, Verdict
from services.claude import get_executive_response, get_executive_response_stream
from middleware import (
    check_chat_limit, increment_chat_count,
    check_trial_message, get_cached_response, cache_response
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

    reply = await get_executive_response(messages)

    cache_response(last_message, reply, db)

    increment_chat_count(user, db)

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

    return {"reply": reply, "limited": False}


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

    async def generate():
        full_reply = ""
        async for chunk in get_executive_response_stream(messages):
            full_reply += chunk
            yield chunk

        cache_response(last_message, full_reply, db)
        increment_chat_count(user, db)

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
from models import ChatSession
from datetime import date as date_type

@router.get("/session-status/{user_id}")
async def session_status(user_id: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return {"unlimited": False, "seconds_remaining": 0}

    if user.is_paid:
        return {"unlimited": True, "seconds_remaining": None}

    today = str(date_type.today())
    session = db.query(ChatSession).filter(
        ChatSession.user_id == user_id,
        ChatSession.date == today
    ).first()

    if not session or not session.session_start:
        return {"unlimited": False, "seconds_remaining": 600, "started": False}

    elapsed = (datetime.utcnow() - session.session_start).total_seconds()
    remaining = max(0, 600 - elapsed)

    return {"unlimited": False, "seconds_remaining": round(remaining), "started": True}