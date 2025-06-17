import express from 'express';
import Summary from '../models/Summary.js';
import authenticateToken from '../middleware/auth.js';
import { validateYouTubeUrl, getVideoDetails, getVideoTranscript } from '../services/youtubeService.js';
import { generateSummary, basicSummarization } from '../services/summarizationService.js';

const router = express.Router();

// Create summary
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { youtubeUrl } = req.body;
    const userId = req.userId; // Changed from req.user.id to req.userId

    if (!youtubeUrl) {
      return res.status(400).json({ message: 'YouTube URL is required' });
    }

    try {
      // Step 1: Validate and extract video ID
      const videoId = validateYouTubeUrl(youtubeUrl);

      // Step 2: Get video details
      const videoDetails = await getVideoDetails(videoId);

      // Step 3: Get video transcript
      const transcript = await getVideoTranscript(videoId);

      // Step 4: Generate summary
      let summary;
      try {
        // Try Hugging Face API first
        summary = await generateSummary(transcript);
        console.log('Successfully generated summary using Hugging Face API');
      } catch (error) {
        console.warn('Hugging Face API failed:', error);
        // Fallback to basic summarization if Hugging Face fails
        summary = basicSummarization(transcript);
        console.log('Generated summary using basic summarization');
      }

      // Step 5: Save to database
      const newSummary = new Summary({
        userId,
        title: videoDetails.title,
        youtubeUrl,
        videoId,
        transcript,
        summary,
        thumbnail: videoDetails.thumbnail,
        channelTitle: videoDetails.channelTitle,
        publishedAt: videoDetails.publishedAt
      });

      await newSummary.save();
      res.status(201).json(newSummary);
    } catch (error) {
      console.error('Error processing video:', error);
      res.status(500).json({ 
        message: 'Failed to process video',
        error: error.message 
      });
    }
  } catch (error) {
    console.error('Error creating summary:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// Get user's summaries
router.get('/', authenticateToken, async (req, res) => {
  try {
    const summaries = await Summary.find({ userId: req.userId });
    res.json(summaries);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching summaries' });
  }
});

// Get single summary
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const summary = await Summary.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!summary) {
      return res.status(404).json({ message: 'Summary not found' });
    }

    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching summary' });
  }
});

// Delete a summary
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await Summary.deleteOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Summary not found or you are not authorized to delete it.' });
    }

    res.json({ message: 'Summary deleted successfully' });
  } catch (error) {
    console.error('Error deleting summary:', error);
    res.status(500).json({ message: 'Error deleting summary' });
  }
});

export default router;
