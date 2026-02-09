"""API dependencies for authentication and database."""
from typing import Generator, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from models.database import get_db
from models.user import User
from models.packer import Packer
from core.security import decode_token, verify_token_type
from core.constants import TOKEN_TYPE_ACCESS, UserRole


security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Dependency to get current authenticated user.
    
    Args:
        credentials: HTTP bearer credentials
        db: Database session
        
    Returns:
        Current user
        
    Raises:
        HTTPException: If user not found or token invalid
    """
    token = credentials.credentials
    payload = decode_token(token)
    verify_token_type(payload, TOKEN_TYPE_ACCESS)
    
    user_id: Optional[int] = int(payload.get("sub")) if payload.get("sub") else None
    user_role: Optional[str] = payload.get("role")
    
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )
    
    if user_role != UserRole.USER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized as user",
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    
    return user


def get_current_packer(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> Packer:
    """
    Dependency to get current authenticated packer.
    
    Args:
        credentials: HTTP bearer credentials
        db: Database session
        
    Returns:
        Current packer
        
    Raises:
        HTTPException: If packer not found or token invalid
    """
    token = credentials.credentials
    payload = decode_token(token)
    verify_token_type(payload, TOKEN_TYPE_ACCESS)
    
    packer_id: Optional[int] = int(payload.get("sub")) if payload.get("sub") else None
    user_role: Optional[str] = payload.get("role")
    
    if packer_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )
    
    if user_role != UserRole.PACKER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized as packer",
        )
    
    packer = db.query(Packer).filter(Packer.id == packer_id).first()
    
    if packer is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Packer not found",
        )
    
    return packer
