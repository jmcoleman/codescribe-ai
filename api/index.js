import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import passport from 'passport';
import apiRoutes from '../server/src/routes/api.js';
import authRoutes from '../server/src/routes/auth.js';
import paymentRoutes from '../server/src/routes/payments.js';
import webhookRoutes from '../server/src/routes/webhooks.js';
import migrateRoutes from '../server/src/routes/migrate.js';
import contactRoutes from '../server/src/routes/contact.js';
import legalRoutes from '../server/src/routes/legal.js';
import cronRoutes from '../server/src/routes/cron.js';
import adminRoutes from '../server/src/routes/admin.js';
import errorHandler from '../server/src/middleware/errorHandler.js';
import '../server/src/config/passport.js'; // Initialize passport strategies

const app = express();

// Feature flag for authentication
const ENABLE_AUTH = process.env.ENABLE_AUTH === 'true';

// Configure CORS to expose rate limit headers
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? ['https://codescribe-ai.vercel.app', 'https://codescribe-ai-*.vercel.app', 'https://codescribeai.com']
    : ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset']
};
app.use(cors(corsOptions));

// IMPORTANT: Webhooks route MUST come BEFORE express.json()
// Stripe webhooks need raw body for signature verification
if (ENABLE_AUTH) {
  app.use('/api/webhooks', webhookRoutes);
}

app.use(express.json({ limit: '10mb' }));

// Session configuration (required for authentication)
if (ENABLE_AUTH) {
  // Use PostgreSQL session storage for Vercel serverless
  // connectPgSimple is a function that takes the session constructor
  const PgSession = connectPgSimple(session);

  app.use(
    session({
      store: new PgSession({
        conObject: {
          connectionString: process.env.POSTGRES_URL,
          ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        },
        tableName: 'session',
        createTableIfMissing: false
      }),
      secret: process.env.SESSION_SECRET || 'fallback-secret-change-in-production',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'lax', // Required for OAuth redirects
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      }
    })
  );

  // Initialize Passport
  app.use(passport.initialize());
  app.use(passport.session());
}

// Mount routes
app.use('/api', apiRoutes);
if (ENABLE_AUTH) {
  app.use('/api/auth', authRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/contact', contactRoutes);
  app.use('/api/legal', legalRoutes);
  app.use('/api/admin', adminRoutes); // Admin routes (requires auth + admin email)
}
app.use('/api/cron', cronRoutes);
app.use('/api/migrate', migrateRoutes);

app.use(errorHandler);

// Export the Express app as a serverless function
export default app;
