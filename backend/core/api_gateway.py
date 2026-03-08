"""
Kong-Like API Gateway Middleware.

Provides enterprise-grade API security features equivalent to Kong API Gateway:
- Brute Force Protection (login lockout after failed attempts)
- IP Blacklisting (auto-ban on abuse)
- Request ID Tracking (X-Request-ID for tracing)
- SQL Injection Detection (pattern matching on params)
- Bot Detection (suspicious User-Agent blocking)
- API Key Authentication (optional X-API-Key header)
- Request Body Size Limiting
"""
from fastapi import Request, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from datetime import datetime, timedelta
from typing import Dict, Set
from collections import OrderedDict
import hashlib
import uuid
import re


# ═══════════════════════════════════════════════════════════
# 1. BRUTE FORCE PROTECTION
# ═══════════════════════════════════════════════════════════

class BruteForceProtectionMiddleware(BaseHTTPMiddleware):
    """
    Kong-style login rate limiter.
    Locks out IPs after repeated failed login attempts.
    
    Config:
        max_attempts: Max failed logins before lockout (default: 5)
        lockout_minutes: How long the lockout lasts (default: 15)
    """

    def __init__(self, app, max_attempts: int = 5, lockout_minutes: int = 15):
        super().__init__(app)
        self.max_attempts = max_attempts
        self.lockout_minutes = lockout_minutes
        # IP -> [timestamps of failed attempts]
        self.failed_attempts: Dict[str, list] = {}
        # IP -> lockout_expiry
        self.locked_ips: Dict[str, datetime] = {}

    def _get_ip(self, request: Request) -> str:
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        return request.client.host if request.client else "unknown"

    async def dispatch(self, request: Request, call_next):
        # Only apply to login endpoints
        login_paths = ["/api/v1/auth/login/user", "/api/v1/auth/login/packer", "/api/v1/auth/login/admin"]
        if request.url.path not in login_paths or request.method != "POST":
            return await call_next(request)

        ip = self._get_ip(request)
        now = datetime.utcnow()

        # Check if IP is locked out
        if ip in self.locked_ips:
            if now < self.locked_ips[ip]:
                remaining = int((self.locked_ips[ip] - now).total_seconds())
                return JSONResponse(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    content={
                        "detail": f"Account temporarily locked due to too many failed attempts. Try again in {remaining} seconds.",
                        "locked_until": self.locked_ips[ip].isoformat(),
                        "retry_after": remaining
                    },
                    headers={"Retry-After": str(remaining)}
                )
            else:
                # Lockout expired
                del self.locked_ips[ip]
                self.failed_attempts.pop(ip, None)

        response = await call_next(request)

        # Track failed login attempts (401 = bad credentials)
        if response.status_code == 401:
            if ip not in self.failed_attempts:
                self.failed_attempts[ip] = []

            # Prune old attempts
            window = now - timedelta(minutes=self.lockout_minutes)
            self.failed_attempts[ip] = [t for t in self.failed_attempts[ip] if t > window]
            self.failed_attempts[ip].append(now)

            attempts_left = self.max_attempts - len(self.failed_attempts[ip])

            if len(self.failed_attempts[ip]) >= self.max_attempts:
                self.locked_ips[ip] = now + timedelta(minutes=self.lockout_minutes)
                return JSONResponse(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    content={
                        "detail": f"Too many failed login attempts. Account locked for {self.lockout_minutes} minutes.",
                        "retry_after": self.lockout_minutes * 60
                    },
                    headers={"Retry-After": str(self.lockout_minutes * 60)}
                )

            # Add warning header
            response.headers["X-Login-Attempts-Remaining"] = str(max(0, attempts_left))

        elif response.status_code == 200:
            # Successful login — clear failed attempts
            self.failed_attempts.pop(ip, None)

        return response


# ═══════════════════════════════════════════════════════════
# 2. IP BLACKLISTING
# ═══════════════════════════════════════════════════════════

class IPBlacklistMiddleware(BaseHTTPMiddleware):
    """
    Kong-style IP restriction plugin.
    Auto-bans IPs that trigger rate limits repeatedly.
    
    Manually blacklisted IPs are blocked permanently.
    Auto-banned IPs are blocked for ban_duration_hours.
    """

    def __init__(self, app, ban_threshold: int = 10, ban_duration_hours: int = 24):
        super().__init__(app)
        self.ban_threshold = ban_threshold
        self.ban_duration_hours = ban_duration_hours
        # IP -> count of rate limit violations
        self.violations: Dict[str, int] = {}
        # IP -> ban expiry
        self.banned_ips: Dict[str, datetime] = {}
        # Permanent blacklist (loaded from config)
        self.permanent_blacklist: Set[str] = set()

    def _get_ip(self, request: Request) -> str:
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        return request.client.host if request.client else "unknown"

    async def dispatch(self, request: Request, call_next):
        ip = self._get_ip(request)
        now = datetime.utcnow()

        # Check permanent blacklist
        if ip in self.permanent_blacklist:
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"detail": "Access denied"}
            )

        # Check auto-ban
        if ip in self.banned_ips:
            if now < self.banned_ips[ip]:
                return JSONResponse(
                    status_code=status.HTTP_403_FORBIDDEN,
                    content={"detail": "IP temporarily blocked due to abuse"}
                )
            else:
                del self.banned_ips[ip]
                self.violations.pop(ip, None)

        response = await call_next(request)

        # Track rate limit violations
        if response.status_code == 429:
            self.violations[ip] = self.violations.get(ip, 0) + 1
            if self.violations[ip] >= self.ban_threshold:
                self.banned_ips[ip] = now + timedelta(hours=self.ban_duration_hours)
                return JSONResponse(
                    status_code=status.HTTP_403_FORBIDDEN,
                    content={"detail": f"IP blocked for {self.ban_duration_hours} hours due to repeated abuse"}
                )

        return response


