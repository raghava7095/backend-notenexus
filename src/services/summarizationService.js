import fetch from 'node-fetch';
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
  
  // Detect video type based on title and content
  const detectVideoType = () => {
    const title = validSentences.find(s => s.toLowerCase().includes('title'))?.toLowerCase();
    const content = validSentences.join(' ').toLowerCase();
    
    // Check for technical content keywords
    const techKeywords = [
      'implement', 'algorithm', 'data structure', 'problem', 'solution',
      'time complexity', 'space complexity', 'performance', 'optimization',
      'cache', 'LRU', 'FIFO', 'queue', 'stack', 'hash', 'map'
    ];
    
    if (techKeywords.some(keyword => 
      title?.includes(keyword) || content.includes(keyword))) {
      return 'technical';
    }
    
    // Check for tutorial keywords
    const tutorialKeywords = [
      'how to', 'step by step', 'process', 'guide', 'tutorial',
      'beginner', 'advanced', 'tips', 'tricks', 'learn', 'tutorial'
    ];
    
    if (tutorialKeywords.some(keyword => 
      title?.includes(keyword) || content.includes(keyword))) {
      return 'tutorial';
    }
    
    // Check for review keywords
    const reviewKeywords = [
      'review', 'opinion', 'thoughts', 'analysis', 'pros', 'cons',
      'recommendation', 'rating', 'performance', 'unboxing', 'test'
    ];
    
    if (reviewKeywords.some(keyword => 
      title?.includes(keyword) || content.includes(keyword))) {
      return 'review';
    }
    
    return 'general';
  };

  const videoType = detectVideoType();
  
  // Extract meaningful content based on video type
  const extractContent = () => {
    switch (videoType) {
      case 'technical':
        return validSentences.reduce((acc, sentence) => {
          // Remove marketing and non-technical content
          if (sentence.includes('https://') || 
              sentence.includes('Check out') || 
              sentence.includes('Subscribe') || 
              sentence.includes('Premium') || 
              sentence.includes('doubt') || 
              sentence.includes('social') || 
              sentence.includes('website') || 
              sentence.includes('Discord')) {
            return acc;
          }
          
          // Extract technical content
          const techKeywords = [
            'implement', 'algorithm', 'data structure', 'problem', 'solution',
            'time complexity', 'space complexity', 'performance', 'optimization',
            'cache', 'LRU', 'FIFO', 'queue', 'stack', 'hash', 'map',
            'O(1)', 'O(n)', 'constant', 'linear'
          ];
          
          if (techKeywords.some(keyword => 
            sentence.toLowerCase().includes(keyword))) {
            acc.push(sentence);
          }
          return acc;
        }, []);
      
      case 'tutorial':
        return validSentences.reduce((acc, sentence) => {
          // Remove marketing content
          if (sentence.includes('https://') || 
              sentence.includes('Check out') || 
              sentence.includes('Subscribe')) {
            return acc;
          }
          
          // Extract tutorial content
          const tutorialKeywords = [
            'how to', 'step by step', 'process', 'guide', 'tutorial',
            'beginner', 'advanced', 'tips', 'tricks', 'learn', 'tutorial',
            'first', 'second', 'third', 'finally', 'end'
          ];
          
          if (tutorialKeywords.some(keyword => 
            sentence.toLowerCase().includes(keyword))) {
            acc.push(sentence);
          }
          return acc;
        }, []);
      
      case 'review':
        return validSentences.reduce((acc, sentence) => {
          // Remove marketing content
          if (sentence.includes('https://') || 
              sentence.includes('Check out') || 
              sentence.includes('Subscribe')) {
            return acc;
          }
          
          // Extract review content
          const reviewKeywords = [
            'review', 'opinion', 'thoughts', 'analysis', 'pros', 'cons',
            'recommendation', 'rating', 'performance', 'unboxing', 'test',
            'good', 'bad', 'better', 'worse', 'improve'
          ];
          
          if (reviewKeywords.some(keyword => 
            sentence.toLowerCase().includes(keyword))) {
            acc.push(sentence);
          }
          return acc;
        }, []);
      
      default:
        return validSentences.filter(sentence => 
          !sentence.includes('https://') && 
          !sentence.includes('Check out') && 
          !sentence.includes('Subscribe') && 
          sentence.length > 20
        );
    }
  };

  const content = extractContent();
  
  // Create summary based on video type
  const createSummary = () => {
    if (content.length === 0) {
      // Try to extract problem statement if it's technical content
      if (videoType === 'technical') {
        const problemSentence = validSentences.find(sentence => {
          return sentence.toLowerCase().includes('problem') || 
                 sentence.toLowerCase().includes('implement') || 
                 sentence.toLowerCase().includes('solution');
        });
        if (problemSentence) {
          return problemSentence.trim();
        }
      }
      return 'No meaningful content found';
    }

    switch (videoType) {
      case 'technical':
        // Create a structured technical summary
        return content.reduce((acc, sentence) => {
          // Check for complexity analysis
          if (sentence.toLowerCase().includes('complexity') || 
              sentence.toLowerCase().includes('O(')) {
            acc.complexity = (acc.complexity || '') + sentence + ' ';
          }
          // Check for implementation details
          else if (sentence.toLowerCase().includes('implementation') || 
                   sentence.toLowerCase().includes('design') || 
                   sentence.toLowerCase().includes('solution')) {
            acc.implementation = (acc.implementation || '') + sentence + ' ';
          }
          // Check for problem statement
          else if (sentence.toLowerCase().includes('problem') || 
                   sentence.toLowerCase().includes('implement')) {
            acc.overview = (acc.overview || '') + sentence + ' ';
          }
          return acc;
        }, {});
      
      case 'tutorial':
        return content.reduce((acc, sentence) => {
          // Check for steps
          if (sentence.toLowerCase().includes('step') || 
              sentence.toLowerCase().includes('first') || 
              sentence.toLowerCase().includes('second')) {
            acc.steps = (acc.steps || '') + sentence + ' ';
          }
          // Check for tips
          else if (sentence.toLowerCase().includes('tip') || 
                   sentence.toLowerCase().includes('trick')) {
            acc.tips = (acc.tips || '') + sentence + ' ';
          }
          return acc;
        }, {});
      
      case 'review':
        return content.reduce((acc, sentence) => {
          // Check for pros
          if (sentence.toLowerCase().includes('pro') || 
              sentence.toLowerCase().includes('good') || 
              sentence.toLowerCase().includes('better')) {
            acc.pros = (acc.pros || '') + sentence + ' ';
          }
          // Check for cons
          else if (sentence.toLowerCase().includes('con') || 
                   sentence.toLowerCase().includes('bad') || 
                   sentence.toLowerCase().includes('worse')) {
            acc.cons = (acc.cons || '') + sentence + ' ';
          }
          return acc;
        }, {});
      
      default:
        return content.join(' ').trim();
    }
  };

  const summary = createSummary();
  
  // Format the final summary
  const formatSummary = () => {
    if (typeof summary === 'string') {
      return summary;
    }

    const summaryParts = [];
    
    // Always show overview if available
    if (summary.overview) {
      summaryParts.push(`Overview: ${summary.overview.trim()}`);
    }
    
    // Add technical details for technical content
    if (videoType === 'technical') {
      if (summary.implementation) {
        summaryParts.push(`Implementation: ${summary.implementation.trim()}`);
      }
      if (summary.complexity) {
        summaryParts.push(`Complexity: ${summary.complexity.trim()}`);
      }
    }
    
    // Add tutorial steps and tips
    if (videoType === 'tutorial') {
      if (summary.steps) {
        summaryParts.push(`Steps: ${summary.steps.trim()}`);
      }
      if (summary.tips) {
        summaryParts.push(`Tips: ${summary.tips.trim()}`);
      }
    }
    
    // Add pros and cons for reviews
    if (videoType === 'review') {
      if (summary.pros) {
        summaryParts.push(`Pros: ${summary.pros.trim()}`);
      }
      if (summary.cons) {
        summaryParts.push(`Cons: ${summary.cons.trim()}`);
      }
    }

    // If no specific sections were found, just return the content
    if (summaryParts.length === 0) {
      return content.join(' ').trim();
    }

    return summaryParts.join('\n').trim();
  };

  return formatSummary();
}

