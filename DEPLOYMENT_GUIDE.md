# 🚀 Server Deployment Guide - 24/7 চালু রাখার জন্য

## সার্ভার Requirements

### Option 1: VPS (Virtual Private Server)
- **Recommended**: DigitalOcean, AWS EC2, Linode, Vultr
- **Minimum Specs**:
  - 2 CPU cores
  - 2GB RAM
  - 20GB SSD
  - Ubuntu 20.04+ / Debian 11+

### Option 2: Dedicated Server
- Any Linux server with root access

---

## 📋 Pre-Deployment Checklist

### 1. Server Setup
- [ ] Server purchased/ready
- [ ] SSH access configured
- [ ] Domain name pointed to server IP (optional but recommended)
- [ ] Firewall configured (ports 3000, 3001, 22)

### 2. Database Setup
- [ ] MongoDB Atlas account created (recommended)
- [ ] OR MongoDB installed on server
- [ ] Connection string ready

### 3. Environment Variables
- [ ] WHOP credentials ready
- [ ] Apify API key ready
- [ ] MongoDB connection string ready
- [ ] Redis setup (optional)

---

## 🔧 Step-by-Step Deployment

### Step 1: Connect to Server

```bash
ssh root@your-server-ip
# OR
ssh username@your-server-ip
```

### Step 2: Install Required Software

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should be 18.x or higher
npm --version

# Install PM2 globally (for process management)
sudo npm install -g pm2

# Install Git (if not installed)
sudo apt install -y git

# Install Redis (optional, for caching)
sudo apt install -y redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

### Step 3: Upload Code to Server

**Option A: Using Git (Recommended)**
```bash
# On server
cd /var/www  # or any directory you prefer
git clone https://github.com/your-username/your-repo.git homedepot-deals
cd homedepot-deals
```

**Option B: Using SCP (from local machine)**
```bash
# From your local machine
scp -r /path/to/website root@your-server-ip:/var/www/homedepot-deals
```

**Option C: Using SFTP**
- Use FileZilla or WinSCP to upload files

### Step 4: Install Dependencies

```bash
cd /var/www/homedepot-deals

# Install all dependencies
npm install

# OR for production only
npm ci --only=production
```

### Step 5: Configure Environment Variables

```bash
# Copy production environment template
cp env.production.example .env.production

# Edit environment file
nano .env.production
# OR
vi .env.production
```

**Fill in these values:**
```env
NODE_ENV=production
PORT=3001

# MongoDB (use MongoDB Atlas connection string)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/homedepot_deals?retryWrites=true&w=majority

# Redis (if installed on server)
REDIS_URL=redis://localhost:6379

# WHOP API
WHOP_API_KEY=your_whop_api_key
WHOP_CLIENT_ID=your_whop_client_id
WHOP_CLIENT_SECRET=your_whop_client_secret
WHOP_REDIRECT_URI=https://yourdomain.com/api/auth/whop/callback

# Apify API
APIFY_API_KEY=your_apify_api_key_here

# Frontend URL
NEXT_PUBLIC_API_URL=https://yourdomain.com
# OR if backend on different domain
NEXT_PUBLIC_API_URL=https://api.yourdomain.com

# Frontend URL (for redirects)
FRONTEND_URL=https://yourdomain.com
```

**Save and exit:**
- Nano: `Ctrl+X`, then `Y`, then `Enter`
- Vi: `:wq`, then `Enter`

### Step 6: Build Frontend

```bash
npm run build
```

### Step 7: Start with PM2 (24/7 Running)

```bash
# Start both frontend and backend
pm2 start ecosystem.config.js --env production

# Save PM2 configuration (so it persists after reboot)
pm2 save

# Setup PM2 to start on system boot
pm2 startup
# Follow the command it outputs (usually: sudo env PATH=... pm2 startup systemd -u username --hp /home/username)

# Check status
pm2 status

# View logs
pm2 logs
```

### Step 8: Configure Firewall

```bash
# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow your application ports (if not using reverse proxy)
sudo ufw allow 3000/tcp  # Frontend
sudo ufw allow 3001/tcp  # Backend

# Enable firewall
sudo ufw enable
```

