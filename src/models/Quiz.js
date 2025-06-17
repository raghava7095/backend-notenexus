import mongoose from 'mongoose';

const quizSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  summaryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Summary',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  questions: [{
    question: String,
    options: [String],
    correctAnswer: String,
    explanation: String,
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('Quiz', quizSchema);
