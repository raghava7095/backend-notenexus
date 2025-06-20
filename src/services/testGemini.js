import { AI } from '@google/generative-ai';

console.log('Testing Gemini AI import');
console.log('AI:', AI);

// Test initialization
try {
  const genAI = new AI(process.env.GEMINI_API_KEY);
  console.log('Initialized successfully');
} catch (error) {
  console.error('Error initializing:', error);
}
