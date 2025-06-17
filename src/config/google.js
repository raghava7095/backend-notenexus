import dotenv from 'dotenv';

dotenv.config();

export default {
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL || 'https://backend-notenexus.onrender.com/api/auth/google/callback',
  scope: ['profile', 'email'],
};