### Step 9: Setup Reverse Proxy (Recommended)

**Install Nginx:**
```bash
sudo apt install -y nginx
```

**Configure Nginx for Frontend:**
```bash
sudo nano /etc/nginx/sites-available/homedepot-deals
```

**Add this configuration:**
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Enable site:**
```bash
sudo ln -s /etc/nginx/sites-available/homedepot-deals /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl restart nginx
```

**Configure Nginx for Backend API:**
```bash
sudo nano /etc/nginx/sites-available/homedepot-api
```

```nginx
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
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/homedepot-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 10: Setup SSL Certificate (HTTPS)

**Install Certbot:**
```bash
sudo apt install -y certbot python3-certbot-nginx
```

**Get SSL Certificate:**
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
sudo certbot --nginx -d api.yourdomain.com
```

**Auto-renewal (already configured by certbot):**
```bash
sudo certbot renew --dry-run  # Test renewal
```

### Step 11: Verify Everything Works

```bash
# Check PM2 status
pm2 status

# Check logs
pm2 logs

# Check if ports are listening
sudo netstat -tlnp | grep -E '3000|3001'

# Test API
curl http://localhost:3001/api/health

# Test Frontend
curl http://localhost:3000
```

---

## 🐳 Alternative: Docker Deployment

If you prefer Docker:

### Step 1-4: Same as above (server setup, upload code)

### Step 5: Install Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install -y docker-compose

# Add user to docker group (optional)
sudo usermod -aG docker $USER
```

### Step 6: Configure Environment

```bash
cp env.production.example .env.production
nano .env.production
# Fill in all values
```

### Step 7: Start with Docker

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Check status
docker-compose ps
```

### Step 8: Setup Nginx (same as above)

---

## 📊 Monitoring & Maintenance

### PM2 Commands

```bash
pm2 status              # Check application status
pm2 logs                # View all logs
pm2 logs homedepot-backend    # View backend logs only
pm2 logs homedepot-frontend   # View frontend logs only
pm2 restart all         # Restart all apps
pm2 restart homedepot-backend # Restart backend only
pm2 stop all            # Stop all apps
pm2 delete all          # Remove all apps
pm2 monit               # Real-time monitoring
```

### Docker Commands

```bash
docker-compose ps           # Check status
docker-compose logs -f      # View logs
docker-compose restart      # Restart services
docker-compose down         # Stop services
docker-compose up -d        # Start services
```

### Update Application

```bash
# Pull latest code
git pull origin main

# Install new dependencies (if any)
npm install

# Rebuild frontend
npm run build

# Restart PM2
pm2 restart all

# OR for Docker
docker-compose build
docker-compose up -d
```

---

## 🔒 Security Checklist

- [ ] Firewall configured (UFW)
- [ ] SSH key authentication (disable password login)
- [ ] SSL certificate installed (HTTPS)
- [ ] Environment variables secured (not in git)
- [ ] MongoDB access restricted (IP whitelist)
- [ ] Regular backups configured
- [ ] PM2/Docker auto-restart enabled

---

## 🆘 Troubleshooting

### Application not starting
```bash
pm2 logs              # Check error logs
pm2 restart all        # Try restarting
```

### Port already in use
```bash
sudo lsof -i :3000    # Check what's using port 3000
sudo lsof -i :3001    # Check what's using port 3001
```

### Database connection error
- Check MongoDB connection string
- Verify MongoDB Atlas IP whitelist
- Check network connectivity

### Nginx 502 Bad Gateway
- Check if backend is running: `pm2 status`
- Check backend logs: `pm2 logs homedepot-backend`
- Verify proxy_pass URL in Nginx config

---

## 📞 Support

If you face any issues:
1. Check PM2/Docker logs
2. Check Nginx error logs: `sudo tail -f /var/log/nginx/error.log`
3. Verify all environment variables are set correctly
4. Ensure MongoDB is accessible from server

---

## ✅ Deployment Complete!

Your application should now be running 24/7 on the server! 🎉

**Access URLs:**
- Frontend: `https://yourdomain.com`
- Backend API: `https://api.yourdomain.com` or `https://yourdomain.com/api`
- Admin Panel: `https://yourdomain.com/admin`

