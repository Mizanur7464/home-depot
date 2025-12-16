import { Router, Request, Response } from 'express';
import { Deal } from '../models/Deal';
import { DealFilters } from '../types';
import mongoose from 'mongoose';
import { cacheOrFetch, CacheKeys, CACHE_TTL } from '../services/cache';

export const dealsRouter = Router();

// Get all deals with filters
dealsRouter.get('/', async (req: Request, res: Response) => {
  console.log('\n📥 [API] GET /api/deals called');
  console.log('   - Query params:', JSON.stringify(req.query));
  
  try {
    // Check MongoDB connection
    const dbState = mongoose.connection.readyState;
    console.log(`   - MongoDB state: ${dbState} (0=disconnected, 1=connected, 2=connecting, 3=disconnecting)`);
    
    if (dbState !== 1) {
      console.warn('   ⚠️ MongoDB not connected');
      return res.status(503).json({ 
        error: 'Database not connected',
        message: 'MongoDB connection failed. Please check your connection string and IP whitelist.',
        deals: [],
        page: 1,
        limit: 20
      });
    }
    
    console.log('   ✅ MongoDB connected');

    const filters: DealFilters = {
      sku: req.query.sku as string,
      price_ending: req.query.price_ending as string,
      category_id: req.query.category_id as string,
      min_discount: req.query.min_discount ? parseFloat(req.query.min_discount as string) : undefined,
      max_discount: req.query.max_discount ? parseFloat(req.query.max_discount as string) : undefined,
      zip_code: req.query.zip_code as string,
      online_only: req.query.online_only === 'true',
      in_store_only: req.query.in_store_only === 'true',
      featured_only: req.query.featured_only === 'true',
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 30, // Default: 30 clearance products
    };
    
    const showAll = req.query.show_all === 'true'; // Allow showing all products (not just clearance)

    // Generate cache key from filters
    const cacheKey = CacheKeys.dealsList({
      ...filters,
      show_all: showAll,
    });

    // Fetch with cache
    const result = await cacheOrFetch(
      cacheKey,
      async () => {
        const query: any = {};

        if (filters.sku) {
          query.sku = { $regex: filters.sku, $options: 'i' };
        }

        if (filters.price_ending) {
          query.price_ending = filters.price_ending;
        }

        if (filters.category_id) {
          query.category_id = filters.category_id;
        }

        if (filters.min_discount || filters.max_discount) {
          query.discount_percent = {};
          if (filters.min_discount) {
            query.discount_percent.$gte = filters.min_discount;
          }
          if (filters.max_discount) {
            query.discount_percent.$lte = filters.max_discount;
          }
        }

        // IMPORTANT: Filter out of stock items - only show products that are available
        // Buyer requirement: "I do not want the out of stock items to show"
        if (filters.online_only) {
          // User specifically wants online only
          query.online_available = true;
          console.log(`   - Filtering for ONLINE available items only`);
        } else if (filters.in_store_only) {
          // User specifically wants in-store only
          query.in_store_available = true;
          console.log(`   - Filtering for IN-STORE available items only`);
        } else {
          // Default: Show items that are available online OR in-store (at least one location)
          // This ensures out of stock items (both false) are never shown
          query.$or = [
            { online_available: true },
            { in_store_available: true }
          ];
          console.log(`   - Filtering for IN STOCK items only (online_available OR in_store_available)`);
        }

        if (filters.featured_only) {
          query.is_featured = true;
        }

        // ZIP code filter (check in availability_data) - combine with availability filter using $and
        if (filters.zip_code) {
          query.$and = query.$and || [];
          query.$and.push({
            $or: [
              { 'availability_data.zip': filters.zip_code },
              { 'store_locations.zip': filters.zip_code },
              { availability_data: { $regex: filters.zip_code } },
            ]
          });
        }

        const skip = (filters.page! - 1) * filters.limit!;
        console.log(`   - Query:`, JSON.stringify(query, null, 2));
        console.log(`   - Skip: ${skip}, Limit: ${filters.limit}`);
        
        // Show CLEARANCE items only (price endings: .06, .04, .03, .02)
        // Always show only clearance items unless show_all=true or price_ending filter is specified
        if (!filters.price_ending && !showAll) {
          query.price_ending = { $in: ['.06', '.04', '.03', '.02'] };
          console.log(`   - Filtering for CLEARANCE items only (price endings: .06, .04, .03, .02)`);
        } else if (showAll) {
          console.log(`   - Showing ALL products (show_all=true)`);
        } else if (filters.price_ending) {
          console.log(`   - Filtering by specific price ending: ${filters.price_ending}`);
        }
        
        let deals = await Deal.find(query)
          .populate('category_id', 'name slug')
          .sort({ is_featured: -1, last_updated: -1 })
          .limit(filters.limit! * 2) // Get more to account for deduplication
          .skip(skip);

        // Deduplicate by SKU (in case of any duplicates)
        const seenSkus = new Set<string>();
        deals = deals.filter(deal => {
          if (seenSkus.has(deal.sku)) {
            return false; // Skip duplicate
          }
          seenSkus.add(deal.sku);
          return true;
        });

        // Limit to requested amount after deduplication
        deals = deals.slice(0, filters.limit!);

        console.log(`   ✅ Found ${deals.length} unique deals`);
        if (deals.length > 0) {
          console.log(`   - First deal SKU: ${deals[0].sku}`);
        }
        
        return { deals, page: filters.page, limit: filters.limit };
      },
      CACHE_TTL.DEALS_LIST
    );
    
    res.json(result);
  } catch (error: any) {
    console.error('Error fetching deals:', error);
    res.status(500).json({ 
      error: 'Failed to fetch deals',
      message: error.message || 'Database operation failed',
      deals: []
    });
  }
});

// Get single deal by ID
dealsRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    // Check MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ 
        error: 'Database not connected',
        message: 'MongoDB connection failed. Please check your connection string and IP whitelist.'
      });
    }

    const { id } = req.params;
    const cacheKey = CacheKeys.dealSingle(id);

    // Fetch with cache
    const deal = await cacheOrFetch(
      cacheKey,
      async () => {
        const dealData = await Deal.findById(id).populate('category_id', 'name slug');
        if (!dealData) {
          return null;
        }
        return dealData;
      },
      CACHE_TTL.DEAL_SINGLE
    );

    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    res.json(deal);
  } catch (error: any) {
    console.error('Error fetching deal:', error);
    res.status(500).json({ 
      error: 'Failed to fetch deal',
      message: error.message || 'Database operation failed'
    });
  }
});