# ═══════════════════════════════════════════════════════════
# 3. REQUEST ID TRACKING (Kong Correlation ID)
# ═══════════════════════════════════════════════════════════

class RequestIDMiddleware(BaseHTTPMiddleware):
    """
    Kong-style correlation ID plugin.
    Adds X-Request-ID to all requests/responses for distributed tracing.
    """

    async def dispatch(self, request: Request, call_next):
        # Use existing request ID or generate new
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        
        # Store in request state for logging
        request.state.request_id = request_id

        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Gateway"] = "PackNow-Gateway/1.0"
        
        return response


# ═══════════════════════════════════════════════════════════
# 4. SQL INJECTION DETECTION
# ═══════════════════════════════════════════════════════════

class SQLInjectionDetectionMiddleware(BaseHTTPMiddleware):
    """
    Kong-style request transformer with SQL injection pattern matching.
    Blocks requests containing common SQL injection patterns.
    """

    SQL_PATTERNS = [
        r"(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|EXEC|EXECUTE)\b.*\b(FROM|INTO|TABLE|SET|WHERE|DATABASE)\b)",
        r"(--)|(;--)|(/\*)",
        r"(\b(OR|AND)\b\s+\d+\s*=\s*\d+)",
        r"(\'.*\b(OR|AND)\b.*\')",
        r"(\bSLEEP\s*\(\d+\))",
        r"(\bBENCHMARK\s*\()",
        r"(\bWAITFOR\s+DELAY\b)",
        r"(CHAR\s*\(\d+\))",
    ]

    def __init__(self, app):
        super().__init__(app)
        self.compiled_patterns = [re.compile(p, re.IGNORECASE) for p in self.SQL_PATTERNS]

    def _check_sqli(self, value: str) -> bool:
        """Check if a string contains SQL injection patterns."""
        for pattern in self.compiled_patterns:
            if pattern.search(value):
                return True
        return False

    async def dispatch(self, request: Request, call_next):
        # Check query parameters
        for key, value in request.query_params.items():
            if self._check_sqli(value) or self._check_sqli(key):
                return JSONResponse(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    content={"detail": "Potentially malicious request blocked"}
                )

        # Check URL path
        if self._check_sqli(request.url.path):
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={"detail": "Potentially malicious request blocked"}
            )

        return await call_next(request)


# ═══════════════════════════════════════════════════════════
# 5. BOT DETECTION
# ═══════════════════════════════════════════════════════════

class BotDetectionMiddleware(BaseHTTPMiddleware):
    """
    Kong-style bot detection plugin.
    Blocks requests from known bad bots and empty User-Agents.
    """

    BAD_BOTS = [
        "sqlmap", "nikto", "nmap", "masscan", "dirbuster",
        "gobuster", "wfuzz", "hydra", "zgrab", "nuclei",
        "havij", "acunetix", "nessus", "openvas", "burpsuite",
    ]

    async def dispatch(self, request: Request, call_next):
        # Skip for health/docs endpoints
        if request.url.path in ["/health", "/", "/docs", "/redoc", "/openapi.json"]:
            return await call_next(request)

        user_agent = request.headers.get("User-Agent", "").lower()

        # Block empty user agents on API endpoints
        if not user_agent and request.url.path.startswith("/api/"):
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"detail": "Request blocked: missing User-Agent"}
            )

        # Block known attack tools
        for bot in self.BAD_BOTS:
            if bot in user_agent:
                return JSONResponse(
                    status_code=status.HTTP_403_FORBIDDEN,
                    content={"detail": "Access denied"}
                )

        return await call_next(request)


# ═══════════════════════════════════════════════════════════
# 6. REQUEST BODY SIZE LIMITER
# ═══════════════════════════════════════════════════════════

class RequestSizeLimitMiddleware(BaseHTTPMiddleware):
    """
    Kong-style request size limiting plugin.
    Prevents DoS attacks via oversized payloads.
    """

    def __init__(self, app, max_size_bytes: int = 1_048_576):  # 1MB default
        super().__init__(app)
        self.max_size_bytes = max_size_bytes

    async def dispatch(self, request: Request, call_next):
        content_length = request.headers.get("Content-Length")

        if content_length and int(content_length) > self.max_size_bytes:
            return JSONResponse(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                content={
                    "detail": f"Request body too large. Maximum size: {self.max_size_bytes // 1024}KB",
                    "max_size": self.max_size_bytes
                }
            )

        return await call_next(request)


# ═══════════════════════════════════════════════════════════
# 7. API KEY AUTHENTICATION (for third-party integrations)
# ═══════════════════════════════════════════════════════════

class APIKeyMiddleware(BaseHTTPMiddleware):
    """
    Kong-style API key authentication plugin.
    Optional X-API-Key header for third-party/webhook integrations.
    Normal JWT auth still works for all endpoints.
    """

    def __init__(self, app, api_keys: set = None, protected_prefixes: list = None):
        super().__init__(app)
        self.api_keys = api_keys or set()
        self.protected_prefixes = protected_prefixes or ["/api/v1/webhooks"]

    async def dispatch(self, request: Request, call_next):
        # Only enforce on explicitly protected prefixes
        is_protected = any(request.url.path.startswith(p) for p in self.protected_prefixes)

        if is_protected and self.api_keys:
            api_key = request.headers.get("X-API-Key")
            if not api_key or api_key not in self.api_keys:
                return JSONResponse(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    content={"detail": "Invalid or missing API key"},
                    headers={"WWW-Authenticate": "API-Key"}
                )

        return await call_next(request)

