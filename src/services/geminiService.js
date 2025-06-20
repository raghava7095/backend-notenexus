import fetch from 'node-fetch';

const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

export const generateWithGemini = async (prompt, temperature = 0.7) => {
  try {
    const response = await fetch(`${API_URL}?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: temperature,
          topK: 100,
          topP: 0.9,
          candidateCount: 1,
          maxOutputTokens: 2048
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`HTTP error! status: ${response.status}\n${JSON.stringify(errorData, null, 2)}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw error;
  }
};

// Specific functions for different use cases
export async function generateSummary(text) {
  const prompt = `
    Please create a comprehensive and detailed summary of this video transcript. 
    Include:
    1. Main topic and purpose of the video
    2. Key points and important details
    3. Practical applications or takeaways
    4. Any specific recommendations or advice given
    5. Overall value proposition
    
    The summary should be thorough and informative, capturing all essential information from the transcript.
    
    Transcript:
    ${text}
  `;
  
  return await generateWithGemini(prompt);
}

export async function generateQuiz(text, title) {
  const prompt = `
    Generate 5 multiple choice questions from this video transcript.
    Each question should have 4 options (A, B, C, D) and include the correct answer.
    Format the response as JSON with the following structure:
    {
      "title": "Quiz Title",
      "questions": [
        {
          "question": "Question text",
          "options": ["A", "B", "C", "D"],
          "correctAnswer": "A",
          "explanation": "Brief explanation"
        }
      ]
    }
    
    Video Title: ${title}
    Transcript:
    ${text}
  `;

  const response = await generateWithGemini(prompt);
  return JSON.parse(response);
}

export async function generateFlashcards(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('Invalid or missing content for flashcards');
  }

  // Log the input text for debugging
  console.log('Generating flashcards for content:', text.slice(0, 200) + '...');

  const prompt = `
    Create 5 flashcards based on this content. Each flashcard should:
    1. Have a clear question that tests understanding of the content
    2. Have a concise and accurate answer
    3. Include a category that describes the topic area
    
    Format your response exactly like this:
    [
      {
        "question": "What is the main topic of the content?",
        "answer": "The answer to the question",
        "category": "Main Concepts"
      }
    ]
    
    IMPORTANT: Return ONLY the JSON array. Do not include any additional text or markdown.
    Do not include backticks or any other formatting.
    
    Content:
    ${text}
  `;

  try {
    const response = await generateWithGemini(prompt);
    console.log('Raw Gemini response:', response);

    // Handle markdown code blocks
    let cleanedResponse = response.trim();
    if (cleanedResponse.startsWith('```json') && cleanedResponse.endsWith('```')) {
      cleanedResponse = cleanedResponse.substring(7, cleanedResponse.length - 3).trim();
    }

    try {
      const flashcards = JSON.parse(cleanedResponse);
      console.log('Parsed flashcards:', flashcards);
      return flashcards;
    } catch (parseError) {
      console.error('Failed to parse JSON:', parseError);
      console.error('Raw response:', cleanedResponse);
      throw new Error('Failed to parse flashcard response');
    }
  } catch (error) {
    console.error('Error in Gemini API call:', error);
    throw error;
  }
  
  // Handle the case where Gemini wraps the JSON in markdown code blocks
  let cleanedResponse = response.trim();
  if (cleanedResponse.startsWith('```json') && cleanedResponse.endsWith('```')) {
    cleanedResponse = cleanedResponse.substring(7, cleanedResponse.length - 3).trim();
  }
  
  try {
    const flashcards = JSON.parse(cleanedResponse);
    return flashcards;
  } catch (parseError) {
    console.error('Failed to parse flashcards JSON:', parseError);
    console.error('Raw response:', response);
    throw parseError;
  }
}
