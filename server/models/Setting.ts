import mongoose from 'mongoose';

const settingSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: mongoose.Schema.Types.Mixed,
  updated_at: { type: Date, default: Date.now },
});

export const Setting = mongoose.models.Setting || mongoose.model('Setting', settingSchema);

