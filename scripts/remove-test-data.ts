import dotenv from 'dotenv';
import { connectDB } from '../server/db/connection';
import { Deal } from '../server/models/Deal';

dotenv.config();

async function removeTestData() {
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

    console.log('\n🗑️  Removing test data...');
    
    // Delete all deals with source: 'test'
    const result = await Deal.deleteMany({ source: 'test' });
    
    console.log(`\n✅ Complete!`);
    console.log(`   - Deleted ${result.deletedCount} test deals`);
    console.log(`\n🎉 Test data removed successfully!`);
    console.log(`   - Only real Apify data will remain`);
    
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

removeTestData();

