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
from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, status, Response
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse, StreamingResponse
from pathlib import Path
import os
import requests
import json
import base64
import time

from backend.routes import auth, user, video
from backend.config import settings
from backend.exceptions import BaseAppError, app_error_handler, global_exception_handler

app = FastAPI(title="AI Infographic & Advertisement Video Generator")

# ─── Exception Handlers ───
app.add_exception_handler(BaseAppError, app_error_handler)
app.add_exception_handler(Exception, global_exception_handler)

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

# ─── Routers ───
app.include_router(auth.router)
app.include_router(user.router)
app.include_router(video.router)


