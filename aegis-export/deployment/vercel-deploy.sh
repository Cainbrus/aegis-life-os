#!/bin/bash

# Aegis Frontend Deployment Script for Vercel
echo "🚀 Deploying Aegis Frontend to Vercel..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "Installing Vercel CLI..."
    npm install -g vercel
fi

# Navigate to frontend directory
cd /app/frontend

# Create production environment file
echo "Creating production environment..."
read -p "Enter your Railway backend URL (from previous step): " BACKEND_URL

cat > .env.production << EOF
REACT_APP_BACKEND_URL=$BACKEND_URL
EOF

# Create vercel.json for routing
cat > vercel.json << EOF
{
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "$BACKEND_URL/api/\$1"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
EOF

# Login to Vercel (will open browser)
echo "Please login to Vercel when prompted..."
vercel login

# Deploy to Vercel
echo "Deploying frontend..."
vercel --prod

# Get the deployed URL
FRONTEND_URL=$(vercel ls --scope=$(vercel whoami) | grep aegis | head -1 | awk '{print $2}')
echo "✅ Frontend deployed at: https://$FRONTEND_URL"

# Set up custom domain (if you have one)
read -p "Do you have a custom domain? (y/n): " HAS_DOMAIN

if [ "$HAS_DOMAIN" = "y" ]; then
    read -p "Enter your domain (e.g., aegis-os.com): " CUSTOM_DOMAIN
    vercel domains add $CUSTOM_DOMAIN
    vercel alias set $FRONTEND_URL $CUSTOM_DOMAIN
    echo "✅ Custom domain configured: https://$CUSTOM_DOMAIN"
fi

echo "🎉 Frontend deployment complete!"
echo "🌍 Aegis is now LIVE at: https://$FRONTEND_URL"