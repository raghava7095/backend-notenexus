import express from 'express';
import Flashcard from '../models/Flashcard.js';
import Summary from '../models/Summary.js';
import authenticateToken from '../middleware/auth.js';
import { generateFlashcards } from '../services/geminiService.js';

const router = express.Router();

// Helper function to handle errors
const handleError = (res, error, message) => {
  console.error(error);
  return res.status(500).json({ message, error: error.message });
};

// Generate flashcards for a summary
router.post('/generate', authenticateToken, async (req, res) => {
  console.log('Flashcard generation request received for summaryId:', req.body.summaryId);
  const { summaryId } = req.body;

  try {
    const summary = await Summary.findById(summaryId);
    if (!summary) {
      return res.status(404).json({ message: 'Summary not found' });
    }

    const flashcards = await generateFlashcards(summary.summary);
    console.log('Generated flashcards:', flashcards);

    if (!Array.isArray(flashcards) || flashcards.length === 0) {
      console.error('No flashcards were generated');
      return res.status(500).json({ 
        message: 'Failed to generate flashcards',
        error: 'No flashcards were returned from the AI service'
      });
    }

    // Create new flashcard set
    const newFlashcardSet = new Flashcard({
      userId: req.userId,
      summaryId: summaryId,
      flashcards: flashcards
    });

    try {
      const savedFlashcards = await newFlashcardSet.save();
      res.status(201).json(savedFlashcards);
    } catch (saveError) {
      handleError(res, saveError, 'Failed to save flashcards');
    }
  } catch (error) {
    handleError(res, error, 'Failed to generate flashcards');
  }
});

// Get all flashcards for a summary
router.get('/summary/:summaryId', authenticateToken, async (req, res) => {
  try {
    const flashcards = await Flashcard.find({ summaryId: req.params.summaryId, userId: req.userId });
    res.json(flashcards);
  } catch (error) {
    handleError(res, error, 'Failed to fetch flashcards');
  }
});

// Get a single flashcard
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const flashcard = await Flashcard.findById(req.params.id);
    if (!flashcard) {
      return res.status(404).json({ message: 'Flashcard not found' });
    }

    // Ensure user has access to this flashcard
    if (flashcard.userId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(flashcard);
  } catch (error) {
    handleError(res, error, 'Failed to fetch flashcard');
  }
});

// Delete a single flashcard
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const flashcard = await Flashcard.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!flashcard) {
      return res.status(404).json({ message: 'Flashcard not found or user not authorized.' });
    }
    res.status(200).json({ message: 'Flashcard deleted successfully.' });
  } catch (error) {
    console.error('Error deleting flashcard:', error);
    res.status(500).json({ message: 'Error deleting flashcard.' });
  }
});

// Delete all flashcards for a summary
router.delete('/summary/:summaryId', authenticateToken, async (req, res) => {
  try {
    const result = await Flashcard.deleteMany({ summaryId: req.params.summaryId, userId: req.userId });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'No flashcards found for this summary to delete.' });
    }
    res.status(200).json({ message: `${result.deletedCount} flashcards deleted successfully.` });
  } catch (error) {
    console.error('Error deleting flashcards for summary:', error);
    res.status(500).json({ message: 'Error deleting flashcards for summary.' });
  }
});

export default router;
