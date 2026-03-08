"""
OWASP Top 10 Security Test Suite for PackNow API.

Tests cover:
1. SQL Injection      6. Rate Limit enforcement
2. XSS Prevention     7. Security Headers
3. Brute Force        8. Large Payload rejection
4. JWT Manipulation   9. Missing Auth
5. IDOR Protection   10. CORS validation
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Set test environment before any app imports
os.environ["DATABASE_URL"] = "sqlite:///./test_packnow.db"
os.environ["SECRET_KEY"] = "test-secret-key-for-security-testing-only"
os.environ["DEBUG"] = "true"
os.environ["DB_HOST"] = "localhost"

from fastapi.testclient import TestClient
from api.main import app

client = TestClient(app)

# ═══════════════════════════════════════════════════════════
# Helper: Register + Login to get a valid token
# ═══════════════════════════════════════════════════════════

def get_auth_token(phone="+1234567890", password="Test@1234", name="SecurityTester", email="sec@test.com"):
    """Create a user and return JWT token."""
    # Try to register
    client.post("/api/v1/auth/register/user", json={
        "name": name, "email": email, "phone": phone, "password": password
    })
    # Login
    resp = client.post("/api/v1/auth/login/user", json={
        "phone": phone, "password": password
    })
    if resp.status_code == 200:
        return resp.json().get("access_token")
    return None


# ═══════════════════════════════════════════════════════════
# TEST 1: SQL INJECTION
# ═══════════════════════════════════════════════════════════

class TestSQLInjection:
    """Test SQL injection protection."""

    def test_sqli_in_query_params(self):
        """SQL injection in query parameters should be blocked."""
        payloads = [
            "1 OR 1=1",
            "'; DROP TABLE users;--",
            "1 UNION SELECT * FROM users",
            "SLEEP(5)",
            "BENCHMARK(1000000,SHA1('test'))",
        ]
        for payload in payloads:
            resp = client.get(f"/api/v1/orders/?search={payload}")
            assert resp.status_code in [400, 401, 403, 404, 422], \
                f"SQL injection not blocked: {payload}"

    def test_sqli_in_url_path(self):
        """SQL injection in URL path should be blocked."""
        resp = client.get("/api/v1/orders/1 OR 1=1")
        assert resp.status_code in [400, 404, 422]

    def test_sqli_in_login(self):
        """SQL injection in login fields should be safe."""
        resp = client.post("/api/v1/auth/login/user", json={
            "phone": "' OR '1'='1",
            "password": "' OR '1'='1"
        })
        assert resp.status_code in [400, 401, 422]


# ═══════════════════════════════════════════════════════════
# TEST 2: XSS PREVENTION
# ═══════════════════════════════════════════════════════════

class TestXSSPrevention:
    """Test XSS protection."""

    def test_xss_in_registration(self):
        """XSS payload in registration should be handled safely."""
        xss_payloads = [
            "<script>alert('xss')</script>",
            "<img src=x onerror=alert(1)>",
            "javascript:alert(1)",
        ]
        for payload in xss_payloads:
            resp = client.post("/api/v1/auth/register/user", json={
                "name": payload,
                "email": "xss@test.com",
                "phone": "+1234567891",
                "password": "Test@1234"
            })
            # Should either reject or sanitize the input
            if resp.status_code == 201:
                data = resp.json()
                assert "<script>" not in str(data), "XSS payload stored unsanitized"

    def test_xss_headers(self):
        """X-XSS-Protection header should be present."""
        resp = client.get("/")
        assert resp.headers.get("X-XSS-Protection") == "1; mode=block"
        assert "nosniff" in resp.headers.get("X-Content-Type-Options", "")


# ═══════════════════════════════════════════════════════════
# TEST 3: BRUTE FORCE PROTECTION
# ═══════════════════════════════════════════════════════════

class TestBruteForce:
    """Test brute force protection."""

    def test_login_lockout_after_failed_attempts(self):
        """Account should lock after 5 failed login attempts."""
        for i in range(6):
            resp = client.post("/api/v1/auth/login/user", json={
                "phone": "+9999999999",
                "password": f"wrong_password_{i}"
            })
        # After 5+ attempts, should get 429
        resp = client.post("/api/v1/auth/login/user", json={
            "phone": "+9999999999",
            "password": "another_wrong"
        })
        assert resp.status_code == 429, "Brute force protection not triggered"

    def test_warning_header_on_failed_login(self):
        """X-Login-Attempts-Remaining header should appear on failed logins."""
        resp = client.post("/api/v1/auth/login/user", json={
            "phone": "+8888888888",
            "password": "wrong_password"
        })
        # May or may not have the header depending on 401 vs other status
        if resp.status_code == 401:
            # Header should be present
            assert "X-Login-Attempts-Remaining" in resp.headers or resp.status_code == 429


# ═══════════════════════════════════════════════════════════
# TEST 4: JWT MANIPULATION
# ═══════════════════════════════════════════════════════════

class TestJWTSecurity:
    """Test JWT token security."""

    def test_expired_token_rejected(self):
        """Expired JWT should be rejected."""
        from jose import jwt
        from datetime import datetime, timedelta
        
        expired_token = jwt.encode(
            {"sub": "1", "role": "user", "exp": datetime.utcnow() - timedelta(hours=1), "token_type": "access"},
            "fake_secret", algorithm="HS256"
        )
        resp = client.get("/api/v1/users/me", headers={"Authorization": f"Bearer {expired_token}"})
        assert resp.status_code == 401

    def test_tampered_token_rejected(self):
        """Tampered JWT should be rejected."""
        resp = client.get("/api/v1/users/me", headers={
            "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.tampered"
        })
        assert resp.status_code == 401

    def test_no_internal_error_leak(self):
        """JWT errors should not leak internal information."""
        resp = client.get("/api/v1/users/me", headers={
            "Authorization": "Bearer invalid.token.here"
        })
        assert resp.status_code == 401
        detail = resp.json().get("detail", "")
        # Should NOT contain internal details like "Signature has expired"
        assert "Signature" not in detail
        assert "JWTError" not in detail
        assert "expired" not in detail.lower() or "credentials" in detail.lower()

    def test_wrong_role_token_rejected(self):
        """Token with wrong role should be rejected on role-specific endpoints."""
        token = get_auth_token()
        if token:
            # User token should NOT work on admin endpoints
            resp = client.get("/api/v1/admin/dashboard", headers={
                "Authorization": f"Bearer {token}"
            })
            assert resp.status_code in [401, 403]


# ═══════════════════════════════════════════════════════════
# TEST 5: IDOR PROTECTION
# ═══════════════════════════════════════════════════════════

class TestIDOR:
    """Test Insecure Direct Object Reference protection."""

    def test_cannot_access_other_users_orders(self):
        """User should not access another user's orders."""
        token = get_auth_token()
        if token:
            # Try to access order ID 99999 (not owned by this user)
            resp = client.get("/api/v1/orders/99999", headers={
                "Authorization": f"Bearer {token}"
            })
            assert resp.status_code in [403, 404], "IDOR vulnerability: can access other user's order"

    def test_cannot_cancel_other_users_orders(self):
        """User should not be able to cancel another user's order."""
        token = get_auth_token()
        if token:
            resp = client.delete("/api/v1/orders/99999", headers={
                "Authorization": f"Bearer {token}"
            })
            assert resp.status_code in [403, 404]


