import os
import requests
import base64

def synthesize_speech(text: str, voice_preference: int = 1) -> str:
    api_key = os.environ.get("INWORLD_API_KEY")
    voice_id = os.environ.get("INWORLD_VOICE_ID")

    if len(text) > 1900:
        text = text[:1900].rsplit('.', 1)[0] + '.'

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
    return data["audioContent"]