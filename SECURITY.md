# PackNow Security Configuration & Best Practices

## Implemented Security Features

### 1. **Authentication & Authorization**
- ✅ JWT-based authentication with access and refresh tokens
- ✅ Secure password hashing with bcrypt
- ✅ Role-based access control (User vs Packer)
- ✅ Token refresh mechanism to maintain sessions securely
- ✅ Password strength validation (min 8 chars, uppercase, lowercase, digit, special char)
- ✅ Phone number validation (international format)

### 2. **HTTP Security Headers**
All responses include:
- `X-Content-Type-Options: nosniff` - Prevents MIME sniffing
- `X-Frame-Options: DENY` - Prevents clickjacking
- `X-XSS-Protection: 1; mode=block` - XSS protection
- `Strict-Transport-Security` - Forces HTTPS
- `Content-Security-Policy` - Restricts resource loading
- `Referrer-Policy` - Controls referrer information
- `Permissions-Policy` - Restricts dangerous browser features

### 3. **Rate Limiting**
- 60 requests per minute per client
- Client fingerprinting based on IP + User-Agent
- Rate limit headers exposed: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- 429 Too Many Requests with Retry-After header

### 4. **CORS Configuration**
- Whitelisted origins only
- Credentials support enabled
- Specific HTTP methods allowed (GET, POST, PUT, DELETE, PATCH)
- Preflight request caching (10 minutes)

### 5. **Input Validation**
- Phone number format validation
- Password strength requirements
- XSS prevention through input sanitization
- SQL injection prevention (SQLAlchemy ORM parameterization)

### 6. **Session Management**
- Short-lived access tokens (15 minutes - configurable)
- Long-lived refresh tokens (7 days - configurable)
- Secure token storage in localStorage (frontend)
- Automatic token refresh mechanism
- Token invalidation on 401 errors

### 7. **Middleware Stack** (Ordered)
1. Trusted Host validation
2. GZip compression
3. Security headers
4. Rate limiting
5. Request logging
6. CORS

### 8. **Production Features**
- API documentation disabled in production
- Debug mode conditional features
- Request/Response logging for auditing
- Compressed responses (GZip)
- Host header validation

## Configuration

### Environment Variables (Production)

```bash
# Security
SECRET_KEY=<64+ character random string>
DEBUG=False
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# JWT
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
ALGORITHM=HS256

# Database (use strong passwords)
DATABASE_URL=postgresql://user:strong_password@host:5432/dbname

# Redis
REDIS_URL=redis://redis:6379/0
```

### Generating Secure SECRET_KEY

```python
import secrets
print(secrets.token_urlsafe(64))
```

## Security Best Practices

### Frontend
1. **Never store sensitive data in localStorage without encryption**
2. **Always validate form inputs client-side AND server-side**
3. **Use HTTPS in production (enforce HSTS)**
4. **Implement CSRF tokens for state-changing operations**
5. **Sanitize user input before rendering**
6. **Keep dependencies updated**

### Backend
1. **Always use parameterized queries (SQLAlchemy ORM)**
2. **Never expose internal error details to clients in production**
3. **Log security events (failed logins, rate limit hits)**
4. **Rotate secrets regularly**
5. **Use environment variables for secrets (never hardcode)**
6. **Implement database connection pooling**
7. **Enable database query logging in development only**

### Infrastructure
1. **Use HTTPS/TLS everywhere**
2. **Enable firewall rules**
3. **Keep OS and packages updated**
4. **Use Docker image scanning**
5. **Implement backup strategy**
6. **Monitor for suspicious activity**
7. **Use managed services for databases (RDS, Cloud SQL)**
8. **Enable audit logging**

## Additional Security Recommendations

### 1. Add CAPTCHA
Prevent bot attacks on registration/login:
```python
# Add recaptcha validation
import requests

def verify_recaptcha(token):
    response = requests.post(
        'https://www.google.com/recaptcha/api/siteverify',
        data={'secret': RECAPTCHA_SECRET, 'response': token}
    )
    return response.json().get('success', False)
```

