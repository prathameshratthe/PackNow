# PackNow Deployment Script for Windows
# Run this in PowerShell

Write-Host "🚀 PackNow Deployment Script" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan
Write-Host ""

# Check if Vercel CLI is installed
$vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue

if (-not $vercelInstalled) {
    Write-Host "📦 Installing Vercel CLI..." -ForegroundColor Yellow
    npm install -g vercel
}

Write-Host ""
Write-Host "🎯 Deploying Frontend to Vercel (FREE FOREVER)" -ForegroundColor Green
Write-Host "-----------------------------------------------" -ForegroundColor Green
Write-Host ""
Write-Host "This will:" -ForegroundColor White
Write-Host "1. Build your React frontend"
Write-Host "2. Deploy to Vercel's global CDN"
Write-Host "3. Give you a live URL in 2 minutes"
Write-Host ""
Write-Host "You'll need to login to Vercel when prompted." -ForegroundColor Yellow
Write-Host ""

Read-Host "Press Enter to continue"

# Navigate to frontend
Set-Location frontend

# Deploy to Vercel
Write-Host ""
Write-Host "🚀 Deploying..." -ForegroundColor Cyan
vercel --prod

Write-Host ""
Write-Host "✅ Frontend Deployed!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Go to https://vercel.com/dashboard"
Write-Host "2. Click on your project"
Write-Host "3. Go to Settings → Environment Variables"
Write-Host "4. Add: VITE_API_URL = http://localhost:8000/api/v1"
Write-Host "   (or your deployed backend URL)"
Write-Host "5. Redeploy (click 'Deployments' → latest → '...' → 'Redeploy')"
Write-Host ""
Write-Host "🎉 Your frontend will be live!" -ForegroundColor Green
Write-Host ""
Write-Host "For backend deployment, go to:" -ForegroundColor Yellow
Write-Host "https://dashboard.render.com" -ForegroundColor Cyan
Write-Host "And follow the Render deployment guide!" -ForegroundColor Yellow
Write-Host ""
