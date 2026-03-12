"""
FastAPI application – orchestrates the full video-generation pipeline.

Endpoints:
  POST /process             → Azure Speech Avatar pipeline (original)
  POST /process-infographic → Animated infographic pipeline (new)

Pipeline (Avatar):
  1. Upload PDF → Azure Blob Storage
  2. Extract text → Azure Document Intelligence (OCR)
  3. Generate script → Azure OpenAI
  4. Generate avatar video → Azure AI Speech Avatar
  5. Upload video → Azure Blob Storage

Pipeline (Infographic):
  1. Upload PDF → Azure Blob Storage
  2. Extract text → Azure Document Intelligence (OCR)
  3. Generate scene plan → Azure OpenAI (structured JSON)
  4. Render animated frames → Pillow
  5. Generate narration audio → OpenAI TTS
  6. Merge video + audio → FFmpeg
  7. Upload video → Azure Blob Storage
"""
from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, status
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse, StreamingResponse
from pathlib import Path
import os
import requests
import json
import base64
import time

from backend.blob_service import upload_pdf, upload_video, upload_logo, upload_brand_kit, download_brand_kit
from backend.ocr_service import extract_text_from_document
from backend.script_service import generate_script, generate_scene_plan
from backend.video_generator import generate_avatar_video, generate_infographic_video

# Auth Imports
from backend.db import users_collection, videos_collection
from backend.auth_service import hash_password, verify_password, create_access_token, decode_access_token
from fastapi import Depends, HTTPException, status, Header, Form, Response
from pydantic import BaseModel
from datetime import datetime

app = FastAPI(title="AI Infographic & Advertisement Video Generator")

# Pydantic Schemas
class UserSignUp(BaseModel):
    full_name: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

# ─── CORS ───
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Static file serving ───
BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"
(STATIC_DIR / "videos").mkdir(parents=True, exist_ok=True)
(STATIC_DIR / "audio").mkdir(parents=True, exist_ok=True)
(STATIC_DIR / "avatars").mkdir(parents=True, exist_ok=True)
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

@app.get("/logo-proxy")
async def logo_proxy(url: str):
    """Proxy for brand logos – uses Azure SDK with server credentials."""
    from backend.blob_service import _get_client
    from urllib.parse import urlparse, unquote
    try:
        # Decode repeatedly until stable (handles double/triple encoding)
        decoded_url = url
        while unquote(decoded_url) != decoded_url:
            decoded_url = unquote(decoded_url)
        
        parsed = urlparse(decoded_url)
        
        if "blob.core.windows.net" not in parsed.netloc:
            raise HTTPException(status_code=400, detail="Invalid proxy URL")
        
        # Path format: /container/blobname...
        path_parts = parsed.path.lstrip("/").split("/", 1)
        if len(path_parts) < 2:
            raise HTTPException(status_code=400, detail="Malformed blob URL")
            
        container = path_parts[0]
        blob_name = unquote(path_parts[1])  # Fully decode the blob name
        
        print(f"DEBUG logo_proxy: container={container}, blob_name={blob_name}")

        client = _get_client()
        blob_client = client.get_blob_client(container, blob_name)
        
        download_stream = blob_client.download_blob()
        content = download_stream.readall()
        
        properties = blob_client.get_blob_properties()
        content_type = properties.content_settings.content_type or "image/png"
        
        return Response(content=content, media_type=content_type)
    except Exception as e:
        print(f"ERROR: logo_proxy failed for url={url}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Could not retrieve asset")

@app.get("/video-proxy")
async def video_proxy(url: str):
    """Proxy for videos – streams chunks from Azure Blob Storage."""
    from backend.blob_service import _get_client
    from urllib.parse import urlparse, unquote
    try:
        decoded_url = url
        while unquote(decoded_url) != decoded_url:
            decoded_url = unquote(decoded_url)
        
        parsed = urlparse(decoded_url)
        if "blob.core.windows.net" not in parsed.netloc:
            raise HTTPException(status_code=400, detail="Invalid proxy URL")
        
        path_parts = parsed.path.lstrip("/").split("/", 1)
        container = path_parts[0]
        blob_name = unquote(path_parts[1])
        
        client = _get_client()
        blob_client = client.get_blob_client(container, blob_name)
        
        # Stream the blob in chunks to avoid memory issues
        def stream_generator():
            download_stream = blob_client.download_blob()
            for chunk in download_stream.chunks():
                yield chunk
        
        properties = blob_client.get_blob_properties()
        content_type = properties.content_settings.content_type or "video/mp4"
        
        return StreamingResponse(stream_generator(), media_type=content_type)
    except Exception as e:
        print(f"ERROR: video_proxy failed for url={url}: {e}")
        raise HTTPException(status_code=500, detail="Could not stream video")

# ─── Auth Dependency ───
async def get_current_user(authorization: str = Header(None)):
    if not authorization:
        print("DEBUG: No Authorization header provided")
        return None
        
    if not authorization.startswith("Bearer "):
        print(f"DEBUG: Invalid Authorization header format: {authorization[:20]}...")
        return None
    
    token = authorization.split(" ")[1]
    if token == "null" or token == "undefined":
        print(f"DEBUG: Frontend sent literal '{token}' as token")
        return None

    payload = decode_access_token(token)
    
    if not payload:
        print("DEBUG: Token decoding failed (invalid or expired)")
        return None
        
    email = payload.get("sub")
    if not email:
        print("DEBUG: Token payload missing 'sub' claim")
        return None
        
    user = users_collection.find_one({"email": email})
    if not user:
        print(f"DEBUG: No user found for email '{email}'")
    
    return user

#  Authentication Endpoints

@app.post("/auth/signup")
async def signup(user_data: UserSignUp):
    # Check if email exists
    existing_user = users_collection.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create user document
    new_user = {
        "full_name": user_data.full_name,
        "email": user_data.email,
        "password_hash": hash_password(user_data.password),
        "created_at": datetime.utcnow()
    }
    
    users_collection.insert_one(new_user)
    
    # Create token
    token = create_access_token(data={"sub": new_user["email"]})
    
    return {
        "message": "User created successfully",
        "user": {"name": new_user["full_name"], "email": new_user["email"]},
        "access_token": token,
        "token_type": "bearer"
    }

