"""Main FastAPI application with Kong-like API Gateway."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from contextlib import asynccontextmanager

from core.config import settings
from core.security_middleware import (
    SecurityHeadersMiddleware,
    RateLimitMiddleware,
    RequestLoggingMiddleware
)
from core.api_gateway import (
    BruteForceProtectionMiddleware,
    IPBlacklistMiddleware,
    RequestIDMiddleware,
    SQLInjectionDetectionMiddleware,
    BotDetectionMiddleware,
    RequestSizeLimitMiddleware,
    APIKeyMiddleware,
)
from sqlalchemy import text
from models.database import init_db, engine
from api.routes import auth, orders, users, packers, tracking, admin, analytics


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.
    
    Handles startup and shutdown events.
    """
    # Startup: Initialize database
    init_db()
    
    # Auto-migration for new columns (safe to run multiple times)
    try:
        with engine.begin() as conn:
            # Dropoff and OTP
            try:
                conn.execute(text("ALTER TABLE orders ADD COLUMN dropoff_location JSON"))
            except Exception:
                pass
            try:
                conn.execute(text("ALTER TABLE orders ADD COLUMN delivery_otp VARCHAR(6)"))
            except Exception:
                pass
            try:
                conn.execute(text("ALTER TABLE orders ADD COLUMN receiver_name VARCHAR"))
            except Exception:
                pass
            try:
                conn.execute(text("ALTER TABLE orders ADD COLUMN receiver_phone VARCHAR"))
            except Exception:
                pass
    except Exception as e:
        print(f"Migration error: {e}")
        
    print("✅ Database initialized and migrated")
    print("✅ Kong-like API Gateway enabled")
    print("✅ Security: Brute force protection (5 attempts → 15-min lockout)")
    print("✅ Security: IP blacklisting (10 violations → 24-hr ban)")
    print("✅ Security: SQL injection detection")
    print("✅ Security: Bot/scanner blocking")
    print("✅ Security: Request size limit (1MB)")
    print("✅ Security: Rate limiting (60 req/min)")
    print("✅ Security: HSTS + CSP + COOP + CORP")
    
    yield
    
    # Shutdown
    print("🛑 Shutting down PackNow")


# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="On-demand professional packaging service API with enterprise security",
    lifespan=lifespan,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)


# ═══════════════════════════════════════════════════════════
# MIDDLEWARE STACK (order matters — first added = outermost)
# Kong-like gateway → Security → Rate limit → Logging → CORS
# ═══════════════════════════════════════════════════════════

# 1. Trusted Hosts
if not settings.DEBUG:
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=[
            "localhost", "127.0.0.1",
            "*.onrender.com",
            "*.vercel.app",
        ]
    )

# 2. GZip compression
app.add_middleware(GZipMiddleware, minimum_size=1000)

# 3. Kong Gateway: Request ID tracking
app.add_middleware(RequestIDMiddleware)

# 4. Kong Gateway: Bot detection
app.add_middleware(BotDetectionMiddleware)

# 5. Kong Gateway: SQL injection detection
app.add_middleware(SQLInjectionDetectionMiddleware)

# 6. Kong Gateway: Request body size limit (1MB)
app.add_middleware(RequestSizeLimitMiddleware, max_size_bytes=1_048_576)

# 7. Kong Gateway: IP blacklisting (auto-ban after 10 rate limit violations)
app.add_middleware(IPBlacklistMiddleware, ban_threshold=10, ban_duration_hours=24)

# 8. Kong Gateway: Brute force protection (5 attempts → 15-min lockout)
app.add_middleware(BruteForceProtectionMiddleware, max_attempts=5, lockout_minutes=15)

# 9. Security Headers (HSTS, CSP, COOP, CORP, COEP)
app.add_middleware(SecurityHeadersMiddleware)

# 10. Rate Limiting (60 req/min per client)
app.add_middleware(RateLimitMiddleware, requests_per_minute=60)

# 11. Request Logging
app.add_middleware(RequestLoggingMiddleware)

# 12. CORS (must be last middleware added)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins(),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    allow_headers=["*"],
    expose_headers=[
        "X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset",
        "X-Request-ID", "X-Gateway", "X-Login-Attempts-Remaining",
    ],
    max_age=600,
)

# Include routers
app.include_router(auth.router, prefix=settings.API_V1_PREFIX)
app.include_router(orders.router, prefix=settings.API_V1_PREFIX)
app.include_router(users.router, prefix=settings.API_V1_PREFIX)
app.include_router(packers.router, prefix=settings.API_V1_PREFIX)
app.include_router(tracking.router, prefix=settings.API_V1_PREFIX)
app.include_router(admin.router, prefix=settings.API_V1_PREFIX)
app.include_router(analytics.router, prefix=settings.API_V1_PREFIX)


@app.get("/")
def root():
    """Root endpoint — no version leakage."""
    return {
        "service": "PackNow API",
        "status": "operational",
        "gateway": "PackNow-Gateway/1.0"
    }


@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )
