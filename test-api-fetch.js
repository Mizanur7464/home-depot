// Quick test script to check API fetch
require('dotenv').config();
const { DataFetcher } = require('./server/services/dataFetcher');

async function test() {
  console.log('\n🧪 Testing API Fetch...\n');
  
  const fetcher = new DataFetcher();
  const deals = await fetcher.fetchFromAPI('clearance', 10);
  
  console.log(`\n✅ Result: ${deals.length} deals fetched\n`);
  
  if (deals.length > 0) {
    console.log('First deal:', JSON.stringify(deals[0], null, 2));
  }
  
  process.exit(0);
}

test().catch(console.error);

