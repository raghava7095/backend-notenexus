import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

// Create OAuth2 client
const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_CALLBACK_URL
);

// Generate authorization URL
const scopes = [
  'https://mail.google.com/',
  'https://www.googleapis.com/auth/gmail.send'
];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: scopes,
  prompt: 'consent'
});

console.log('Please visit this URL to authorize the application:');
console.log(authUrl);

// After you authorize, you'll get a code in the URL. Use that code to get the tokens:
console.log('\nAfter authorization, you will receive a code in the URL. Copy the code and paste it here:');

// Read the authorization code from stdin
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Enter the authorization code: ', async (code) => {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    console.log('\nRefresh Token:', tokens.refresh_token);
    console.log('\nAdd this refresh token to your .env file as GOOGLE_REFRESH_TOKEN');
  } catch (error) {
    console.error('Error getting tokens:', error);
  }
  rl.close();
});
