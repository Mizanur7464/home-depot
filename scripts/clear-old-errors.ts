import dotenv from 'dotenv';
import { connectDB } from '../server/db/connection';
import { Log } from '../server/models/Log';

dotenv.config();

async function clearOldErrors() {
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
      console.error('❌ MongoDB connection failed.');
      process.exit(1);
    }

    console.log('✅ Connected to MongoDB');

    console.log('\n🗑️  Clearing old error logs...');
    console.log('   - Removing Playwright/scraper related errors');
    console.log('   - Removing "apiDeals is not defined" errors');
    
    // Delete old Playwright errors
    const playwrightResult = await Log.deleteMany({
      type: 'error',
      $or: [
        { 'data.error': { $regex: /Executable doesn't exist/i } },
        { 'data.error': { $regex: /browserType\.launch/i } },
        { 'data.error': { $regex: /Playwright/i } },
        { 'data.error': { $regex: /apiDeals is not defined/i } }
      ]
    });
    
    console.log(`\n✅ Complete!`);
    console.log(`   - Deleted ${playwrightResult.deletedCount} old error logs`);
    console.log(`\n🎉 Old errors cleared!`);
    console.log(`   - Only new, relevant errors will be shown`);

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

clearOldErrors();

