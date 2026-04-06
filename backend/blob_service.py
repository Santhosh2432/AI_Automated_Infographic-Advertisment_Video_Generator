"""
Azure Blob Storage service – upload PDFs and download generated videos.
"""
import os
import uuid
from azure.storage.blob import BlobServiceClient, ContentSettings
from backend.config import settings

def _get_client() -> BlobServiceClient:
    return BlobServiceClient.from_connection_string(settings.AZURE_STORAGE_CONNECTION_STRING)



def _ensure_container(client: BlobServiceClient, name: str):
    """Create the container if it doesn't exist."""
    try:
        client.create_container(name)
    except Exception:
        pass  # container already exists


def upload_pdf(file_bytes: bytes, original_filename: str) -> str:
    """Upload a PDF to Blob Storage and return the blob name."""
    client = _get_client()
    _ensure_container(client, settings.AZURE_STORAGE_UPLOAD_CONTAINER)

    blob_name = f"{uuid.uuid4().hex}_{original_filename}"
    blob_client = client.get_blob_client(settings.AZURE_STORAGE_UPLOAD_CONTAINER, blob_name)
    blob_client.upload_blob(
        file_bytes,
        overwrite=True,
        content_settings=ContentSettings(content_type="application/pdf"),
    )
    print(f"DEBUG: Uploaded PDF to blob '{blob_name}'")
    return blob_name


def upload_video(video_data, video_name: str, user_email: str = None, metadata: dict = None) -> str:
    """Upload a finished video (bytes or stream) to Blob Storage and return the public URL."""
    client = _get_client()
    _ensure_container(client, settings.AZURE_STORAGE_VIDEO_CONTAINER)

    # Use a structured path if user_email is provided
    blob_name = f"videos/{user_email}/{video_name}" if user_email else video_name
    blob_client = client.get_blob_client(settings.AZURE_STORAGE_VIDEO_CONTAINER, blob_name)
    
    blob_client.upload_blob(
        video_data,
        overwrite=True,
        content_settings=ContentSettings(content_type="video/mp4"),
        metadata=metadata,
        connection_timeout=600  # 10 minutes timeout for large videos
    )
    video_url = blob_client.url
    print(f"DEBUG: Uploaded video to blob '{blob_name}' → {video_url}")
    return video_url


def list_user_videos(user_email: str):
    """List all videos for a specific user from Blob Storage."""
    client = _get_client()
    container_client = client.get_container_client(settings.AZURE_STORAGE_VIDEO_CONTAINER)
    
    prefix = f"videos/{user_email}/"
    blobs = container_client.list_blobs(name_starts_with=prefix, include=['metadata'])
    
    results = []
    for blob in blobs:
        blob_client = container_client.get_blob_client(blob.name)
        results.append({
            "name": blob.name,
            "url": blob_client.url,
            "metadata": blob.metadata,
            "created_at": blob.last_modified
        })
    return results


def delete_video_blob(blob_url_or_name: str):
    """Delete a video blob from storage."""
    client = _get_client()
    
    # Extract blob name if URL is provided
    blob_name = blob_url_or_name
    if "blob.core.windows.net" in blob_url_or_name:
        from urllib.parse import urlparse, unquote
        parsed = urlparse(blob_url_or_name)
        # /container/blobname...
        path_parts = parsed.path.lstrip("/").split("/", 1)
        if len(path_parts) >= 2:
            blob_name = unquote(path_parts[1])

    blob_client = client.get_blob_client(settings.AZURE_STORAGE_VIDEO_CONTAINER, blob_name)
    blob_client.delete_blob()
    print(f"DEBUG: Deleted blob '{blob_name}'")


def upload_logo(file_bytes: bytes, original_filename: str) -> str:
    """Upload a brand logo to Blob Storage and return the public URL."""
    client = _get_client()
    _ensure_container(client, settings.AZURE_STORAGE_BRANDKIT_CONTAINER)

    # Use a fixed name or a prefixed name? Fixed might be better for overwriting
    # but unique is safer. Let's go with unique for now.
    blob_name = f"logo_{uuid.uuid4().hex}_{original_filename}"
    blob_client = client.get_blob_client(settings.AZURE_STORAGE_BRANDKIT_CONTAINER, blob_name)
    
    # Determine content type based on extension
    ext = os.path.splitext(original_filename)[1].lower()
    content_type = "image/png"
    if ext in [".jpg", ".jpeg"]:
        content_type = "image/jpeg"
    elif ext == ".svg":
        content_type = "image/svg+xml"

    blob_client.upload_blob(
        file_bytes,
        overwrite=True,
        content_settings=ContentSettings(content_type=content_type),
    )
    logo_url = blob_client.url
    print(f"DEBUG: Uploaded logo to blob '{blob_name}' → {logo_url}")
    return logo_url


def upload_brand_kit(email: str, brand_kit: dict) -> str:
    """Upload brand kit JSON to Blob Storage."""
    import json
    client = _get_client()
    _ensure_container(client, settings.AZURE_STORAGE_BRANDKIT_CONTAINER)
    
    blob_name = f"brand_kit_{email.replace('@', '_').replace('.', '_')}.json"
    blob_client = client.get_blob_client(settings.AZURE_STORAGE_BRANDKIT_CONTAINER, blob_name)
    
    blob_client.upload_blob(
        json.dumps(brand_kit),
        overwrite=True,
        content_settings=ContentSettings(content_type="application/json"),
    )
    print(f"DEBUG: Uploaded brand kit to blob '{blob_name}'")
    return blob_name


def download_blob(container: str, blob_name: str) -> bytes:
    """Download a blob and return its bytes."""
    client = _get_client()
    blob_client = client.get_blob_client(container, blob_name)
    return blob_client.download_blob().readall()


def download_brand_kit(email: str) -> dict:
    """Download brand kit JSON from Blob Storage."""
    import json
    try:
        blob_name = f"brand_kit_{email.replace('@', '_').replace('.', '_')}.json"
        data = download_blob(settings.AZURE_STORAGE_BRANDKIT_CONTAINER, blob_name)
        return json.loads(data)
    except Exception as e:
        print(f"DEBUG: Failed to download brand kit from blob: {e}")
        return None
