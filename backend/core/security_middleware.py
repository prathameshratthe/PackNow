"""Security middleware and utilities."""
from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from datetime import datetime, timedelta
from typing import Dict
import hashlib


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add security headers to all responses."""
    
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        
        # Security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        
        return response


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Simple rate limiting middleware."""
    
    def __init__(self, app, requests_per_minute: int = 60):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.requests: Dict[str, list] = {}
    
    def _get_client_id(self, request: Request) -> str:
        """Get unique client identifier."""
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            ip = forwarded.split(",")[0].strip()
        else:
            ip = request.client.host if request.client else "unknown"
        
        # Include user agent for better fingerprinting
        user_agent = request.headers.get("User-Agent", "")
        client_id = hashlib.sha256(f"{ip}:{user_agent}".encode()).hexdigest()
        return client_id
    
    async def dispatch(self, request: Request, call_next):
        # Skip rate limiting for health checks
        if request.url.path in ["/health", "/docs", "/redoc", "/openapi.json"]:
            return await call_next(request)
        
        client_id = self._get_client_id(request)
        now = datetime.utcnow()
        minute_ago = now - timedelta(minutes=1)
        
        # Clean old requests
        if client_id in self.requests:
            self.requests[client_id] = [
                req_time for req_time in self.requests[client_id]
                if req_time > minute_ago
            ]
        else:
            self.requests[client_id] = []
        
        # Check rate limit
        if len(self.requests[client_id]) >= self.requests_per_minute:
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "detail": "Too many requests. Please try again later.",
                    "retry_after": 60
                },
                headers={"Retry-After": "60"}
            )
        
        # Record this request
        self.requests[client_id].append(now)
        
        response = await call_next(request)
        
        # Add rate limit headers
        remaining = self.requests_per_minute - len(self.requests[client_id])
        response.headers["X-RateLimit-Limit"] = str(self.requests_per_minute)
        response.headers["X-RateLimit-Remaining"] = str(max(0, remaining))
        response.headers["X-RateLimit-Reset"] = str(int((now + timedelta(minutes=1)).timestamp()))
        
        return response


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Log all requests for security monitoring."""
    
    async def dispatch(self, request: Request, call_next):
        start_time = datetime.utcnow()
        
        # Log request
        client_host = request.client.host if request.client else "unknown"
        print(f"[{start_time.isoformat()}] {request.method} {request.url.path} from {client_host}")
        
        response = await call_next(request)
        
        # Log response
        duration = (datetime.utcnow() - start_time).total_seconds()
        print(f"[{datetime.utcnow().isoformat()}] Response {response.status_code} in {duration:.2f}s")
        
        return response


def sanitize_input(value: str) -> str:
    """Sanitize user input to prevent XSS."""
    if not value:
        return value
    
    # Remove potentially dangerous characters
    dangerous_chars = ['<', '>', '"', "'", '&', '`']
    for char in dangerous_chars:
        value = value.replace(char, '')
    
    return value.strip()


def validate_phone_number(phone: str) -> bool:
    """Validate phone number format."""
    import re
    # International format: +[country code][number]
    pattern = r'^\+\d{10,15}$'
    return bool(re.match(pattern, phone))


def validate_password_strength(password: str) -> tuple[bool, str]:
    """
    Validate password strength.
    
    Returns:
        Tuple of (is_valid, error_message)
    """
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    
    if not any(c.isupper() for c in password):
        return False, "Password must contain at least one uppercase letter"
    
    if not any(c.islower() for c in password):
        return False, "Password must contain at least one lowercase letter"
    
    if not any(c.isdigit() for c in password):
        return False, "Password must contain at least one digit"
    
    # Check for special characters
    special_chars = "!@#$%^&*()_+-=[]{}|;:,.<>?"
    if not any(c in special_chars for c in password):
        return False, "Password must contain at least one special character"
    
    return True, ""
