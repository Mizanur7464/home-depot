import dotenv from 'dotenv';
import { connectDB } from '../server/db/connection';
import { Deal } from '../server/models/Deal';
import mongoose from 'mongoose';

dotenv.config();

async function removeClearanceTest() {
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
    console.log('\n🗑️  Removing CLEARANCE test products...');
    
    const result = await Deal.deleteMany({ 
      sku: { $regex: /^CLEAR/ } 
    });

    console.log(`\n✅ Complete!`);
    console.log(`   - Deleted ${result.deletedCount} test clearance products`);
    console.log(`\n🎉 Test products removed!`);
    console.log(`   - Only REAL Apify products will remain`);

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

removeClearanceTest();

