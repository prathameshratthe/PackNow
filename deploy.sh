#!/bin/bash

echo "🚀 PackNow Deployment Script"
echo "=============================="
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null
then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

echo ""
echo "🎯 Deploying Frontend to Vercel (FREE FOREVER)"
echo "-----------------------------------------------"
echo ""
echo "This will:"
echo "1. Build your React frontend"
echo "2. Deploy to Vercel's global CDN"
echo "3. Give you a live URL in 2 minutes"
echo ""
echo "You'll need to login to Vercel when prompted."
echo ""

read -p "Press Enter to continue..."

# Navigate to frontend
cd frontend

# Deploy to Vercel
echo ""
echo "🚀 Deploying..."
vercel --prod

echo ""
echo "✅ Frontend Deployed!"
echo ""
echo "📝 Next Steps:"
echo "1. Go to https://vercel.com/dashboard"
echo "2. Click on your project"
echo "3. Go to Settings → Environment Variables"
echo "4. Add: VITE_API_URL = http://localhost:8000/api/v1"
echo "5. Redeploy (click 'Deployments' → latest → '...' → 'Redeploy')"
echo ""
echo "🎉 Your frontend will be live!"
echo ""
