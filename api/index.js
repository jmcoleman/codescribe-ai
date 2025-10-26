import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';
import apiRoutes from '../server/src/routes/api.js';
import authRoutes from '../server/src/routes/auth.js';
import migrateRoutes from '../server/src/routes/migrate.js';
import errorHandler from '../server/src/middleware/errorHandler.js';
import '../server/src/config/passport.js'; // Initialize passport strategies

const app = express();

// Configure CORS to expose rate limit headers
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? ['https://codescribe-ai.vercel.app', 'https://codescribe-ai-*.vercel.app', 'https://codescribeai.com']
    : ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset']
};
app.use(cors(corsOptions));

app.use(express.json({ limit: '10mb' }));

// Session configuration (required for authentication)
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'fallback-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Mount routes
app.use('/api', apiRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/migrate', migrateRoutes);

app.use(errorHandler);

// Export the Express app as a serverless function
export default app;
