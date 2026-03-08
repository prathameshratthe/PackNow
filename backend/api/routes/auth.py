"""Authentication routes."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from models.database import get_db
from models.user import User
from models.packer import Packer
from schemas.user import UserCreate, UserLogin, UserResponse, TokenResponse, AdminLogin
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


@router.post("/login/admin", response_model=TokenResponse)
def login_admin(login_data: AdminLogin, db: Session = Depends(get_db)):
    """
    Login admin with email + password + admin secret key (two-factor).
    
    Args:
        login_data: Admin login credentials with secret key
        db: Database session
        
    Returns:
        Access and refresh tokens
        
    Raises:
        HTTPException: If credentials are invalid or admin key is wrong
    """
    from models.admin import Admin
    from schemas.user import AdminLogin as AdminLoginSchema
    from core.config import settings
    import hmac
    
    # Validate admin secret key FIRST (prevents timing attacks)
    if not hmac.compare_digest(login_data.admin_key, settings.ADMIN_SECRET_KEY):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"  # Generic message — don't reveal which field failed
        )
    
    admin = db.query(Admin).filter(Admin.email == login_data.email).first()
    
    if not admin or not verify_password(login_data.password, admin.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    # Create tokens
    access_token = create_access_token(data={"sub": str(admin.id), "role": UserRole.ADMIN})
    refresh_token = create_refresh_token(data={"sub": str(admin.id), "role": UserRole.ADMIN})
    
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


# ═══════════════════════════════════════════════════════════
# FORGOT PASSWORD — SMS OTP Flow
# ═══════════════════════════════════════════════════════════

import random
import string
import time

from pydantic import BaseModel
from services.email import email_service

# In-memory OTP store: { phone: { "otp": "123456", "expires": timestamp } }
_password_reset_otps = {}


class ForgotPasswordRequest(BaseModel):
    phone: str
    role: str = "user"  # "user" or "packer"


class VerifyOTPRequest(BaseModel):
    phone: str
    otp: str
    role: str = "user"


class ResetPasswordRequest(BaseModel):
    phone: str
    otp: str
    new_password: str
    role: str = "user"


@router.post("/forgot-password/request-otp")
def request_password_reset_otp(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Send a 6-digit OTP via SMS for password reset."""
    
    # Find the user/packer
    if request.role == "packer":
        account = db.query(Packer).filter(Packer.phone == request.phone).first()
    else:
        account = db.query(User).filter(User.phone == request.phone).first()
    
    if not account:
        # Don't reveal whether the phone exists — always return success
        return {"message": "If this phone number is registered, you will receive an OTP."}
        
    if not account.email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No email address is associated with this account. Cannot send password reset link."
        )
    
    # Generate 6-digit OTP
    otp = ''.join(random.choices(string.digits, k=6))
    
    # Store with 5-minute expiry
    _password_reset_otps[request.phone] = {
        "otp": otp,
        "expires": time.time() + 300,  # 5 minutes
        "role": request.role,
        "verified": False
    }
    
    # Send Email OTP
    html_content = f"""
    <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
        <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center;">
            <h2 style="color: #1a56db; margin-bottom: 20px;">PackNow Password Reset</h2>
            <p style="color: #4b5563; text-align: left; line-height: 1.6;">Hello {account.name},</p>
            <p style="color: #4b5563; text-align: left; line-height: 1.6;">You requested a password reset for your PackNow account. Use the following OTP to proceed:</p>
            <div style="margin: 30px 0; padding: 20px; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px;">
                <p style="font-size: 32px; font-weight: bold; font-family: monospace; letter-spacing: 8px; color: #15803d; margin: 0;">{otp}</p>
            </div>
            <p style="color: #6b7280; font-size: 14px; text-align: left;">This OTP is valid for <strong>5 minutes</strong>. If you did not request this reset, please ignore this email.</p>
        </div>
    </div>
    """
    email_service.send_email(
        to_email=account.email,
        subject="Your PackNow Password Reset OTP",
        html_content=html_content
    )
    
    return {"message": "If this phone number is registered and has an email, you will receive an OTP."}


@router.post("/forgot-password/verify-otp")
def verify_password_reset_otp(request: VerifyOTPRequest):
    """Verify the OTP sent for password reset."""
    
    stored = _password_reset_otps.get(request.phone)
    
    if not stored:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No OTP found for this number. Please request a new one."
        )
    
    if time.time() > stored["expires"]:
        del _password_reset_otps[request.phone]
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP has expired. Please request a new one."
        )
    
    if stored["otp"] != request.otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OTP. Please try again."
        )
    
    # Mark as verified
    _password_reset_otps[request.phone]["verified"] = True
    
    return {"message": "OTP verified successfully. You can now reset your password."}


@router.post("/forgot-password/reset-password")
def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Reset password after successful OTP verification."""
    
    stored = _password_reset_otps.get(request.phone)
    
    if not stored or not stored.get("verified"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please verify your OTP first."
        )
    
    if time.time() > stored["expires"]:
        del _password_reset_otps[request.phone]
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP has expired. Please request a new one."
        )
    
    if stored["otp"] != request.otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OTP."
        )
    
    # Validate new password strength
    from core.security_middleware import validate_password_strength
    is_valid, error_msg = validate_password_strength(request.new_password)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_msg
        )
    
    # Find account and update password
    if request.role == "packer":
        account = db.query(Packer).filter(Packer.phone == request.phone).first()
    else:
        account = db.query(User).filter(User.phone == request.phone).first()
    
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found."
        )
    
    account.password_hash = hash_password(request.new_password)
    db.commit()
    
    # Clean up OTP
    del _password_reset_otps[request.phone]
    
    return {"message": "Password reset successfully. You can now log in with your new password."}
