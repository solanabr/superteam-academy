import mongoose, { Schema, model, models } from 'mongoose';

const UserSchema = new Schema({
  walletAddress: { type: String, required: true, unique: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  username: { type: String },
  email: { type: String },
  telegram: { type: String },
  discord: { type: String },
  phoneNumber: { type: String },
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  streak: { type: Number, default: 0 },
  lastActiveDate: { type: Date, default: Date.now },
  enrolledCourses: [{ type: String }], // Array of course slugs
  completedLessons: [{ type: String }], // Array of lesson IDs
  achievements: [{ type: String }],
}, { timestamps: true });

const User = models.User || model('User', UserSchema);

export default User;
