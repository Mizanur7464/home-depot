import axios from 'axios';
import { Deal } from '../models/Deal';
import { Log } from '../models/Log';
import { Deal as DealType } from '../types';
import { connectDB } from '../db/connection';
import mongoose from 'mongoose';

// Apify API integration for Home Depot data

export class DataFetcher {
  private apiKey: string;
  private actorId: string = 'jupri~homedepot';
  private baseUrl: string = 'https://api.apify.com/v2';
  private _loggedPricing: boolean = false; // Track if we've logged pricing structure

  constructor() {
    this.apiKey = process.env.APIFY_API_KEY || process.env.HOME_DEPOT_API_KEY || '';
    console.log('📋 DataFetcher initialized');
    console.log(`   - API Key present: ${this.apiKey ? 'YES (' + this.apiKey.substring(0, 10) + '...)' : 'NO ❌'}`);
    console.log(`   - Actor ID: ${this.actorId}`);
  }

  // Start Apify actor run with custom input
  private async startRunWithInput(inputPayload: any): Promise<string> {
    try {
      console.log(`\n📤 [DEBUG] Starting run with custom input...`);
      console.log(`   - Input payload:`, JSON.stringify(inputPayload, null, 2));
      
      const response = await axios.post(
        `${this.baseUrl}/acts/${this.actorId}/runs?token=${this.apiKey}`,
        inputPayload
      );
      
      console.log(`\n✅ [DEBUG] Run started successfully`);
      console.log(`   - Response status: ${response.status}`);
      console.log(`   - Run ID: ${response.data.data.id}`);
      return response.data.data.id;
    } catch (error: any) {
      console.error('\n❌ [DEBUG] Error starting Apify run:');
      console.error(`   - Error message: ${error.message}`);
      throw new Error(`Failed to start Apify run: ${error.message}`);
    }
  }

  // Validate API key before making requests
  private validateApiKey(): boolean {
    if (!this.apiKey || this.apiKey.trim() === '') {
      console.error('❌ APIFY_API_KEY is not set');
      return false;
    }
    
    // Basic validation - Apify API keys start with 'apify_api_'
    if (!this.apiKey.startsWith('apify_api_')) {
      console.warn('⚠️ API key format may be incorrect (should start with "apify_api_")');
    }
    
    return true;
  }

  // Start Apify actor run with retry logic
  private async startRun(query: string = 'drill', limit: number = 100, retries: number = 3): Promise<string> {
    // Validate API key first
    if (!this.validateApiKey()) {
      throw new Error('API key not configured. Please set APIFY_API_KEY in .env file');
    }

    let lastError: any = null;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`\n🔵 [DEBUG] startRun called (attempt ${attempt}/${retries})`);
        console.log(`   - Query: ${query}`);
        console.log(`   - Limit: ${limit}`);
        console.log(`   - Actor ID: ${this.actorId}`);
        console.log(`   - API Key present: ${this.apiKey ? 'YES' : 'NO ❌'}`);
        
        // Use EXACT Apify input format (from user's successful run)
        // This is the format that works - just change query to "drill"
        const inputPayload = {
          dev_dataset_clear: false,
          dev_no_strip: false,
          dev_proxy_config: {
            useApifyProxy: true,
            apifyProxyGroups: ["RESIDENTIAL"],
            apifyProxyCountry: "US"
          },
          include_details: false,
          limit: Math.min(limit, 1000), // Cap at 1000 to avoid issues
          query: Array.isArray(query) ? query : [query], // Ensure it's an array
          review_verified: false
        };
        
        console.log(`\n📤 [INPUT] Sending to Apify:`);
        console.log(`   - Query: ${JSON.stringify(inputPayload.query)}`);
        console.log(`   - Limit: ${inputPayload.limit}`);

        const response = await axios.post(
          `${this.baseUrl}/acts/${this.actorId}/runs?token=${this.apiKey}`,
          inputPayload,
          {
            timeout: 30000, // 30 second timeout
            validateStatus: (status) => status < 500 // Don't throw on 4xx errors
          }
        );
        
