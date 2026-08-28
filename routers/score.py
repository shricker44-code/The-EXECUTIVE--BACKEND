from fastapi import APIRouter, Depends, Query
from typing import Optional
from sqlalchemy.orm import Session
from database import get_db
from models import User, Verdict, Account
from routers.chat import get_verdict_query
from services.scoring import compute_hooks_and_strategy_score, compute_consistency_score, compute_engagement_score

router = APIRouter()


@router.get("/{user_id}")
async def get_score(user_id: str, account_id: Optional[str] = Query(None), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return {"error": "User not found"}

    verdicts = (
        get_verdict_query(user, account_id, db)
        .order_by(Verdict.created_at.desc())
        .limit(10)
        .all()
    )

    if not verdicts:
        return {
            "total": 0,
            "consistency": 0,
            "hooks": 0,
            "engagement": 0,
            "strategy": 0,
            "label": "NO DATA YET",
        }

    snapshot_dates = [v.created_at for v in verdicts if v.follower_count_snapshot is not None or v.engagement_rate_snapshot is not None]
    latest_engagement = next((v.engagement_rate_snapshot for v in verdicts if v.engagement_rate_snapshot is not None), None)
    verdict_texts = [v.content for v in reversed(verdicts)]

    consistency = compute_consistency_score(snapshot_dates)
    engagement = compute_engagement_score(latest_engagement)
    hooks_strategy = await compute_hooks_and_strategy_score(verdict_texts)

    total = consistency + engagement + hooks_strategy["hooks"] + hooks_strategy["strategy"]

    labels = [(90, 'BOARDROOM ELITE'), (75, 'EXECUTIVE TIER'), (60, 'JUNIOR EXEC'), (40, 'NEEDS WORK'), (0, "YOU'RE FIRED")]
    label = next(l[1] for l in labels if total >= l[0])

    return {
        "total": total,
        "consistency": consistency,
        "hooks": hooks_strategy["hooks"],
        "engagement": engagement,
        "strategy": hooks_strategy["strategy"],
        "label": label,
    }