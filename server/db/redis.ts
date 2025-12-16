import { createClient, RedisClientType } from 'redis';

let redisClient: RedisClientType | null = null;
let redisAvailable: boolean | null = null; // Cache availability status
let lastConnectionAttempt: number = 0;
const CONNECTION_RETRY_DELAY = 60000; // Don't retry for 60 seconds after failure

// Initialize Redis connection
export async function connectRedis(): Promise<RedisClientType> {
  if (redisClient && redisClient.isOpen) {
    return redisClient;
  }

  // If we recently failed, don't try again immediately
  const timeSinceLastAttempt = Date.now() - lastConnectionAttempt;
  if (redisAvailable === false && timeSinceLastAttempt < CONNECTION_RETRY_DELAY) {
    throw new Error('Redis unavailable - skipping connection attempt');
  }

  const redisUrl = process.env.REDIS_URL || 
                   (process.env.REDIS_HOST && process.env.REDIS_PORT
                     ? `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
                     : 'redis://localhost:6379');

  // Only log on first attempt
  if (redisAvailable === null) {
    console.log('🔄 Connecting to Redis...');
    console.log(`   - URL: ${redisUrl.replace(/:[^:@]+@/, ':****@')}`); // Hide password if present
  }

  try {
    redisClient = createClient({
      url: redisUrl,
      socket: {
        connectTimeout: 5000, // 5 second timeout
        reconnectStrategy: false, // Disable auto-reconnect to reduce noise
      },
    });

    // Only log errors once, not repeatedly
    let errorLogged = false;
    redisClient.on('error', (err) => {
      if (!errorLogged) {
        console.error('❌ Redis error:', err.message);
        errorLogged = true;
      }
    });

    redisClient.on('ready', () => {
      console.log('✅ Redis: Connected and ready');
      redisAvailable = true;
    });

    await redisClient.connect();
    redisAvailable = true;
    lastConnectionAttempt = Date.now();
    return redisClient;
  } catch (error: any) {
    redisAvailable = false;
    lastConnectionAttempt = Date.now();
    
    // Only log on first failure
    if (redisClient === null || !redisClient.isOpen) {
      console.warn('⚠️ Redis connection failed - continuing without cache');
      console.warn(`   - Error: ${error.message}`);
      console.warn('   - Cache is optional - API will work without it');
    }
    
    // Clean up failed client
    if (redisClient) {
      try {
        await redisClient.quit();
      } catch {
        // Ignore cleanup errors
      }
      redisClient = null;
    }
    
    throw error;
  }
}

// Get Redis client (returns null if not connected)
export function getRedisClient(): RedisClientType | null {
  return redisClient && redisClient.isOpen ? redisClient : null;
}

// Check if Redis is available (cached result)
export async function isRedisAvailable(): Promise<boolean> {
  // If we know Redis is available, return immediately
  if (redisAvailable === true && redisClient && redisClient.isOpen) {
    return true;
  }
  
  // If we recently failed, don't check again
  if (redisAvailable === false) {
    const timeSinceLastAttempt = Date.now() - lastConnectionAttempt;
    if (timeSinceLastAttempt < CONNECTION_RETRY_DELAY) {
      return false;
    }
  }

  // Try to connect (only if not recently failed)
  try {
    const client = await connectRedis();
    await client.ping();
    redisAvailable = true;
    return true;
  } catch {
    redisAvailable = false;
    return false;
  }
}

// Close Redis connection
export async function closeRedis(): Promise<void> {
  if (redisClient && redisClient.isOpen) {
    await redisClient.quit();
    redisClient = null;
    console.log('✅ Redis: Connection closed');
  }
}

