
const mongoose = require('mongoose');
const { Schema, model, models } = mongoose;

const UserSchema = new Schema({
  walletAddress: { type: String, required: true, unique: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  username: { type: String },
}, { strict: false }); // strict: false to ignore other fields

const User = models.User || model('User', UserSchema);

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error("Missing MONGODB_URI. usage: MONGODB_URI=... node scripts/make-admin.js <wallet>");
    process.exit(1);
}

const walletAddress = process.argv[2];

if (!walletAddress) {
    console.error("Missing wallet address.");
    process.exit(1);
}

async function makeAdmin() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected!');

    console.log(`Promoting ${walletAddress} to admin...`);
    const result = await User.updateOne(
        { walletAddress },
        { $set: { role: 'admin' } }
    );

    if (result.matchedCount === 0) {
        console.log('User not found! Please login first to create your account.');
    } else if (result.modifiedCount === 0) {
         console.log('User is already an admin.');
    } else {
        console.log('Success! User is now an admin.');
    }

    process.exit(0);
  } catch (error) {
    console.error('Failed:', error);
    process.exit(1);
  }
}

makeAdmin();
