# 🚀 Complete Deployment Guide - Step by Step

## 📌 Important Notes

### Domain vs IP Address:
- **Domain লাগবে**: Public website এর জন্য (recommended)
- **IP Address**: Private/internal use এর জন্য OK, কিন্তু professional না

### Recommendation:
- **Domain নিন** (Namecheap, GoDaddy, Cloudflare - $10-15/year)
- SSL certificate setup করা সহজ হবে
- Professional look
- Easy to remember

---

## 🎯 Prerequisites

### 1. Server Requirements:
- **VPS Server**: DigitalOcean, AWS EC2, Linode, Vultr
- **Minimum Specs**: 2 CPU, 2GB RAM, 20GB SSD
- **OS**: Ubuntu 20.04+ / Debian 11+

### 2. Accounts Needed:
- [ ] MongoDB Atlas account (free tier available)
- [ ] WHOP account (for authentication)
- [ ] Apify account (for data)
- [ ] Domain name (optional but recommended)

### 3. Information Ready:
- [ ] MongoDB connection string
- [ ] WHOP API credentials
- [ ] Apify API key
- [ ] Domain name (if using)

---

## 📋 Step-by-Step Deployment

### STEP 1: Server Setup

#### 1.1 Connect to Server
```bash
ssh root@your-server-ip
# OR
ssh username@your-server-ip
```

#### 1.2 Install Required Software
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node --version  # Should be 18.x or higher
npm --version

# Install PM2 (process manager for 24/7)
sudo npm install -g pm2

# Install Git
sudo apt install -y git

# Install Redis (optional - for caching)
sudo apt install -y redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

---

### STEP 2: Upload Code to Server

#### Option A: Using Git (Recommended)
```bash
# On server
cd /var/www
git clone https://github.com/your-username/your-repo.git homedepot-deals
cd homedepot-deals
```

#### Option B: Using SCP (from your local machine)
```bash
# From your local Windows machine (PowerShell)
scp -r D:\Project\website root@your-server-ip:/var/www/homedepot-deals
```

#### Option C: Using SFTP
- Download FileZilla or WinSCP
- Connect to server
- Upload entire project folder to `/var/www/homedepot-deals`

---

### STEP 3: Install Dependencies

```bash
cd /var/www/homedepot-deals

# Install all dependencies
npm install
```

---

### STEP 4: Configure Environment Variables

```bash
# Copy production template
cp env.production.example .env.production

# Edit the file
nano .env.production
```

#### Fill in ALL these values:

```env
# Server
NODE_ENV=production
PORT=3001

# MongoDB (MongoDB Atlas connection string)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/homedepot_deals?retryWrites=true&w=majority

# Redis (if installed on server)
REDIS_URL=redis://localhost:6379

# WHOP API (from your WHOP account)
WHOP_API_KEY=your_whop_api_key_here
WHOP_CLIENT_ID=your_whop_client_id_here
WHOP_CLIENT_SECRET=your_whop_client_secret_here
WHOP_REDIRECT_URI=https://yourdomain.com/api/auth/whop/callback
# OR if using IP: http://your-server-ip:3000/api/auth/whop/callback

# Apify API (from your Apify account)
APIFY_API_KEY=your_apify_api_key_here

# Frontend URL
NEXT_PUBLIC_API_URL=https://yourdomain.com
# OR if using IP: http://your-server-ip:3001

# Frontend URL for redirects
FRONTEND_URL=https://yourdomain.com
# OR if using IP: http://your-server-ip:3000
```

**Save and exit:**
- Nano: Press `Ctrl+X`, then `Y`, then `Enter`
- Vi: Press `Esc`, type `:wq`, then `Enter`

---

### STEP 5: Build Frontend

```bash
npm run build
```

This will take 2-5 minutes. Wait for it to complete.

---

### STEP 6: Start with PM2 (24/7 Running)

```bash
# Start both frontend and backend
pm2 start ecosystem.config.js --env production

# Save PM2 configuration (important!)
pm2 save

# Setup PM2 to start on system boot (important!)
pm2 startup
# Follow the command it outputs (copy and run it)
```

**Example output:**
```bash
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u root --hp /root
```
Copy and run this command.

---

### STEP 7: Verify Everything Works

```bash
# Check PM2 status
pm2 status

# Should show:
# - homedepot-backend: online
# - homedepot-frontend: online

# Check logs
pm2 logs

# Test backend health
curl http://localhost:3001/api/health

# Test frontend
curl http://localhost:3000
```

---

### STEP 8: Configure Firewall