# ═══════════════════════════════════════════════════════════
# TEST 6: RATE LIMITING
# ═══════════════════════════════════════════════════════════

class TestRateLimiting:
    """Test rate limiting enforcement."""

    def test_rate_limit_headers_present(self):
        """Rate limit headers should be present on API responses."""
        resp = client.get("/api/v1/auth/register/user",)
        # GET on a POST endpoint might 405, but any API response should have headers
        resp2 = client.get("/")
        headers = resp2.headers
        assert "X-RateLimit-Limit" in headers
        assert "X-RateLimit-Remaining" in headers

    def test_health_check_not_rate_limited(self):
        """Health check should not be rate limited."""
        for _ in range(100):
            resp = client.get("/health")
        assert resp.status_code == 200


# ═══════════════════════════════════════════════════════════
# TEST 7: SECURITY HEADERS
# ═══════════════════════════════════════════════════════════

class TestSecurityHeaders:
    """Test security headers on responses."""

    def test_strict_transport_security(self):
        resp = client.get("/")
        hsts = resp.headers.get("Strict-Transport-Security", "")
        assert "max-age=31536000" in hsts
        assert "includeSubDomains" in hsts
        assert "preload" in hsts

    def test_content_security_policy(self):
        resp = client.get("/")
        csp = resp.headers.get("Content-Security-Policy", "")
        assert "default-src 'self'" in csp
        assert "frame-ancestors 'none'" in csp
        assert "base-uri 'self'" in csp

    def test_xframe_options(self):
        resp = client.get("/")
        assert resp.headers.get("X-Frame-Options") == "DENY"

    def test_cross_origin_policies(self):
        resp = client.get("/")
        assert resp.headers.get("Cross-Origin-Opener-Policy") == "same-origin"
        assert resp.headers.get("Cross-Origin-Resource-Policy") == "same-origin"

    def test_referrer_policy(self):
        resp = client.get("/")
        assert resp.headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"

    def test_request_id_tracking(self):
        resp = client.get("/")
        assert "X-Request-ID" in resp.headers
        assert "X-Gateway" in resp.headers

    def test_no_version_leak(self):
        """Root endpoint should not expose application version."""
        resp = client.get("/")
        data = resp.json()
        assert "version" not in data


