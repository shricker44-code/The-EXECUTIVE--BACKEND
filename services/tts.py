import os
import requests
import base64

def synthesize_speech(text: str, voice_preference: int = 1) -> str:
    api_key = os.environ.get("INWORLD_API_KEY")
    voice_id = os.environ.get("INWORLD_VOICE_ID")

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

    response.raise_for_status()
    data = response.json()
    return data["audioContent"]