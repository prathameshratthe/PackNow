# PackNow - Local Development Setup (Without Docker)

## Prerequisites

You have:
- ✅ Python 3.13
- ✅ Node.js v22

You'll need to install:
- PostgreSQL 15+
- Redis 7+ (optional for caching)

---

## Quick Setup (Using SQLite Instead)

If you don't want to install PostgreSQL, I can help you modify the backend to use SQLite for local development:

### Step 1: Install Backend Dependencies

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

### Step 2: Configure Environment

Create `backend\.env` file:
```env
# SQLite Configuration (simpler for local dev)
DATABASE_URL=sqlite:///./packnow.db
REDIS_URL=redis://localhost:6379/0
SECRET_KEY=local-dev-secret-key-min-32-chars-long
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
DEBUG=True
ALLOWED_ORIGINS=http://localhost:3000
BASE_PACKING_FEE=50
PRICE_PER_KM=10
URGENT_MULTIPLIER=1.5
```

### Step 3: Run Backend

```bash
cd backend
venv\Scripts\activate
python seed_db.py
uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be at: http://localhost:8000
API Docs: http://localhost:8000/docs

### Step 4: Install Frontend Dependencies

Open a NEW terminal:
```bash
cd frontend
npm install
```

### Step 5: Configure Frontend Environment

Create `frontend\.env`:
```env
VITE_API_URL=http://localhost:8000/api/v1
```

### Step 6: Run Frontend

```bash
cd frontend
npm run dev
```

Frontend will be at: http://localhost:3000

---

## With PostgreSQL (Production-like)

If you have PostgreSQL installed:

### 1. Create Database

```sql
CREATE DATABASE packnow;
CREATE USER postgres WITH PASSWORD 'postgres';
GRANT ALL PRIVILEGES ON DATABASE packnow TO postgres;
```

### 2. Update backend\.env

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/packnow
# ... rest same as above
```

### 3. Follow steps 1, 3, 4, 5, 6 above

---

## Alternative: Install Docker Desktop

**Easiest option** - one command to run everything:

1. Download: https://www.docker.com/products/docker-desktop/
2. Install and start Docker Desktop
3. Run:
   ```bash
   docker-compose up --build
   ```

This handles PostgreSQL, Redis, backend, and frontend automatically!

---

## Testing the Application

1. **Open browser**: http://localhost:3000
2. **Sign up**: Create account with phone +919999999999
3. **Create order**: Select Electronics, enter dimensions, see price estimate
4. **View dashboard**: See your order with status
5. **API docs**: http://localhost:8000/docs - Try endpoints directly

## Demo Packer Credentials

Phone: +919876543210
Password: packer123
