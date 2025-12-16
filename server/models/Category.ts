import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true },
  is_active: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now },
});

export const Category = mongoose.models.Category || mongoose.model('Category', categorySchema);

