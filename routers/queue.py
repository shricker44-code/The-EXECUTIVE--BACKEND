from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from collections import deque
import asyncio
import time

router = APIRouter()

request_queue = deque()
MAX_QUEUE_SIZE = 100
RATE_WINDOW = 60
request_timestamps = []

def is_rate_limited() -> bool:
    now = time.time()
    global request_timestamps
    request_timestamps = [t for t in request_timestamps if now - t < RATE_WINDOW]
    if len(request_timestamps) >= MAX_QUEUE_SIZE:
        return True
    request_timestamps.append(now)
    return False

def get_queue_position() -> int:
    return len(request_queue)

@router.get("/status")
async def queue_status():
    return {
        "queue_size": len(request_queue),
        "max_queue_size": MAX_QUEUE_SIZE,
        "requests_last_minute": len(request_timestamps),
        "is_busy": is_rate_limited(),
    }