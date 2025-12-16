// Direct test of Apify API
require('dotenv').config();
const axios = require('axios');

const API_KEY = process.env.APIFY_API_KEY;
const ACTOR_ID = 'jupri~homedepot';
const BASE_URL = 'https://api.apify.com/v2';

async function test() {
  console.log('\n🧪 Testing Apify Direct...\n');
  
  const inputPayload = {
    dev_dataset_clear: false,
    dev_no_strip: false,
    dev_proxy_config: {
      useApifyProxy: true,
      apifyProxyGroups: ["RESIDENTIAL"],
      apifyProxyCountry: "US"
    },
    include_details: false,
    limit: 10,
    query: ["drill"], // Using "drill" not "Indomie"
    review_verified: false
  };

  console.log('📤 Starting run with input:');
  console.log(JSON.stringify(inputPayload, null, 2));
  
  try {
    // Start run
    const runResponse = await axios.post(
      `${BASE_URL}/acts/${ACTOR_ID}/runs?token=${API_KEY}`,
      inputPayload
    );
    
    const runId = runResponse.data.data.id;
    console.log(`\n✅ Run started: ${runId}`);
    console.log(`   URL: https://console.apify.com/actors/${ACTOR_ID}/runs/${runId}`);
    
    // Wait for completion
    console.log('\n⏳ Waiting for run to complete...');
    let status = 'RUNNING';
    let attempts = 0;
    
    while (status === 'RUNNING' && attempts < 60) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      const statusResponse = await axios.get(
        `${BASE_URL}/actor-runs/${runId}?token=${API_KEY}`
      );
      status = statusResponse.data.data.status;
      const itemsCount = statusResponse.data.data.stats?.itemsCount || 0;
      console.log(`   Attempt ${attempts + 1}: Status = ${status}, Items = ${itemsCount}`);
      attempts++;
    }
    
    if (status === 'SUCCEEDED') {
      const datasetId = runResponse.data.data.defaultDatasetId;
      const itemsResponse = await axios.get(
        `${BASE_URL}/datasets/${datasetId}/items?token=${API_KEY}`
      );
      const items = itemsResponse.data || [];
      console.log(`\n✅ SUCCESS! Got ${items.length} items`);
      if (items.length > 0) {
        console.log('\nFirst item:');
        console.log(JSON.stringify(items[0], null, 2).substring(0, 500));
      }
    } else {
      console.log(`\n❌ Run ${status}`);
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
  }
  
  process.exit(0);
}

test();

