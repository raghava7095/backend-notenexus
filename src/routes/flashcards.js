import express from 'express';
import Flashcard from '../models/Flashcard.js';
import Summary from '../models/Summary.js';
import authenticateToken from '../middleware/auth.js';
import fetch from 'node-fetch';

const router = express.Router();

const MODEL = 'google/flan-t5-large';
const API_URL = `https://api-inference.huggingface.co/models/${MODEL}`;

// Generate flashcards for a summary
router.post('/generate', authenticateToken, async (req, res) => {
  console.log('Flashcard generation request received for summaryId:', req.body.summaryId);
  const { summaryId } = req.body;

  if (!process.env.HUGGINGFACE_API_KEY) {
    return res.status(500).json({ message: 'Hugging Face API key is not configured.' });
  }

  try {
    const summary = await Summary.findById(summaryId);
    if (!summary) {
      return res.status(404).json({ message: 'Summary not found' });
    }

    const prompt = `Based on the following summary, generate a set of 5-10 high-quality flashcards. Each flashcard should focus on a key term, concept, or important fact from the text. Return the output as a single, valid JSON array of objects. Each object must have "question", "answer", and "category" fields. Do not include any text or markdown outside of the JSON array. Summary: "${summary.content}"`;

    console.log(`Calling Hugging Face API at: ${API_URL}`);
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs: prompt, parameters: { max_new_tokens: 1024, return_full_text: false } }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Hugging Face API Error: ${response.status}`, errorText);
      throw new Error('Failed to generate flashcards from Hugging Face API.');
    }

    const data = await response.json();
    const rawContent = data[0]?.generated_text;
    console.log('Raw Hugging Face response:', rawContent);

    if (!rawContent) {
      throw new Error('Invalid response format from Hugging Face API.');
    }

    let flashcards;
    try {
      const jsonMatch = rawContent.match(/\[\s\S]*\]/);
      const jsonString = jsonMatch ? jsonMatch[0] : rawContent;
      flashcards = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('Failed to parse JSON from Hugging Face response:', parseError);
      console.error('Raw content was:', rawContent);
      return res.status(500).json({ message: 'Error parsing flashcards from AI response.' });
    }

    if (!Array.isArray(flashcards)) {
      return res.status(500).json({ message: 'AI did not return a valid array of flashcards.' });
    }

    const createdFlashcards = await Promise.all(
      flashcards.map(card =>
        Flashcard.create({
          userId: req.userId,
          summaryId,
          question: card.question,
          answer: card.answer,
          category: card.category || 'General',
        })
      )
    );

    res.status(201).json(createdFlashcards);
  } catch (error) {
    console.error('Error generating flashcards:', error);
    res.status(500).json({ message: 'An unexpected error occurred during flashcard generation.' });
  }
});

// Get all flashcards for a summary
router.get('/summary/:summaryId', authenticateToken, async (req, res) => {
  try {
    const flashcards = await Flashcard.find({ summaryId: req.params.summaryId, userId: req.userId });
    res.json(flashcards);
  } catch (error) {
    console.error('Error fetching flashcards:', error);
    res.status(500).json({ message: 'Error fetching flashcards.' });
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
