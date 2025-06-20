import { generateFlashcards } from './geminiService.js';
import rateLimiter from '../utils/rateLimiter.js';

// A fallback for when the API is unavailable or fails
const generateBasicFlashcards = (summaryText) => {
  return [
    {
      question: 'What is the main topic of the summary?',
      answer: 'Not specified',
    },
    {
      question: 'What is a key point from the summary?',
      answer: 'Not specified',
    },
  ];
};

export const generateFlashcards = async (summaryText) => {
  console.log('Attempting to generate flashcards');
  
  if (!rateLimiter.canRequest()) {
    console.log(`Rate limit exceeded. Falling back to basic flashcards.`);
    return generateBasicFlashcards(summaryText);
  }

  try {
    const flashcards = await generateFlashcards(summaryText);
    return flashcards;
  } catch (error) {
    console.error('Gemini API Error:', error);
    return generateBasicFlashcards(summaryText);
  }
};
