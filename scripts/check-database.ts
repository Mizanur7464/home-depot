import dotenv from 'dotenv';
import { connectDB } from '../server/db/connection';
import { Deal } from '../server/models/Deal';
import mongoose from 'mongoose';

dotenv.config();

async function checkDatabase() {
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
      console.error('❌ MongoDB connection failed.');
      process.exit(1);
    }

    console.log('✅ Connected to MongoDB\n');

    // Count all products
    const totalProducts = await Deal.countDocuments();
    console.log(`📊 Total products in database: ${totalProducts}`);

    // Count by availability
    const inStockProducts = await Deal.countDocuments({
      $or: [
        { online_available: true },
        { in_store_available: true }
      ]
    });
    console.log(`   - In stock (online OR in-store): ${inStockProducts}`);

    const outOfStockProducts = await Deal.countDocuments({
      online_available: false,
      in_store_available: false
    });
    console.log(`   - Out of stock (both false): ${outOfStockProducts}`);

    // Count by price ending
    const clearanceProducts = await Deal.countDocuments({
      price_ending: { $in: ['.06', '.04', '.03', '.02'] }
    });
    console.log(`   - Clearance items (.06, .04, .03, .02): ${clearanceProducts}`);

    // Count products that match BOTH criteria (in stock AND clearance)
    const availableClearance = await Deal.countDocuments({
      $or: [
        { online_available: true },
        { in_store_available: true }
      ],
      price_ending: { $in: ['.06', '.04', '.03', '.02'] }
    });
    console.log(`\n✅ Available Clearance Products: ${availableClearance}`);
    console.log(`   (This is what should show on website)`);

    // Show sample products
    if (totalProducts > 0) {
      console.log(`\n📦 Sample products (first 5):`);
      const samples = await Deal.find().limit(5);
      samples.forEach((deal, index) => {
        console.log(`\n   ${index + 1}. SKU: ${deal.sku}`);
        console.log(`      Title: ${deal.title?.substring(0, 50)}...`);
        console.log(`      Price: $${deal.current_price} (ending: ${deal.price_ending || 'N/A'})`);
        console.log(`      Online: ${deal.online_available}, In-Store: ${deal.in_store_available}`);
        console.log(`      Last Updated: ${deal.last_updated}`);
      });
    } else {
      console.log(`\n⚠️  No products in database!`);
      console.log(`   - Need to run data refresh to fetch products from Apify`);
      console.log(`   - Go to Admin Panel → Settings → Manual Refresh Now`);
    }

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkDatabase();

