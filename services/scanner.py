import os
import json
import base64
import random
import anthropic
from typing import Optional
from fastapi import UploadFile
from services.claude import SYSTEM_PROMPT_EN as SYSTEM_PROMPT

EXTRACTION_PROMPT = """Look at this TikTok analytics screenshot. Extract ONLY these numbers if visible:
- follower_count (as a plain integer, no commas or symbols)
- engagement_rate (as a plain number representing a percentage, e.g. 4.2 for 4.2%)
- watch_time (average watch time as a percentage, e.g. 62.5 for 62.5% average watch time — NOT total watch time hours)
- completion_rate (video completion rate as a percentage, e.g. 45.0)
- profile_visits (as a plain integer)

Respond with ONLY a JSON object in this exact format, nothing else, no markdown, no explanation:
{"follower_count": <integer or null>, "engagement_rate": <number or null>, "watch_time": <number or null>, "completion_rate": <number or null>, "profile_visits": <integer or null>}

If a number isn't visible or determinable, use null for that field."""

SEARCH_INSIGHTS_EXTRACTION_PROMPT = """Look at this screenshot from TikTok's Search Insights / Content Gap page. It shows keywords or topics people are searching for related to the creator's niche, usually paired with a demand or competition signal (e.g. "High search, low competition", or a specific number).

List every distinct topic or keyword visible, with whatever signal appears next to it. One per line, plain text, no markdown, in this format:
topic — signal

If this screenshot does not show search/keyword data, respond with exactly: NO_INSIGHTS_FOUND"""

NOTHING_CHANGED_MESSAGES = [
    "Nothing has changed since your last check-in. Go execute your assignment. Come back when the numbers move.",
    "Same numbers as last time. I already gave you your assignment. Execute it, then come back with proof it worked.",
    "These numbers are identical to your last upload. That tells me one thing — you haven't done the work yet. Go do it.",
]


async def extract_analytics_numbers(image_data: bytes, media_type: str) -> tuple[dict, int]:
    client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))
    b64_image = base64.standard_b64encode(image_data).decode("utf-8")

    response = client.messages.create(
        model="claude-sonnet-5",
        max_tokens=200,
        messages=[{
            "role": "user",
            "content": [
                {"type": "image", "source": {"type": "base64", "media_type": media_type, "data": b64_image}},
                {"type": "text", "text": EXTRACTION_PROMPT}
            ],
        }],
    )

    tokens = response.usage.input_tokens + response.usage.output_tokens

    raw = response.content[0].text.strip()
    try:
        data = json.loads(raw)
        return {
            "follower_count": data.get("follower_count"),
            "engagement_rate": data.get("engagement_rate"),
            "watch_time": data.get("watch_time"),
            "completion_rate": data.get("completion_rate"),
            "profile_visits": data.get("profile_visits"),
        }, tokens
    except (json.JSONDecodeError, AttributeError):
        return {
            "follower_count": None, "engagement_rate": None,
            "watch_time": None, "completion_rate": None, "profile_visits": None,
        }, tokens


async def extract_search_insights(image_data: bytes, media_type: str) -> tuple[Optional[str], int]:
    client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))
    b64_image = base64.standard_b64encode(image_data).decode("utf-8")

    response = client.messages.create(
        model="claude-sonnet-5",
        max_tokens=400,
        messages=[{
            "role": "user",
            "content": [
                {"type": "image", "source": {"type": "base64", "media_type": media_type, "data": b64_image}},
                {"type": "text", "text": SEARCH_INSIGHTS_EXTRACTION_PROMPT}
            ],
        }],
    )

    tokens = response.usage.input_tokens + response.usage.output_tokens
    raw = response.content[0].text.strip()

    if raw == "NO_INSIGHTS_FOUND":
        return None, tokens
    return raw, tokens


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
    screenshot_type: str = "analytics",
    record=None,
    db=None,
    extra_context: str = "",
) -> tuple[str, Optional[dict], int, Optional[str]]:
    client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))
    messages = []
    extracted_numbers = None
    search_insights_result = None
    total_tokens = 0

    if tiktok_url:
        prompt = f"""Scan this TikTok profile/video and deliver your boardroom verdict.
URL submitted: {tiktok_url}

Analyze what you can determine about this creator strategy and deliver a full Executive verdict.
What is working. What is dead weight. What needs to change. Now."""
        messages.append({"role": "user", "content": prompt})

    elif screenshot:
        image_data = await screenshot.read()
        media_type = screenshot.content_type or "image/jpeg"

        if screenshot_type == "search_insights":
            insights_text, extraction_tokens = await extract_search_insights(image_data, media_type)
            total_tokens += extraction_tokens
            search_insights_result = insights_text

            b64_image = base64.standard_b64encode(image_data).decode("utf-8")
            insights_summary = insights_text if insights_text else "No clear topics could be read from this screenshot."
            messages.append({
                "role": "user",
                "content": [
                    {"type": "image", "source": {"type": "base64", "media_type": media_type, "data": b64_image}},
                    {"type": "text", "text": f"""This is a screenshot of my TikTok Search Insights / Content Gap page. Here is what was extracted from it:

{insights_summary}

Based on these real search opportunities — not generic keyword guesses — tell me which specific topics I should make content about right now, why each is a real opportunity for my account specifically, and how to frame the hook for at least one of them. Be specific and reference the actual topics shown, not generic advice."""}
                ],
            })

        else:
            if record is not None and db is not None:
                new_numbers, extraction_tokens = await extract_analytics_numbers(image_data, media_type)
                total_tokens += extraction_tokens

                if is_unchanged(new_numbers, record.last_follower_count, record.last_engagement_rate):
                    return random.choice(NOTHING_CHANGED_MESSAGES), None, total_tokens, None

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
        return "No content submitted. The Executive does not work with nothing. Give me something to analyze.", None, 0, None

    system = SYSTEM_PROMPT
    if extra_context:
        system += f"\n\n{extra_context}"

    response = client.messages.create(
        model="claude-opus-4-8",
        max_tokens=1024,
        system=system,
        messages=messages,
    )
    total_tokens += response.usage.input_tokens + response.usage.output_tokens
    return response.content[0].text, extracted_numbers, total_tokens, search_insights_result