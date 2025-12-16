import dotenv from 'dotenv';
import { connectDB } from '../server/db/connection';
import { Deal } from '../server/models/Deal';

dotenv.config();

const testDeals = [
  {
    sku: '100123456',
    title: 'DEWALT 20V MAX Cordless Drill Kit',
    description: 'Professional cordless drill with 2 batteries and charger',
    image_url: 'https://images.homedepot-static.com/productImages/123456/sample.jpg',
    current_price: 89.06,
    original_price: 149.99,
    discount_percent: 40.63,
    price_ending: '.06',
    online_available: true,
    in_store_available: true,
    availability_data: { zip: '30309', stock: 5 },
    store_locations: [{ zip: '30309', store: 'Atlanta' }],
    is_featured: true,
    source: 'test',
    last_updated: new Date(),
    created_at: new Date(),
  },
  {
    sku: '100234567',
    title: 'Milwaukee M18 Fuel Impact Driver',
    description: 'High-performance impact driver with brushless motor',
    image_url: 'https://images.homedepot-static.com/productImages/234567/sample.jpg',
    current_price: 129.04,
    original_price: 199.99,
    discount_percent: 35.48,
    price_ending: '.04',
    online_available: true,
    in_store_available: false,
    availability_data: { zip: '30309', stock: 0 },
    store_locations: [],
    is_featured: false,
    source: 'test',
    last_updated: new Date(),
    created_at: new Date(),
  },
  {
    sku: '100345678',
    title: 'Ryobi ONE+ 18V Cordless Circular Saw',
    description: 'Lightweight circular saw with 5.5" blade',
    image_url: 'https://images.homedepot-static.com/productImages/345678/sample.jpg',
    current_price: 49.03,
    original_price: 79.99,
    discount_percent: 38.75,
    price_ending: '.03',
    online_available: false,
    in_store_available: true,
    availability_data: { zip: '30309', stock: 3 },
    store_locations: [{ zip: '30309', store: 'Atlanta' }],
    is_featured: true,
    source: 'test',
    last_updated: new Date(),
    created_at: new Date(),
  },
  {
    sku: '100456789',
    title: 'Bosch 12V Max Drill/Driver Kit',
    description: 'Compact drill driver with LED light',
    image_url: 'https://images.homedepot-static.com/productImages/456789/sample.jpg',
    current_price: 59.02,
    original_price: 99.99,
    discount_percent: 40.96,
    price_ending: '.02',
    online_available: true,
    in_store_available: true,
    availability_data: { zip: '30309', stock: 8 },
    store_locations: [{ zip: '30309', store: 'Atlanta' }],
    is_featured: false,
    source: 'test',
    last_updated: new Date(),
    created_at: new Date(),
  },
  {
    sku: '100567890',
    title: 'Makita XPH12Z 18V LXT Hammer Drill',
    description: 'Professional hammer drill with variable speed',
    image_url: 'https://images.homedepot-static.com/productImages/567890/sample.jpg',
    current_price: 99.06,
    original_price: 159.99,
    discount_percent: 38.13,
    price_ending: '.06',
    online_available: true,
    in_store_available: true,
    availability_data: { zip: '30309', stock: 2 },
    store_locations: [{ zip: '30309', store: 'Atlanta' }],
    is_featured: true,
    source: 'test',
    last_updated: new Date(),
    created_at: new Date(),
  },
  {
    sku: '100678901',
    title: 'Craftsman V20 Cordless Drill Set',
    description: 'Complete drill set with accessories',
    image_url: 'https://images.homedepot-static.com/productImages/678901/sample.jpg',
    current_price: 79.04,
    original_price: 129.99,
    discount_percent: 39.23,
    price_ending: '.04',
    online_available: true,
    in_store_available: false,
    availability_data: { zip: '30309', stock: 0 },
    store_locations: [],
    is_featured: false,
    source: 'test',
    last_updated: new Date(),
    created_at: new Date(),
  },
  {
    sku: '100789012',
    title: 'Black+Decker 20V MAX Cordless Drill',
    description: 'Affordable cordless drill for home projects',
    image_url: 'https://images.homedepot-static.com/productImages/789012/sample.jpg',
    current_price: 39.03,
    original_price: 69.99,
    discount_percent: 44.29,
    price_ending: '.03',
    online_available: false,
    in_store_available: true,
    availability_data: { zip: '30309', stock: 12 },
    store_locations: [{ zip: '30309', store: 'Atlanta' }],
    is_featured: false,
    source: 'test',
    last_updated: new Date(),
    created_at: new Date(),
  },
  {
    sku: '100890123',
    title: 'Porter-Cable 20V MAX Drill Kit',
    description: 'Professional drill kit with 2 batteries',
    image_url: 'https://images.homedepot-static.com/productImages/890123/sample.jpg',
    current_price: 69.02,
    original_price: 119.99,
    discount_percent: 42.50,
    price_ending: '.02',
    online_available: true,
    in_store_available: true,
    availability_data: { zip: '30309', stock: 6 },
    store_locations: [{ zip: '30309', store: 'Atlanta' }],
    is_featured: true,
    source: 'test',
    last_updated: new Date(),
    created_at: new Date(),
  },
  {
    sku: '100901234',
    title: 'Ridgid 18V Cordless Drill Driver',
    description: 'Heavy-duty drill driver with lifetime warranty',
    image_url: 'https://images.homedepot-static.com/productImages/901234/sample.jpg',
    current_price: 89.06,
    original_price: 149.99,
    discount_percent: 40.63,
    price_ending: '.06',
    online_available: true,
    in_store_available: true,
    availability_data: { zip: '30309', stock: 4 },
    store_locations: [{ zip: '30309', store: 'Atlanta' }],
    is_featured: false,
    source: 'test',
    last_updated: new Date(),
    created_at: new Date(),
  },
  {
    sku: '101012345',
    title: 'Kobalt 24V MAX Cordless Drill',
    description: 'High-torque drill with brushless motor',
    image_url: 'https://images.homedepot-static.com/productImages/1012345/sample.jpg',
    current_price: 109.04,
    original_price: 179.99,
    discount_percent: 39.42,
    price_ending: '.04',
    online_available: true,
    in_store_available: false,
    availability_data: { zip: '30309', stock: 0 },
    store_locations: [],
    is_featured: true,
    source: 'test',
    last_updated: new Date(),
    created_at: new Date(),
  },
];

