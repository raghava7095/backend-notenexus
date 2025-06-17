#NoteNexus Backend

This is the backend server for the Lecture AI Notes application, built with Node.js and Express.

## Features

- User Authentication (Sign up, Login, Logout)
- Lecture Note Summarization
- Flashcard Generation
- Quiz Generation
- Profile Management
- Export Functionality

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
ping me for env variables we have nearly 10
PORT=5000
MONGODB_URI=mongodb://localhost:27017/lecture-ai-notes
JWT_SECRET=your-secret-key
OPENAI_API_KEY=your-openai-api-key
```

## API Endpoints

### Authentication

- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - Login user

### Summaries

- POST `/api/summaries` - Create new summary
- GET `/api/summaries` - Get all user's summaries
- GET `/api/summaries/:id` - Get single summary

### Flashcards

- POST `/api/flashcards/generate` - Generate flashcards for a summary
- GET `/api/flashcards/summary/:summaryId` - Get flashcards for a summary

### Quizzes

- POST `/api/quizzes/generate` - Generate quiz for a summary
- GET `/api/quizzes` - Get all user's quizzes
- GET `/api/quizzes/:id` - Get single quiz

### Profile

- GET `/api/profile` - Get user profile
- PUT `/api/profile` - Update user profile
- GET `/api/profile/stats` - Get user statistics

### Export

- POST `/api/export/summary/:id` - Export summary as PDF
- POST `/api/export/flashcards/summary/:summaryId` - Export flashcards as PDF
- POST `/api/export/quiz/:id` - Export quiz as PDF

## Running the Server

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm run dev
```

The server will start on `http://localhost:5000`
