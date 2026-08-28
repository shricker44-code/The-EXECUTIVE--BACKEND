import os
import json
import anthropic
from datetime import datetime, timedelta

SCORING_SYSTEM_PROMPT = """You are scoring a TikTok creator's HOOKS and STRATEGY based on their recent verdict history from The Executive. Score each from 0-25 based on the substance of what's in the verdicts — recurring problems named across multiple verdicts should lower the score, real improvement referenced should raise it.

Respond with ONLY a JSON object, nothing else:
{"hooks": <integer 0-25>, "strategy": <integer 0-25>}
"""


async def compute_hooks_and_strategy_score(verdict_texts: list[str]) -> dict:
    if not verdict_texts:
        return {"hooks": 0, "strategy": 0}

    client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))
    combined = "\n\n---\n\n".join(verdict_texts[-5:])

    response = client.messages.create(
        model="claude-sonnet-5",
        max_tokens=100,
        system=SCORING_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": f"Recent verdicts:\n\n{combined}"}],
    )

    try:
        data = json.loads(response.content[0].text.strip())
        return {
            "hooks": max(0, min(25, int(data.get("hooks", 0)))),
            "strategy": max(0, min(25, int(data.get("strategy", 0)))),
        }
    except (json.JSONDecodeError, ValueError, TypeError):
        return {"hooks": 0, "strategy": 0}


def compute_consistency_score(snapshot_dates: list[datetime]) -> int:
    """Scores check-in cadence over the last 14 days against the 3-5x/week ideal (6-10 check-ins)."""
    if not snapshot_dates:
        return 0
    cutoff = datetime.utcnow() - timedelta(days=14)
    recent = [d for d in snapshot_dates if d >= cutoff]
    count = len(recent)
    target = 8  # midpoint of 3-5x/week over 2 weeks
    ratio = min(count / target, 1.0)
    return round(ratio * 25)


def compute_engagement_score(engagement_rate: float) -> int:
    """Scores latest engagement rate against the 4.25% platform average."""
    if engagement_rate is None:
        return 0
    PLATFORM_AVG = 4.25
    ratio = min(engagement_rate / PLATFORM_AVG, 1.5)  # cap so 1.5x avg = full score
    return round(min(ratio / 1.5 * 25, 25))