import express from 'express';
import cors from 'cors';
import apiRoutes from './routes/api.js';
import errorHandler from './middleware/errorHandler.js';

const app = express();

// Configure CORS to expose rate limit headers
const developmentOrigins = ['http://localhost:5173', 'http://localhost:5174'];

// Add custom origins from environment variable if set (comma-separated for multiple origins)
if (process.env.ALLOWED_ORIGINS) {
  const customOrigins = process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim());
  developmentOrigins.push(...customOrigins);
}

const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? (process.env.ALLOWED_ORIGINS || 'https://codescribe-ai.vercel.app')
    : developmentOrigins,
  credentials: true,
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset']
};
app.use(cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use('/api', apiRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
