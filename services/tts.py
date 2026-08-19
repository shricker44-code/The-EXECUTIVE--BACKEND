import os
from google.cloud import texttospeech
import base64

VOICES = {
    1: {"name": "en-US-Chirp3-HD-Charon", "gender": texttospeech.SsmlVoiceGender.MALE},
    2: {"name": "en-US-Chirp3-HD-Fenrir", "gender": texttospeech.SsmlVoiceGender.MALE},
    3: {"name": "en-US-Chirp3-HD-Orus", "gender": texttospeech.SsmlVoiceGender.MALE},
}

def synthesize_speech(text: str, voice_preference: int = 1) -> str:
    client = texttospeech.TextToSpeechClient()

    voice_config = VOICES.get(voice_preference, VOICES[1])

    synthesis_input = texttospeech.SynthesisInput(text=text)

    voice = texttospeech.VoiceSelectionParams(
        language_code="en-US",
        name=voice_config["name"],
        ssml_gender=voice_config["gender"],
    )

    audio_config = texttospeech.AudioConfig(
        audio_encoding=texttospeech.AudioEncoding.MP3,
    )

    response = client.synthesize_speech(
        input=synthesis_input, voice=voice, audio_config=audio_config
    )

    audio_base64 = base64.b64encode(response.audio_content).decode("utf-8")
    return audio_base64