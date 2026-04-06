"""
Azure OpenAI service – convert raw OCR text into a structured scene plan
with narration script + scene definitions for animated infographic video.
"""
import json
from openai import AzureOpenAI
from tenacity import retry, wait_exponential, stop_after_attempt
from backend.config import settings
from backend.exceptions import VideoGenError

# ─── Configuration Constants ───
MIN_TOTAL_DURATION_SEC = 60
MAX_TOTAL_DURATION_SEC = 90
TARGET_TOTAL_DURATION_SEC = 75
MIN_SCENES = 8
MAX_SCENES = 12
ALLOWED_VISUAL_STYLES = {"spotlight", "timeline", "stats", "comparison", "roadmap"}


# ─── Prompts ───

SCRIPT_SYSTEM_PROMPT = (
    "You are a professional scriptwriter for advertisement videos. "
    "Given raw text extracted from a company document, produce a concise, "
    "engaging narration script that runs for roughly 1:00 to 1:30 when spoken aloud. "
    "The script must be written as spoken dialogue – no stage directions, "
    "no headings, no bullet points. Write in a warm, confident, persuasive tone. "
    "Focus on the most compelling facts and value propositions."
)

SCENE_PLAN_SYSTEM_PROMPT = """You are an expert infographic video planner. Given raw text extracted from a document, produce a JSON object with two keys:

1. "narration" — A concise, engaging spoken narration script that runs for roughly 1:00 to 1:30 when read aloud. Warm, confident, persuasive tone. No stage directions or bullet points — pure spoken dialogue.

2. "scenes" — An array of 8-12 scene objects. Each scene represents one visual slide of the infographic video. The scenes must feel visually varied and cinematic, not repetitive. Each scene object has:
   - "id": integer (1, 2, 3, ...)
   - "title": string (short, punchy heading for this scene, max 6 words)
   - "bullets": array of 6-8 short strings (key facts/stats to display)
   - "bg_color": string (hex color for background, use dark professional colors like "#1A1A2E", "#16213E", "#0F3460", "#1B1B2F", "#162447", "#1F4068")
   - "accent_color": string (hex color for highlights/accents, use vibrant colors like "#E94560", "#00D2FF", "#F8B500", "#7B2FF7", "#00C9A7", "#FF6B6B")
   - "icon": string (one of: "chart_up", "chart_bar", "globe", "people", "star", "rocket", "shield", "lightbulb", "target", "gear")
   - "visual_style": string (one of: "spotlight", "timeline", "stats", "comparison", "roadmap")
   - "highlight": string (short callout phrase, max 5 words)
   - "stat_value": string (short numeric/stat callout like "42%" or "$3.2M")
   - "stat_label": string (label for the stat value, max 4 words)
   - "footer_note": string (one short supporting line, max 10 words)
   - "duration_sec": number (how long this scene lasts, typically 6-10 seconds, total should sum to 60-90 seconds)

Distribute the narrative naturally across the scenes. Use different visual styles across consecutive scenes so the pacing feels richer and more animated.

Return ONLY valid JSON, no markdown fences, no extra text."""


SUMMARY_SYSTEM_PROMPT = (
    "You are a specialized assistant that summarizes text concisely while "
    "preserving all key facts, statistics, and main points that would be "
    "useful for an infographic or advertisement video."
)

@retry(wait=wait_exponential(multiplier=1, min=2, max=10), stop=stop_after_attempt(3))
def _call_openai(client, messages, temperature=0.7, max_tokens=2048, response_format=None):
    kwargs = {
        "model": settings.AZURE_OPENAI_DEPLOYMENT,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
    }
    if response_format:
        kwargs["response_format"] = response_format
        
    try:
        return client.chat.completions.create(**kwargs)
    except Exception as e:
        print(f"DEBUG: OpenAI Call Error: {e}")
        raise VideoGenError(f"Failed to communicate with Azure OpenAI: {str(e)}")


def _chunk_and_summarize(client, text: str, chunk_size: int = 6000) -> str:
    if len(text) <= chunk_size:
        return text
        
    print(f"DEBUG: Text is {len(text)} chars. Chunking and summarizing...")
    chunks = []
    for i in range(0, len(text), chunk_size):
        chunks.append(text[i:i+chunk_size])
        
    summaries = []
    for idx, chunk in enumerate(chunks):
        print(f"DEBUG: Summarizing chunk {idx+1}/{len(chunks)}")
        messages = [
            {"role": "system", "content": SUMMARY_SYSTEM_PROMPT},
            {"role": "user", "content": f"Please summarize this excerpt:\n\n{chunk}"}
        ]
        response = _call_openai(client, messages, temperature=0.5, max_tokens=1024)
        summaries.append(response.choices[0].message.content.strip())
        
    combined_summary = "\n\n".join(summaries)
    return combined_summary[:6000]


def _clamp(value: float, minimum: float, maximum: float) -> float:
    return max(minimum, min(maximum, value))


def _normalize_scene_duration(total_duration: float, scene_count: int) -> float:
    if scene_count <= 0:
        return TARGET_TOTAL_DURATION_SEC
    if MIN_TOTAL_DURATION_SEC <= total_duration <= MAX_TOTAL_DURATION_SEC:
        return total_duration
    return _clamp(TARGET_TOTAL_DURATION_SEC, scene_count * 6, scene_count * 10)