# ═══════════════════════════════════════════════════════════
# TEST 8: LARGE PAYLOAD REJECTION
# ═══════════════════════════════════════════════════════════

class TestPayloadLimits:
    """Test request body size limits."""

    def test_oversized_payload_rejected(self):
        """Requests larger than 1MB should be rejected."""
        # 2MB payload
        large_payload = {"data": "x" * (2 * 1024 * 1024)}
        resp = client.post("/api/v1/auth/login/user", json=large_payload)
        assert resp.status_code in [401, 413, 422], "Large payload not rejected"


# ═══════════════════════════════════════════════════════════
# TEST 9: MISSING AUTH ENFORCEMENT
# ═══════════════════════════════════════════════════════════

class TestAuthEnforcement:
    """Test that protected endpoints require authentication."""

    def test_orders_require_auth(self):
        resp = client.get("/api/v1/orders/")
        assert resp.status_code in [401, 403]

    def test_user_profile_requires_auth(self):
        resp = client.get("/api/v1/users/me")
        assert resp.status_code in [401, 403]

    def test_admin_dashboard_requires_auth(self):
        resp = client.get("/api/v1/admin/dashboard")
        assert resp.status_code in [401, 403]

    def test_analytics_requires_auth(self):
        resp = client.get("/api/v1/admin/analytics/revenue")
        assert resp.status_code in [401, 403]

    def test_tracking_requires_auth(self):
        resp = client.get("/api/v1/orders/1/tracking")
        assert resp.status_code in [401, 403]


# ═══════════════════════════════════════════════════════════
# TEST 10: BOT DETECTION
# ═══════════════════════════════════════════════════════════

class TestBotDetection:
    """Test bot/scanner detection."""

    def test_sqlmap_blocked(self):
        """SQLMap user agent should be blocked."""
        resp = client.get("/api/v1/orders/", headers={"User-Agent": "sqlmap/1.0"})
        assert resp.status_code == 403

    def test_nikto_blocked(self):
        """Nikto scanner should be blocked."""
        resp = client.get("/api/v1/orders/", headers={"User-Agent": "Nikto/2.1.6"})
        assert resp.status_code == 403

    def test_normal_browser_allowed(self):
        """Normal browser User-Agent should be allowed."""
        resp = client.get("/", headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0"
        })
        assert resp.status_code == 200
