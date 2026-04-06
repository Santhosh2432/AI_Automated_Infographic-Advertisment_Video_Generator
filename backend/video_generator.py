"""
Video generation services:

1. generate_avatar_video()       Azure AI Speech Avatar (batch synthesis) [PRESERVED]
2. generate_infographic_video()  Pillow animation + OpenAI TTS + FFmpeg   [NEW]
"""
import os
import time
import uuid
import shutil
import subprocess
import tempfile
import requests as http_requests
from pathlib import Path
from backend.config import settings
from backend.scene_renderer import render_scenes
from backend.tts_service import generate_narration_audio

#  Azure Speech Avatar Constants
AVATAR_CHARACTER = "lisa"
AVATAR_STYLE = "casual-sitting"
VIDEO_FORMAT = "mp4"
VIDEO_CODEC = "h264"
SUBTITLE_TYPE = "hard_embedded"

BASE_URL = f"https://{settings.AZURE_SPEECH_REGION}.api.cognitive.microsoft.com"

def _headers():
    return {
        "Ocp-Apim-Subscription-Key": settings.AZURE_SPEECH_KEY,
        "Content-Type": "application/json",
    }



def _build_ssml(script_text: str) -> str:
    """Wrap script text in SSML for the avatar synthesis."""
    safe = (
        script_text
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )
    return (
        f'<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" '
        f'xmlns:mstts="http://www.w3.org/2001/mstts" xml:lang="en-US">'
        f'<voice name="{settings.AZURE_SPEECH_VOICE}">{safe}</voice></speak>'
    )


def _submit_batch_synthesis(script_text: str) -> str:
    """Submit a batch avatar synthesis job and return the job ID."""
    job_id = str(uuid.uuid4())
    url = f"{BASE_URL}/avatar/batchsyntheses/{job_id}?api-version=2024-08-01"

    payload = {
        "inputKind": "SSML",
        "inputs": [
            {"content": _build_ssml(script_text)}
        ],
        "avatarConfig": {
            "talkingAvatarCharacter": AVATAR_CHARACTER,
            "talkingAvatarStyle": AVATAR_STYLE,
            "videoFormat": VIDEO_FORMAT,
            "videoCodec": VIDEO_CODEC,
            "subtitleType": SUBTITLE_TYPE,
            "backgroundColor": "#FFFFFFFF",
        },
    }

    print(f"DEBUG: Submitting avatar batch synthesis job {job_id} ...")
    resp = http_requests.put(url, json=payload, headers=_headers())

    if resp.status_code not in (200, 201, 202):
        raise RuntimeError(
            f"Avatar synthesis submit failed ({resp.status_code}): {resp.text}"
        )

    print(f"DEBUG: Job submitted successfully – {job_id}")
    return job_id


def _poll_until_done(job_id: str, timeout: int = 600, interval: int = 10) -> dict:
    """Poll the job status until it succeeds, fails, or times out."""
    url = f"{BASE_URL}/avatar/batchsyntheses/{job_id}?api-version=2024-08-01"
    deadline = time.time() + timeout

    while time.time() < deadline:
        resp = http_requests.get(url, headers=_headers())
        resp.raise_for_status()
        data = resp.json()
        status = data.get("status", "Unknown")
        print(f"DEBUG: Job {job_id} status → {status}")

        if status == "Succeeded":
            return data
        if status == "Failed":
            raise RuntimeError(
                f"Avatar synthesis failed: {data.get('properties', {}).get('error', data)}"
            )

        time.sleep(interval)

    raise TimeoutError(f"Avatar synthesis timed out after {timeout}s")


def _download_video(result: dict, output_path: Path) -> Path:
    """Download the generated video from the result URL."""
    outputs = result.get("outputs", {})
    video_url = outputs.get("result")

    if not video_url:
        raise RuntimeError(f"No video URL in synthesis result: {outputs}")

    print(f"DEBUG: Downloading avatar video from {video_url} ...")
    resp = http_requests.get(video_url, stream=True)
    resp.raise_for_status()

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "wb") as f:
        for chunk in resp.iter_content(chunk_size=8192):
            f.write(chunk)

    print(f"DEBUG: Video saved to {output_path} ({output_path.stat().st_size} bytes)")
    return output_path


