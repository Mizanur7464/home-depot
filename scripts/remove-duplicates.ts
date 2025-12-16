import mongoose from 'mongoose';
import { Deal } from '../server/models/Deal';

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL || '';

async function removeDuplicates() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all deals grouped by SKU
    const duplicates = await Deal.aggregate([
      {
        $group: {
          _id: '$sku',
          count: { $sum: 1 },
          ids: { $push: '$_id' }
        }
      },
      {
        $match: {
          count: { $gt: 1 } // Only SKUs with duplicates
        }
      }
    ]);

    console.log(`\n📊 Found ${duplicates.length} SKUs with duplicates`);

    let removed = 0;
    let kept = 0;

    for (const dup of duplicates) {
      const sku = dup._id;
      const ids = dup.ids;
      const count = dup.count;

      console.log(`\n🔍 Processing SKU: ${sku} (${count} duplicates)`);

      // Keep the most recently updated one, delete the rest
      const deals = await Deal.find({ sku }).sort({ last_updated: -1 });
      
      if (deals.length > 1) {
        const keepDeal = deals[0]; // Most recent
        const deleteDeals = deals.slice(1); // Older ones

        console.log(`   ✅ Keeping: ${keepDeal._id} (updated: ${keepDeal.last_updated})`);
        kept++;

        for (const deleteDeal of deleteDeals) {
          await Deal.findByIdAndDelete(deleteDeal._id);
          console.log(`   ❌ Deleted: ${deleteDeal._id} (updated: ${deleteDeal.last_updated})`);
          removed++;
        }
      }
    }

    console.log(`\n✅ Cleanup complete:`);
    console.log(`   - Kept: ${kept} unique products`);
    console.log(`   - Removed: ${removed} duplicates`);

    // Verify no duplicates remain
    const remainingDuplicates = await Deal.aggregate([
      {
        $group: {
          _id: '$sku',
          count: { $sum: 1 }
        }
      },
      {
        $match: {
          count: { $gt: 1 }
        }
      }
    ]);

    if (remainingDuplicates.length === 0) {
      console.log(`\n✅ No duplicates remaining!`);
    } else {
      console.log(`\n⚠️ Warning: ${remainingDuplicates.length} SKUs still have duplicates`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

removeDuplicates();

