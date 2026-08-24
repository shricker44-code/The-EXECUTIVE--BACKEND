import os
import base64
import anthropic
from typing import Optional
from fastapi import UploadFile
from services.claude import SYSTEM_PROMPT

async def scan_content(
    tiktok_url: Optional[str] = None,
    manual_input: Optional[str] = None,
    screenshot: Optional[UploadFile] = None,
) -> str:
    client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))
    messages = []

    if tiktok_url:
        prompt = f"""Scan this TikTok profile/video and deliver your boardroom verdict.
URL submitted: {tiktok_url}

Analyze what you can determine about this creator strategy and deliver a full Executive verdict.
What is working. What is dead weight. What needs to change. Now."""
        messages.append({"role": "user", "content": prompt})

    elif screenshot:
        image_data = await screenshot.read()
        b64_image = base64.standard_b64encode(image_data).decode("utf-8")
        media_type = screenshot.content_type or "image/jpeg"
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
        return "No content submitted. The Executive does not work with nothing. Give me something to analyze."

    response = client.messages.create(
        model="claude-opus-4-8",
        max_tokens=1024,
        system=SYSTEM_PROMPT,
        messages=messages,
    )
    return response.content[0].text