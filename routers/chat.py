from fastapi import APIRouter, Depends, Header
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.orm import Session
from database import get_db
from models import User, Verdict
from services.claude import get_executive_response
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

    if user:
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