from fastapi import APIRouter, UploadFile, File, Form, Depends
from typing import Optional
from sqlalchemy.orm import Session
from database import get_db
from models import User, Verdict, Account
from services.scanner import scan_content
from middleware import check_verdict_limit
from routers.chat import get_verdict_query
import uuid
from datetime import datetime
from pydantic import BaseModel

router = APIRouter()

TREND_LIMIT = 6


def build_growth_trend(user, account_id, db, limit=TREND_LIMIT):
    snapshots = (
        get_verdict_query(user, account_id, db)
        .filter(Verdict.follower_count_snapshot.isnot(None))
        .order_by(Verdict.created_at.desc())
        .limit(limit)
        .all()
    )
    if len(snapshots) < 2:
        return ""

    snapshots = list(reversed(snapshots))

    def build_line(field, suffix=""):
        points = [v for v in snapshots if getattr(v, field) is not None]
        if not points:
            return None
        return " → ".join(
            f"{getattr(v, field):,}{suffix} ({v.created_at.strftime('%b %d')})"
            for v in points
        )

    lines = ["GROWTH TREND (real data, use this — do not estimate or guess trend direction):"]
    follower_line = build_line("follower_count_snapshot")
    if follower_line:
        lines.append(f"Follower count history: {follower_line}")
    engagement_line = build_line("engagement_rate_snapshot", "%")
    if engagement_line:
        lines.append(f"Engagement rate history: {engagement_line}")
    watch_time_line = build_line("watch_time_snapshot", "%")
    if watch_time_line:
        lines.append(f"Average watch time history: {watch_time_line}")
    completion_line = build_line("completion_rate_snapshot", "%")
    if completion_line:
        lines.append(f"Completion rate history: {completion_line}")
    visits_line = build_line("profile_visits_snapshot")
    if visits_line:
        lines.append(f"Profile visits history: {visits_line}")

    lines.append(
        "Reference this trend explicitly in your verdict — state whether the creator is actually growing, "
        "stalling, or declining based on these real numbers, not on how they feel about their progress."
    )
    return "\n".join(lines)


def build_assignment_outcome_context(user, account_id, db):
    last_actioned = (
        get_verdict_query(user, account_id, db)
        .filter(Verdict.assignment.isnot(None))
        .filter(Verdict.posted_after == True)
        .order_by(Verdict.created_at.desc())
        .first()
    )
    if not last_actioned:
        return ""

    baseline_bits = []
    if last_actioned.follower_count_snapshot is not None:
        baseline_bits.append(f"{last_actioned.follower_count_snapshot:,} followers")
    if last_actioned.engagement_rate_snapshot is not None:
        baseline_bits.append(f"{last_actioned.engagement_rate_snapshot}% engagement")
    if last_actioned.watch_time_snapshot is not None:
        baseline_bits.append(f"{last_actioned.watch_time_snapshot}% avg watch time")
    if last_actioned.completion_rate_snapshot is not None:
        baseline_bits.append(f"{last_actioned.completion_rate_snapshot}% completion rate")
    if last_actioned.profile_visits_snapshot is not None:
        baseline_bits.append(f"{last_actioned.profile_visits_snapshot:,} profile visits")

    if not baseline_bits:
        return ""

    baseline_str = ", ".join(baseline_bits)

    return (
        f"ASSIGNMENT OUTCOME CHECK: The creator's last assignment was: \"{last_actioned.assignment}\" — "
        f"they confirmed they completed it. Baseline metrics at the time of that assignment: {baseline_str}. "
        f"Compare the numbers you just read from their current screenshot against this baseline — specifically "
        f"whichever metric the assignment was actually targeting (e.g. a hook-framework assignment should be "
        f"judged primarily by completion rate or watch time, not follower count). "
        f"State explicitly and specifically whether the assignment worked — cite the actual before/after numbers. "
        f"If the numbers did not improve, say so plainly and directly, do not soften it, and pivot to a different "
        f"approach instead of repeating the same advice. This comparison should open your verdict, before anything "
        f"else — proving whether your last call was right matters more than anything else you say."
    )


@router.post("/")
async def scan(
    user_id: Optional[str] = Form(None),
    account_id: Optional[str] = Form(None),
    tiktok_url: Optional[str] = Form(None),
    manual_input: Optional[str] = Form(None),
    screenshot: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
):
    if not user_id:
        return {"verdict": "Please sign in to request a scan.", "limited": True}

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return {"verdict": "Account not found. Please sign in again.", "limited": True}

    allowed, limit_message = check_verdict_limit(user, db)
    if not allowed:
        return {"verdict": limit_message, "limited": True}

    account = None
    if account_id:
        account = db.query(Account).filter(Account.id == account_id, Account.user_id == user.id).first()
        if not account:
            return {"verdict": "That account could not be found on your profile.", "limited": True}

    record = account if account else user

    growth_trend = build_growth_trend(user, account_id, db)
    outcome_context = build_assignment_outcome_context(user, account_id, db)
    extra_context = "\n\n".join(filter(None, [growth_trend, outcome_context]))

    result, extracted_numbers, tokens_used = await scan_content(
        tiktok_url=tiktok_url,
        manual_input=manual_input,
        screenshot=screenshot,
        record=record,
        db=db,
        extra_context=extra_context,
    )

    verdict = Verdict(
        id=str(uuid.uuid4()),
        user_id=user.id,
        account_id=account.id if account else None,
        content=result,
        follower_count_snapshot=extracted_numbers.get("follower_count") if extracted_numbers else None,
        engagement_rate_snapshot=extracted_numbers.get("engagement_rate") if extracted_numbers else None,
        watch_time_snapshot=extracted_numbers.get("watch_time") if extracted_numbers else None,
        completion_rate_snapshot=extracted_numbers.get("completion_rate") if extracted_numbers else None,
        profile_visits_snapshot=extracted_numbers.get("profile_visits") if extracted_numbers else None,
        created_at=datetime.utcnow()
    )
    db.add(verdict)

    if not user.is_paid:
        user.trial_tokens_used = (user.trial_tokens_used or 0) + tokens_used

    db.commit()

    return {"verdict": result, "limited": False}

class QuickScanRequest(BaseModel):
    niche: str
    followers: str
    views: str

@router.post("/quick")
async def quick_scan(request: QuickScanRequest):
    from services.claude import get_quick_scan_hook
    hook = await get_quick_scan_hook(request.niche, request.followers, request.views)
    return {"hook": hook}