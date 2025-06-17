import express from 'express';
import User from '../models/User.js';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { config } from 'dotenv';
import bcrypt from 'bcryptjs';
import Summary from '../models/Summary.js';
import Quiz from '../models/Quiz.js';

config();

const router = express.Router();

// Generate password reset token
router.post('/forgot', async (req, res) => {
  try {
    const { email } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('User not found');
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = Date.now() + 1 * 60 * 60 * 1000; // 1 hour from now

    // Update user with reset token
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpiry;
    await user.save();

    // Get user statistics
    const summaries = await Summary.find({ userId: user._id });
    const quizzes = await Quiz.find({ userId: user._id });
    
    const stats = {
      videosProcessed: summaries.length,
      hoursSaved: Math.round(summaries.length * 0.5), // Assuming avg video is 30 minutes
      quizzesCreated: quizzes.length,
      notesCreated: summaries.length
    };

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const resetUrl = `https://frontend-notenexus.vercel.app/password-reset/${resetToken}`;
    
    // Send email with user statistics
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'NoteNexus - Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb;">NoteNexus Password Reset</h2>
          <p>Hi ${user.name || 'User'},</p>
          <p>We've received a request to reset your password.</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Your NoteNexus Stats:</h3>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;">
              <div style="display: flex; align-items: center; gap: 10px;">
                <span style="color: #2563eb; font-size: 20px;">📊</span>
                <div>
                  <p style="margin: 0; font-weight: 600;">${stats.videosProcessed}</p>
                  <p style="margin: 0; color: #6b7280; font-size: 12px;">Videos Processed</p>
                </div>
              </div>
              <div style="display: flex; align-items: center; gap: 10px;">
                <span style="color: #2563eb; font-size: 20px;">⏰</span>
                <div>
                  <p style="margin: 0; font-weight: 600;">${stats.hoursSaved}</p>
                  <p style="margin: 0; color: #6b7280; font-size: 12px;">Hours Saved</p>
                </div>
              </div>
              <div style="display: flex; align-items: center; gap: 10px;">
                <span style="color: #2563eb; font-size: 20px;">📝</span>
                <div>
                  <p style="margin: 0; font-weight: 600;">${stats.notesCreated}</p>
                  <p style="margin: 0; color: #6b7280; font-size: 12px;">Notes Created</p>
                </div>
              </div>
              <div style="display: flex; align-items: center; gap: 10px;">
                <span style="color: #2563eb; font-size: 20px;">📊</span>
                <div>
                  <p style="margin: 0; font-weight: 600;">${stats.quizzesCreated}</p>
                  <p style="margin: 0; color: #6b7280; font-size: 12px;">Quizzes Created</p>
                </div>
              </div>
            </div>
          </div>
          
          <p>To reset your password, click the button below:</p>
          <p>
            <a href="${resetUrl}" style="
              display: inline-block;
              padding: 12px 24px;
              background-color: #2563eb;
              color: white;
              text-decoration: none;
              border-radius: 6px;
              margin: 10px 0;
            ">Reset Password</a>
          </p>
          <p>This link will expire in 1 hour.</p>
          
          <p>Need help? Contact us at ${process.env.EMAIL_USER}</p>
          <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
            &copy; NoteNexus 2025. All rights reserved.
          </p>
        </div>
      `
    });

    console.log('Password reset email sent successfully to:', email);
    res.status(200).json({ message: 'Password reset email sent successfully' });
  } catch (error) {
    console.error('Error sending password reset email:', error);
    res.status(500).json({ 
      message: 'Failed to send password reset email. Please try again later.',
      error: error.message 
    });
  }
});

// Reset password
router.post('/reset', async (req, res) => {
  try {
    const { token, password } = req.body;

    // Find user with valid token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user
    await User.findByIdAndUpdate(user._id, {
      password: hashedPassword,
      resetToken: null,
      resetTokenExpires: null,
      resetPasswordAt: Date.now()
    });

    res.json({ message: 'Password successfully reset' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ message: 'Error resetting password' });
  }
});

export default router;