@app.post("/auth/login")
async def login(user_data: UserLogin):
    user = users_collection.find_one({"email": user_data.email})
    
    if not user or not verify_password(user_data.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = create_access_token(data={"sub": user["email"]})
    
    return {
        "message": "Login successful",
        "user": {"name": user["full_name"], "email": user["email"]},
        "access_token": token,
        "token_type": "bearer"
    }

# ─── OAuth Configuration ───
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

# ─── Google OAuth Endpoints (Mocked for Testing) ───
@app.get("/auth/google")
async def google_login():
    """Mock Google login – bypasses Google but creates user in DB."""
    email = "google_tester@example.com"
    full_name = "Google Tester"
    
    # Create/Update user in DB
    user = users_collection.find_one({"email": email})
    if not user:
        user = {
            "full_name": full_name,
            "email": email,
            "auth_provider": "google",
            "created_at": datetime.utcnow()
        }
        users_collection.insert_one(user)
    
    # Create internal JWT and redirect back
    internal_token = create_access_token(data={"sub": email})
    user_data = {"name": full_name, "email": email}
    user_b64 = base64.b64encode(json.dumps(user_data).encode()).decode()
    
    return RedirectResponse(url=f"{FRONTEND_URL}/?token={internal_token}&user={user_b64}")

@app.get("/auth/callback/google")
async def google_callback(code: str):
    """Handles Google OAuth callback (Placeholder)."""
    # This is skipped in mock mode
    return RedirectResponse(url=f"{FRONTEND_URL}/")

# ─── GitHub OAuth Endpoints (Mocked for Testing) ───
@app.get("/auth/github")
async def github_login():
    """Mock GitHub login – bypasses GitHub but creates user in DB."""
    email = "github_tester@example.com"
    full_name = "GitHub Tester"
    
    # Create/Update user in DB
    user = users_collection.find_one({"email": email})
    if not user:
        user = {
            "full_name": full_name,
            "email": email,
            "auth_provider": "github",
            "created_at": datetime.utcnow()
        }
        users_collection.insert_one(user)
    
    # Create internal JWT and redirect back
    internal_token = create_access_token(data={"sub": email})
    user_data = {"name": full_name, "email": email}
    user_b64 = base64.b64encode(json.dumps(user_data).encode()).decode()
    
    return RedirectResponse(url=f"{FRONTEND_URL}/?token={internal_token}&user={user_b64}")

@app.get("/auth/callback/github")
async def github_callback(code: str):
    """Handles GitHub OAuth callback (Placeholder)."""
    # This is skipped in mock mode
    return RedirectResponse(url=f"{FRONTEND_URL}/")

@app.get("/user/stats")
async def get_user_stats(current_user: dict = Depends(get_current_user)):
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    email = current_user["email"]
    
    # Derivation from Blob Storage
    from backend.blob_service import list_user_videos
    try:
        blobs = list_user_videos(email)
        video_count = len(blobs)
        
        total_seconds = 0
        for blob in blobs:
            # Metadata keys in Azure are usually lowercase
            gen_time_str = blob.get("metadata", {}).get("generation_time_s", "0")
            try:
                total_seconds += float(gen_time_str)
            except:
                pass
        
        total_minutes = int(total_seconds // 60)
        remaining_seconds = int(total_seconds % 60)
        
        if total_minutes >= 60:
            generation_time = f"{total_minutes // 60}h {total_minutes % 60}m"
        else:
            generation_time = f"{total_minutes}m {remaining_seconds}s" if total_seconds > 0 else "0m"
            
    except Exception as e:
        print(f"DEBUG: Failed to fetch stats from blob: {e}")
        # Fallback to DB count
        video_count = videos_collection.count_documents({"user_email": email})
        generation_time = "N/A"

    # Account creation date
    created_at = current_user.get("created_at")
    if isinstance(created_at, datetime):
        member_since = created_at.strftime("%b %Y")
    else:
        member_since = "N/A"
        
    return {
        "total_videos": video_count,
        "generation_time": generation_time,
        "member_since": member_since
    }

@app.delete("/user/videos/{video_id}")
async def delete_video(video_id: str, current_user: dict = Depends(get_current_user)):
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    from bson import ObjectId
    from backend.blob_service import delete_video_blob
    
    try:
        video = videos_collection.find_one({"_id": ObjectId(video_id), "user_email": current_user["email"]})
        if not video:
            raise HTTPException(status_code=404, detail="Video not found")
        
        # 1. Delete from Blob Storage
        video_url = video.get("video_url")
        if video_url and "/video-proxy?url=" in video_url:
            actual_blob_url = video_url.split("?url=")[1]
            try:
                delete_video_blob(actual_blob_url)
            except Exception as e:
                print(f"DEBUG: Failed to delete blob: {e}")
                
        # 2. Delete from DB
        videos_collection.delete_one({"_id": ObjectId(video_id)})
        
        return {"message": "Video deleted successfully"}
    except Exception as e:
        print(f"ERROR: Deletion failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/user/videos")
async def get_user_videos(current_user: dict = Depends(get_current_user)):
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    user_videos = list(videos_collection.find({"user_email": current_user["email"]}).sort("created_at", -1))
    for video in user_videos:
        video["_id"] = str(video["_id"])
    return user_videos


@app.post("/user/avatar")
async def upload_avatar(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    # Validate file type
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Upload directly to Blob
    file_bytes = await file.read()
    avatar_url = upload_logo(file_bytes, file.filename)
    
    # Update DB
    users_collection.update_one(
        {"email": current_user["email"]},
        {"$set": {"avatar_url": avatar_url}}
    )
    
    return {"avatar_url": avatar_url}
    

# ─── Brand Kit Endpoints ───

class BrandKitUpdate(BaseModel):
    primary_color: str = "#1A1A2E"
    secondary_color: str = "#E94560"
    logo_url: str = None

@app.get("/user/brand-kit")
async def get_brand_kit(current_user: dict = Depends(get_current_user)):
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Ensure brand_kit exist as a dict
    brand_kit = current_user.get("brand_kit")
    if not isinstance(brand_kit, dict):
        brand_kit = {}

    defaults = {
        "primary_color": "#1A1A2E",
        "secondary_color": "#E94560",
        "logo_url": None,
        "logos": []
    }
    
    # Merge with defaults
    for key, val in defaults.items():
        if key not in brand_kit or brand_kit[key] is None:
            brand_kit[key] = val
            
    return brand_kit

@app.post("/user/brand-kit")
async def update_brand_kit(
    primary_color: str = Form(None),
    secondary_color: str = Form(None),
    logo_file: UploadFile = File(None),
    logo_url: str = Form(None),
    delete_logo_url: str = Form(None),
    current_user: dict = Depends(get_current_user)
):
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    brand_kit = current_user.get("brand_kit", {
        "primary_color": "#1A1A2E",
        "secondary_color": "#E94560",
        "logo_url": None,
        "logos": []
    })
    
    # Initialize logos list if missing
    if "logos" not in brand_kit:
        brand_kit["logos"] = []
        if brand_kit.get("logo_url"):
            brand_kit["logos"].append(brand_kit["logo_url"])

    # Update colors
    if primary_color:
        brand_kit["primary_color"] = primary_color
    if secondary_color:
        brand_kit["secondary_color"] = secondary_color

    # Handle Logo selection/upload
    if logo_file:
        logo_url_uploaded = upload_logo(await logo_file.read(), logo_file.filename)
        brand_kit["logo_url"] = logo_url_uploaded
        if logo_url_uploaded not in brand_kit["logos"]:
            brand_kit["logos"].append(logo_url_uploaded)
    elif logo_url:
        # Setting an existing logo as primary
        brand_kit["logo_url"] = logo_url

    # Handle deletion
    if delete_logo_url:
        if delete_logo_url in brand_kit["logos"]:
            brand_kit["logos"].remove(delete_logo_url)
            # If current active logo was deleted, pick another or set to None
            if brand_kit.get("logo_url") == delete_logo_url:
                brand_kit["logo_url"] = brand_kit["logos"][0] if brand_kit["logos"] else None
    
    users_collection.update_one(
        {"email": current_user["email"]},
        {"$set": {"brand_kit": brand_kit}}
    )
    
    # Sync to Blob Storage
    try:
        upload_brand_kit(current_user["email"], brand_kit)
    except Exception as e:
        print(f"DEBUG: Brand kit sync to blob failed: {e}")
    
    return {"message": "Brand kit updated", "brand_kit": brand_kit}


# Azure Speech Avatar Pipeline

@app.post("/process")
async def process(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    """Original pipeline: OCR → Script → Azure Speech Avatar → Blob."""
    file_bytes = await file.read()

    #    Upload PDF to Blob Storage
    blob_name = upload_pdf(file_bytes, file.filename or "document.pdf")

    #    Extract text with Azure Document Intelligence (OCR)
    extracted_text = extract_text_from_document(file_bytes)

    #    Generate narration script with Azure OpenAI
    script = generate_script(extracted_text)

    #    Generate avatar video with Azure AI Speech
    start_time = time.time()
    video_path = generate_avatar_video(script)
    generation_time = time.time() - start_time
    video_filename = os.path.basename(video_path)

    #    Upload final video to Blob Storage
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
        "script_preview": script[:500],
    }



@app.post("/process-infographic")
async def process_infographic(
    file: UploadFile = File(...), 
    logo_url: str = Form(None),
    current_user: dict = Depends(get_current_user)
):
    """New pipeline: OCR → Scene Plan JSON → Pillow frames → TTS → FFmpeg → MP4."""
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
        # Try blob first (as requested), fall back to DB
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
        "narration_preview": scene_plan.get("narration", "")[:500],
        "scene_count": len(scene_plan.get("scenes", [])),
        "scenes": scene_plan.get("scenes", []),
    }

@app.post("/regenerate")
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
        "script_preview": script[:500]
    }