def _normalize_scene(scene: dict, index: int) -> dict:
    bullets = scene.get("bullets") or []
    visual_style = str(scene.get("visual_style") or "spotlight").strip().lower()
    if visual_style not in ALLOWED_VISUAL_STYLES:
        visual_style = "spotlight"

    duration = scene.get("duration_sec", 7)
    try:
        duration = float(duration)
    except (TypeError, ValueError):
        duration = 7.0

    cleaned_bullets = [str(item).strip() for item in bullets if str(item).strip()][:8]

    return {
        "id": scene.get("id", index + 1),
        "title": str(scene.get("title") or f"Scene {index + 1}").strip(),
        "bullets": cleaned_bullets,
        "bg_color": str(scene.get("bg_color") or "#1A1A2E").strip(),
        "accent_color": str(scene.get("accent_color") or "#E94560").strip(),
        "icon": str(scene.get("icon") or "star").strip(),
        "visual_style": visual_style,
        "highlight": str(scene.get("highlight") or "").strip(),
        "stat_value": str(scene.get("stat_value") or "").strip(),
        "stat_label": str(scene.get("stat_label") or "").strip(),
        "footer_note": str(scene.get("footer_note") or "").strip(),
        "duration_sec": _clamp(duration, 5.0, 12.0),
    }


def _normalize_scene_plan(scene_plan: dict) -> dict:
    scenes = scene_plan.get("scenes", [])
    normalized_scenes = [_normalize_scene(scene, index) for index, scene in enumerate(scenes)]

    total_duration = sum(scene["duration_sec"] for scene in normalized_scenes)
    target_duration = _normalize_scene_duration(total_duration, len(normalized_scenes))

    if normalized_scenes and total_duration > 0:
        scale = target_duration / total_duration
        for scene in normalized_scenes:
            scene["duration_sec"] = round(_clamp(scene["duration_sec"] * scale, 5.0, 12.0), 1)

        adjusted_total = sum(scene["duration_sec"] for scene in normalized_scenes)
        correction = round(target_duration - adjusted_total, 1)
        if correction:
            normalized_scenes[-1]["duration_sec"] = round(
                _clamp(normalized_scenes[-1]["duration_sec"] + correction, 5.0, 12.0),
                1,
            )

    scene_plan["scenes"] = normalized_scenes
    scene_plan["narration"] = str(scene_plan.get("narration") or "").strip()
    return scene_plan


def _get_client() -> AzureOpenAI:
    """Create and return an Azure OpenAI client."""
    return AzureOpenAI(
        azure_endpoint=settings.AZURE_OPENAI_ENDPOINT,
        api_key=settings.AZURE_OPENAI_KEY,
        api_version="2024-02-01",
    )


def generate_script(extracted_text: str) -> str:
    """Send the OCR text to Azure OpenAI and return a narration script (plain text)."""
    try:
        client = _get_client()
        processed_text = _chunk_and_summarize(client, extracted_text)

        print("DEBUG: Sending text to Azure OpenAI for script generation...")
        messages = [
            {"role": "system", "content": SCRIPT_SYSTEM_PROMPT},
            {
                "role": "user",
                "content": (
                    "Here is the raw text extracted from the document. "
                    "Please write a narration script for an advertisement video:\n\n"
                    f"{processed_text}"
                ),
            },
        ]
        response = _call_openai(client, messages, temperature=0.7, max_tokens=2048)

        script = response.choices[0].message.content.strip()
        print(f"DEBUG: Script generated ({len(script)} chars)")
        return script

    except Exception as e:
        print(f"DEBUG: OpenAI Error: {type(e).__name__}: {e}")
        raise


def generate_scene_plan(extracted_text: str) -> dict:
    """Send OCR text to Azure OpenAI and return a structured scene plan (dict).

    Returns:
        dict with keys "narration" (str) and "scenes" (list[dict]).
    """
    try:
        client = _get_client()
        processed_text = _chunk_and_summarize(client, extracted_text)

        print("DEBUG: Sending text to Azure OpenAI for scene plan generation...")
        messages = [
            {"role": "system", "content": SCENE_PLAN_SYSTEM_PROMPT},
            {
                "role": "user",
                "content": (
                    "Here is the raw text extracted from the document. "
                    "Create a structured scene plan for an animated "
                    "infographic video:\n\n"
                    f"{processed_text}"
                ),
            },
        ]
        response = _call_openai(client, messages, temperature=0.7, max_tokens=4096, response_format={"type": "json_object"})

        raw = response.choices[0].message.content.strip()
        print(f"DEBUG: Scene plan raw response ({len(raw)} chars)")

        scene_plan = json.loads(raw)

        # Validate required keys
        if "narration" not in scene_plan:
            raise ValueError("Scene plan missing 'narration' key")
        if "scenes" not in scene_plan or not isinstance(scene_plan["scenes"], list):
            raise ValueError("Scene plan missing or invalid 'scenes' key")

        scene_plan = _normalize_scene_plan(scene_plan)

        print(f"DEBUG: Scene plan parsed – {len(scene_plan['scenes'])} scenes")
        return scene_plan

    except json.JSONDecodeError as e:
        print(f"DEBUG: Failed to parse scene plan JSON: {e}")
        print(f"DEBUG: Raw response was: {raw[:500]}")
        raise ValueError(f"OpenAI returned invalid JSON: {e}")
    except Exception as e:
        print(f"DEBUG: OpenAI Error: {type(e).__name__}: {e}")
        raise
