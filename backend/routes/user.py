from fastapi import APIRouter, HTTPException, status, Depends, Header, Form, UploadFile, File
from pydantic import BaseModel
from datetime import datetime
from bson import ObjectId

from backend.db import users_collection, videos_collection
from backend.auth_service import decode_access_token
from backend.blob_service import list_user_videos, delete_video_blob, upload_logo, upload_brand_kit
from backend.dependencies import get_current_user
from backend.config import settings

router = APIRouter(prefix="/user", tags=["user"])

@router.get("/stats")
async def get_user_stats(current_user: dict = Depends(get_current_user)):
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    email = current_user["email"]
    
    try:
        blobs = list_user_videos(email)
        video_count = len(blobs)
        
        total_seconds = 0
        for blob in blobs:
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
        video_count = videos_collection.count_documents({"user_email": email})
        generation_time = "N/A"

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

@router.delete("/videos/{video_id}")
async def delete_video(video_id: str, current_user: dict = Depends(get_current_user)):
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        video = videos_collection.find_one({"_id": ObjectId(video_id), "user_email": current_user["email"]})
        if not video:
            raise HTTPException(status_code=404, detail="Video not found")
        
        video_url = video.get("video_url")
        if video_url and "/video-proxy?url=" in video_url:
            actual_blob_url = video_url.split("?url=")[1]
            try:
                delete_video_blob(actual_blob_url)
            except Exception as e:
                print(f"DEBUG: Failed to delete blob: {e}")
                
        videos_collection.delete_one({"_id": ObjectId(video_id)})
        
        return {"message": "Video deleted successfully"}
    except Exception as e:
        print(f"ERROR: Deletion failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/videos")
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

@router.post("/avatar")
async def upload_avatar(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    file_bytes = await file.read()
    avatar_url = upload_logo(file_bytes, file.filename)
    
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

@router.get("/brand-kit")
async def get_brand_kit(current_user: dict = Depends(get_current_user)):
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    brand_kit = current_user.get("brand_kit")
    if not isinstance(brand_kit, dict):
        brand_kit = {}

    defaults = {
        "primary_color": "#1A1A2E",
        "secondary_color": "#E94560",
        "logo_url": None,
        "logos": []
    }
    
    for key, val in defaults.items():
        if key not in brand_kit or brand_kit[key] is None:
            brand_kit[key] = val
            
    return brand_kit

@router.post("/brand-kit")
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
    
    if "logos" not in brand_kit:
        brand_kit["logos"] = []
        if brand_kit.get("logo_url"):
            brand_kit["logos"].append(brand_kit["logo_url"])

    if primary_color:
        brand_kit["primary_color"] = primary_color
    if secondary_color:
        brand_kit["secondary_color"] = secondary_color

    if logo_file:
        logo_url_uploaded = upload_logo(await logo_file.read(), logo_file.filename)
        brand_kit["logo_url"] = logo_url_uploaded
        if logo_url_uploaded not in brand_kit["logos"]:
            brand_kit["logos"].append(logo_url_uploaded)
    elif logo_url:
        brand_kit["logo_url"] = logo_url

    if delete_logo_url:
        if delete_logo_url in brand_kit["logos"]:
            brand_kit["logos"].remove(delete_logo_url)
            if brand_kit.get("logo_url") == delete_logo_url:
                brand_kit["logo_url"] = brand_kit["logos"][0] if brand_kit["logos"] else None
    
    users_collection.update_one(
        {"email": current_user["email"]},
        {"$set": {"brand_kit": brand_kit}}
    )
    
    try:
        upload_brand_kit(current_user["email"], brand_kit)
    except Exception as e:
        print(f"DEBUG: Brand kit sync to blob failed: {e}")
    
    return {"message": "Brand kit updated", "brand_kit": brand_kit}
