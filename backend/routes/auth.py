from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from datetime import datetime
import os
import json
import base64
from fastapi.responses import RedirectResponse

from backend.db import users_collection
from backend.auth_service import hash_password, verify_password, create_access_token
from backend.config import settings

router = APIRouter(prefix="/auth", tags=["auth"])

class UserSignUp(BaseModel):
    full_name: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

# Use centralized settings for FRONTEND_URL

@router.post("/signup")
async def signup(user_data: UserSignUp):
    existing_user = users_collection.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    new_user = {
        "full_name": user_data.full_name,
        "email": user_data.email,
        "password_hash": hash_password(user_data.password),
        "created_at": datetime.utcnow()
    }
    
    users_collection.insert_one(new_user)
    token = create_access_token(data={"sub": new_user["email"]})
    
    return {
        "message": "User created successfully",
        "user": {"name": new_user["full_name"], "email": new_user["email"]},
        "access_token": token,
        "token_type": "bearer"
    }

@router.post("/login")
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

# ─── Google OAuth Endpoints (Mocked for Testing) ───
@router.get("/google")
async def google_login():
    """Mock Google login – bypasses Google but creates user in DB."""
    email = "google_tester@example.com"
    full_name = "Google Tester"
    
    user = users_collection.find_one({"email": email})
    if not user:
        user = {
            "full_name": full_name,
            "email": email,
            "auth_provider": "google",
            "created_at": datetime.utcnow()
        }
        users_collection.insert_one(user)
    
    internal_token = create_access_token(data={"sub": email})
    user_data = {"name": full_name, "email": email}
    user_b64 = base64.b64encode(json.dumps(user_data).encode()).decode()
    
    return RedirectResponse(url=f"{settings.FRONTEND_URL}/?token={internal_token}&user={user_b64}")

@router.get("/callback/google")
async def google_callback(code: str):
    return RedirectResponse(url=f"{settings.FRONTEND_URL}/")

# ─── GitHub OAuth Endpoints (Mocked for Testing) ───
@router.get("/github")
async def github_login():
    """Mock GitHub login – bypasses GitHub but creates user in DB."""
    email = "github_tester@example.com"
    full_name = "GitHub Tester"
    
    user = users_collection.find_one({"email": email})
    if not user:
        user = {
            "full_name": full_name,
            "email": email,
            "auth_provider": "github",
            "created_at": datetime.utcnow()
        }
        users_collection.insert_one(user)
    
    internal_token = create_access_token(data={"sub": email})
    user_data = {"name": full_name, "email": email}
    user_b64 = base64.b64encode(json.dumps(user_data).encode()).decode()
    
    return RedirectResponse(url=f"{FRONTEND_URL}/?token={internal_token}&user={user_b64}")

@router.get("/callback/github")
async def github_callback(code: str):
    return RedirectResponse(url=f"{FRONTEND_URL}/")
