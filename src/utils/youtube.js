import { YoutubeTranscript } from 'youtube-transcript';

export async function getTranscript(url) {
  try {
    const videoId = url.split('v=')[1];
    if (!videoId) {
      throw new Error('Invalid YouTube URL');
    }

    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    if (!transcript || transcript.length === 0) {
      throw new Error('No transcript available');
    }

    // Join transcript parts into a single text
    return transcript.map(part => part.text).join(' ');
  } catch (error) {
    console.error('Error getting transcript:', error);
    throw error;
  }
}
