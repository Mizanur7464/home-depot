import dotenv from 'dotenv';
import { connectDB } from '../server/db/connection';
import { Deal } from '../server/models/Deal';
import mongoose from 'mongoose';

dotenv.config();

async function resetAvailability() {
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

    // Count out of stock products
    const outOfStockCount = await Deal.countDocuments({
      online_available: false,
      in_store_available: false
    });
    
    console.log(`📊 Found ${outOfStockCount} products marked as out of stock`);
    console.log(`   - Resetting them to available (temporary fix)`);
    console.log(`   - After refresh, availability will be set correctly\n`);

    // Reset all products to available (temporary fix)
    // After refresh, they will be set correctly based on Apify data
    const result = await Deal.updateMany(
      {
        online_available: false,
        in_store_available: false
      },
      {
        $set: {
          online_available: true,
          in_store_available: true,
          last_updated: new Date()
        }
      }
    );

    console.log(`✅ Reset ${result.modifiedCount} products to available`);
    console.log(`\n⚠️  IMPORTANT: Run a data refresh to get correct availability from Apify!`);
    console.log(`   - Go to Admin Panel → Settings → Manual Refresh Now`);
    console.log(`   - This will fetch fresh data and set availability correctly`);

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

resetAvailability();

