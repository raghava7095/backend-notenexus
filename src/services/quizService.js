import { generateWithGemini } from './geminiService.js';
import rateLimiter from '../utils/rateLimiter.js';

// A fallback for when the API is unavailable or fails
const generateBasicQuiz = (summaryText, title) => {
  return {
    title: `Basic Quiz for: ${title}`,
    questions: [
      {
        question: 'What is the main topic of the summary?',
        options: ['Content Analysis', 'Data Processing', 'AI Capabilities', 'Not Specified'],
        correctAnswer: 'Not Specified',
        explanation: 'This is a basic, fallback quiz. The AI-powered generation failed.',
      },
      {
        question: 'Which of these is a placeholder question?',
        options: ['This one', 'The first one', 'All of them', 'None of them'],
        correctAnswer: 'All of them',
        explanation: 'This quiz indicates a problem with the AI service.',
      },
    ],
  };
};

export const generateQuiz = async (summaryText, title) => {
  console.log('Attempting to generate quiz for:', title);
  
  if (!rateLimiter.canRequest()) {
    console.log(`Rate limit exceeded. Falling back to a basic quiz.`);
    return generateBasicQuiz(summaryText, title);
  }

  try {
    const prompt = `
      Create a comprehensive quiz about this video content.
      Generate 5 multiple choice questions with 4 options each.
      Each question should have a correct answer and an explanation.
      Format the response as JSON with the following structure:
      {
        "title": "Quiz Title",
        "questions": [
          {
            "question": "Question text",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correctAnswer": "Option A",
            "explanation": "Explanation why this is correct"
          }
        ]
      }
      
      Video Title: ${title}
      Content:
      ${summaryText}
    `;

    const generatedText = await generateWithGemini(prompt);
    
    if (!generatedText) {
      console.error('Invalid response from Gemini API');
      throw new Error('Invalid response from API.');
    }

    // The model might return the JSON wrapped in markdown, so we extract it.
    const jsonMatch = generatedText.match(/\`\`\`json\n([\s\S]*?)\n\`\`\`/);
    const jsonString = jsonMatch ? jsonMatch[1].trim() : generatedText.trim();

    try {
      const quizData = JSON.parse(jsonString);
      // Basic validation to ensure we got a valid quiz structure
      if (!quizData?.questions?.length) {
        throw new Error('Parsed JSON is not a valid quiz structure.');
      }
      return quizData;
    } catch (parseError) {
      console.error('Failed to parse JSON from API response:', parseError);
      console.error('Raw model output:', generatedText);
      throw new Error('Failed to parse quiz from API response.');
    }

  } catch (error) {
// Removed timeoutId reference since it's not needed anymore
    console.error('Error generating quiz:', error.message);
    console.log('Falling back to basic quiz generation.');
    return generateBasicQuiz(summaryText, title);
  }
};
