import express from 'express';
import authenticateToken from '../middleware/auth.js';
import { generateQuiz } from '../services/quizService.js';
import Summary from '../models/Summary.js';
import Quiz from '../models/Quiz.js';

const router = express.Router();

// Generate a new quiz from a summary
router.post('/generate', authenticateToken, async (req, res) => {
  const { summaryId } = req.body;
  if (!summaryId) {
    return res.status(400).json({ message: 'summaryId is required.' });
  }

  try {
    const summary = await Summary.findOne({ _id: summaryId, userId: req.userId });
    if (!summary) {
      return res.status(404).json({ message: 'Summary not found or you do not have access.' });
    }

    // Check if a quiz already exists for this summary
    const existingQuiz = await Quiz.findOne({ summaryId: summary._id, userId: req.userId });
    if (existingQuiz) {
      return res.status(200).json(existingQuiz);
    }

    const quizData = await generateQuiz(summary.summary, summary.title);

    const newQuiz = new Quiz({
      userId: req.userId,
      summaryId: summary._id,
      title: quizData.title,
      questions: quizData.questions,
    });

    await newQuiz.save();
    res.status(201).json(newQuiz);
  } catch (error) {
    console.error('Error generating quiz:', error);
    res.status(500).json({ message: 'Failed to generate quiz.' });
  }
});

// Get all quizzes for the logged-in user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const quizzes = await Quiz.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(quizzes);
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    res.status(500).json({ message: 'Failed to fetch quizzes.' });
  }
});

// Get a single quiz by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const quiz = await Quiz.findOne({ _id: req.params.id, userId: req.userId });
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found.' });
    }
    res.json(quiz);
  } catch (error) {
    console.error('Error fetching quiz:', error);
    res.status(500).json({ message: 'Failed to fetch quiz.' });
  }
});

// Delete a quiz
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await Quiz.deleteOne({ _id: req.params.id, userId: req.userId });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Quiz not found or not authorized.' });
    }
    res.json({ message: 'Quiz deleted successfully.' });
  } catch (error) {
    console.error('Error deleting quiz:', error);
    res.status(500).json({ message: 'Failed to delete quiz.' });
  }
});

export default router;
