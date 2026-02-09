"""Authentication routes."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from models.database import get_db
from models.user import User
from models.packer import Packer
from schemas.user import UserCreate, UserLogin, UserResponse, TokenResponse
from schemas.packer import PackerCreate, PackerResponse
from core.security import hash_password, verify_password, create_access_token, create_refresh_token
from core.constants import UserRole


router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register/user", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user.
    
    Args:
        user_data: User registration data
        db: Database session
        
    Returns:
        Created user
        
    Raises:
        HTTPException: If phone or email already exists
    """
    # Validate input
    from core.security_middleware import validate_phone_number, validate_password_strength
    
    if not validate_phone_number(user_data.phone):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid phone number format. Use international format: +[country code][number]"
        )
    
    is_valid, error_msg = validate_password_strength(user_data.password)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_msg
        )
    
    # Check if user already exists
    existing_user = db.query(User).filter(User.phone == user_data.phone).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone number already registered"
        )
    
    if user_data.email:
        existing_email = db.query(User).filter(User.email == user_data.email).first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
    
    # Create new user
    new_user = User(
        name=user_data.name,
        phone=user_data.phone,
        email=user_data.email,
        password_hash=hash_password(user_data.password),
        location=user_data.location
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    print(f"✅ New user registered: {new_user.phone}")
    
    return new_user


@router.post("/register/packer", response_model=PackerResponse, status_code=status.HTTP_201_CREATED)
def register_packer(packer_data: PackerCreate, db: Session = Depends(get_db)):
    """
    Register a new packer.
    
    Args:
        packer_data: Packer registration data
        db: Database session
        
    Returns:
        Created packer
        
    Raises:
        HTTPException: If phone or email already exists
    """
    # Validate input
    from core.security_middleware import validate_phone_number, validate_password_strength
    
    if not validate_phone_number(packer_data.phone):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid phone number format. Use international format: +[country code][number]"
        )
    
    is_valid, error_msg = validate_password_strength(packer_data.password)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_msg
        )
    
    # Check if packer already exists
    existing_packer = db.query(Packer).filter(Packer.phone == packer_data.phone).first()
    if existing_packer:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone number already registered"
        )
    
    if packer_data.email:
        existing_email = db.query(Packer).filter(Packer.email == packer_data.email).first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
    
    # Create new packer
    new_packer = Packer(
        name=packer_data.name,
        phone=packer_data.phone,
        email=packer_data.email,
        password_hash=hash_password(packer_data.password),
        lat=packer_data.lat,
        lng=packer_data.lng,
        inventory=packer_data.inventory
    )
    
    db.add(new_packer)
    db.commit()
    db.refresh(new_packer)
    
    print(f"✅ New packer registered: {new_packer.phone}")
    
    return new_packer


@router.post("/login/user", response_model=TokenResponse)
def login_user(login_data: UserLogin, db: Session = Depends(get_db)):
    """
    Login user and return JWT tokens.
    
    Args:
        login_data: Login credentials
        db: Database session
        
    Returns:
        Access and refresh tokens
        
    Raises:
        HTTPException: If credentials are invalid
    """
    user = db.query(User).filter(User.phone == login_data.phone).first()
    
    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect phone or password"
        )
    
    # Create tokens
    access_token = create_access_token(data={"sub": str(user.id), "role": UserRole.USER})
    refresh_token = create_refresh_token(data={"sub": str(user.id), "role": UserRole.USER})
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }


@router.post("/login/packer", response_model=TokenResponse)
def login_packer(login_data: UserLogin, db: Session = Depends(get_db)):
    """
    Login packer and return JWT tokens.
    
    Args:
        login_data: Login credentials
        db: Database session
        
    Returns:
        Access and refresh tokens
        
    Raises:
        HTTPException: If credentials are invalid
    """
    packer = db.query(Packer).filter(Packer.phone == login_data.phone).first()
    
    if not packer or not verify_password(login_data.password, packer.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect phone or password"
        )
    
    # Create tokens
    access_token = create_access_token(data={"sub": str(packer.id), "role": UserRole.PACKER})
    refresh_token = create_refresh_token(data={"sub": str(packer.id), "role": UserRole.PACKER})
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }


@router.post("/refresh", response_model=TokenResponse)
def refresh_access_token(refresh_token: str, db: Session = Depends(get_db)):
    """
    Refresh access token using refresh token.
    
    Args:
        refresh_token: Valid refresh token
        db: Database session
        
    Returns:
        New access and refresh tokens
        
    Raises:
        HTTPException: If refresh token is invalid
    """
    from core.security import decode_token, verify_token_type, create_access_token, create_refresh_token
    from core.constants import TOKEN_TYPE_REFRESH
    
    try:
        # Decode and verify refresh token
        payload = decode_token(refresh_token)
        verify_token_type(payload, TOKEN_TYPE_REFRESH)
        
        user_id = payload.get("sub")
        role = payload.get("role")
        
        if not user_id or not role:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
        
        # Create new tokens
        new_access_token = create_access_token(data={"sub": user_id, "role": role})
        new_refresh_token = create_refresh_token(data={"sub": user_id, "role": role})
        
        print(f"✅ Token refreshed for user/packer: {user_id}")
        
        return {
            "access_token": new_access_token,
            "refresh_token": new_refresh_token,
            "token_type": "bearer"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )
