import dotenv from 'dotenv';
import { connectDB } from '../server/db/connection';
import { Deal } from '../server/models/Deal';

dotenv.config();

async function removeNonClearance() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await connectDB();

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

    console.log('\n🗑️  Removing non-clearance items...');
    console.log('   - Keeping only items with price endings: .06, .04, .03, .02');
    
    // Delete all items that are NOT clearance items
    const result = await Deal.deleteMany({
      price_ending: { $nin: ['.06', '.04', '.03', '.02'] }
    });

    console.log(`\n✅ Complete!`);
    console.log(`   - Deleted ${result.deletedCount} non-clearance items`);
    
    // Count remaining clearance items
    const clearanceCount = await Deal.countDocuments({
      price_ending: { $in: ['.06', '.04', '.03', '.02'] }
    });
    
    console.log(`   - Remaining clearance items: ${clearanceCount}`);
    console.log(`\n🎉 Non-clearance items removed successfully!`);
    console.log(`   - Only CLEARANCE items (price endings: .06, .04, .03, .02) will be displayed`);

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

removeNonClearance();

