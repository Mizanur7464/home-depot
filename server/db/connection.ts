import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/homedepot_deals';

let isConnected = false;

export const connectDB = async () => {
  if (isConnected) {
    console.log('✅ MongoDB already connected');
    return;
  }

  try {
    console.log('🔄 Connecting to MongoDB...');
    console.log(`   - URI: ${MONGODB_URI ? MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@') : 'NOT SET ❌'}`);
    
    if (!MONGODB_URI || MONGODB_URI.includes('localhost')) {
      console.error('❌ MONGODB_URI not set or using localhost');
      console.log('💡 Create .env file with: MONGODB_URI=mongodb+srv://...');
      isConnected = false;
      return;
    }

    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 30000, // Increased to 30s
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
    });
    isConnected = true;
    console.log('✅ MongoDB connected');
  } catch (error: any) {
    console.error('❌ MongoDB connection error:', error.message);
    console.log('⚠️ Server will continue running, but database operations will fail');
    console.log('💡 Fix:');
    console.log('   1. Check .env file has MONGODB_URI');
    console.log('   2. Add your IP to MongoDB Atlas Network Access whitelist');
    console.log('   3. Check MongoDB Atlas cluster is running');
    // Don't throw - let server continue running
    isConnected = false;
  }
};

// Handle connection events
mongoose.connection.on('connected', () => {
  console.log('✅ MongoDB connected');
  isConnected = true;
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err.message);
  isConnected = false;
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB disconnected');
  isConnected = false;
  
  // Attempt to reconnect after 5 seconds
  setTimeout(async () => {
    if (!isConnected) {
      console.log('🔄 Attempting to reconnect to MongoDB...');
      try {
        await connectDB();
      } catch (error: any) {
        console.error('❌ Reconnection failed:', error.message);
        console.log('💡 Will retry on next database operation');
      }
    }
  }, 5000);
});

// Export mongoose for models
export default mongoose;
