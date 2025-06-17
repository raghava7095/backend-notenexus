import express from 'express';
import passport from 'passport';
import { Strategy } from 'passport-google-oauth20';
const GoogleStrategy = Strategy;
import jwt from 'jsonwebtoken';
import { default as User } from '../models/User.js';
import { default as GoogleConfig } from '../config/google.js';

const router = express.Router();

// Configure Google Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user exists
    const existingUser = await User.findOne({ 
      $or: [
        { email: profile.emails[0].value },
        { googleId: profile.id }
      ]
    });

    if (existingUser) {
      // If user exists, update their profile picture if changed
      if (existingUser.profilePicture !== profile.photos[0]?.value) {
        existingUser.profilePicture = profile.photos[0]?.value;
        await existingUser.save();
      }
      const token = jwt.sign(
        { userId: existingUser._id },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );
      return done(null, { user: existingUser, token });
    }

    // Create new user
    const user = new User({
      name: profile.displayName,
      email: profile.emails[0].value,
      googleId: profile.id,
      profilePicture: profile.photos[0]?.value,
      authenticationMethod: 'google'
    });

    await user.save();
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    return done(null, { user, token });
  } catch (error) {
    console.error('Google auth error:', error);
    done(error);
  }
}));

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    console.log('Registration attempt:', { name, email }); // Log email but not password for security

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if email is valid
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Check if password is strong enough (min 8 chars)
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }

    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Create user with password
    const user = new User({ 
      name, 
      email, 
      password,
      authenticationMethod: 'password' // Explicitly set authentication method
    });
    
    // Save user and check password
    await user.save();
    console.log('User saved successfully');
    console.log('Password verification after save:', await user.comparePassword(password));

    // Create token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.status(201).json({ token, user: user.getAuthData() });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Error registering user' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt:', { email }); // Log email but not password for security
    console.log('Password length:', password?.length);

    // Validate input
    if (!email || !password) {
      console.error('Missing credentials:', { email, hasPassword: !!password });
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user using static method
    const user = await User.findByEmail(email);
    console.log('User found:', user ? user.email : 'No user found');
    
    if (!user) {
      console.log('No user found with this email');
      // Don't reveal if user exists for security
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log('User authentication method:', user.authenticationMethod);
    console.log('User password exists:', !!user.password);
    console.log('User password length:', user.password?.length);
    console.log('User password is hashed:', user.password?.startsWith('$2b$'));

    // Check if user can authenticate with password
    const canAuthWithPassword = user.canAuthenticateWithPassword();
    console.log('Can authenticate with password:', canAuthWithPassword);
    
    if (!canAuthWithPassword) {
      console.log('User must use Google authentication');
      return res.status(401).json({ 
        message: 'This account uses Google authentication',
        suggestion: 'Please use Google Sign-in instead'
      });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    console.log('Password verification result:', isMatch);
    
    if (!isMatch) {
      console.log('Password does not match');
      // Don't reveal if password is correct or not for security
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Create token
    const tokenPayload = { userId: user._id };
    console.log('Token payload:', tokenPayload);
    
    // Test JWT generation with hardcoded secret
    const hardcodedToken = jwt.sign(
      tokenPayload,
      'lecture-ai-notes-backend-secret-2025',
      { expiresIn: '24h' }
    );
    console.log('Hardcoded token generated:', hardcodedToken);

    // Test JWT generation with env secret
    const envSecret = process.env.JWT_SECRET;
    console.log('Using JWT secret:', envSecret);
    
    const envToken = jwt.sign(
      tokenPayload,
      envSecret,
      { expiresIn: '24h' }
    );
    console.log('Environment token generated:', envToken);

    // Update last login time
    user.updatedAt = new Date();
    await user.save();

    res.json({ 
      token: envToken, 
      user: user.getAuthData()
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error logging in' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt:', { email }); // Log email but not password for security

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user using static method
    const user = await User.findByEmail(email);
    console.log('User found:', user ? user.email : 'No user found');
    console.log('User password:', user?.password);
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if user can authenticate with password
    const canAuthWithPassword = user.canAuthenticateWithPassword();
    console.log('Can authenticate with password:', canAuthWithPassword);
    
    if (!canAuthWithPassword) {
      return res.status(401).json({ 
        message: 'This account uses Google authentication',
        suggestion: 'Please use Google Sign-in instead'
      });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    console.log('Password verification result:', isMatch);
    
    if (isMatch === false) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Create token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({ 
      token, 
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email,
        profilePicture: user.profilePicture
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error logging in' });
  }
});

// Google authentication routes
router.get('/google', 
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    session: false
  })
);

router.get('/google/callback', 
  passport.authenticate('google', { 
    failureRedirect: '/auth',
    session: false
  }),
  (req, res) => {
    // Successful authentication
    const token = req.user.token;
    const user = {
      id: req.user.user._id,
      name: req.user.user.name,
      email: req.user.user.email,
      profilePicture: req.user.user.profilePicture
    };

    // Redirect back to frontend with token
    res.redirect(`https://frontend-notenexus.vercel.app/auth/success?token=${encodeURIComponent(token)}&user=${encodeURIComponent(JSON.stringify(user))}`);
  }
);

// Logout
router.post('/logout', (req, res) => {
  res.status(200).json({ message: 'Successfully logged out' });
});

export default router;
