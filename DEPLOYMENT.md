# PackNow Deployment Guide

> **TL;DR**: Deploy the entire app (frontend + backend + database) together in under 5 minutes using Railway or Render.

---

## 🚀 Quick Deploy - Integrated Approach (Recommended)

Deploy everything together as one unit - **easiest and fastest!**

---

## 📦 Option 1: Railway - ONE Command Deployment

**Best for**: Students, quick deployment, free monthly credits

Railway deploys your entire Docker Compose setup automatically.

### Step 1: Install Railway CLI

```bash
npm install -g @railway/cli
```

### Step 2: Login and Initialize

```bash
cd "c:\Users\prath\OneDrive - rknec.edu\Desktop\VII\PackNow"
railway login
```

### Step 3: Create New Project

```bash
# Create project
railway init

# Add PostgreSQL database
railway add

# Select "PostgreSQL" from the list
```

### Step 4: Set Environment Variables

```bash
# Generate secret key
railway variables set SECRET_KEY=$(python -c "import secrets; print(secrets.token_urlsafe(64))")

# Set production mode
railway variables set DEBUG=false

# Railway will auto-set DATABASE_URL
```

### Step 5: Deploy!

```bash
railway up
```

That's it! Railway will:
- ✅ Build your backend (FastAPI)
- ✅ Build your frontend (React)
- ✅ Setup PostgreSQL database
- ✅ Setup Redis (if added)
- ✅ Configure networking
- ✅ Provide HTTPS URLs

### Step 6: Get Your URLs

```bash
railway open
```

Your app will be available at:
- Frontend: `https://your-app.up.railway.app`
- Backend: `https://your-app-backend.up.railway.app`

### Railway Free Tier
- ✅ $5 credit/month (resets monthly)
- ✅ ~500 hours runtime
- ✅ All services included
- ✅ No credit card required for trial

---

## 🎯 Option 2: Render - Blueprint Deployment

**Best for**: Long-term free hosting, no credit card

Deploy everything with one YAML file.

### Step 1: Create `render.yaml`

Already created! Located in project root:

```yaml
# render.yaml
databases:
  - name: packnow-db
    databaseName: packnow
    user: packnow_user
    plan: free
    
services:
  # PostgreSQL is auto-created above
  
  # Backend API
  - type: web
    name: packnow-backend
    env: docker
    dockerfilePath: ./backend/Dockerfile
    dockerContext: ./backend
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: packnow-db
          property: connectionString
      - key: SECRET_KEY
        generateValue: true
      - key: DEBUG
        value: false
      - key: ALLOWED_ORIGINS
        value: https://packnow-frontend.onrender.com
    
  # Frontend
  - type: web
    name: packnow-frontend
    env: docker
    dockerfilePath: ./frontend/Dockerfile
    dockerContext: ./frontend
    envVars:
      - key: VITE_API_URL
        value: https://packnow-backend.onrender.com/api/v1
```

### Step 2: Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/PackNow.git
git push -u origin main
```

### Step 3: Deploy on Render

1. Go to https://render.com
2. Click "New +" → "Blueprint"
3. Connect your GitHub repository
4. Select "PackNow" repository
5. Click "Apply"

Render will deploy:
- ✅ PostgreSQL database (free 90 days)
- ✅ Backend service
- ✅ Frontend service
- ✅ All connected automatically

### Step 4: Access Your App

- Frontend: `https://packnow-frontend.onrender.com`
- Backend: `https://packnow-backend.onrender.com`
- API Docs: `https://packnow-backend.onrender.com/docs`

### Render Free Tier
- ✅ 750 hours/month per service
- ✅ Services spin down after 15 min inactivity
- ✅ PostgreSQL free for 90 days
- ✅ Automatic HTTPS

---

## 🐳 Option 3: DigitalOcean App Platform

**Best for**: Production-ready deployment with Docker

Deploy your entire Docker Compose stack.

### Step 1: Create Dockerfiles

