import mongoose from 'mongoose';

const summarySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  youtubeUrl: {
    type: String,
    required: true,
  },
  videoId: {
    type: String,
    required: true,
  },
  transcript: {
    type: String,
    required: true,
  },
  summary: {
    type: String,
    required: true,
  },
  thumbnail: {
    type: String,
  },
  channelTitle: {
    type: String,
  },
  publishedAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('Summary', summarySchema);