// Use Hugging Face Inference API for summarization
export async function generateSummary(text) {
  const API_KEY = process.env.HUGGINGFACE_API_KEY;
  const MODEL = 'facebook/bart-large-cnn';
  const API_URL = `https://api-inference.huggingface.co/models/${MODEL}`;
  
  try {
    // First check if we have a valid API key
    if (!API_KEY) {
      console.log('No Hugging Face API key configured, falling back to basic summarization');
      return basicSummarization(text);
    }

    // Check rate limit
    if (!rateLimiter.canRequest()) {
      const waitTime = rateLimiter.getTimeUntilNextRequest();
      console.log(`Rate limit exceeded. Waiting ${waitTime}ms before next request`);
      return 'Rate limit exceeded. Please try again later.';
    }

    // Make API request with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    try {
      // Add request to rate limiter
      rateLimiter.addRequest();
      
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: text,
          parameters: {
            max_length: 150,
            min_length: 30
          }
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error(`Hugging Face API response status: ${response.status}`);
        const errorText = await response.text();
        console.error('Hugging Face API response:', errorText);
        
        // Handle specific error cases
        if (response.status === 403) {
          console.error('Hugging Face API access denied. This might be due to rate limiting or API key issues.');
          return 'API access denied. Falling back to basic summarization.';
        }
        if (response.status === 429) {
          console.error('Hugging Face API rate limit exceeded.');
          return 'Rate limit exceeded. Please try again later.';
        }
        
        throw new Error('Failed to generate summary with Hugging Face API');
      }

      const data = await response.json();
      
      // Validate response format
      if (!Array.isArray(data) || !data[0]?.summary_text) {
        console.error('Unexpected response format from Hugging Face API:', data);
        throw new Error('Invalid response format from Hugging Face API');
      }

      console.log('Successfully generated summary using Hugging Face API');
      return data[0].summary_text;
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.error('Hugging Face API request timed out');
        return 'Request timed out. Falling back to basic summarization.';
      }
      throw fetchError;
    }
  } catch (error) {
    console.error('Error generating summary:', error);
    // Fall back to basic summarization
    if (error.name === 'AbortError') {
      console.error('Request timed out');
    } else {
      console.error('Error generating summary:', error);
    }
    console.log('Falling back to basic summarization');
    return basicSummarization(text);
  }
}
