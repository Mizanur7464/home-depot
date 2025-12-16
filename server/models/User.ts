import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  whop_user_id: { type: String, required: true, unique: true },
  email: String,
  membership_active: { type: Boolean, default: false },
  last_checked_at: Date,
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

export const User = mongoose.models.User || mongoose.model('User', userSchema);

