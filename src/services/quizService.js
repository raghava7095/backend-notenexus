import fetch from 'node-fetch';
import rateLimiter from '../utils/rateLimiter.js';

const API_KEY = process.env.HUGGINGFACE_API_KEY;
// Using a powerful instruction-following model for reliable JSON output
const MODEL = 'mistralai/Mistral-7B-Instruct-v0.1';
const API_URL = `https://api-inference.huggingface.co/models/${MODEL}`;

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
  if (!API_KEY) {
    console.error('Hugging Face API key is not configured. Falling back to basic quiz.');
    return generateBasicQuiz(summaryText, title);
  }

  if (!rateLimiter.canRequest()) {
    console.log(`Rate limit exceeded. Falling back to a basic quiz.`);
    return generateBasicQuiz(summaryText, title);
  }

    const prompt = `Based on the following summary, generate a challenging and high-quality quiz with 3 to 5 multiple-choice questions. The quiz should test understanding of the key concepts, facts, and nuances in the text.

For each question, provide:
1. A unique and insightful question.
2. An array of 4 distinct and plausible options. One option must be the correct answer.
3. The correct answer, which must exactly match one of the options.
4. A brief explanation for why the answer is correct, based on the text.

Return the output as a single, valid JSON array of objects, where each object represents a question. The JSON structure for each object must be: { "question": "...", "options": ["...", "...", "...", "..."], "correctAnswer": "...", "explanation": "..." }.

Do not include any text, markdown, or formatting outside of the JSON array itself.

Summary: "${summaryText}"`;

  const controller = new AbortController();
  // Increased timeout for potentially longer generation time
  const timeoutId = setTimeout(() => controller.abort(), 20000); // 20-second timeout

  try {
    rateLimiter.addRequest();
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 1024, // Allow more tokens for a JSON structure
          return_full_text: false, // Only return the generated part
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Hugging Face API Error: ${response.status} - ${response.statusText}`);
      console.error('API Response Text:', errorText);
      throw new Error(`Failed to generate quiz from API. Status: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data[0]?.generated_text;
    console.log('Raw output from AI model:', generatedText);

    if (!generatedText) {
      console.error('Invalid response format from Hugging Face API:', data);
      throw new Error('Invalid response format from API.');
    }

    // The model might return the JSON wrapped in markdown, so we extract it.
    const jsonMatch = generatedText.match(/\`\`\`json\n([\s\S]*?)\n\`\`\`/);
    const jsonString = jsonMatch ? jsonMatch[1].trim() : generatedText.trim();

    try {
      const questions = JSON.parse(jsonString);
      // Basic validation to ensure we got an array of questions
      if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error('Parsed JSON is not a valid quiz structure.');
      }
      return {
        title: `Quiz for: ${title}`,
        questions,
      };
    } catch (parseError) {
      console.error('Failed to parse JSON from API response:', parseError);
      console.error('Raw model output:', generatedText);
      throw new Error('Failed to parse quiz from API response.');
    }

  } catch (error) {
    clearTimeout(timeoutId);
    console.error('Error generating quiz:', error.message);
    console.log('Falling back to basic quiz generation.');
    return generateBasicQuiz(summaryText, title);
  }
};
