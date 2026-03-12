"""
Azure AI Speech service – convert narration text into spoken audio (MP3).
"""
import os
from pathlib import Path
import azure.cognitiveservices.speech as speechsdk
from dotenv import load_dotenv

load_dotenv()

SPEECH_KEY = os.getenv("AZURE_SPEECH_KEY")
SPEECH_REGION = os.getenv("AZURE_SPEECH_REGION")
# Default voice, can be changed (e.g., en-US-AvaMultilingualNeural, en-US-AndrewMultilingualNeural)
VOICE_NAME = os.getenv("AZURE_SPEECH_VOICE")


def generate_narration_audio(narration_text: str, output_path: Path = None) -> Path:
    """Generate spoken narration audio from text using Azure AI Speech.

    Args:
        narration_text: The narration script to convert to speech.
        output_path:    Where to save the MP3 file. Defaults to static/audio/narration.mp3.

    Returns:
        Path to the saved MP3 file.
    """
    if output_path is None:
        import uuid
        base_dir = Path(__file__).resolve().parent
        audio_dir = base_dir / "static" / "audio"
        audio_dir.mkdir(parents=True, exist_ok=True)
        output_path = audio_dir / f"narration_{uuid.uuid4().hex}.mp3"

    try:
        # Configure speech service
        speech_config = speechsdk.SpeechConfig(subscription=SPEECH_KEY, region=SPEECH_REGION)
        speech_config.speech_synthesis_voice_name = VOICE_NAME
        
        # Output to file
        audio_config = speechsdk.audio.AudioOutputConfig(filename=str(output_path))

        # Create synthesizer
        synthesizer = speechsdk.SpeechSynthesizer(speech_config=speech_config, audio_config=audio_config)

        print(f"DEBUG: Generating Azure TTS audio with voice '{VOICE_NAME}' ...")
        result = synthesizer.speak_text_async(narration_text).get()

        if result.reason == speechsdk.ResultReason.SynthesizingAudioCompleted:
            file_size = output_path.stat().st_size
            print(f"DEBUG: TTS audio saved to {output_path} ({file_size:,} bytes)")
            return output_path
        elif result.reason == speechsdk.ResultReason.Canceled:
            cancellation_details = result.cancellation_details
            print(f"DEBUG: Speech synthesis canceled: {cancellation_details.reason}")
            if cancellation_details.reason == speechsdk.CancellationReason.Error:
                print(f"DEBUG: Error details: {cancellation_details.error_details}")
            raise RuntimeError(f"Speech synthesis failed: {cancellation_details.reason}")

    except Exception as e:
        print(f"DEBUG: TTS Error: {type(e).__name__}: {e}")
        raise