### 2. Implement Account Lockout
Prevent brute force attacks:
```python
# Track failed login attempts
failed_attempts = {}  # Use Redis in production

def check_lockout(phone):
    if phone in failed_attempts:
        if failed_attempts[phone]['count'] >= 5:
            lockout_time = failed_attempts[phone]['locked_until']
            if datetime.utcnow() < lockout_time:
                raise HTTPException(
                    status_code=429,
                    detail="Account temporarily locked due to too many failed attempts"
                )
```

### 3. Enable Two-Factor Authentication (2FA)
```python
# Send OTP via SMS
from twilio.rest import Client

def send_otp(phone, code):
    client = Client(TWILIO_SID, TWILIO_TOKEN)
    client.messages.create(
        to=phone,
        from_=TWILIO_PHONE,
        body=f"Your PackNow verification code: {code}"
    )
```

### 4. Add Email Verification
```python
# Generate verification token
import secrets

verification_token = secrets.token_urlsafe(32)
# Send email with verification link
```

### 5. Implement Audit Logging
```python
# Log all security-relevant events
class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer)
    action = Column(String)  # login, logout, order_created, etc.
    ip_address = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)
    metadata = Column(JSON)
```

### 6. Database Security
```sql
-- Use read-only replicas for reporting
-- Enable SSL connections
-- Implement row-level security
-- Regular backups and point-in-time recovery
```

### 7. API Security
- Implement API versioning (`/api/v1`, `/api/v2`)
- Use API keys for third-party integrations
- Implement webhook signature verification
- Rate limit per endpoint (stricter for sensitive operations)

### 8. Container Security
```dockerfile
# Use non-root user
USER appuser

# Scan images
RUN trivy filesystem --no-progress /

# Minimal base images
FROM python:3.11-slim-alpine
```

## Compliance Checklist

### OWASP Top 10 2021
- [x] A01:2021 - Broken Access Control → Role-based auth
- [x] A02:2021 - Cryptographic Failures → bcrypt, HTTPS, JWT
- [x] A03:2021 - Injection → Parameterized queries, input validation
- [x] A04:2021 - Insecure Design → Security by design
- [x] A05:2021 - Security Misconfiguration → Security headers, disabled debug in prod
- [x] A06:2021 - Vulnerable Components → Dependency management
- [x] A07:2021 - Auth Failures → Strong password policy, JWT
- [x] A08:2021 - Data Integrity → Input validation
- [x] A09:2021 - Logging Failures → Request logging
- [x] A10:2021 - SSRF → Input validation, no user-controlled URLs

### GDPR Compliance
- Implement data export feature
- Add account deletion endpoint
- Log consent for data processing
- Encrypt PII at rest
- Implement data retention policies

## Penetration Testing Checklist

Before going to production, test for:
1. SQL Injection
2. XSS (Stored, Reflected, DOM-based)
3. CSRF
4. Authentication bypass
5. Authorization bypass
6. Session fixation
7. Brute force attacks
8. Directory traversal
9. File upload vulnerabilities
10. API parameter manipulation

## Monitoring & Alerting

Set up alerts for:
- High rate of 401/403 errors
- Rate limit threshold breaches
- Database connection failures
- Unusual traffic patterns
- Failed login attempts spike
- Disk space warnings
- Memory/CPU spikes

## Regular Security Maintenance

- [ ] Weekly dependency updates
- [ ] Monthly security audits
- [ ] Quarterly penetration testing
- [ ] Rotate secrets every 90 days
- [ ] Review access logs monthly
- [ ] Update security headers as needed
- [ ] Test backup restoration quarterly

## Security Incident Response Plan

1. **Detect**: Monitor logs and alerts
2. **Contain**: Isolate affected systems
3. **Eradicate**: Remove threat
4. **Recover**: Restore services
5. **Lessons Learned**: Document and improve

---

**Last Updated**: 2026-02-10  
**Version**: 1.0.0  
**Maintainer**: PackNow Security Team
