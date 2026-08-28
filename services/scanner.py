import os
import json
import base64
import random
import anthropic
from typing import Optional
from fastapi import UploadFile
from services.claude import SYSTEM_PROMPT

EXTRACTION_PROMPT = """Look at this TikTok analytics screenshot. Extract ONLY these two numbers if visible:
- follower_count (as a plain integer, no commas or symbols)
- engagement_rate (as a plain number representing a percentage, e.g. 4.2 for 4.2%)

Respond with ONLY a JSON object in this exact format, nothing else, no markdown, no explanation:
{"follower_count": <integer or null>, "engagement_rate": <number or null>}

If a number isn't visible or determinable, use null for that field."""

NOTHING_CHANGED_MESSAGES = [
    "Nothing has changed since your last check-in. Go execute your assignment. Come back when the numbers move.",
    "Same numbers as last time. I already gave you your assignment. Execute it, then come back with proof it worked.",
    "These numbers are identical to your last upload. That tells me one thing — you haven't done the work yet. Go do it.",
]


async def extract_analytics_numbers(image_data: bytes, media_type: str) -> dict:
    client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))
    b64_image = base64.standard_b64encode(image_data).decode("utf-8")

    response = client.messages.create(
        model="claude-sonnet-5",
        max_tokens=150,
        messages=[{
            "role": "user",
            "content": [
                {"type": "image", "source": {"type": "base64", "media_type": media_type, "data": b64_image}},
                {"type": "text", "text": EXTRACTION_PROMPT}
            ],
        }],
    )

    raw = response.content[0].text.strip()
    try:
        data = json.loads(raw)
        return {
            "follower_count": data.get("follower_count"),
            "engagement_rate": data.get("engagement_rate"),
        }
    except (json.JSONDecodeError, AttributeError):
        return {"follower_count": None, "engagement_rate": None}


def is_unchanged(new_numbers: dict, last_follower_count, last_engagement_rate) -> bool:
    followers_match = (
        new_numbers.get("follower_count") is not None
        and last_follower_count is not None
        and new_numbers["follower_count"] == last_follower_count
    )
    engagement_match = (
        new_numbers.get("engagement_rate") is not None
        and last_engagement_rate is not None
        and abs(new_numbers["engagement_rate"] - last_engagement_rate) < 0.1
    )
    return followers_match and engagement_match


async def scan_content(
    tiktok_url: Optional[str] = None,
    manual_input: Optional[str] = None,
    screenshot: Optional[UploadFile] = None,
    record=None,
    db=None,
    extra_context: str = "",
) -> tuple[str, Optional[dict]]:
    client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))
    messages = []
    extracted_numbers = None

    if tiktok_url:
        prompt = f"""Scan this TikTok profile/video and deliver your boardroom verdict.
URL submitted: {tiktok_url}

Analyze what you can determine about this creator strategy and deliver a full Executive verdict.
What is working. What is dead weight. What needs to change. Now."""
        messages.append({"role": "user", "content": prompt})

    elif screenshot:
        image_data = await screenshot.read()
        media_type = screenshot.content_type or "image/jpeg"

        if record is not None and db is not None:
            new_numbers = await extract_analytics_numbers(image_data, media_type)

            if is_unchanged(new_numbers, record.last_follower_count, record.last_engagement_rate):
                return random.choice(NOTHING_CHANGED_MESSAGES), None

            if new_numbers.get("follower_count") is not None:
                record.last_follower_count = new_numbers["follower_count"]
            if new_numbers.get("engagement_rate") is not None:
                record.last_engagement_rate = new_numbers["engagement_rate"]
            db.commit()

            extracted_numbers = new_numbers

        b64_image = base64.standard_b64encode(image_data).decode("utf-8")
        messages.append({
            "role": "user",
            "content": [
                {"type": "image", "source": {"type": "base64", "media_type": media_type, "data": b64_image}},
                {"type": "text", "text": """This is a screenshot of my TikTok analytics page. Read every number visible in this screenshot precisely — follower count, total likes, engagement rate, watch time percentage, completion rate, profile visits, and any top-performing video data shown.

Extract and state the exact numbers you see before giving your verdict, so I know you actually read my data and did not guess. Then deliver your full boardroom verdict using those exact numbers per your specificity requirements. What is working. What is failing. What changes immediately."""}
            ],
        })

    elif manual_input:
        prompt = f"""A creator has submitted their account details manually. Scan this and deliver your boardroom verdict.

Creator Input:
{manual_input}

Analyze their strategy. Give a sharp, personalized Executive verdict.
What is working. What is dead weight. What needs to change. No fluff."""
        messages.append({"role": "user", "content": prompt})

    else:
        return "No content submitted. The Executive does not work with nothing. Give me something to analyze.", None

    system = SYSTEM_PROMPT
    if extra_context:
        system += f"\n\n{extra_context}"

    response = client.messages.create(
        model="claude-opus-4-8",
        max_tokens=1024,
        system=system,
        messages=messages,
    )
    return response.content[0].text, extracted_numbers