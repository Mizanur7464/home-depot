# PowerShell deployment script for Windows
param(
    [string]$Method = "pm2"
)

Write-Host "🚀 Starting deployment..." -ForegroundColor Green

# Check if .env.production exists
if (-not (Test-Path ".env.production")) {
    Write-Host "❌ Error: .env.production file not found" -ForegroundColor Red
    Write-Host "💡 Copy .env.production.example to .env.production and fill in your values" -ForegroundColor Yellow
    exit 1
}

# Build frontend
Write-Host "📦 Building frontend..." -ForegroundColor Cyan
npm run build

if ($Method -eq "docker") {
    # Docker deployment
    Write-Host "🐳 Building Docker images..." -ForegroundColor Cyan
    docker-compose -f docker-compose.yml build
    
    Write-Host "🐳 Starting services..." -ForegroundColor Cyan
    docker-compose -f docker-compose.yml up -d
    
    Write-Host "✅ Deployment complete!" -ForegroundColor Green
    Write-Host "📊 Check status: docker-compose ps" -ForegroundColor Yellow
    Write-Host "📋 View logs: docker-compose logs -f" -ForegroundColor Yellow
} else {
    # PM2 deployment
    Write-Host "📦 Installing production dependencies..." -ForegroundColor Cyan
    npm ci --only=production
    
    Write-Host "🔄 Starting with PM2..." -ForegroundColor Cyan
    pm2 start ecosystem.config.js --env production
    
    Write-Host "💾 Saving PM2 configuration..." -ForegroundColor Cyan
    pm2 save
    
    Write-Host "✅ Deployment complete!" -ForegroundColor Green
    Write-Host "📊 Check status: pm2 status" -ForegroundColor Yellow
    Write-Host "📋 View logs: pm2 logs" -ForegroundColor Yellow
}

Write-Host "🎉 Deployment finished!" -ForegroundColor Green

