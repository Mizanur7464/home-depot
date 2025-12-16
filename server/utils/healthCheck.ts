// Health check utilities
import mongoose from 'mongoose';
import { isRedisAvailable } from '../db/redis';

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  database: {
    connected: boolean;
    status: string;
  };
  cache: {
    available: boolean;
  };
  api: {
    apifyKeyConfigured: boolean;
  };
  timestamp: string;
}

export async function getHealthStatus(): Promise<HealthStatus> {
  const dbStatus = mongoose.connection.readyState;
  const dbStates = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  const dbConnected = dbStatus === 1;
  const redisAvailable = await isRedisAvailable();
  const apifyKeyConfigured = !!(process.env.APIFY_API_KEY || process.env.HOME_DEPOT_API_KEY);

  // Determine overall status
  let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  
  if (!dbConnected) {
    overallStatus = 'unhealthy'; // Database is critical
  } else if (!redisAvailable || !apifyKeyConfigured) {
    overallStatus = 'degraded'; // Cache and API key are optional
  }

  return {
    status: overallStatus,
    database: {
      connected: dbConnected,
      status: dbStates[dbStatus as keyof typeof dbStates] || 'unknown'
    },
    cache: {
      available: redisAvailable
    },
    api: {
      apifyKeyConfigured
    },
    timestamp: new Date().toISOString()
  };
}

