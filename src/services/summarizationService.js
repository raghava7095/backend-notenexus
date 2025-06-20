import { generateSummary as generateGeminiSummary } from './geminiService.js';
import rateLimiter from '../utils/rateLimiter.js';

// Basic summarization as fallback
export function basicSummarization(text) {
  // Clean up the input text
  text = text
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/\s+/g, ' ')    // Remove extra spaces
    .replace(/\n/g, ' ')     // Remove newlines
    .trim();

  // Split text into sentences
  const sentences = text.split(/(?<=[.!?])\s+/);
  
  // Remove any empty sentences
  const validSentences = sentences.filter(sentence => sentence.trim());
  
  // Take first 5 sentences as basic summary
  const summary = validSentences.slice(0, 5)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  return summary;
}

// Main summary generation function using Gemini
export async function generateSummary(text) {
  try {
    // Check rate limit
    if (!rateLimiter.canRequest()) {
      const waitTime = rateLimiter.getTimeUntilNextRequest();
      console.log(`Rate limit exceeded. Waiting ${waitTime}ms before next request`);
      return 'Rate limit exceeded. Please try again later.';
    }

    // Add request to rate limiter
    rateLimiter.addRequest();

    // Generate summary using Gemini
    const summary = await generateGeminiSummary(text);
    console.log('Successfully generated summary using Gemini API');
    return summary;
  } catch (error) {
    console.error('Error generating summary:', error);
    // Fall back to basic summarization
    console.log('Falling back to basic summarization');
    return basicSummarization(text);
  }
}
