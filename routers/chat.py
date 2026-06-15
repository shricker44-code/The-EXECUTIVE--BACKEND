from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
from services.claude import get_executive_response

router = APIRouter()

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]

@router.post("/")
async def chat(request: ChatRequest):
    messages = [m.dict() for m in request.messages]
    reply = await get_executive_response(messages)
    return {"reply": reply}