async function addTestData() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await connectDB();
    
    // Wait for connection to be ready
    const mongoose = require('mongoose');
    let attempts = 0;
    while (mongoose.connection.readyState !== 1 && attempts < 10) {
      console.log(`   ⏳ Waiting for connection... (${attempts + 1}/10)`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      attempts++;
    }
    
    if (mongoose.connection.readyState !== 1) {
      console.error('❌ MongoDB connection failed. Please check:');
      console.error('   1. IP whitelist in MongoDB Atlas');
      console.error('   2. Connection string in .env file');
      process.exit(1);
    }
    
    console.log('✅ Connected to MongoDB');

    console.log(`\n📦 Adding ${testDeals.length} test deals...`);
    
    let added = 0;
    let updated = 0;
    let errors = 0;

    for (const dealData of testDeals) {
      try {
        const existing = await Deal.findOne({ sku: dealData.sku });
        
        if (existing) {
          await Deal.findByIdAndUpdate(existing._id, dealData);
          updated++;
          console.log(`   ✓ Updated: ${dealData.sku} - ${dealData.title.substring(0, 40)}...`);
        } else {
          const deal = new Deal(dealData);
          await deal.save();
          added++;
          console.log(`   ✓ Added: ${dealData.sku} - ${dealData.title.substring(0, 40)}...`);
        }
      } catch (error: any) {
        errors++;
        console.error(`   ✗ Error with ${dealData.sku}:`, error.message);
      }
    }

    console.log(`\n✅ Complete!`);
    console.log(`   - Added: ${added}`);
    console.log(`   - Updated: ${updated}`);
    console.log(`   - Errors: ${errors}`);
    console.log(`\n🎉 Test data added successfully!`);
    
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addTestData();

