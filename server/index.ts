import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './db/connection';
import { connectRedis } from './db/redis';
import { dealsRouter } from './routes/deals';
import { authRouter } from './routes/auth';
import { adminRouter } from './routes/admin';
import { DataRefreshJob } from './jobs/dataRefresh';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Connect to MongoDB
connectDB().catch(console.error);

// Connect to Redis (optional - continues without cache if Redis unavailable)
connectRedis().catch((error) => {
  console.warn('⚠️ Redis connection failed, continuing without cache');
  console.warn(`   - Error: ${error.message}`);
  console.warn('   - Cache is optional - API will work without it');
});

// Initialize and start data refresh job (runs every 30 minutes)
let refreshJob: DataRefreshJob | null = null;
try {
  refreshJob = new DataRefreshJob();
  refreshJob.startScheduler();
  console.log('✅ Data refresh job scheduled (every 30 minutes)');
} catch (error: any) {
  console.error('❌ Failed to start data refresh job:', error.message);
  console.warn('⚠️ Data refresh will not run automatically - use admin panel to trigger manually');
}

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/deals', dealsRouter);
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const { getHealthStatus } = require('./utils/healthCheck');
    const health = await getHealthStatus();
    
    const statusCode = health.status === 'healthy' ? 200 : 
                      health.status === 'degraded' ? 200 : 503;
    
    res.status(statusCode).json(health);
  } catch (error: any) {
    res.status(503).json({
      status: 'unhealthy',
      message: 'Health check failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Start server with error handling
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

server.on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
    console.log(`💡 Run: npm run kill-port`);
    console.log(`💡 Or manually kill the process and restart`);
    process.exit(1);
  } else {
    console.error('❌ Server error:', err);
    process.exit(1);
  }
});

// Handle uncaught exceptions and unhandled rejections
process.on('uncaughtException', (error: Error) => {
  console.error('❌ Uncaught Exception:', error);
  console.error('Stack:', error.stack);
  // Don't exit - let PM2 handle restart
});

process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit - let PM2 handle restart
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

