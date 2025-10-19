import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import apiRoutes from '../server/src/routes/api.js';
import errorHandler from '../server/src/middleware/errorHandler.js';

const app = express();

// Configure CORS to expose rate limit headers
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? ['https://codescribe-ai.vercel.app', 'https://codescribe-ai-*.vercel.app']
    : ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset']
};
app.use(cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use('/api', apiRoutes);

app.use(errorHandler);

// Export the Express app as a serverless function
export default app;
