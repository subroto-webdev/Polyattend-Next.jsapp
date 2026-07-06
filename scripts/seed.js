/**
 * Seed script — creates a default Admin account.
 * Usage: npm run seed
 * (Reads MONGODB_URI, ADMIN_EMAIL, ADMIN_PASSWORD from .env.local / process.env)
 */
require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI not set (check .env.local)');
  await mongoose.connect(uri);

  const userSchema = new mongoose.Schema({}, { strict: false, timestamps: true });
  const User = mongoose.models.User || mongoose.model('User', userSchema, 'users');

  const email = process.env.ADMIN_EMAIL || 'admin@polyattend.com';
  const password = process.env.ADMIN_PASSWORD || 'Admin@123';

  const existing = await User.findOne({ email });
  if (existing) {
    console.log(`Admin already exists: ${email}`);
  } else {
    const hashed = await bcrypt.hash(password, 10);
    await User.create({ name: 'Admin', email, password: hashed, role: 'admin', isActive: true, isVerified: true });
    console.log(`✅ Admin created — email: ${email}  password: ${password}`);
  }
  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
