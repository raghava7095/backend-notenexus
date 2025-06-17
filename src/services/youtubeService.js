import fetch from 'node-fetch';

// Validate YouTube URL
export function validateYouTubeUrl(url) {
  const regExp = /^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/|shorts\/)|(?:(?:watch)?\?v(?:i)?=|\&v(?:i)?=))([^#\&\?]*).*/;
  const match = url.match(regExp);
  if (!match || match[1].length !== 11) {
    throw new Error('Invalid YouTube URL');
  }
  return match[1];
}

// Get video details using YouTube Data API
export async function getVideoDetails(videoId) {
  const API_KEY = process.env.YOUTUBE_API_KEY;
  const url = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet&key=${API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to fetch video details');
    }

    if (data.items && data.items.length > 0) {
      const video = data.items[0];
      return {
        title: video.snippet.title,
        description: video.snippet.description,
        thumbnail: video.snippet.thumbnails.medium.url,
        channelTitle: video.snippet.channelTitle,
        publishedAt: video.snippet.publishedAt
      };
    }
    throw new Error('Video not found');
  } catch (error) {
    console.error('Error getting video details:', error);
    throw error;
  }
}

// Get video transcript using YouTube API
export async function getVideoTranscript(videoId) {
  try {
    const API_KEY = process.env.YOUTUBE_API_KEY;
    if (!API_KEY) {
      throw new Error('YouTube API key is not configured');
    }

    // First get video details to check if captions are available
    const videoDetailsUrl = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=contentDetails&key=${API_KEY}`;
    const videoDetailsResponse = await fetch(videoDetailsUrl);
    const videoDetails = await videoDetailsResponse.json();

    if (!videoDetailsResponse.ok) {
      console.error('Error fetching video details:', videoDetails.error?.message);
      throw new Error('Failed to fetch video details');
    }

    // Check if captions are available
    const hasCaptions = videoDetails.items[0]?.contentDetails?.caption === 'true';
    if (!hasCaptions) {
      console.log('Video has no captions enabled. Trying alternative methods...');
      
      // Try to get title and description as fallback
      const snippetUrl = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet&key=${API_KEY}`;
      const snippetResponse = await fetch(snippetUrl);
      const snippetData = await snippetResponse.json();

      if (!snippetResponse.ok) {
        throw new Error('Failed to fetch video snippet');
      }

      const video = snippetData.items[0];
      const fallbackTranscript = `
        Title: ${video.snippet.title}
        Description: ${video.snippet.description}
      `;

      console.log('Using fallback transcript:', fallbackTranscript.substring(0, 100) + '...');
      return fallbackTranscript;
    }

    // Get the caption track
    const captionsUrl = `https://www.googleapis.com/youtube/v3/captions?videoId=${videoId}&part=snippet&key=${API_KEY}`;
    const captionsResponse = await fetch(captionsUrl);
    const captionsData = await captionsResponse.json();

    if (!captionsResponse.ok) {
      console.error('Error fetching captions:', captionsData.error?.message);
      throw new Error('Failed to fetch captions');
    }

    if (!captionsData.items || captionsData.items.length === 0) {
      throw new Error('No captions found for this video');
    }

    // Get the first caption track (usually the default one)
    const captionTrack = captionsData.items[0];
    const captionId = captionTrack.id;
    console.log('Using caption track:', captionTrack);

    // Get the caption data
    const captionUrl = `https://www.googleapis.com/youtube/v3/captions/${captionId}?key=${API_KEY}`;
    const captionResponse = await fetch(captionUrl);
    const captionData = await captionResponse.json();

    if (!captionResponse.ok) {
      console.error('Caption response status:', captionResponse.status);
      console.error('Caption response:', captionData);
      throw new Error('Failed to fetch caption content');
    }

    // Parse the caption data
    let transcript = '';
    if (captionData.text) {
      captionData.text.forEach(part => {
        transcript += part.text + ' ';
      });
    } else {
      throw new Error('No text data found in caption response');
    }

    // Clean up the transcript
    const cleanedTranscript = transcript
      .replace(/[\[\]]/g, '')
      .replace(/\n/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    return cleanedTranscript;
  } catch (error) {
    console.error('Detailed error:', error);
    throw new Error('Failed to get video transcript. Make sure the video has captions enabled.');
  }
}
