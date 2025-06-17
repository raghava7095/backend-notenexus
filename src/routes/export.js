import express from 'express';
import authenticateToken from '../middleware/auth.js';
import Summary from '../models/Summary.js';
import Flashcard from '../models/Flashcard.js';
import Quiz from '../models/Quiz.js';

const router = express.Router();

// Export summary as PDF
router.post('/summary/:id', authenticateToken, async (req, res) => {
  try {
    const summary = await Summary.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!summary) {
      return res.status(404).json({ message: 'Summary not found' });
    }

    // Generate PDF content
    const pdfContent = `
      <h1>${summary.title}</h1>
      <h2>Original Content</h2>
      <p>${summary.content}</p>
      <h2>Summary</h2>
      <p>${summary.summary}</p>
    `;

    // For now, just return the HTML content
    // In a real implementation, you would use a PDF generation library
    res.json({ htmlContent: pdfContent });
  } catch (error) {
    res.status(500).json({ message: 'Error exporting summary' });
  }
});

// Export flashcards as PDF
router.post('/flashcards/summary/:summaryId', authenticateToken, async (req, res) => {
  try {
    const flashcards = await Flashcard.find({
      summaryId: req.params.summaryId,
      userId: req.userId
    });

    if (flashcards.length === 0) {
      return res.status(404).json({ message: 'No flashcards found' });
    }

    // Generate PDF content
    const pdfContent = `
      <h1>Flashcards</h1>
      ${flashcards.map(card => `
        <div style="border: 1px solid #ccc; padding: 10px; margin: 10px 0;">
          <h3>${card.question}</h3>
          <p>${card.answer}</p>
        </div>
      `).join('')}
    `;

    res.json({ htmlContent: pdfContent });
  } catch (error) {
    res.status(500).json({ message: 'Error exporting flashcards' });
  }
});

// Export quiz as PDF
router.post('/quiz/:id', authenticateToken, async (req, res) => {
  try {
    const quiz = await Quiz.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // Generate PDF content
    const pdfContent = `
      <h1>${quiz.title}</h1>
      ${quiz.questions.map((q, index) => `
        <div style="border: 1px solid #ccc; padding: 10px; margin: 10px 0;">
          <h3>${index + 1}. ${q.question}</h3>
          <ul>
            ${q.options.map(option => `<li>${option}</li>`).join('')}
          </ul>
          <p><strong>Correct Answer:</strong> ${q.correctAnswer}</p>
          <p><strong>Explanation:</strong> ${q.explanation}</p>
        </div>
      `).join('')}
    `;

    res.json({ htmlContent: pdfContent });
  } catch (error) {
    res.status(500).json({ message: 'Error exporting quiz' });
  }
});

export default router;
