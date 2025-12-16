# Home Depot Clearance Deals Website

A private, member-only website for displaying Home Depot clearance deals. Built with Next.js, TypeScript, Node.js, and PostgreSQL.

## Features

- 🔐 **WHOP Authentication** - Only active WHOP subscribers can access
- 🔍 **Advanced Search & Filters** - Search by SKU, filter by price endings, category, discount %, location
- 📊 **Real-time Data** - Integrated with paid APIs and optional scraping
- 📱 **Mobile-Friendly** - Responsive design for all devices
- 🎛️ **Admin Panel** - Manage categories, featured items, and settings
- ⚡ **Fast Performance** - Optimized with caching and efficient queries

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL
- **Cache**: Redis
- **Scraping**: Playwright (backup only)

## Setup Instructions

### Prerequisites

- Node.js 18+
- MongoDB (MongoDB Atlas or local)
- Redis (optional, for caching - API works without it)

### Installation

1. **Clone and install dependencies:**
```bash
npm install
```

2. **Set up environment variables:**
Create a `.env` file in the root directory:
```env
# Database (MongoDB)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/homedepot_deals?retryWrites=true&w=majority

# Server
PORT=3001
NODE_ENV=development

# Redis Cache (optional - API works without it)
REDIS_URL=redis://localhost:6379
# OR use separate host/port:
# REDIS_HOST=localhost
# REDIS_PORT=6379

# WHOP API
WHOP_API_KEY=your_whop_api_key
WHOP_CLIENT_ID=your_whop_client_id
WHOP_CLIENT_SECRET=your_whop_client_secret
WHOP_REDIRECT_URI=http://localhost:3000/api/auth/whop/callback

# API Keys
APIFY_API_KEY=your_apify_api_key_here
# OR
HOME_DEPOT_API_KEY=your_api_key_here

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3001
```

3. **Set up database:**
- MongoDB: Use MongoDB Atlas (cloud) or local MongoDB
- Connection string should be in `.env` as `MONGODB_URI`
- Database will be created automatically on first connection

4. **Set up Redis (optional):**
```bash
# Local Redis
redis-server

# Or use Redis cloud service (Redis Cloud, Upstash, etc.)
# Add REDIS_URL to .env
```

4. **Start development servers:**
```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend
npm run dev:server
```

5. **Open in browser:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## Project Structure

```
website/
├── app/                 # Next.js app directory
│   ├── page.tsx        # Home page
│   ├── admin/          # Admin panel
│   └── globals.css     # Global styles
├── components/          # React components
│   ├── Header.tsx
│   ├── DealGrid.tsx
│   ├── DealCard.tsx
│   ├── Filters.tsx
│   └── AdminDashboard.tsx
├── server/             # Backend server
│   ├── index.ts       # Express server
│   ├── routes/        # API routes
│   ├── services/      # Business logic
│   ├── jobs/          # Scheduled jobs
│   ├── db/            # Database files
│   └── middleware/    # Auth middleware
└── types/             # TypeScript types
```

## API Endpoints

### Deals
- `GET /api/deals` - Get all deals with filters
- `GET /api/deals/:id` - Get single deal

### Authentication
- `GET /api/auth/whop/callback` - WHOP OAuth callback
- `POST /api/auth/verify` - Verify membership

### Admin
- `GET /api/admin/categories` - Get all categories
- `POST /api/admin/categories` - Create category
- `PUT /api/admin/categories/:id` - Update category
- `PUT /api/admin/deals/:id/feature` - Feature/unfeature deal
- `GET /api/admin/settings` - Get settings
- `PUT /api/admin/settings` - Update settings
- `GET /api/admin/logs` - Get logs
- `POST /api/admin/refresh` - Trigger data refresh

## Data Pipeline

The system fetches data from paid APIs first, and falls back to scraping if needed:

1. **API Integration** - Connects to paid Home Depot APIs
2. **Data Normalization** - Formats data to standard structure
3. **Database Storage** - Saves deals with availability info
4. **Scheduled Refresh** - Auto-refreshes every 30 minutes (configurable)
5. **Backup Scraper** - Only used when API doesn't provide data

## WHOP Integration

1. User clicks "Login with WHOP"
2. Redirects to WHOP OAuth
3. WHOP returns with authorization code
4. Backend exchanges code for access token
5. Verifies active membership
6. Grants access to website

## Admin Panel

Access at `/admin` (requires WHOP authentication)

Features:
- Manage categories
- Feature/unfeature deals
- Configure refresh intervals
- View system logs
- Manual data refresh

## Deployment

### Prerequisites
- Node.js 18+ installed
- MongoDB database (MongoDB Atlas recommended)
- Redis (optional, for caching)
- PM2 installed globally (`npm install -g pm2`) OR Docker installed

### Option 1: PM2 Deployment (VPS/Server)

1. **Prepare environment:**
```bash
# Copy production environment template
cp env.production.example .env.production
# Edit .env.production with your values
```

2. **Install dependencies:**
```bash
npm ci --only=production
```

3. **Build frontend:**
```bash
npm run build
```

4. **Start with PM2:**
```bash
# Start applications
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup
```

5. **Useful PM2 commands:**
```bash
pm2 status              # Check status
pm2 logs                # View logs
pm2 restart all         # Restart all apps
pm2 stop all            # Stop all apps
pm2 delete all          # Remove all apps
```

### Option 2: Docker Deployment

1. **Prepare environment:**
```bash
# Copy production environment template
cp env.production.example .env.production
# Edit .env.production with your values
```

2. **Start services:**
```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

3. **Individual services:**
```bash
# Start only database services (for development)
docker-compose -f docker-compose.dev.yml up -d

# Rebuild after code changes
docker-compose build
docker-compose up -d
```

### Option 3: Vercel (Frontend) + VPS (Backend)

**Frontend on Vercel:**
```bash
npm run build
vercel deploy
```

**Backend on VPS:**
- Follow PM2 deployment steps above
- Configure CORS to allow Vercel domain
- Update `NEXT_PUBLIC_API_URL` in Vercel environment variables

### Environment Variables for Production

Required variables in `.env.production`:
- `MONGODB_URI` - MongoDB connection string
- `APIFY_API_KEY` - Apify API key
- `WHOP_API_KEY`, `WHOP_CLIENT_ID`, `WHOP_CLIENT_SECRET` - WHOP credentials
- `NEXT_PUBLIC_API_URL` - Backend API URL
- `REDIS_URL` (optional) - Redis connection string

### Health Checks

- Backend: `http://your-api-domain.com/api/health`
- Frontend: `http://your-frontend-domain.com`

### Monitoring

- PM2: `pm2 monit` - Real-time monitoring
- Docker: `docker-compose ps` - Service status
- Logs: Check `./logs/` directory (PM2) or `docker-compose logs` (Docker)

## Maintenance

- Monitor logs in admin panel
- Update API keys as needed
- Adjust refresh intervals based on API limits
- Add new categories as needed

## Support

For issues or questions, check the logs in the admin panel or contact support.
