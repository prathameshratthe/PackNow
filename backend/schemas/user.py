"""User schemas for request/response validation."""
from typing import Optional, Dict
from pydantic import BaseModel, EmailStr, constr
from datetime import datetime


class UserBase(BaseModel):
    """Base user schema with common fields."""
    name: constr(min_length=1, max_length=255)
    phone: constr(pattern=r'^\+?[0-9]{10,15}$')
    email: Optional[EmailStr] = None


class UserCreate(UserBase):
    """Schema for user registration."""
    password: constr(min_length=6)
    location: Optional[Dict[str, float]] = None  # {lat, lng, address}


class UserLogin(BaseModel):
    """Schema for user login."""
    phone: str
    password: str


class UserResponse(UserBase):
    """Schema for user response."""
    id: int
    location: Optional[Dict] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    """Schema for authentication token response."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
