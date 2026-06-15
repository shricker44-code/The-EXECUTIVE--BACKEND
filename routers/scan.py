from fastapi import APIRouter, UploadFile, File, Form
from typing import Optional
from services.scanner import scan_content

router = APIRouter()

@router.post("/")
async def scan(
    tiktok_url: Optional[str] = Form(None),
    manual_input: Optional[str] = Form(None),
    screenshot: Optional[UploadFile] = File(None),
):
    result = await scan_content(
        tiktok_url=tiktok_url,
        manual_input=manual_input,
        screenshot=screenshot,
    )
    return {"verdict": result}