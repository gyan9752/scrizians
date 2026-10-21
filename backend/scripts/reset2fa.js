/*
 * Resets two-factor authentication for one account (lost phone etc.).
 * The user is asked to scan a new QR code on their next login.
 *
 * Usage:  npm run reset-2fa -- admin@scrizians.com
 */
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config();

const connectDB = require('../src/config/db');
const User = require('../src/models/User');

const run = async () => {
  const email = (process.argv[2] || '').trim().toLowerCase();

  if (!email) {
    console.error('Usage: npm run reset-2fa -- <email>');
    process.exit(1);
  }

  await connectDB();

  const user = await User.findOne({ email });

  if (!user) {
    console.error(`No user found for ${email}`);
    await mongoose.disconnect();
    process.exit(1);
  }

  user.set('twoFactor.enabled', false);
  user.set('twoFactor.method', null);
  user.set('twoFactor.secret', null);
  user.set('twoFactor.verifiedAt', null);
  user.set('twoFactor.lastUsedStep', 0);

  /* Force every device to sign in again. */
  user.sessions.forEach((session) => {
    if (!session.revokedAt) {
      session.revokedAt = new Date();
    }
  });

  user.failedLoginAttempts = 0;
  user.lockedUntil = null;

  await user.save();

  console.log(`2FA reset for ${email}. They will set it up again on next login.`);

  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error('Reset failed:', error.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
