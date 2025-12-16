import dotenv from 'dotenv';
import { connectDB } from '../server/db/connection';
import { Deal } from '../server/models/Deal';

dotenv.config();

// Cleanup old products that haven't been updated in X days
async function cleanupOldProducts(daysOld: number = 30) {
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

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    console.log(`\n🗑️  Cleaning up old products...`);
    console.log(`   - Removing products not updated in last ${daysOld} days`);
    console.log(`   - Cutoff date: ${cutoffDate.toISOString()}`);
    
    // Find old products
    const oldProducts = await Deal.find({
      last_updated: { $lt: cutoffDate }
    });

    console.log(`   - Found ${oldProducts.length} old products`);

    if (oldProducts.length === 0) {
      console.log(`\n✅ No old products to clean up!`);
      process.exit(0);
    }

    // Ask for confirmation (in production, you might want to add a flag)
    console.log(`\n⚠️  About to delete ${oldProducts.length} old products`);
    console.log(`   - This will remove products not updated since ${cutoffDate.toLocaleDateString()}`);
    
    // Delete old products
    const result = await Deal.deleteMany({
      last_updated: { $lt: cutoffDate }
    });

    console.log(`\n✅ Cleanup complete!`);
    console.log(`   - Deleted ${result.deletedCount} old products`);
    
    // Count remaining products
    const remainingCount = await Deal.countDocuments();
    console.log(`   - Remaining products: ${remainingCount}`);
    console.log(`\n🎉 Old products cleaned up successfully!`);

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Get days from command line argument or use default
const daysOld = process.argv[2] ? parseInt(process.argv[2]) : 30;
cleanupOldProducts(daysOld);

