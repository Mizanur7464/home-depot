# Deployment Guide

Complete guide for deploying the Home Depot Clearance Deals website to production.

## Quick Start

### PM2 Deployment (Recommended for VPS)
```bash
# 1. Setup environment
cp env.production.example .env.production
# Edit .env.production

# 2. Install and build
npm ci --only=production
npm run build

# 3. Start with PM2
npm run pm2:start
pm2 save
pm2 startup
```

### Docker Deployment
```bash
# 1. Setup environment
cp env.production.example .env.production
# Edit .env.production

# 2. Start services
npm run docker:up
```

## Detailed Instructions

### 1. Environment Setup

1. Copy the production environment template:
```bash
cp env.production.example .env.production
```

2. Edit `.env.production` and fill in:
   - MongoDB connection string
   - Apify API key
   - WHOP credentials
   - Frontend API URL
   - Redis URL (optional)

### 2. Database Setup

#### MongoDB Atlas (Recommended)
1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster
3. Create database user
4. Whitelist your server IP (or 0.0.0.0/0 for all)
5. Get connection string and add to `.env.production`

#### Local MongoDB
```bash
# Using Docker
docker run -d -p 27017:27017 --name mongodb mongo:7
```

### 3. Redis Setup (Optional)

#### Redis Cloud (Recommended)
1. Sign up at [Redis Cloud](https://redis.com/try-free/)
2. Create database
3. Get connection URL
4. Add to `.env.production` as `REDIS_URL`

#### Local Redis
```bash
# Using Docker
docker run -d -p 6379:6379 --name redis redis:7-alpine
```

### 4. Deployment Methods

#### Method A: PM2 (VPS/Server)

**Prerequisites:**
- Node.js 18+ installed
- PM2 installed: `npm install -g pm2`

**Steps:**
```bash
# Install dependencies
npm ci --only=production

# Build frontend
npm run build

# Start applications
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup auto-start on boot
pm2 startup
# Follow the command it outputs

# Check status
pm2 status

# View logs
pm2 logs
```

**PM2 Commands:**
```bash
pm2 status              # Check all apps
pm2 logs                # View all logs
pm2 logs homedepot-backend  # Backend logs only
pm2 restart all          # Restart all
pm2 stop all            # Stop all
pm2 delete all          # Remove all
pm2 monit               # Real-time monitoring
```

#### Method B: Docker Compose

**Prerequisites:**
- Docker and Docker Compose installed

**Steps:**
```bash
# Build images
docker-compose build

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild after code changes
docker-compose build --no-cache
docker-compose up -d
```

**Docker Commands:**
```bash
docker-compose ps           # Check status
docker-compose logs -f      # Follow logs
docker-compose restart      # Restart services
docker-compose down -v      # Stop and remove volumes
```

#### Method C: Vercel (Frontend) + VPS (Backend)

**Frontend on Vercel:**
1. Install Vercel CLI: `npm install -g vercel`
2. Deploy: `vercel --prod`
3. Add environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_API_URL` - Your backend API URL

**Backend on VPS:**
- Follow PM2 deployment steps above
- Configure CORS in `server/index.ts` to allow Vercel domain
- Use reverse proxy (Nginx) for SSL

### 5. Reverse Proxy (Nginx)

Example Nginx configuration:

```nginx
# Frontend
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Backend API
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 6. SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com

# Auto-renewal (already configured)
sudo certbot renew --dry-run
```

### 7. Monitoring & Maintenance

#### Health Checks
- Backend: `http://your-api-domain.com/api/health`
- Frontend: `http://your-frontend-domain.com`

#### Logs
- PM2: `pm2 logs` or check `./logs/` directory
- Docker: `docker-compose logs -f`
- Nginx: `/var/log/nginx/`

#### Updates
```bash
# PM2
git pull
npm ci --only=production
npm run build
pm2 restart all

# Docker
git pull
docker-compose build
docker-compose up -d
```

### 8. Troubleshooting

**Backend not starting:**
- Check MongoDB connection: `mongosh "your-connection-string"`
- Check environment variables: `cat .env.production`
- Check logs: `pm2 logs homedepot-backend` or `docker-compose logs backend`

**Frontend not loading:**
- Check build: `npm run build`
- Check API URL: Ensure `NEXT_PUBLIC_API_URL` is correct
- Check CORS settings in backend

**Database connection issues:**
- Verify MongoDB Atlas IP whitelist
- Check connection string format
- Test connection: `mongosh "your-connection-string"`

**Redis connection issues:**
- Redis is optional - API works without it
- Check Redis URL format
- Test connection: `redis-cli -u "your-redis-url" ping`

## Production Checklist

- [ ] Environment variables configured
- [ ] MongoDB database created and accessible
- [ ] Redis configured (optional)
- [ ] Frontend built successfully
- [ ] Backend health check passing
- [ ] SSL certificate installed
- [ ] Domain DNS configured
- [ ] CORS settings configured
- [ ] PM2/Docker services running
- [ ] Logs directory created (PM2)
- [ ] Auto-restart configured
- [ ] Monitoring setup
- [ ] Backup strategy in place

## Support

For issues:
1. Check logs: `pm2 logs` or `docker-compose logs`
2. Check health endpoint: `/api/health`
3. Verify environment variables
4. Check database connectivity