```bash
# Allow SSH (important - don't lock yourself out!)
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow application ports (if not using reverse proxy)
sudo ufw allow 3000/tcp  # Frontend
sudo ufw allow 3001/tcp  # Backend

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

---

### STEP 9: Setup Domain & Nginx (Recommended)

#### 9.1 Point Domain to Server IP
- Go to your domain registrar (Namecheap, GoDaddy, etc.)
- Add A record:
  - **Type**: A
  - **Name**: @ (or leave blank)
  - **Value**: Your server IP address
  - **TTL**: 3600

#### 9.2 Install Nginx
```bash
sudo apt install -y nginx
```

#### 9.3 Configure Nginx for Frontend
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

#### 9.4 Configure Nginx for Backend API
```bash
sudo nano /etc/nginx/sites-available/homedepot-api
```

**Add this configuration:**
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

**Enable site:**
```bash
sudo ln -s /etc/nginx/sites-available/homedepot-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

### STEP 10: Setup SSL Certificate (HTTPS)

#### 10.1 Install Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
```

#### 10.2 Get SSL Certificate
```bash
# For main domain
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# For API subdomain
sudo certbot --nginx -d api.yourdomain.com
```

#### 10.3 Auto-renewal (already configured)
```bash
# Test renewal
sudo certbot renew --dry-run
```

**SSL certificate automatically renews every 90 days.**

---

### STEP 11: Update Environment Variables (After Domain Setup)

```bash
nano .env.production
```

**Update these values:**
```env
WHOP_REDIRECT_URI=https://yourdomain.com/api/auth/whop/callback
NEXT_PUBLIC_API_URL=https://yourdomain.com
FRONTEND_URL=https://yourdomain.com
```

**Restart PM2:**
```bash
pm2 restart all
```

---

## ✅ Verification Checklist

After deployment, verify:

- [ ] PM2 shows both apps as "online": `pm2 status`
- [ ] Backend health check works: `curl http://localhost:3001/api/health`
- [ ] Frontend loads: `curl http://localhost:3000`
- [ ] Domain works (if configured): Visit `https://yourdomain.com`
- [ ] Admin panel accessible: `https://yourdomain.com/admin`
- [ ] Data refresh job running (check logs): `pm2 logs homedepot-backend`

---

## 📊 Useful Commands

### PM2 Commands:
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

### Update Application:
```bash
# Pull latest code (if using Git)
cd /var/www/homedepot-deals
git pull

# Install new dependencies (if any)
npm install

# Rebuild frontend
npm run build

# Restart PM2
pm2 restart all
```

### Check Logs:
```bash
# PM2 logs
pm2 logs

# Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# System logs
sudo journalctl -u nginx -f
```

---

## 🆘 Troubleshooting

### Application not starting:
```bash
pm2 logs              # Check error logs
pm2 restart all        # Try restarting
```

### Port already in use:
```bash
sudo lsof -i :3000    # Check what's using port 3000
sudo lsof -i :3001    # Check what's using port 3001
```

### Database connection error:
- Check MongoDB Atlas connection string in `.env.production`
- Verify server IP is whitelisted in MongoDB Atlas Network Access
- Check MongoDB Atlas cluster is running

### Nginx 502 Bad Gateway:
- Check if backend is running: `pm2 status`
- Check backend logs: `pm2 logs homedepot-backend`
- Verify proxy_pass URL in Nginx config

### Domain not working:
- Check DNS propagation: `nslookup yourdomain.com`
- Verify A record points to correct IP
- Wait 5-10 minutes for DNS to propagate

### SSL certificate error:
- Check domain is pointing to server: `nslookup yourdomain.com`
- Verify Nginx config: `sudo nginx -t`
- Check Certbot logs: `sudo certbot certificates`

---

## 🎉 Success!

Your application is now running 24/7! 

**Access URLs:**
- Frontend: `https://yourdomain.com` (or `http://your-server-ip:3000`)
- Backend API: `https://api.yourdomain.com` (or `http://your-server-ip:3001`)
- Admin Panel: `https://yourdomain.com/admin`

**Features:**
- ✅ 24/7 running (PM2 auto-restart)
- ✅ Auto data refresh (every 30 minutes)
- ✅ Auto database reconnection
- ✅ SSL/HTTPS enabled
- ✅ Auto-start on server reboot

---

## 📝 Important Reminders

1. **MongoDB Atlas**: Use cloud database, not local (data loss prevention)
2. **PM2 Startup**: Must run `pm2 startup` for auto-start on boot
3. **Environment Variables**: Always update `.env.production` after domain changes
4. **Backups**: Setup MongoDB Atlas automatic backups
5. **Monitoring**: Regularly check `pm2 status` and logs

---

## 🎯 Summary

**Complete Deployment Process:**
1. ✅ Server setup (Node.js, PM2, Git)
2. ✅ Upload code
3. ✅ Install dependencies
4. ✅ Configure environment variables
5. ✅ Build frontend
6. ✅ Start with PM2
7. ✅ Setup firewall
8. ✅ Configure domain & Nginx (optional)
9. ✅ Setup SSL (optional)
10. ✅ Verify everything works

**Time Required:** 30-60 minutes

**Result:** Your application running 24/7 with auto-restart, auto-refresh, and all safety features! 🚀

