from fastapi import Header, HTTPException, status
from backend.auth_service import decode_access_token
from backend.db import users_collection
from backend.exceptions import AuthError

async def get_current_user(authorization: str = Header(None)):
    """
    Dependency to retrieve the current user from the Authorization header.
    Raises AuthError if the token is missing, invalid, or expired.
    """
    if not authorization:
        raise AuthError("No Authorization header provided")
        
    if not authorization.startswith("Bearer "):
        raise AuthError("Invalid Authorization header format")
    
    token = authorization.split(" ")[1]
    if token == "null" or token == "undefined":
        raise AuthError("Invalid authentication token provided")

    payload = decode_access_token(token)
    
    if not payload:
        raise AuthError("Authentication token is invalid or expired")
        
    email = payload.get("sub")
    if not email:
        raise AuthError("Authentication token payload is missing identity claim")
        
    user = users_collection.find_one({"email": email})
    if not user:
        raise AuthError(f"User with email '{email}' not found in our database")
    
    return user
