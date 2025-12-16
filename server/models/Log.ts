import mongoose from 'mongoose';

const logSchema = new mongoose.Schema({
  type: { type: String, required: true, index: true }, // 'api', 'scraper', 'error', 'auth'
  message: String,
  data: mongoose.Schema.Types.Mixed,
  created_at: { type: Date, default: Date.now, index: true },
});

export const Log = mongoose.models.Log || mongoose.model('Log', logSchema);

