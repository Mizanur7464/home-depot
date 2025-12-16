import mongoose from 'mongoose';

const dealSchema = new mongoose.Schema({
  sku: { type: String, required: true, unique: true, index: true },
  title: { type: String, required: true },
  description: String,
  image_url: String,
  current_price: { type: Number, required: true },
  original_price: Number,
  discount_percent: Number,
  price_ending: String, // .06, .04, .03, .02
  category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', index: true },
  online_available: { type: Boolean, default: false },
  in_store_available: { type: Boolean, default: false },
  availability_data: mongoose.Schema.Types.Mixed, // Store zip codes and stock info
  store_locations: mongoose.Schema.Types.Mixed, // Array of store locations with zip codes
  is_featured: { type: Boolean, default: false, index: true },
  source: String, // 'api' or 'scraper'
  last_updated: { type: Date, default: Date.now, index: true },
  created_at: { type: Date, default: Date.now },
});

export const Deal = mongoose.models.Deal || mongoose.model('Deal', dealSchema);

