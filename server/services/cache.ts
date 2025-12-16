import { getRedisClient, isRedisAvailable } from '../db/redis';

// Cache TTL (Time To Live) in seconds
const CACHE_TTL = {
  DEALS_LIST: 300,      // 5 minutes
  DEAL_SINGLE: 600,     // 10 minutes
  CATEGORIES: 3600,     // 1 hour
  WHOP_TOKEN: 300,      // 5 minutes
};

// Generate cache key
function getCacheKey(prefix: string, ...parts: (string | number | undefined)[]): string {
  const keyParts = parts
    .filter(part => part !== undefined && part !== null && part !== '')
    .map(part => String(part).replace(/[^a-zA-Z0-9_-]/g, '_'));
  
  return `homedepot:${prefix}:${keyParts.join(':')}`;
}

// Get data from cache
export async function getFromCache<T>(key: string): Promise<T | null> {
  try {
    if (!(await isRedisAvailable())) {
      return null; // Silent fail - Redis is optional
    }

    const client = getRedisClient();
    if (!client) {
      return null;
    }

    const cached = await client.get(key);
    if (cached) {
      // Only log cache hits in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ Cache HIT: ${key.substring(0, 50)}...`);
      }
      return JSON.parse(cached) as T;
    }

    // Don't log cache misses (too noisy)
    return null;
  } catch (error: any) {
    // Silent fail - Redis is optional
    return null;
  }
}

// Set data in cache
export async function setCache(key: string, value: any, ttl: number = CACHE_TTL.DEALS_LIST): Promise<void> {
  try {
    if (!(await isRedisAvailable())) {
      return; // Silent fail - Redis is optional
    }

    const client = getRedisClient();
    if (!client) {
      return;
    }

    await client.setEx(key, ttl, JSON.stringify(value));
    // Don't log every cache set (too noisy)
  } catch (error: any) {
    // Silent fail - Redis is optional
  }
}

// Delete from cache
export async function deleteCache(key: string): Promise<void> {
  try {
    if (!(await isRedisAvailable())) {
      return; // Silent fail - Redis is optional
    }

    const client = getRedisClient();
    if (!client) {
      return;
    }

    await client.del(key);
    // Don't log every cache delete
  } catch (error: any) {
    // Silent fail - Redis is optional
  }
}

// Delete multiple keys by pattern
export async function deleteCachePattern(pattern: string): Promise<void> {
  try {
    if (!(await isRedisAvailable())) {
      return; // Silent fail - Redis is optional
    }

    const client = getRedisClient();
    if (!client) {
      return;
    }

    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(keys);
      console.log(`🗑️ Cache invalidated: ${keys.length} keys cleared`);
    }
  } catch (error: any) {
    // Silent fail - Redis is optional
  }
}

// Cache keys for different resources
export const CacheKeys = {
  // Deals
  dealsList: (filters: Record<string, any>) => {
    // Create a stable key from filters
    const filterStr = Object.entries(filters)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('&');
    return getCacheKey('deals', 'list', filterStr || 'all');
  },
  
  dealSingle: (id: string) => getCacheKey('deals', 'single', id),
  
  // Categories
  categoriesList: () => getCacheKey('categories', 'list'),
  categorySingle: (id: string) => getCacheKey('categories', 'single', id),
  
  // WHOP tokens
  whopToken: (token: string) => getCacheKey('whop', 'token', token.substring(0, 20)),
  
  // Clear all deals cache
  clearAllDeals: () => 'homedepot:deals:*',
  clearAllCategories: () => 'homedepot:categories:*',
};

// Invalidate all deals cache (call after data refresh)
export async function invalidateDealsCache(): Promise<void> {
  await deleteCachePattern(CacheKeys.clearAllDeals());
}

// Invalidate all categories cache
export async function invalidateCategoriesCache(): Promise<void> {
  await deleteCachePattern(CacheKeys.clearAllCategories());
}

// Cache middleware helper
export async function cacheOrFetch<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl: number = CACHE_TTL.DEALS_LIST
): Promise<T> {
  // Try to get from cache
  const cached = await getFromCache<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Fetch from source
  const data = await fetchFn();
  
  // Store in cache
  await setCache(key, data, ttl);
  
  return data;
}

export { CACHE_TTL };