**Backend Dockerfile** (`backend/Dockerfile`):
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Frontend Dockerfile** (`frontend/Dockerfile`):
```dockerfile
FROM node:18-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Frontend nginx.conf** (`frontend/nginx.conf`):
```nginx
server {
    listen 80;
    server_name _;
    
    root /usr/share/nginx/html;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Step 2: Deploy to DigitalOcean

1. Push code to GitHub
2. Go to https://cloud.digitalocean.com/apps
3. Click "Create App"
4. Select your GitHub repository
5. DigitalOcean auto-detects Docker Compose
6. Add PostgreSQL database (managed)
7. Set environment variables
8. Deploy!

### Cost
- $5/month basic plan
- Includes 1GB RAM, database

---

## ⚡ Option 4: Fly.io - Global Edge Deployment

**Best for**: Low latency, global deployment

### Quick Deploy

```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Deploy backend
cd backend
fly launch --name packnow-backend --region sin

# Deploy frontend  
cd ../frontend
fly launch --name packnow-frontend --region sin

# Add PostgreSQL
fly postgres create --name packnow-db

# Connect database
fly postgres attach packnow-db --app packnow-backend
```

### Fly.io Free Tier
- ✅ 3 VMs free
- ✅ 3GB persistent storage
- ✅ 160GB bandwidth

---

## 📝 Dockerfile Setup (If Not Using Docker Compose)

If deploying without Docker Compose, create these files:

### Backend Dockerfile

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt requirements_security.txt ./
RUN pip install --no-cache-dir -r requirements.txt -r requirements_security.txt

# Copy application
COPY . .

# Run migrations (optional)
# RUN alembic upgrade head

EXPOSE 8000

CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
```

### Frontend Dockerfile

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

---

## 🔧 Environment Variables for Production

### Backend `.env`

```bash
# Database (Railway/Render auto-provides this)
DATABASE_URL=postgresql://user:password@host:5432/dbname
REDIS_URL=redis://host:6379/0

# Security - GENERATE A STRONG KEY!
SECRET_KEY=<generate using: python -c "import secrets; print(secrets.token_urlsafe(64))">
DEBUG=False
ALLOWED_ORIGINS=https://your-frontend-url.com

# JWT
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
ALGORITHM=HS256
```

### Frontend `.env`

```bash
VITE_API_URL=https://your-backend-url.com/api/v1
```

---

## ✅ Pre-Deployment Checklist

- [ ] Push code to GitHub
- [ ] Create `.env.example` (no secrets)
- [ ] Set `DEBUG=False` in production
- [ ] Generate strong `SECRET_KEY`
- [ ] Whitelist frontend URL in `ALLOWED_ORIGINS`
- [ ] Test locally with production settings
- [ ] Update `VITE_API_URL` to backend URL

---

## 🚀 Quick Comparison

| Platform         | Setup Time | Free Tier       | Integrated Deploy      |
| ---------------- | ---------- | --------------- | ---------------------- |
| **Railway**      | 2 min      | $5/month credit | ✅ Yes (docker-compose) |
| **Render**       | 5 min      | Free forever¹   | ✅ Yes (blueprint)      |
| **Fly.io**       | 5 min      | 3 VMs free      | ✅ Yes (fly.toml)       |
| **DigitalOcean** | 10 min     | $5/month        | ✅ Yes (App Platform)   |

¹ Database free for 90 days

---

## 🎯 Recommended Deployment Path

### For Students (FREE)
```bash
# Railway - Easiest!
npm i -g @railway/cli
railway login
railway init
railway add  # Select PostgreSQL
railway up
```

### For Long-Term Projects
1. Push to GitHub
2. Go to Render.com
3. Use Blueprint (render.yaml)
4. Click Deploy

### For Production
- DigitalOcean App Platform ($5/month)
- Includes managed database, backups, monitoring

---

## 📞 Post-Deployment Testing

After deployment, test:

```bash
# Test backend
curl https://your-backend-url.com/api/v1/health

# Test registration
curl -X POST https://your-backend-url.com/api/v1/auth/register/user \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","phone":"+919999999999","email":"test@test.com","password":"Test123!","location":{"lat":19.07,"lng":72.87}}'
```

Visit frontend URL and:
1. ✅ Register new account
2. ✅ Login
3. ✅ Create order
4. ✅ Check all pages load

---

## 🆘 Troubleshooting

### Backend Won't Start
- Check logs: `railway logs` or Render dashboard
- Verify DATABASE_URL is set
- Ensure all dependencies in requirements.txt

### Frontend Can't Connect to Backend
- Check VITE_API_URL environment variable
- Verify CORS (ALLOWED_ORIGINS) includes frontend URL
- Check network tabs in browser DevTools

### Database Connection Failed
- Verify DATABASE_URL format
- Check database service is running
- Ensure migrations ran

---

## 🎓 Additional Resources

- [Railway Docs](https://docs.railway.app)
- [Render Docs](https://render.com/docs)
- [Docker Deployment Best Practices](https://docs.docker.com/develop/dev-best-practices)
- [FastAPI Deployment Guide](https://fastapi.tiangolo.com/deployment/docker)

---

**Ready to deploy? Choose Railway for the simplest integrated deployment!** 🚀
