"""
Azure OpenAI service – convert raw OCR text into a structured scene plan
with narration script + scene definitions for animated infographic video.
"""
import os
import json
from openai import AzureOpenAI
from dotenv import load_dotenv

load_dotenv()

AZURE_OPENAI_ENDPOINT = os.getenv("AZURE_OPENAI_ENDPOINT")
AZURE_OPENAI_KEY = os.getenv("AZURE_OPENAI_KEY")
AZURE_OPENAI_DEPLOYMENT = os.getenv("AZURE_OPENAI_DEPLOYMENT", "gpt-4")

# ─── Prompts ───

SCRIPT_SYSTEM_PROMPT = (
    "You are a professional scriptwriter for advertisement videos. "
    "Given raw text extracted from a company document, produce a concise, "
    "engaging narration script (60-90 seconds when spoken aloud). "
    "The script must be written as spoken dialogue – no stage directions, "
    "no headings, no bullet points. Write in a warm, confident, persuasive tone. "
    "Focus on the most compelling facts and value propositions."
)

SCENE_PLAN_SYSTEM_PROMPT = """You are an expert infographic video planner. Given raw text extracted from a document, produce a JSON object with two keys:

1. "narration" — A concise, engaging spoken narration script (60-90 seconds when read aloud). Warm, confident, persuasive tone. No stage directions or bullet points — pure spoken dialogue.

2. "scenes" — An array of 4-6 scene objects. Each scene represents one visual slide of the infographic video. Each scene object has:
   - "id": integer (1, 2, 3, ...)
   - "title": string (short, punchy heading for this scene, max 6 words)
   - "bullets": array of 2-4 short strings (key facts/stats to display)
   - "bg_color": string (hex color for background, use dark professional colors like "#1A1A2E", "#16213E", "#0F3460", "#1B1B2F", "#162447", "#1F4068")
   - "accent_color": string (hex color for highlights/accents, use vibrant colors like "#E94560", "#00D2FF", "#F8B500", "#7B2FF7", "#00C9A7", "#FF6B6B")
   - "icon": string (one of: "chart_up", "chart_bar", "globe", "people", "star", "rocket", "shield", "lightbulb", "target", "gear")
   - "duration_sec": number (how long this scene lasts, typically 4-7 seconds, total should sum to 30-45 seconds)

Return ONLY valid JSON, no markdown fences, no extra text."""


def _get_client() -> AzureOpenAI:
    """Create and return an Azure OpenAI client."""
    return AzureOpenAI(
        azure_endpoint=AZURE_OPENAI_ENDPOINT,
        api_key=AZURE_OPENAI_KEY,
        api_version="2024-02-01",
    )


def generate_script(extracted_text: str) -> str:
    """Send the OCR text to Azure OpenAI and return a narration script (plain text)."""
    try:
        client = _get_client()

        print("DEBUG: Sending text to Azure OpenAI for script generation...")
        response = client.chat.completions.create(
            model=AZURE_OPENAI_DEPLOYMENT,
            messages=[
                {"role": "system", "content": SCRIPT_SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": (
                        "Here is the raw text extracted from the document. "
                        "Please write a narration script for an advertisement video:\n\n"
                        f"{extracted_text[:4000]}"
                    ),
                },
            ],
            temperature=0.7,
            max_tokens=1024,
        )

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

        print("DEBUG: Sending text to Azure OpenAI for scene plan generation...")
        response = client.chat.completions.create(
            model=AZURE_OPENAI_DEPLOYMENT,
            messages=[
                {"role": "system", "content": SCENE_PLAN_SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": (
                        "Here is the raw text extracted from the document. "
                        "Create a structured scene plan for an animated "
                        "infographic video:\n\n"
                        f"{extracted_text[:4000]}"
                    ),
                },
            ],
            temperature=0.7,
            max_tokens=2048,
            response_format={"type": "json_object"},
        )

        raw = response.choices[0].message.content.strip()
        print(f"DEBUG: Scene plan raw response ({len(raw)} chars)")

        scene_plan = json.loads(raw)

        # Validate required keys
        if "narration" not in scene_plan:
            raise ValueError("Scene plan missing 'narration' key")
        if "scenes" not in scene_plan or not isinstance(scene_plan["scenes"], list):
            raise ValueError("Scene plan missing or invalid 'scenes' key")

        print(f"DEBUG: Scene plan parsed – {len(scene_plan['scenes'])} scenes")
        return scene_plan

    except json.JSONDecodeError as e:
        print(f"DEBUG: Failed to parse scene plan JSON: {e}")
        print(f"DEBUG: Raw response was: {raw[:500]}")
        raise ValueError(f"OpenAI returned invalid JSON: {e}")
    except Exception as e:
        print(f"DEBUG: OpenAI Error: {type(e).__name__}: {e}")
        raise