        // Check for 4xx errors (client errors)
        if (response.status >= 400 && response.status < 500) {
          const errorMsg = response.data?.error?.message || response.data?.message || 'Invalid request';
          console.error(`\n❌ [DEBUG] Apify API returned ${response.status}:`);
          console.error(`   - Error: ${errorMsg}`);
          console.error(`   - Response:`, JSON.stringify(response.data, null, 2));
          
          // Don't retry on 4xx errors (client errors) - they won't succeed on retry
          if (response.status === 401 || response.status === 403) {
            throw new Error(`API authentication failed (${response.status}): ${errorMsg}. Check your API key.`);
          } else if (response.status === 400) {
            throw new Error(`Invalid request (400): ${errorMsg}. Check input format.`);
          } else {
            throw new Error(`API request failed (${response.status}): ${errorMsg}`);
          }
        }
        
        console.log(`\n✅ [DEBUG] Run started successfully`);
        console.log(`   - Response status: ${response.status}`);
        console.log(`   - Run ID: ${response.data.data.id}`);
        console.log(`   - Run status: ${response.data.data.status}`);
        console.log(`   - Run URL: https://console.apify.com/actors/${this.actorId}/runs/${response.data.data.id}`);
        return response.data.data.id;
      } catch (error: any) {
        lastError = error;
        console.error(`\n❌ [DEBUG] Error starting Apify run (attempt ${attempt}/${retries}):`);
        console.error(`   - Error message: ${error.message}`);
        console.error(`   - Response status: ${error.response?.status}`);
        
        // Don't retry on client errors (4xx)
        if (error.response?.status >= 400 && error.response?.status < 500) {
          throw error;
        }
        
        // Retry on server errors (5xx) or network errors
        if (attempt < retries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Exponential backoff, max 10s
          console.log(`   - Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // All retries failed
    throw new Error(`Failed to start Apify run after ${retries} attempts: ${lastError?.message || 'Unknown error'}`);
  }

  // Wait for run to complete
  private async waitForRun(runId: string, maxWaitTime: number = 300000): Promise<string> {
    console.log(`\n🔵 [DEBUG] waitForRun called`);
    console.log(`   - Run ID: ${runId}`);
    console.log(`   - Max wait time: ${maxWaitTime}ms (${maxWaitTime/1000}s)`);
    
    const startTime = Date.now();
    const checkInterval = 5000; // Check every 5 seconds
    let checkCount = 0;

    while (Date.now() - startTime < maxWaitTime) {
      try {
        checkCount++;
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`\n⏳ [DEBUG] Checking run status (attempt ${checkCount}, ${elapsed}s elapsed)...`);
        
        const response = await axios.get(
          `${this.baseUrl}/actor-runs/${runId}?token=${this.apiKey}`
        );
        const status = response.data.data.status;
        const datasetId = response.data.data.defaultDatasetId;

        console.log(`   - Current status: ${status}`);
        console.log(`   - Dataset ID: ${datasetId || 'N/A'}`);

        if (status === 'SUCCEEDED') {
          console.log(`\n✅ [DEBUG] Run succeeded!`);
          console.log(`   - Dataset ID: ${datasetId}`);
          return datasetId;
        } else if (status === 'FAILED' || status === 'ABORTED') {
          console.error(`\n❌ [DEBUG] Run ${status.toLowerCase()}`);
          console.error(`   - Status message: ${response.data.data.statusMessage || 'N/A'}`);
          throw new Error(`Run ${status.toLowerCase()}: ${response.data.data.statusMessage || ''}`);
        }

        // Still running, wait and check again
        console.log(`   - Still running, waiting ${checkInterval/1000}s before next check...`);
        await new Promise(resolve => setTimeout(resolve, checkInterval));
      } catch (error: any) {
        if (error.message.includes('FAILED') || error.message.includes('ABORTED')) {
          throw error;
        }
        console.log(`   ⚠️ Error checking status (will retry): ${error.message}`);
        await new Promise(resolve => setTimeout(resolve, checkInterval));
      }
    }

    console.error(`\n❌ [DEBUG] Run timeout after ${maxWaitTime/1000}s`);
    throw new Error('Run timeout: Exceeded maximum wait time');
  }

  // Get dataset items from completed run
  private async getDatasetItems(datasetId: string): Promise<any[]> {
    try {
      console.log(`\n🔵 [DEBUG] getDatasetItems called`);
      console.log(`   - Dataset ID: ${datasetId}`);
      console.log(`   - URL: ${this.baseUrl}/datasets/${datasetId}/items?token=${this.apiKey.substring(0, 10)}...`);
      
      const response = await axios.get(
        `${this.baseUrl}/datasets/${datasetId}/items?token=${this.apiKey}`
      );
      
      console.log(`\n✅ [DEBUG] Dataset items fetched`);
      console.log(`   - Response status: ${response.status}`);
      console.log(`   - Items count: ${Array.isArray(response.data) ? response.data.length : 'N/A'}`);
      console.log(`   - Data type: ${Array.isArray(response.data) ? 'Array' : typeof response.data}`);
      
      if (Array.isArray(response.data) && response.data.length > 0) {
        console.log(`   - First item keys:`, Object.keys(response.data[0]));
      }
      
      return response.data || [];
    } catch (error: any) {
      console.error('\n❌ [DEBUG] Error fetching dataset items:');
      console.error(`   - Error message: ${error.message}`);
      console.error(`   - Response status: ${error.response?.status}`);
      console.error(`   - Response data:`, JSON.stringify(error.response?.data || {}, null, 2));
      throw new Error(`Failed to fetch dataset items: ${error.message}`);
    }
  }

  // Get actor input schema
  private async getActorInputSchema(): Promise<any> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/acts/${this.actorId}?token=${this.apiKey}`
      );
      return response.data.data.inputSchema;
    } catch (error: any) {
      console.error('Error fetching actor schema:', error.message);
      return null;
    }
  }

  // Get input from last successful run
  private async getLastSuccessfulRunInput(): Promise<any> {
    try {
      // Get last 10 runs
      const runsResponse = await axios.get(
        `${this.baseUrl}/acts/${this.actorId}/runs?token=${this.apiKey}&limit=10`
      );
      const runs = runsResponse.data.data.items || [];
      
      // Find first successful run with results > 50 (to ensure it's a real successful run)
      for (const run of runs) {
        if (run.status === 'SUCCEEDED' && run.stats?.itemsCount && run.stats.itemsCount > 50) {
          console.log(`   ✅ Found successful run: ${run.id} with ${run.stats.itemsCount} items`);
          // Get run details with input
          const runDetails = await axios.get(
            `${this.baseUrl}/actor-runs/${run.id}?token=${this.apiKey}`
          );
          const input = runDetails.data.data.options?.input || runDetails.data.data.input;
          if (input) {
            console.log(`   - Input format:`, JSON.stringify(input, null, 2));
            return input;
          }
        }
      }
      
      console.log('   ⚠️ No successful run with >50 items found, using default format');
      return null;
    } catch (error: any) {
      console.error('Error fetching last successful run:', error.message);
      return null;
    }
  }

  // Fetch deals from Apify API
  // Strategy: Fetch large number of products with multiple queries to find clearance items
  async fetchFromAPI(query: string = 'clearance', limit: number = 1000): Promise<DealType[]> {
    console.log('\n' + '='.repeat(60));
    console.log('🔍 [FETCH] fetchFromAPI called');
    console.log('='.repeat(60));
    console.log(`   - Query: ${query}`);
    console.log(`   - Limit: ${limit}`);
    console.log(`   - Timestamp: ${new Date().toISOString()}`);
    
    if (!this.apiKey) {
      console.warn('⚠️ APIFY_API_KEY not set, skipping API fetch');
      console.log('   - Check .env file for APIFY_API_KEY or HOME_DEPOT_API_KEY');
      return [];
    }

    try {
      console.log('🚀 Starting Apify run...');
      console.log(`   - Base URL: ${this.baseUrl}`);
      console.log(`   - Actor ID: ${this.actorId}`);
      
      // Check actor input schema FIRST
      console.log('📋 Checking actor input schema...');
      const schema = await this.getActorInputSchema();
      if (schema) {
        console.log('   ✅ Actor schema found!');
        console.log('   - Schema:', JSON.stringify(schema, null, 2));
      } else {
        console.warn('   ⚠️ Could not fetch actor schema');
      }

      // Skip checking successful run input - use simple direct format
      console.log('📋 Using direct input format (query array)...');
      
      // Start the run
      const runId = await this.startRun(query, limit);
      console.log(`✅ Run started: ${runId}`);
      console.log(`   - Monitor run: https://console.apify.com/actors/${this.actorId}/runs/${runId}`);

      // Wait for completion
      console.log('⏳ Waiting for run to complete...');
      const datasetId = await this.waitForRun(runId);
      console.log(`✅ Run completed, dataset ID: ${datasetId}`);

      // Get results
      console.log('📥 Fetching dataset items...');
      const items = await this.getDatasetItems(datasetId);
      console.log(`✅ Fetched ${items.length} items from dataset`);
      
      if (items.length === 0) {
        console.error('\n❌ CRITICAL: No items found in dataset!');
        console.error('   - All recent runs show 0 results');
        console.error('   - This means the INPUT FORMAT is WRONG');
        console.error('   - Action required:');
        console.error('     1. Go to Apify Console');
        console.error('     2. Open actor: https://console.apify.com/actors/' + this.actorId);
        console.error('     3. Click "Input" tab to see required format');
        console.error('     4. Or check successful run (the one with 5 results) input');
        console.error(`   - Check this run: https://console.apify.com/actors/${this.actorId}/runs/${runId}`);
      } else {
        console.log(`   ✅ SUCCESS! Got ${items.length} items`);
        console.log(`   - First item sample:`, JSON.stringify(items[0], null, 2).substring(0, 1000));
        console.log(`   - First item keys:`, Object.keys(items[0] || {}));
      }

      // Normalize ALL items and save to database
      // Then filter for clearance items in database query
      console.log('🔄 Normalizing data (saving ALL products to find clearance items)...');
      const normalized: DealType[] = [];
      let errors = 0;
      let clearanceCount = 0;
      
      for (const item of items) {
        try {
          const deal = this.normalizeDealData(item);
          normalized.push(deal);
          
          // Count clearance items
          if (deal.price_ending === '.06' || deal.price_ending === '.04' || 
              deal.price_ending === '.03' || deal.price_ending === '.02') {
            clearanceCount++;
          }
        } catch (error: any) {
          console.error(`   ❌ Error normalizing item:`, error.message);
          errors++;
        }
      }
      
      console.log(`✅ Normalized ${normalized.length} deals from ${items.length} total items`);
      console.log(`   - Clearance items found: ${clearanceCount} (price endings: .06, .04, .03, .02)`);
      console.log(`   - All products will be saved, then filtered for clearance in API`);
      if (normalized.length > 0) {
        console.log(`   - First normalized deal:`, JSON.stringify(normalized[0], null, 2).substring(0, 500));
      }
      return normalized;
    } catch (error: any) {
      console.error('❌ API fetch error:', error.message);
      console.error('   - Error details:', error.response?.data || error.stack);
      
      // Log error with more context
      const errorDetails: any = {
        error: error.message,
        errorType: error.constructor.name,
        statusCode: error.response?.status,
        apiResponse: error.response?.data
      };
      
      // Add helpful suggestions based on error type
      if (error.message.includes('authentication') || error.message.includes('401') || error.message.includes('403')) {
        errorDetails.suggestion = 'Check your APIFY_API_KEY in .env file';
      } else if (error.message.includes('400') || error.message.includes('Invalid request')) {
        errorDetails.suggestion = 'Check Apify actor input format - may need to update query format';
      } else if (error.message.includes('timeout') || error.message.includes('network')) {
        errorDetails.suggestion = 'Network issue - check internet connection and Apify service status';
      } else if (error.message.includes('quota') || error.message.includes('limit')) {
        errorDetails.suggestion = 'API quota exceeded - check Apify account limits';
      }
      
      await this.logActivity('error', 'API fetch failed', errorDetails);
      return [];
    }
  }

  // Normalize API data to our Deal format
  normalizeDealData(rawData: any): DealType {
    console.log(`\n🔵 [DEBUG] normalizeDealData called`);
    console.log(`   - Raw data keys:`, Object.keys(rawData || {}));
    // Extract SKU - Apify uses storeSkuNumber
    const sku = rawData.storeSkuNumber || rawData.sku || rawData.productId || rawData.product_id 
      || rawData.itemNumber || rawData.model || rawData.itemId || rawData.id || rawData.productNumber || '';

    // Extract title - Apify uses productLabel (full product name) or combine brandName + productLabel
    const title = rawData.productLabel || rawData.title || rawData.name || rawData.productName || rawData.productTitle 
      || rawData.displayName || rawData.productDisplayName 
      || (rawData.brandName ? `${rawData.brandName} ${rawData.productLabel || rawData.productName || ''}`.trim() : rawData.brandName || '');

    // Extract price - Apify uses top-level sskMax/sskMin OR nested pricing object
    const pricing = rawData.pricing || {};
    
    // Debug: Log pricing structure for debugging (first item only)
    if (!this._loggedPricing) {
      console.log(`\n💰 [DEBUG] Pricing extraction for first item:`);
      console.log(`   - Top-level sskMax:`, rawData.sskMax);
      console.log(`   - Top-level sskMin:`, rawData.sskMin);
      console.log(`   - Pricing object keys:`, Object.keys(pricing));
      console.log(`   - Pricing object:`, JSON.stringify(pricing, null, 2).substring(0, 800));
      this._loggedPricing = true;
    }
    
    // Priority 1: Top-level fields (most common in Apify)
    let currentPriceNum = rawData.sskMax || rawData.sskMin;
    
    // Priority 2: Nested pricing object - check all possible structures
    if (!currentPriceNum && pricing && typeof pricing === 'object') {
      // Direct fields
      currentPriceNum = pricing.currentPrice || pricing.price || pricing.regularPrice || pricing.unitPrice
        || pricing.salePrice || pricing.finalPrice || pricing.displayPrice || pricing.amount
        || pricing.current || pricing.now || pricing.today || pricing.value;
      
      // Nested objects (pricing.regular.amount, pricing.sale.amount, etc.)
      if (!currentPriceNum) {
        currentPriceNum = pricing.regular?.amount || pricing.regular?.price || pricing.regular?.value
          || pricing.sale?.amount || pricing.sale?.price || pricing.sale?.value
          || pricing.current?.amount || pricing.current?.price || pricing.current?.value
          || pricing.original?.amount || pricing.original?.price;
      }
      
      // Array structures (pricing[0].amount, etc.)
      if (!currentPriceNum && Array.isArray(pricing)) {
        currentPriceNum = pricing[0]?.amount || pricing[0]?.price || pricing[0]?.value;
      }
    }
    
    // Priority 3: Fulfillment object pricing
    if (!currentPriceNum && rawData.fulfillment) {
      const fulfillment = rawData.fulfillment;
      if (typeof fulfillment === 'object') {
        currentPriceNum = fulfillment.pricing?.currentPrice || fulfillment.pricing?.price
          || fulfillment.price || fulfillment.currentPrice || fulfillment.amount;
      }
    }
    
    // Priority 4: Other top-level fields
    if (!currentPriceNum) {
      currentPriceNum = rawData.price || rawData.currentPrice || rawData.current_price 
        || rawData.priceValue || rawData.unitPrice || 0;
    }
    const currentPrice = typeof currentPriceNum === 'string' 
      ? parseFloat(currentPriceNum.replace(/[^0-9.]/g, '')) 
      : (typeof currentPriceNum === 'number' ? currentPriceNum : parseFloat(currentPriceNum) || 0);

    // Extract original price - Priority: top-level wasMaxPriceRange/wasMinPriceRange, then pricing object
    let originalPriceNum = rawData.wasMaxPriceRange || rawData.wasMinPriceRange;
    
    // Fallback to pricing object
    if (!originalPriceNum && pricing) {
      originalPriceNum = pricing.originalPrice || pricing.listPrice || pricing.wasPrice
        || pricing.regular?.amount || pricing.original?.amount;
    }
    
    // Final fallback
    if (!originalPriceNum) {
      originalPriceNum = rawData.originalPrice || rawData.original_price || rawData.listPrice 
        || rawData.regularPrice || rawData.fulfillment?.pricing?.originalPrice;
    }
    const originalPrice = originalPriceNum 
      ? (typeof originalPriceNum === 'string' 
          ? parseFloat(originalPriceNum.replace(/[^0-9.]/g, '')) 
          : (typeof originalPriceNum === 'number' ? originalPriceNum : parseFloat(originalPriceNum)))
      : undefined;

    // Calculate discount
    const discountPercent = originalPrice && originalPrice > currentPrice
      ? this.calculateDiscount(currentPrice, originalPrice)
      : undefined;

    // Extract image - Apify uses nested media object
    const media = rawData.media || {};
    let imageUrl = media.primaryImage || media.image || media.thumbnail || media.images?.[0]?.url
      || rawData.image || rawData.imageUrl || rawData.image_url || rawData.thumbnail || rawData.photo 
      || rawData.productImage || rawData.primaryImage || rawData.images?.[0] || '';
    
    // Fix image URL - replace <SIZE> placeholder with actual size
    if (imageUrl && imageUrl.includes('<SIZE>')) {
      imageUrl = imageUrl.replace('<SIZE>', '600');
    }

    // Extract description from URL if available (Apify provides URL)
    const productUrl = rawData.url || '';
    const description = rawData.description || rawData.productDescription || productUrl || '';

    // Check availability (Apify uses fulfillment object)
    // Buyer requirement: "I do not want the out of stock items to show"
    // "Sometimes products run out of stocks at certain stores"
    const fulfillment = rawData.fulfillment || rawData.availabilityType || {};
    const availabilityType = rawData.availabilityType || {};
    
    // Check if product is available online
    // If Apify returns the product, assume it's available unless explicitly marked as unavailable
    const onlineAvailable = rawData.onlineAvailable === false
      ? false
      : (rawData.onlineAvailable || rawData.availableOnline || fulfillment?.online || availabilityType?.online || true); // Default to true if not explicitly false
    
    // Check if product is available in-store (at ANY store location)
    // Check multiple sources: direct flags, fulfillment object, store_locations array, availability_data
    let inStoreAvailable = false;
    
    // Priority 1: Direct flags
    if (rawData.inStoreAvailable || rawData.availableInStore || rawData.storeAvailable) {
      inStoreAvailable = true;
    }
    // Priority 2: Fulfillment/availabilityType objects
    else if (fulfillment?.inStore || availabilityType?.inStore) {
      inStoreAvailable = true;
    }
    // Priority 3: Check store_locations array (if any store has stock)
    else if (rawData.storeLocations && Array.isArray(rawData.storeLocations) && rawData.storeLocations.length > 0) {
      // If store_locations array exists and has items, assume available at some store
      inStoreAvailable = true;
    }
    // Priority 4: Check availability_data for store stock info
    else if (rawData.availability || rawData.availabilityData) {
      const availData = rawData.availability || rawData.availabilityData;
      // Check if availability_data indicates stock at any location
      if (typeof availData === 'object' && !Array.isArray(availData)) {
        // Check for common stock indicators
        if (availData.stock !== undefined && availData.stock > 0) {
          inStoreAvailable = true;
        } else if (availData.available !== undefined && availData.available === true) {
          inStoreAvailable = true;
        } else if (availData.inStock !== undefined && availData.inStock === true) {
          inStoreAvailable = true;
        }
      }
    }
    // Priority 5: If product is returned by Apify, assume it's available unless explicitly marked as unavailable
    // This is more lenient - if Apify returns the product, it's likely available
    if (!inStoreAvailable && rawData.inStoreAvailable !== false) {
      // If not explicitly marked as unavailable, assume available
      inStoreAvailable = true;
    }
    
    // Extract category info (Apify might use categoryHierarchy)
    const categoryHierarchy = rawData.categoryHierarchy || rawData.categories || [];
    const categoryName = rawData.categoryName || rawData.category_name || categoryHierarchy?.[categoryHierarchy.length - 1] || '';
    const categorySlug = rawData.categorySlug || rawData.category_slug || categoryName?.toLowerCase().replace(/\s+/g, '-') || '';

    const normalized = {
      id: 0, // Will be set by database
      sku: sku.toString(), // Ensure SKU is string
      title: title || `Product ${sku}`, // Fallback if no title
      description: description,
      image_url: imageUrl,
      current_price: currentPrice,
      original_price: originalPrice,
      discount_percent: discountPercent,
      price_ending: this.extractPriceEnding(currentPrice),
      category_id: rawData.categoryId || rawData.category_id,
      category_name: categoryName,
      category_slug: categorySlug,
      online_available: onlineAvailable,
      in_store_available: inStoreAvailable,
      availability_data: rawData.availability || rawData.availabilityData || {},
      store_locations: rawData.storeLocations || rawData.store_locations || [],
      is_featured: false,
      source: 'api' as 'api' | 'scraper',
      last_updated: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };
    
    console.log(`   - Normalized deal:`, {
      sku: normalized.sku,
      title: normalized.title?.substring(0, 50),
      current_price: normalized.current_price,
      original_price: normalized.original_price,
      discount_percent: normalized.discount_percent,
      online_available: normalized.online_available,
      in_store_available: normalized.in_store_available,
      price_ending: normalized.price_ending
    });
    
    return normalized;
  }

  // Extract price ending (.06, .04, .03, .02)
  extractPriceEnding(price: string | number): string | undefined {
    const priceStr = price.toString();
    const decimalPart = priceStr.split('.')[1];
    if (decimalPart && ['06', '04', '03', '02'].includes(decimalPart.slice(0, 2))) {
      return `.${decimalPart.slice(0, 2)}`;
    }
    return undefined;
  }

  // Calculate discount percentage
  calculateDiscount(current: number, original?: number): number | undefined {
    if (!original || original <= current) return undefined;
    return Math.round(((original - current) / original) * 100 * 100) / 100;
  }

  // Save deals to database
  // Returns: Array of SKUs that were successfully saved/updated
  async saveDeals(deals: Partial<DealType>[] | DealType[]): Promise<string[]> {
    console.log('\n' + '='.repeat(60));
    console.log('💾 [SAVE] saveDeals called');
    console.log('='.repeat(60));
    console.log(`   - Number of deals: ${deals.length}`);
    console.log(`   - Timestamp: ${new Date().toISOString()}`);
    
    if (deals.length === 0) {
      console.warn('⚠️ No deals to save - returning early');
      return [];
    }

    // CRITICAL: Ensure MongoDB is connected before saving
    console.log('\n   🔄 Checking MongoDB connection...');
    const dbState = mongoose.connection.readyState;
    console.log(`   - MongoDB state: ${dbState} (0=disconnected, 1=connected, 2=connecting, 3=disconnecting)`);
    
    if (dbState !== 1) {
      console.log('   ⚠️ MongoDB not connected, attempting to connect...');
      try {
        await connectDB();
        // Wait for connection to be ready
        let attempts = 0;
        while (mongoose.connection.readyState !== 1 && attempts < 10) {
          console.log(`   ⏳ Waiting for connection... (${attempts + 1}/10)`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          attempts++;
        }
        
        if (mongoose.connection.readyState !== 1) {
          throw new Error('MongoDB connection failed after 10 attempts');
        }
        console.log('   ✅ MongoDB connected successfully');
      } catch (error: any) {
        console.error('   ❌ Failed to connect to MongoDB:', error.message);
        throw new Error(`Cannot save deals: MongoDB connection failed - ${error.message}`);
      }
    } else {
      console.log('   ✅ MongoDB already connected');
    }

    console.log(`   - First deal sample:`, JSON.stringify(deals[0], null, 2).substring(0, 500));
    console.log(`   - First deal SKU: ${deals[0]?.sku || 'MISSING'}`);
    console.log(`   - First deal title: ${deals[0]?.title?.substring(0, 50) || 'MISSING'}`);
    console.log(`   - First deal price: ${deals[0]?.current_price || 'MISSING'}`);

    let saved = 0;
    let updated = 0;
    let errors = 0;
    const seenSkus: string[] = []; // Track SKUs that were seen in this refresh

    for (let i = 0; i < deals.length; i++) {
      const dealData = deals[i];
      try {
        console.log(`\n   [${i + 1}/${deals.length}] Processing deal...`);
        console.log(`      - SKU: ${dealData.sku || 'MISSING ❌'}`);
        console.log(`      - Title: ${dealData.title?.substring(0, 50) || 'MISSING ❌'}`);
        console.log(`      - Price: ${dealData.current_price || 'MISSING ❌'}`);
        
        if (!dealData.sku) {
          console.warn(`      ⚠️ Skipping deal without SKU`);
          errors++;
          continue;
        }
        
        // Use upsert to update if exists, insert if new (based on SKU)
        const dealUpdate = {
          ...dealData,
          last_updated: new Date(),
        };

        // Check if deal exists by SKU
        const existing = await Deal.findOne({ sku: dealData.sku });
        console.log(`      - Status: ${existing ? 'EXISTS (updating)' : 'NEW (inserting)'}`);

        if (existing) {
          // Update existing deal
          await Deal.findByIdAndUpdate(existing._id, dealUpdate, { new: true });
          updated++;
          console.log(`      ✅ Updated`);
        } else {
          // Insert new deal (will fail if duplicate SKU due to unique index)
          try {
            const newDeal = new Deal(dealUpdate);
            await newDeal.save();
            saved++;
            console.log(`      ✅ Saved`);
          } catch (error: any) {
            // Handle duplicate key error (race condition)
            if (error.code === 11000) {
              console.log(`      ⚠️ Duplicate SKU detected, updating instead`);
              await Deal.findOneAndUpdate({ sku: dealData.sku }, dealUpdate, { new: true });
              updated++;
            } else {
              throw error;
            }
          }
        }
        
        // Track this SKU as seen
        seenSkus.push(dealData.sku);
      } catch (error: any) {
        console.error(`      ❌ Error saving deal ${dealData.sku}:`, error.message);
        console.error(`      - Error stack:`, error.stack);
        errors++;
      }
    }
    
    console.log(`\n✅ [DEBUG] Save complete:`);
    console.log(`   - New: ${saved}`);
    console.log(`   - Updated: ${updated}`);
    console.log(`   - Errors: ${errors}`);
    console.log(`   - Seen SKUs: ${seenSkus.length}`);
    
    return seenSkus; // Return list of SKUs that were seen
  }
  
  // Mark products as out of stock if they weren't seen in the current refresh
  // This ensures products that are no longer on Home Depot are hidden from our website
  async markUnseenProductsAsOutOfStock(seenSkus: string[]): Promise<number> {
    console.log('\n' + '='.repeat(60));
    console.log('🔍 [OUT_OF_STOCK] Marking unseen products as out of stock...');
    console.log('='.repeat(60));
    console.log(`   - Seen SKUs in this refresh: ${seenSkus.length}`);
    console.log(`   - Timestamp: ${new Date().toISOString()}`);
    
    if (seenSkus.length === 0) {
      console.warn('   ⚠️ No seen SKUs - skipping out of stock marking');
      return 0;
    }
    
    try {
      // Find all products that were NOT seen in this refresh
      // AND are currently marked as available (to avoid re-marking already out of stock items)
      const unseenProducts = await Deal.find({
        sku: { $nin: seenSkus },
        $or: [
          { online_available: true },
          { in_store_available: true }
        ]
      });
      
      console.log(`   - Found ${unseenProducts.length} products not seen in this refresh`);
      
      if (unseenProducts.length === 0) {
        console.log(`   ✅ No products to mark as out of stock`);
        return 0;
      }
      
      // Mark them as out of stock
      const result = await Deal.updateMany(
        {
          sku: { $nin: seenSkus },
          $or: [
            { online_available: true },
            { in_store_available: true }
          ]
        },
        {
          $set: {
            online_available: false,
            in_store_available: false,
            last_updated: new Date()
          }
        }
      );
      
      console.log(`   ✅ Marked ${result.modifiedCount} products as out of stock`);
      console.log(`   - These products will now be hidden from the website`);
      
      // Log this activity
      await this.logActivity('api', `Marked ${result.modifiedCount} unseen products as out of stock`, {
        seen_skus_count: seenSkus.length,
        marked_out_of_stock: result.modifiedCount
      });
      
      return result.modifiedCount;
    } catch (error: any) {
      console.error(`   ❌ Error marking products as out of stock:`, error.message);
      await this.logActivity('error', 'Failed to mark unseen products as out of stock', {
        error: error.message
      });
      return 0;
    }
  }

  // Log activity
  async logActivity(type: string, message: string, data?: any): Promise<void> {
    const log = new Log({
      type,
      message,
      data: data || {},
    });
    await log.save();
  }
}
