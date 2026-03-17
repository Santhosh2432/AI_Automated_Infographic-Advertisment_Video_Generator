from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, status
from datetime import datetime
import os
import time
import json

from backend.db import videos_collection
from backend.blob_service import upload_pdf, upload_video, download_brand_kit
from backend.ocr_service import extract_text_from_document
from backend.script_service import generate_script, generate_scene_plan
from backend.video_generator import generate_avatar_video, generate_infographic_video
from backend.dependencies import get_current_user
from backend.config import settings

router = APIRouter(prefix="", tags=["video"])

@router.post("/process")
async def process(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    """Original pipeline: OCR → Script → Azure Speech Avatar → Blob."""
    
    ALLOWED_CONTENT_TYPES = {"application/pdf", "text/plain", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"}
    if file.content_type not in ALLOWED_CONTENT_TYPES and not file.filename.lower().endswith(('.pdf', '.txt', '.docx')):
        raise HTTPException(status_code=400, detail=f"Unsupported file format: {file.filename}. Only PDF, TXT, and DOCX are allowed.")
        
    file_bytes = await file.read()

    # Upload PDF to Blob Storage
    blob_name = upload_pdf(file_bytes, file.filename or "document.pdf")

    # Extract text with Azure Document Intelligence (OCR)
    extracted_text = extract_text_from_document(file_bytes)

    # Generate narration script with Azure OpenAI
    script = generate_script(extracted_text)

    # Generate avatar video with Azure AI Speech
    start_time = time.time()
    video_path = generate_avatar_video(script)
    generation_time = time.time() - start_time
    video_filename = os.path.basename(video_path)

    # Upload final video to Blob Storage
    with open(video_path, "rb") as vf:
        metadata = {
            "generation_time_s": str(round(generation_time, 2)),
            "video_type": "avatar"
        }
        video_blob_url = upload_video(vf, video_filename, user_email=current_user["email"] if current_user else None, metadata=metadata)
        
    # Cleanup local video
    if os.path.exists(video_path):
        os.remove(video_path)

    # Save to database if user is logged in
    proxied_url = f"/video-proxy?url={video_blob_url}"
    if current_user:
        videos_collection.insert_one({
            "user_email": current_user["email"],
            "video_url": proxied_url,
            "type": "avatar",
            "created_at": datetime.utcnow()
        })

    return {
        "message": "Video generated successfully",
        "video_url": proxied_url,
        "video_blob_url": video_blob_url,
        "extracted_text_preview": extracted_text[:500],
        "script_preview": script,
    }


@router.post("/process-infographic")
async def process_infographic(
    file: UploadFile = File(...), 
    logo_url: str = Form(None),
    current_user: dict = Depends(get_current_user)
):
    """New pipeline: OCR → Scene Plan JSON → Pillow frames → TTS → FFmpeg → MP4."""
    
    ALLOWED_CONTENT_TYPES = {"application/pdf", "text/plain", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"}
    if file.content_type not in ALLOWED_CONTENT_TYPES and not file.filename.lower().endswith(('.pdf', '.txt', '.docx')):
        raise HTTPException(status_code=400, detail=f"Unsupported file format: {file.filename}. Only PDF, TXT, and DOCX are allowed.")
        
    file_bytes = await file.read()

    # 1. Upload PDF to Blob Storage (optional – skip if not configured)
    video_blob_url = None
    try:
        upload_pdf(file_bytes, file.filename or "document.pdf")
    except Exception as e:
        print(f"DEBUG: Blob upload skipped ({e})")

    # 2. Extract text with Azure Document Intelligence (OCR)
    extracted_text = extract_text_from_document(file_bytes)

    # 3. Generate structured scene plan with Azure OpenAI
    scene_plan = generate_scene_plan(extracted_text)

    # Fetch Brand Kit
    brand_kit = None
    if current_user:
        print(f"DEBUG: Fetching brand kit for {current_user['email']}...")
        brand_kit = download_brand_kit(current_user["email"])
        if brand_kit:
            print(f"DEBUG: Brand kit content: {brand_kit}")
        else:
            print("DEBUG: Brand kit NOT found in Blob Storage, checking DB...")
            brand_kit = current_user.get("brand_kit")
            if brand_kit:
                print(f"DEBUG: Brand kit found in DB: {brand_kit}")
            else:
                print("DEBUG: No brand kit found in DB either.")
    else:
        print("DEBUG: No current user, skipping brand kit retrieval.")

    # Override logo if provided
    if logo_url:
        if not brand_kit:
            brand_kit = {"primary_color": "#1A1A2E", "secondary_color": "#E94560"}
        brand_kit["logo_url"] = logo_url
        print(f"DEBUG: Logo override applied: {logo_url}")

    # 4. Generate animated infographic video (Pillow + TTS + FFmpeg)
    print(f"DEBUG: Starting video generation with brand_kit presence: {brand_kit is not None}")
    start_time = time.time()
    video_path = generate_infographic_video(scene_plan, brand_kit=brand_kit)
    generation_time = time.time() - start_time

    # 5. Upload final video to Blob Storage
    video_filename = os.path.basename(video_path)

    try:
        with open(video_path, "rb") as vf:
            metadata = {
                "generation_time_s": str(round(generation_time, 2)),
                "video_type": "infographic"
            }
            video_blob_url = upload_video(vf, video_filename, user_email=current_user["email"] if current_user else None, metadata=metadata)
        # Cleanup local video
        if os.path.exists(video_path):
            os.remove(video_path)
    except Exception as e:
        print(f"DEBUG: Video blob upload failed ({e})")
        video_blob_url = None

    # Save to database if user is logged in
    proxied_url = f"/video-proxy?url={video_blob_url}"
    if current_user:
        videos_collection.insert_one({
            "user_email": current_user["email"],
            "video_url": proxied_url,
            "type": "infographic",
            "created_at": datetime.utcnow()
        })

    return {
        "message": "Infographic video generated successfully",
        "video_url": proxied_url,
        "video_blob_url": video_blob_url,
        "extracted_text_preview": extracted_text[:500],
        "narration_preview": scene_plan.get("narration", ""),
        "scene_count": len(scene_plan.get("scenes", [])),
        "scenes": scene_plan.get("scenes", []),
    }

@router.post("/regenerate")
async def regenerate(
    script: str = Form(...),
    video_type: str = Form(...),
    scenes: str = Form(None),  # JSON string
    current_user: dict = Depends(get_current_user)
):
    """Regenerate video from a modified script (bypasses OCR/LLM script gen)."""
    
    # 1. Fetch Brand Kit
    brand_kit = None
    if current_user:
        brand_kit = download_brand_kit(current_user["email"])
        if not brand_kit:
            brand_kit = current_user.get("brand_kit")

    # 2. Re-generate video
    start_time = time.time()
    if video_type == "avatar":
        video_path = generate_avatar_video(script)
    else:
        # infographic mode needs scenes
        try:
            scenes_list = json.loads(scenes) if scenes else []
            scene_plan = {"narration": script, "scenes": scenes_list}
            video_path = generate_infographic_video(scene_plan, brand_kit=brand_kit)
        except Exception as e:
            print(f"DEBUG: Infographic regeneration failed: {e}")
            raise HTTPException(status_code=400, detail=f"Failed to parse scenes or render video: {str(e)}")
    generation_time = time.time() - start_time

    # 3. Upload to Blob
    video_filename = os.path.basename(video_path)
    video_blob_url = None

    try:
        with open(video_path, "rb") as vf:
            metadata = {
                "generation_time_s": str(round(generation_time, 2)),
                "video_type": video_type
            }
            video_blob_url = upload_video(vf, video_filename, user_email=current_user["email"] if current_user else None, metadata=metadata)
        # Cleanup local video
        if os.path.exists(video_path):
            os.remove(video_path)
    except Exception as e:
        print(f"DEBUG: Video blob upload failed ({e})")

    # 4. Save to DB
    proxied_url = f"/video-proxy?url={video_blob_url}"
    if current_user:
        videos_collection.insert_one({
            "user_email": current_user["email"],
            "video_url": proxied_url,
            "type": video_type,
            "created_at": datetime.utcnow()
        })

    return {
        "message": "Video regenerated successfully",
        "video_url": proxied_url,
        "video_blob_url": video_blob_url,
        "script_preview": script
    }
