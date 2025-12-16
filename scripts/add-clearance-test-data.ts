import dotenv from 'dotenv';
import { connectDB } from '../server/db/connection';
import { Deal } from '../server/models/Deal';
import mongoose from 'mongoose';

dotenv.config();

const clearanceDeals = [
  {
    sku: 'CLEAR001',
    title: 'DEWALT 20V MAX Cordless Drill Kit - CLEARANCE',
    description: 'Clearance item with .06 price ending',
    image_url: 'https://images.thdstatic.com/productImages/377e62b9-39a0-4f02-b703-01143dbd479f/svn/dewalt-power-tool-combo-kits-dck240c2-64_600.jpg',
    current_price: 89.06, // Clearance price ending .06
    original_price: 149.99,
    discount_percent: 40.63,
    price_ending: '.06', // Clearance indicator
    online_available: true,
    in_store_available: true,
    is_featured: true,
    source: 'api',
    last_updated: new Date(),
    created_at: new Date(),
  },
  {
    sku: 'CLEAR002',
    title: 'MILWAUKEE M18 Hammer Drill - CLEARANCE',
    description: 'Clearance item with .04 price ending',
    image_url: 'https://images.thdstatic.com/productImages/d8f1f6c9-adb2-4faa-aeb7-47efa88dab0f/svn/milwaukee-hammer-drills-2607-20-64_600.jpg',
    current_price: 129.04, // Clearance price ending .04
    original_price: 199.99,
    discount_percent: 35.48,
    price_ending: '.04',
    online_available: true,
    in_store_available: true,
    is_featured: true,
    source: 'api',
    last_updated: new Date(),
    created_at: new Date(),
  },
  {
    sku: 'CLEAR003',
    title: 'RYOBI ONE+ Combo Kit - CLEARANCE',
    description: 'Clearance item with .03 price ending',
    image_url: 'https://images.thdstatic.com/productImages/e8605f92-8232-47c1-96aa-b44c018d02be/svn/ryobi-power-tools-64_600.jpg',
    current_price: 79.03, // Clearance price ending .03
    original_price: 119.99,
    discount_percent: 34.19,
    price_ending: '.03',
    online_available: true,
    in_store_available: true,
    is_featured: true,
    source: 'api',
    last_updated: new Date(),
    created_at: new Date(),
  },
  {
    sku: 'CLEAR004',
    title: 'BOSCH 18V Drill Driver - CLEARANCE',
    description: 'Clearance item with .02 price ending',
    image_url: 'https://images.thdstatic.com/productImages/8ef5151d-72e6-4803-bd1c-dfbd5dc5bee9/svn/bosch-power-tools-64_600.jpg',
    current_price: 99.02, // Clearance price ending .02
    original_price: 149.99,
    discount_percent: 33.99,
    price_ending: '.02',
    online_available: true,
    in_store_available: true,
    is_featured: true,
    source: 'api',
    last_updated: new Date(),
    created_at: new Date(),
  },
];

async function addClearanceTestData() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await connectDB();

    let attempts = 0;
    while (mongoose.connection.readyState !== 1 && attempts < 10) {
      console.log(`   ⏳ Waiting for connection... (${attempts + 1}/10)`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      attempts++;
    }

    if (mongoose.connection.readyState !== 1) {
      console.error('❌ MongoDB connection failed');
      process.exit(1);
    }

    console.log('✅ Connected to MongoDB');
    console.log(`\n📦 Adding ${clearanceDeals.length} CLEARANCE test deals...`);

    let added = 0;
    let updated = 0;

    for (const dealData of clearanceDeals) {
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
        console.error(`   ✗ Error with ${dealData.sku}:`, error.message);
      }
    }

    console.log(`\n✅ Complete!`);
    console.log(`   - Added: ${added}`);
    console.log(`   - Updated: ${updated}`);
    console.log(`\n🎉 CLEARANCE test data added!`);
    console.log(`   - Price endings: .06, .04, .03, .02`);
    console.log(`   - Check: http://localhost:3001/api/deals?price_ending=.06`);

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addClearanceTestData();

