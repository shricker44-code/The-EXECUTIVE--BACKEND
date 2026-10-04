from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from database import get_db
from models import User

router = APIRouter()

# Keep these option sets in sync with the PWA's questionnaire screen
# (js/main.js QUESTIONNAIRE_OPTIONS). They're not enforced strictly server-side
# (free-text "Other" on niche is allowed) but every other chip answer should
# match one of these values so the system-prompt context stays clean.
CONTENT_STYLE_OPTIONS = {
    "funny_meme", "raw_relatable", "polished_aesthetic", "educational_expert", "high_energy_motivational"
}
BIGGEST_CHALLENGE_OPTIONS = {
    "views_not_growing", "dont_know_what_to_post", "engagement_low", "cant_stay_consistent", "just_starting_out"
}
GOAL_OPTIONS = {
    "follower_milestone", "go_viral_once", "build_personal_brand", "get_sponsorships", "just_having_fun"
}


class QuestionnaireSubmission(BaseModel):
    user_id: str
    tiktok_username: str
    niche: str
    content_style: str
    biggest_challenge: str
    goal: str


@router.get("/status")
async def get_questionnaire_status(user_id: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return {"completed": False, "error": "User not found"}
    return {
        "completed": bool(user.questionnaire_completed),
        "tiktok_username": user.tiktok_username,
        "niche": user.niche,
        "content_style": user.content_style,
        "biggest_challenge": user.biggest_challenge,
        "goal": user.goal,
        "posting_frequency": user.posting_frequency,
    }


@router.post("/submit")
async def submit_questionnaire(payload: QuestionnaireSubmission, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == payload.user_id).first()
    if not user:
        return {"success": False, "detail": "User not found"}

    tiktok_username = payload.tiktok_username.strip().lstrip("@")
    if not tiktok_username:
        return {"success": False, "detail": "TikTok handle is required."}

    niche = payload.niche.strip()
    if not niche:
        return {"success": False, "detail": "Niche is required."}

    if not payload.content_style or not payload.biggest_challenge or not payload.goal:
        return {"success": False, "detail": "All questions are required."}

    user.tiktok_username = tiktok_username
    user.niche = niche
    user.content_style = payload.content_style
    user.biggest_challenge = payload.biggest_challenge
    user.goal = payload.goal
    user.questionnaire_completed = True
    db.commit()

    return {
        "success": True,
        "questionnaire_completed": True,
        "tiktok_username": user.tiktok_username,
        "niche": user.niche,
        "content_style": user.content_style,
        "biggest_challenge": user.biggest_challenge,
        "goal": user.goal,
        "posting_frequency": user.posting_frequency,
    }