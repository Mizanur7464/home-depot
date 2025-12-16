import cron from 'node-cron';
import { DataFetcher } from '../services/dataFetcher';
import { Scraper } from '../services/scraper';
import { invalidateDealsCache } from '../services/cache';

// This job runs periodically to refresh deal data

export class DataRefreshJob {
  private dataFetcher: DataFetcher;
  private scraper: Scraper;
  private isRunning: boolean = false;

  constructor() {
    this.dataFetcher = new DataFetcher();
    this.scraper = new Scraper();
  }

  // Main refresh function
  async refresh(): Promise<void> {
    console.log('\n' + '='.repeat(50));
    console.log('🔄 [REFRESH] Starting data refresh job...');
    console.log('='.repeat(50));
    console.log(`   - Timestamp: ${new Date().toISOString()}`);
    console.log(`   - Is already running: ${this.isRunning}`);
    
    if (this.isRunning) {
      console.log('⏳ Refresh job already running, skipping...');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();
    console.log(`   - Start time: ${new Date(startTime).toISOString()}`);

    try {
      // Strategy: Fetch VERY LARGE number of products to find 20-30 clearance items
      // Clearance items have price endings .06, .04, .03, .02
      console.log('\n📡 Step 1: Fetching from API (VERY large batch to find 20-30 clearance items)...');
      console.log('   - Fetching 2000+ products to increase chance of finding 20-30 clearance items');
      console.log('   - Clearance items have price endings: .06, .04, .03, .02');
      
      // Try MANY diverse queries to find more clearance items
      const queries = [
        'drill', 'tool', 'power tool', 'saw', 'hammer', 
        'screwdriver', 'wrench', 'pliers', 'level', 'tape measure',
        'paint', 'brush', 'roller', 'ladder', 'safety',
        'light', 'bulb', 'outlet', 'switch', 'wire',
        'pipe', 'fitting', 'valve', 'faucet', 'sink'
      ];
      let allDeals: any[] = [];
      
      for (const query of queries) {
        console.log(`\n   🔍 Fetching products with query: "${query}" (limit: 500)...`);
        const deals = await this.dataFetcher.fetchFromAPI(query, 500);
        console.log(`   ✅ Got ${deals.length} deals from "${query}"`);
        allDeals = allDeals.concat(deals);
        
        // Count clearance items found so far
        const currentClearance = allDeals.filter(d => 
          d.price_ending === '.06' || d.price_ending === '.04' || 
          d.price_ending === '.03' || d.price_ending === '.02'
        ).length;
        console.log(`   📊 Current clearance items found: ${currentClearance}`);
        
        // Stop if we have enough clearance items (20-30) OR too many total products
        if (currentClearance >= 30 || allDeals.length >= 2000) {
          console.log(`   ✅ Stopping: ${currentClearance} clearance items found, ${allDeals.length} total products`);
          break;
        }
      }
      
      console.log(`\n✅ Total deals fetched: ${allDeals.length}`);
      
      // Filter for CLEARANCE items only (price endings: .06, .04, .03, .02)
      console.log('\n🔍 Step 1.5: Filtering for CLEARANCE items...');
      const clearanceDeals = allDeals.filter(deal => {
        const priceEnding = deal.price_ending;
        return priceEnding === '.06' || priceEnding === '.04' || 
               priceEnding === '.03' || priceEnding === '.02';
      });
      
      console.log(`   - Total deals: ${allDeals.length}`);
      console.log(`   - Clearance deals: ${clearanceDeals.length}`);
      
      if (clearanceDeals.length > 0) {
        console.log(`   ✅ Found ${clearanceDeals.length} CLEARANCE items!`);
        console.log(`   - First clearance deal:`, JSON.stringify(clearanceDeals[0], null, 2).substring(0, 300));
      } else {
        console.log(`   ⚠️ No clearance items found in ${allDeals.length} products`);
        console.log(`   - Saving ALL products (will filter in API by price endings)`);
      }
      
      if (allDeals.length > 0) {
        console.log('\n💾 Step 2: Saving deals to database...');
        // Save ALL deals (clearance filter will be applied in API)
        console.log(`   - Calling dataFetcher.saveDeals() with ${allDeals.length} deals...`);
        const seenSkus = await this.dataFetcher.saveDeals(allDeals);
        console.log(`   ✅ saveDeals() completed`);
        console.log(`   - Products seen in this refresh: ${seenSkus.length}`);
        
        // Step 2.5: Mark products that weren't seen as out of stock
        // This ensures products no longer on Home Depot are hidden from our website
        console.log('\n🔍 Step 2.5: Checking for products not seen in this refresh...');
        const markedOutOfStock = await this.dataFetcher.markUnseenProductsAsOutOfStock(seenSkus);
        if (markedOutOfStock > 0) {
          console.log(`   ✅ Marked ${markedOutOfStock} products as out of stock (no longer on Home Depot)`);
        } else {
          console.log(`   ✅ All existing products were seen in this refresh`);
        }
        
        // Invalidate cache after saving new data
        console.log('\n🗑️ Step 3: Invalidating deals cache...');
        await invalidateDealsCache();
        console.log(`   ✅ Cache invalidated - fresh data will be served`);
        
        await this.dataFetcher.logActivity('api', `Fetched ${allDeals.length} deals (${clearanceDeals.length} clearance) from API, marked ${markedOutOfStock} as out of stock`);
        console.log(`✅ Successfully saved ${allDeals.length} deals to database`);
        if (clearanceDeals.length > 0) {
          console.log(`   🎉 ${clearanceDeals.length} CLEARANCE items saved!`);
        }
      } else {
        console.log('\n⚠️ Step 2: API returned no data');
        console.log(`   - allDeals.length = ${allDeals.length}`);
        console.log('   - Checking if scraper is available...');
        // Fallback to scraper if API returns no data
        console.log('⚠️ API returned no data, trying scraper...');
        console.log(`   - Calling scraper.scrapeDeals()...`);
        
        try {
          const scrapedDeals = await this.scraper.scrapeDeals();
          console.log(`   ✅ Scraper call completed`);
          console.log(`   - Result: ${scrapedDeals.length} deals scraped`);
          
          if (scrapedDeals.length > 0) {
            const seenSkus = await this.dataFetcher.saveDeals(scrapedDeals);
            
            // Mark products that weren't seen as out of stock
            console.log('\n🔍 Step 2.5: Checking for products not seen in this refresh...');
            const markedOutOfStock = await this.dataFetcher.markUnseenProductsAsOutOfStock(seenSkus);
            if (markedOutOfStock > 0) {
              console.log(`   ✅ Marked ${markedOutOfStock} products as out of stock`);
            }
            
            // Invalidate cache after saving scraped data
            console.log('\n🗑️ Step 3: Invalidating deals cache...');
            await invalidateDealsCache();
            console.log(`   ✅ Cache invalidated - fresh data will be served`);
            
            await this.dataFetcher.logActivity('scraper', `Scraped ${scrapedDeals.length} deals, marked ${markedOutOfStock} as out of stock`);
            console.log(`✅ Successfully saved ${scrapedDeals.length} scraped deals`);
          } else {
            console.warn('⚠️ No deals found from API or scraper');
            console.warn('   - Scraper may not be implemented or Playwright browsers not installed');
          }
        } catch (scraperError: any) {
          console.warn('⚠️ Scraper unavailable:', scraperError.message);
          console.warn('   - This is normal if Playwright browsers are not installed');
          console.warn('   - Scraper is optional - API is the primary data source');
          // Don't log this as an error since scraper is optional
        }
      }

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log('\n' + '='.repeat(50));
      console.log(`✅ Data refresh completed in ${duration}s`);
      console.log(`   - End time: ${new Date().toISOString()}`);
      console.log('='.repeat(50) + '\n');
    } catch (error: any) {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.error('\n' + '='.repeat(50));
      console.error('❌ Data refresh failed:', error.message);
      console.error(`   - Error type: ${error.constructor.name}`);
      console.error(`   - Error message: ${error.message}`);
      console.error('   - Stack:', error.stack);
      console.error(`   - Duration: ${duration}s`);
      console.error(`   - End time: ${new Date().toISOString()}`);
      console.error('='.repeat(50) + '\n');
      
      // Check if it's a Playwright/scraper error - don't log as critical error
      const isPlaywrightError = error.message?.includes('Executable doesn\'t exist') || 
                                error.message?.includes('browserType.launch') ||
                                error.message?.includes('Playwright');
      
      if (isPlaywrightError) {
        // Log as warning, not error - scraper is optional
        await this.dataFetcher.logActivity('scraper', 'Scraper unavailable - Playwright browsers not installed', { 
          error: error.message || String(error),
          note: 'This is normal if Playwright is not installed. Scraper is optional.'
        });
      } else {
        // Log as error for other issues
        await this.dataFetcher.logActivity('error', 'Data refresh failed', { 
          error: error.message || String(error),
          errorType: error.constructor.name,
          stack: error.stack?.substring(0, 500) // Limit stack trace length
        });
      }
    } finally {
      this.isRunning = false;
    }
  }

  // Schedule automatic refresh
  startScheduler(interval: string = '*/30 * * * *'): void {
    // Default: every 30 minutes
    cron.schedule(interval, async () => {
      await this.refresh();
    });
    console.log(`⏰ Data refresh scheduled: ${interval}`);
  }

  // Manual trigger
  async trigger(): Promise<void> {
    console.log('\n🔵 [DEBUG] DataRefreshJob.trigger() called');
    console.log(`   - Timestamp: ${new Date().toISOString()}`);
    console.log(`   - Is already running: ${this.isRunning}`);
    await this.refresh();
  }
}

// Initialize and start if running as standalone
if (require.main === module) {
  const job = new DataRefreshJob();
  job.startScheduler();
}

