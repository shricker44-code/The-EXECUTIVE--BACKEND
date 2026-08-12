from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import User
from middleware import check_trial_message, get_trial_day
from pydantic import BaseModel

router = APIRouter()

class TrialStatusRequest(BaseModel):
    user_id: str

@router.post("/status")
async def get_trial_status(request: TrialStatusRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == request.user_id).first()

    if not user:
        return {"error": "User not found"}

    trial_day = get_trial_day(user)
    trial_message = check_trial_message(user)
    days_remaining = max(0, 14 - trial_day)

    return {
        "trial_day": trial_day,
        "days_remaining": days_remaining,
        "trial_active": user.trial_active,
        "is_paid": user.is_paid,
        "trial_message": trial_message,
        "should_convert": trial_day >= 3 and not user.is_paid,
    }