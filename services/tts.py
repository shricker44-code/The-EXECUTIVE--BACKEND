import os
import requests
import base64
import re

def _chunk_text(text: str, max_chars: int = 1600) -> list[str]:
    sentences = re.split(r'(?<=[.!?])\s+', text)
    chunks = []
    current = ""
    for sentence in sentences:
        if len(current) + len(sentence) + 1 <= max_chars:
            current = f"{current} {sentence}".strip()
        else:
            if current:
                chunks.append(current)
            current = sentence
    if current:
        chunks.append(current)
    return chunks

def _synthesize_chunk(text: str, voice_id: str, api_key: str) -> bytes:
    response = requests.post(
        "https://api.inworld.ai/tts/v1/voice",
        headers={
            "Authorization": f"Basic {api_key}",
            "Content-Type": "application/json",
        },
        json={
            "text": text,
            "voiceId": voice_id,
            "modelId": "inworld-tts-2",
        },
    )
    if not response.ok:
        raise Exception(f"Inworld TTS error {response.status_code}: {response.text}")
    data = response.json()
    return base64.b64decode(data["audioContent"])

def synthesize_speech(text: str, voice_preference: int = 1) -> str:
    api_key = os.environ.get("INWORLD_API_KEY")
    voice_id = os.environ.get("INWORLD_VOICE_ID")

    chunks = _chunk_text(text)
    audio_parts = [_synthesize_chunk(chunk, voice_id, api_key) for chunk in chunks]
    combined_audio = b"".join(audio_parts)

    return base64.b64encode(combined_audio).decode("utf-8")