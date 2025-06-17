import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import passport from 'passport';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import { default as authRoutes } from './routes/auth.js';
import { default as summaryRoutes } from './routes/summaries.js';
import { default as flashcardRoutes } from './routes/flashcards.js';
import { default as quizRoutes } from './routes/quiz.js';
import { default as profileRoutes } from './routes/profile.js';
import { default as exportRoutes } from './routes/export.js';
import { default as pdfRoutes } from './routes/pdf.js';
import { default as passwordResetRoutes } from './routes/passwordReset.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    
    const app = express();

// Request logging middleware
app.use((req, res, next) => {
  console.log(`\n${req.method} ${req.originalUrl}`);
  console.log('Headers:', req.headers);
  if (req.body) {
    console.log('Body:', req.body);
  }
  next();
});

    // Middleware
    app.use(cors());
    app.use(express.json());
    app.use(cookieParser());
    app.use(session({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      resave: false,
      saveUninitialized: false
    }));
    app.use(passport.initialize());
    app.use(passport.session());

    // Routes
    app.use('/api/auth', authRoutes);
    app.use('/api/summaries', summaryRoutes);
    app.use('/api/flashcards', flashcardRoutes);
    app.use('/api/quiz', quizRoutes);
    app.use('/api/profile', profileRoutes);
    app.use('/api/export', exportRoutes);
    app.use('/api/pdf', pdfRoutes);
    app.use('/api/password-reset', passwordResetRoutes);

    // Error handling middleware
    app.use((err, req, res, next) => {
      console.error(err.stack);
      res.status(500).json({ message: 'Something went wrong!' });
    });

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });
