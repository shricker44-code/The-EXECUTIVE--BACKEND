import os
from elevenlabs.client import ElevenLabs
import base64

def synthesize_speech(text: str, voice_preference: int = 1) -> str:
    client = ElevenLabs(api_key=os.environ.get("ELEVENLABS_API_KEY"))

    voice_id = os.environ.get("ELEVENLABS_VOICE_ID")

    audio_generator = client.text_to_speech.convert(
        voice_id=voice_id,
        text=text,
        model_id="eleven_multilingual_v2",
        voice_settings={
            "stability": 0.5,
            "similarity_boost": 0.75,
            "style": 0.3,
            "speed": 0.92,
        },
    )

    audio_bytes = b"".join(audio_generator)
    audio_base64 = base64.b64encode(audio_bytes).decode("utf-8")
    return audio_base64