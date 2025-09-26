#!/bin/bash

# Aegis Backend Deployment Script for Railway
echo "🚀 Deploying Aegis Backend to Railway..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "Installing Railway CLI..."
    npm install -g @railway/cli
fi

# Navigate to backend directory
cd /app/backend

# Create railway.json configuration
cat > railway.json << EOF
{
  "build": {
    "builder": "nixpacks"
  },
  "deploy": {
    "startCommand": "python server.py",
    "healthcheckPath": "/api",
    "healthcheckTimeout": 100,
    "restartPolicyType": "on_failure"
  }
}
EOF

# Create Procfile for Railway
cat > Procfile << EOF
web: python server.py
EOF

# Login to Railway (will open browser)
echo "Please login to Railway when prompted..."
railway login

# Initialize Railway project
railway init

# Set environment variables
echo "Setting up environment variables..."
railway variables set MONGO_URL="mongodb+srv://aegis:$(openssl rand -base64 12)@cluster0.mongodb.net/aegis_production"
railway variables set DB_NAME="aegis_production"  
railway variables set EMERGENT_LLM_KEY="your_emergent_key_here"
railway variables set PORT="8001"

# Deploy to Railway
echo "Deploying backend..."
railway up

# Get the deployed URL
BACKEND_URL=$(railway status --json | jq -r '.deployments[0].url')
echo "✅ Backend deployed at: $BACKEND_URL"
echo "Save this URL - you'll need it for frontend deployment!"

echo "🎉 Backend deployment complete!"