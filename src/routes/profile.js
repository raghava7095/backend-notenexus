import express from 'express';
import User from '../models/User.js';
import authenticateToken from '../middleware/auth.js';

const router = express.Router();

// Get user profile
router.get('/', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile' });
  }
});

// Update user profile
router.put('/', authenticateToken, async (req, res) => {
  try {
    const { name, profilePicture } = req.body;
    const updates = {};
    
    if (name) updates.name = name;
    if (profilePicture) updates.profilePicture = profilePicture;

    const user = await User.findByIdAndUpdate(
      req.userId,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile' });
  }
});

// Get user statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const [summariesCount, flashcardsCount, quizzesCount] = await Promise.all([
      (await import('../models/Summary.js')).default.countDocuments({ userId: req.userId }),
      (await import('../models/Flashcard.js')).default.countDocuments({ userId: req.userId }),
      (await import('../models/Quiz.js')).default.countDocuments({ userId: req.userId })
    ]);

    res.json({
      summaries: summariesCount,
      flashcards: flashcardsCount,
      quizzes: quizzesCount
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching statistics' });
  }
});

export default router;