def generate_avatar_video(script_text: str) -> str:
    """
    Azure Speech Avatar pipeline:
      1. Submit batch avatar synthesis
      2. Poll until done
      3. Download the video
    Returns the local path to the saved video file.
    """
    base_dir = Path(__file__).resolve().parent
    videos_dir = base_dir / "static" / "videos"
    videos_dir.mkdir(parents=True, exist_ok=True)
    video_filename = f"avatar_{uuid.uuid4().hex}.mp4"
    output_path = videos_dir / video_filename

    job_id = _submit_batch_synthesis(script_text)
    result = _poll_until_done(job_id)
    _download_video(result, output_path)

    return str(output_path)



# Animated Infographic Video (Pillow + OpenAI TTS + FFmpeg)

FPS = 30


def _ffmpeg_available() -> bool:
    """Check if FFmpeg is available on the system PATH."""
    ffmpeg_cmd = settings.FFMPEG_PATH or "ffmpeg"
    try:
        result = subprocess.run(
            [ffmpeg_cmd, "-version"],
            capture_output=True, text=True, timeout=10,
        )
        return result.returncode == 0
    except (FileNotFoundError, subprocess.TimeoutExpired):
        return False


def _merge_video_audio(frames_dir: Path, audio_path: Path,
                       output_path: Path, fps: int = FPS):
    """Use FFmpeg to merge PNG frames + MP3 audio into a final MP4."""
    ffmpeg_cmd = settings.FFMPEG_PATH or "ffmpeg"
    frames_pattern = str(frames_dir / "%06d.png")

    cmd = [
        ffmpeg_cmd, "-y",
        "-framerate", str(fps),
        "-i", frames_pattern,
        "-i", str(audio_path),
        "-c:v", "libx264",
        "-preset", "medium",
        "-crf", "23",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-b:a", "192k",
        "-shortest",
        "-movflags", "+faststart",
        str(output_path),
    ]

    print(f"DEBUG: Running FFmpeg: {' '.join(cmd)}")
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=900)

    if result.returncode != 0:
        print(f"DEBUG: FFmpeg stderr: {result.stderr[:2000]}")
        raise RuntimeError(f"FFmpeg failed (exit {result.returncode}): {result.stderr[:500]}")

    print(f"DEBUG: FFmpeg completed – {output_path} "
          f"({output_path.stat().st_size:,} bytes)")


def _merge_video_only(frames_dir: Path, output_path: Path, fps: int = FPS):
    """Use FFmpeg to merge PNG frames into MP4 (no audio)."""
    ffmpeg_cmd = settings.FFMPEG_PATH or "ffmpeg"
    frames_pattern = str(frames_dir / "%06d.png")

    cmd = [
        ffmpeg_cmd, "-y",
        "-framerate", str(fps),
        "-i", frames_pattern,
        "-c:v", "libx264",
        "-preset", "medium",
        "-crf", "23",
        "-pix_fmt", "yuv420p",
        "-movflags", "+faststart",
        str(output_path),
    ]

    print(f"DEBUG: Running FFmpeg (video-only): {' '.join(cmd)}")
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=900)

    if result.returncode != 0:
        raise RuntimeError(f"FFmpeg failed (exit {result.returncode}): {result.stderr[:500]}")

    print(f"DEBUG: FFmpeg completed – {output_path} "
          f"({output_path.stat().st_size:,} bytes)")


def generate_infographic_video(scene_plan: dict, brand_kit: dict = None) -> str:
    """
    Full animated infographic pipeline:
      1. Render scene frames with Pillow
      2. Generate narration audio with OpenAI TTS
      3. Merge frames + audio with FFmpeg
    Returns the local path to the saved MP4 video file.
    """
    if not _ffmpeg_available():
        raise RuntimeError(
            "FFmpeg not found on PATH. Please install FFmpeg: "
            "https://ffmpeg.org/download.html"
        )

    base_dir = Path(__file__).resolve().parent
    videos_dir = base_dir / "static" / "videos"
    videos_dir.mkdir(parents=True, exist_ok=True)
    video_filename = f"infographic_{uuid.uuid4().hex}.mp4"
    output_path = videos_dir / video_filename

    # Use a temp dir for intermediate frames
    tmp_dir = Path(tempfile.mkdtemp(prefix="infographic_frames_"))
    audio_path = None

    try:
        # Apply Brand Kit Colors if provided
        if brand_kit:
            primary = brand_kit.get("primary_color")
            secondary = brand_kit.get("secondary_color")
            for scene in scene_plan.get("scenes", []):
                if primary:
                    scene["bg_color"] = primary
                if secondary:
                    scene["accent_color"] = secondary

        # Render scene frames
        print("DEBUG: ═══ Step 1/3: Rendering scene frames ═══")
        
        # Pre-load brand logo if provided
        logo_img = None
        if brand_kit and brand_kit.get("logo_url"):
            try:
                from PIL import Image
                import requests as req
                from io import BytesIO
                from urllib.parse import unquote
                from backend.blob_service import download_blob
                
                logo_url = brand_kit['logo_url']
                print(f"DEBUG: Attempting to load brand logo from {logo_url} ...")

                
                logo_bytes = None
                
                # If it's an Azure Blob URL, try to download it via SDK (handles private blobs)
                if ".blob.core.windows.net" in logo_url:
                    try:
                        # format: https://<account>.blob.core.windows.net/<container>/<blob_name>
                        parts = logo_url.split("/")
                        blob_name_encoded = parts[-1]
                        # Extract container from URL in case it differs from env var
                        url_container = parts[-2]
                        
                        # IMPORTANT: Unquote the blob name (e.g. %20 -> space)
                        blob_name = unquote(blob_name_encoded)
                        
                        target_container = url_container if url_container else settings.AZURE_STORAGE_BRANDKIT_CONTAINER
                        
                        print(f"DEBUG: Identified as Azure Blob. Downloading '{blob_name}' from '{target_container}'...")
                        logo_bytes = download_blob(target_container, blob_name)
                    except Exception as sdk_err:
                        print(f"DEBUG: SDK Download failed ({sdk_err}), falling back to requests...")
                
                if not logo_bytes:
                    resp = req.get(logo_url, timeout=10)
                    if resp.status_code == 200:
                        logo_bytes = resp.content
                    else:
                        print(f"DEBUG: Logo download failed (HTTP {resp.status_code})")
                
                if logo_bytes:
                    logo_img = Image.open(BytesIO(logo_bytes)).convert("RGBA")
                    
                    # Pre-resize logo to max width 150 (very small)
                    lw, lh = logo_img.size
                    max_lw = 150
                    scale = max_lw / lw
                    logo_img = logo_img.resize((int(lw * scale), int(lh * scale)), Image.Resampling.LANCZOS)
                    print(f"DEBUG: Logo pre-loaded and resized to {logo_img.size}")
                else:
                    print("DEBUG: Failed to obtain logo bytes.")
            except Exception as e:
                print(f"DEBUG: Critical error in logo pre-load: {e}")
        else:
            print("DEBUG: No logo_url provided in brand_kit or brand_kit is None")

        frame_count = render_scenes(scene_plan, tmp_dir, fps=FPS, brand_kit=brand_kit, logo_img=logo_img)
        print(f"DEBUG: Rendered {frame_count} frames")

        # Generate narration audio
        print("DEBUG: ═══ Step 2/3: Generating narration audio ═══")
        narration_text = scene_plan.get("narration", "")
        if narration_text:
            try:
                audio_path = generate_narration_audio(narration_text)
                print(f"DEBUG: Audio generated at {audio_path}")
            except Exception as e:
                print(f"DEBUG: TTS failed ({e}), proceeding without audio")
                audio_path = None

        #  Merge with FFmpeg
        print("DEBUG: ═══ Step 3/3: Merging with FFmpeg ═══")
        if audio_path and audio_path.exists():
            _merge_video_audio(tmp_dir, audio_path, output_path, fps=FPS)
        else:
            _merge_video_only(tmp_dir, output_path, fps=FPS)

        print(f"DEBUG: ✅ Infographic video saved to {output_path}")
        return str(output_path)

    finally:
        # Clean up temp frames
        shutil.rmtree(tmp_dir, ignore_errors=True)
        print(f"DEBUG: Cleaned up temp frames at {tmp_dir}")
        
        # Clean up temp audio if it exists
        if audio_path and audio_path.exists():
            try:
                os.remove(audio_path)
                print(f"DEBUG: Cleaned up temp audio at {audio_path}")
            except Exception as e:
                print(f"DEBUG: Failed to delete temp audio: {e}")