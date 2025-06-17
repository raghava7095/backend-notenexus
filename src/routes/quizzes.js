import express from 'express';
import Quiz from '../models/Quiz.js';
import authenticateToken from '../middleware/auth.js';
import openai from '../config/openai.js';

const router = express.Router();

// Generate quiz for a summary
router.post('/generate', authenticateToken, async (req, res) => {
  try {
    const { summaryId, title } = req.body;
    const summary = await Summary.findById(summaryId);

    if (!summary) {
      return res.status(404).json({ message: 'Summary not found' });
    }

    // Generate quiz questions using OpenAI
    const quizResponse = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that generates educational quizzes.'
        },
        {
          role: 'user',
          content: `Generate a 5-question multiple choice quiz from the following content:
          ${summary.content}
          
          For each question, provide 4 options and the correct answer.
          Format the response as JSON with questions array containing question, options, correctAnswer, and explanation fields.`
        }
      ]
    });

    const quizData = JSON.parse(quizResponse.choices[0].message.content);

    // Create quiz
    const quiz = new Quiz({
      userId: req.userId,
      summaryId,
      title,
      questions: quizData.questions
    });

    await quiz.save();
    res.status(201).json(quiz);
  } catch (error) {
    res.status(500).json({ message: 'Error generating quiz' });
  }
});

// Get quizzes for a user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const quizzes = await Quiz.find({ userId: req.userId });
    res.json(quizzes);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching quizzes' });
  }
});

// Get single quiz
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const quiz = await Quiz.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    res.json(quiz);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching quiz' });
  }
});

export default router;
