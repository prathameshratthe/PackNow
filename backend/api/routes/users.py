"""User management routes."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from models.database import get_db
from models.user import User
from schemas.user import UserResponse
from api.deps import get_current_user


router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserResponse)
def get_user_profile(current_user: User = Depends(get_current_user)):
    """
    Get current user profile.
    
    Args:
        current_user: Authenticated user
        
    Returns:
        User profile
    """
    return current_user
