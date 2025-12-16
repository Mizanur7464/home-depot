#!/bin/bash

# Deployment script for production
set -e

echo "🚀 Starting deployment..."

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo "❌ Error: .env.production file not found"
    echo "💡 Copy .env.production.example to .env.production and fill in your values"
    exit 1
fi

# Build frontend
echo "📦 Building frontend..."
npm run build

# Build Docker images (if using Docker)
if [ "$1" == "docker" ]; then
    echo "🐳 Building Docker images..."
    docker-compose -f docker-compose.yml build
    
    echo "🐳 Starting services..."
    docker-compose -f docker-compose.yml up -d
    
    echo "✅ Deployment complete!"
    echo "📊 Check status: docker-compose ps"
    echo "📋 View logs: docker-compose logs -f"
else
    # PM2 deployment
    echo "📦 Installing production dependencies..."
    npm ci --only=production
    
    echo "🔄 Starting with PM2..."
    pm2 start ecosystem.config.js --env production
    
    echo "💾 Saving PM2 configuration..."
    pm2 save
    
    echo "✅ Deployment complete!"
    echo "📊 Check status: pm2 status"
    echo "📋 View logs: pm2 logs"
fi

echo "🎉 Deployment finished!"

