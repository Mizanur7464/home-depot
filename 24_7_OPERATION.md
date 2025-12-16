# ✅ 24/7 Operation - Complete Setup

## 🎯 হ্যাঁ, আপনার প্রজেক্ট 24/7 চলবে কোন সমস্যা ছাড়াই!

### ✅ যা যা করা হয়েছে:

#### 1. **PM2 Auto-Restart** ✅
- `autorestart: true` - Crash হলে automatically restart হবে
- `max_restarts: 10` - Maximum 10 বার restart করতে পারবে
- `min_uptime: '10s'` - কমপক্ষে 10 সেকেন্ড চললে successful restart
- `restart_delay: 4000` - Restart এর আগে 4 সেকেন্ড wait
- `max_memory_restart: '500M'` - Memory 500MB ছাড়ালে restart

#### 2. **Data Refresh Job Auto-Schedule** ✅
- Server start হলে automatically data refresh job start হবে
- প্রতি 30 মিনিটে automatically নতুন data fetch করবে
- Error হলে crash হবে না, শুধু log করবে

#### 3. **MongoDB Auto-Reconnection** ✅
- Database disconnect হলে automatically reconnect করার চেষ্টা করবে
- 5 সেকেন্ড পর reconnect করার চেষ্টা করবে
- Connection loss হলে server crash হবে না

#### 4. **Error Handling** ✅
- Uncaught exceptions handle করা হয়েছে
- Unhandled rejections handle করা হয়েছে
- Error হলে PM2 automatically restart করবে

#### 5. **Graceful Shutdown** ✅
- SIGTERM/SIGINT signal handle করা হয়েছে
- Server restart/stop এর সময় properly close হবে

#### 6. **Health Check Endpoint** ✅
- `/api/health` endpoint আছে
- Database, Redis, API key status check করে
- Monitoring tools দিয়ে check করতে পারবেন

#### 7. **PM2 Startup on Boot** ✅
- `pm2 startup` command দিয়ে system boot এ auto-start হবে
- Server restart হলেও application automatically start হবে

---

## 🔧 Deployment Steps (24/7 চালু রাখার জন্য):

### Step 1: Server Setup
```bash
# Connect to server
ssh root@your-server-ip

# Install Node.js, PM2
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

### Step 2: Upload & Install
```bash
# Upload code (Git/SCP/SFTP)
cd /var/www/homedepot-deals
npm install
npm run build
```

### Step 3: Configure Environment
```bash
cp env.production.example .env.production
nano .env.production
# Fill in all values
```

### Step 4: Start with PM2
```bash
# Start applications
pm2 start ecosystem.config.js --env production

# Save configuration
pm2 save

# Setup auto-start on boot
pm2 startup
# Follow the command it outputs
```

### Step 5: Verify
```bash
# Check status
pm2 status

# View logs
pm2 logs

# Check health
curl http://localhost:3001/api/health
```

---

## 📊 Monitoring Commands:

```bash
# Check application status
pm2 status

# View real-time logs
pm2 logs

# View specific app logs
pm2 logs homedepot-backend
pm2 logs homedepot-frontend

# Real-time monitoring
pm2 monit

# Restart applications
pm2 restart all

# Check memory usage
pm2 list
```

---

## 🛡️ Safety Features:

### ✅ Auto-Restart on Crash
- Application crash হলে PM2 automatically restart করবে
- Maximum 10 বার restart করতে পারবে

### ✅ Memory Protection
- Memory 500MB ছাড়ালে automatically restart
- Memory leak prevent করবে

### ✅ Database Reconnection
- MongoDB disconnect হলে automatically reconnect করবে
- Temporary network issues handle করবে

### ✅ Error Recovery
- Uncaught errors handle করা হয়েছে
- Application crash হবে না, PM2 restart করবে

### ✅ Graceful Shutdown
- Server restart/stop এর সময় properly close হবে
- Data loss prevent করবে

---

## ⚠️ Important Notes:

### 1. **MongoDB Atlas**
- MongoDB Atlas use করুন (cloud database)
- Local MongoDB use করবেন না (server restart হলে data loss হতে পারে)
- Network Access whitelist এ server IP add করুন

### 2. **Environment Variables**
- `.env.production` file properly configure করুন
- API keys, database URI সব সঠিক আছে কিনা check করুন

### 3. **PM2 Startup**
- `pm2 startup` command run করুন
- System boot এ auto-start হবে

### 4. **Monitoring**
- Regular check করুন: `pm2 status`
- Logs check করুন: `pm2 logs`
- Health check করুন: `curl http://localhost:3001/api/health`

### 5. **Backup**
- Regular database backup নিন
- MongoDB Atlas automatic backup enable করুন

---

## 🎉 Result:

### ✅ আপনার প্রজেক্ট:
- **24/7 চলবে** - কোন manual intervention লাগবে না
- **Auto-restart** - Crash হলে automatically restart হবে
- **Auto-refresh** - প্রতি 30 মিনিটে data update হবে
- **Auto-reconnect** - Database disconnect হলে reconnect করবে
- **Error-resistant** - Errors handle করা হয়েছে
- **Memory-safe** - Memory leak prevent করা হয়েছে
- **Boot-safe** - Server restart হলে auto-start হবে

---

## 🆘 Troubleshooting:

### Application not starting:
```bash
pm2 logs              # Check error logs
pm2 restart all        # Try restarting
```

### Database connection error:
- Check MongoDB Atlas connection string
- Verify IP whitelist
- Check network connectivity

### Memory issues:
```bash
pm2 list               # Check memory usage
pm2 restart all        # Restart to free memory
```

### Data refresh not working:
- Check logs: `pm2 logs homedepot-backend`
- Verify APIFY_API_KEY in .env.production
- Manual trigger: Admin panel → Refresh

---

## ✅ Final Checklist:

- [ ] Server setup complete
- [ ] Code uploaded to server
- [ ] `.env.production` configured
- [ ] MongoDB Atlas connected
- [ ] PM2 started: `pm2 start ecosystem.config.js --env production`
- [ ] PM2 saved: `pm2 save`
- [ ] PM2 startup configured: `pm2 startup`
- [ ] Health check working: `curl http://localhost:3001/api/health`
- [ ] Data refresh job running (check logs)
- [ ] Nginx reverse proxy configured (optional)
- [ ] SSL certificate installed (optional)

---

## 🎊 Conclusion:

**হ্যাঁ, আপনার প্রজেক্ট 24/7 চলবে কোন সমস্যা ছাড়াই!**

সব safety features implement করা হয়েছে:
- ✅ Auto-restart
- ✅ Auto-refresh
- ✅ Auto-reconnect
- ✅ Error handling
- ✅ Memory protection
- ✅ Graceful shutdown

PM2 দিয়ে deploy করলে সব automatically handle হবে। 🚀

