"""
Authentication API Routes
Handles user registration, login, and session management
"""

from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, timedelta
import secrets

router = APIRouter()


# ===== Pydantic Models =====

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    display_name: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class GoogleAuth(BaseModel):
    token: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: dict

class UserResponse(BaseModel):
    id: str
    email: str
    display_name: Optional[str]
    role: str
    created_at: str


# ===== Mock User Database =====
# In production, this connects to Supabase

mock_users = {}


# ===== Routes =====

@router.post("/register", response_model=TokenResponse)
async def register(user: UserRegister):
    """
    Register a new user with email and password
    """
    if user.email in mock_users:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create user
    user_id = secrets.token_hex(16)
    mock_users[user.email] = {
        "id": user_id,
        "email": user.email,
        "password_hash": user.password,  # In production: hash the password
        "display_name": user.display_name or user.email.split("@")[0],
        "role": "FREE",
        "created_at": datetime.utcnow().isoformat()
    }
    
    # Generate token
    access_token = secrets.token_urlsafe(32)
    
    return TokenResponse(
        access_token=access_token,
        expires_in=3600,
        user={
            "id": user_id,
            "email": user.email,
            "display_name": mock_users[user.email]["display_name"],
            "role": "FREE"
        }
    )


@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    """
    Login with email and password
    """
    user = mock_users.get(credentials.email)
    
    if not user or user["password_hash"] != credentials.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Generate token
    access_token = secrets.token_urlsafe(32)
    
    return TokenResponse(
        access_token=access_token,
        expires_in=3600,
        user={
            "id": user["id"],
            "email": user["email"],
            "display_name": user["display_name"],
            "role": user["role"]
        }
    )


@router.post("/google")
async def google_auth(auth: GoogleAuth):
    """
    Authenticate with Google OAuth token
    """
    # In production: Verify Google token with Supabase
    # For demo, create/login user
    
    mock_email = "google_user@example.com"
    
    if mock_email not in mock_users:
        user_id = secrets.token_hex(16)
        mock_users[mock_email] = {
            "id": user_id,
            "email": mock_email,
            "display_name": "Google User",
            "role": "FREE",
            "created_at": datetime.utcnow().isoformat()
        }
    
    user = mock_users[mock_email]
    access_token = secrets.token_urlsafe(32)
    
    return TokenResponse(
        access_token=access_token,
        expires_in=3600,
        user={
            "id": user["id"],
            "email": user["email"],
            "display_name": user["display_name"],
            "role": user["role"]
        }
    )


@router.post("/refresh")
async def refresh_token():
    """
    Refresh access token
    """
    new_token = secrets.token_urlsafe(32)
    return {
        "access_token": new_token,
        "token_type": "bearer",
        "expires_in": 3600
    }


@router.post("/logout")
async def logout():
    """
    Logout user (invalidate session)
    """
    return {"success": True, "message": "Logged out successfully"}


@router.get("/me", response_model=UserResponse)
async def get_current_user():
    """
    Get current authenticated user
    """
    # In production: Verify JWT token and return user
    return UserResponse(
        id="demo_user_id",
        email="user@example.com",
        display_name="Demo User",
        role="FREE",
        created_at=datetime.utcnow().isoformat()
    )
