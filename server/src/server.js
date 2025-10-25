import express from 'express';
import cors from 'cors';

import apiRoutes from './routes/api.js';
import migrateRoutes from './routes/migrate.js';
import errorHandler from './middleware/errorHandler.js';

const app = express();

// Feature flag for authentication
const ENABLE_AUTH = process.env.ENABLE_AUTH === 'true';

// Conditional imports and initialization for auth features
let authRoutes;
if (ENABLE_AUTH) {
  const session = await import('express-session');
  const connectPgSimple = await import('connect-pg-simple');
  const passport = await import('passport');
  const { initializeDatabase, testConnection } = await import('./db/connection.js');
  const authRoutesModule = await import('./routes/auth.js');
  authRoutes = authRoutesModule.default;

  // Import passport configuration
  await import('./config/passport.js');

  // Initialize database on startup
  (async () => {
    try {
      await testConnection();
      console.log('✓ Database connection established');

      await initializeDatabase();
      console.log('✓ Database tables initialized');
    } catch (error) {
      console.error('Database initialization failed:', error);
      // Don't exit - allow server to start for health checks
    }
  })();

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

  // Session configuration (for Passport)
  const PgSession = connectPgSimple.default(session.default);

  app.use(
    session.default({
      store: new PgSession({
        conObject: {
          connectionString: process.env.POSTGRES_URL,
          ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        },
        tableName: 'session',
        createTableIfMissing: false // We create it in initializeDatabase
      }),
      secret: process.env.SESSION_SECRET || 'your-session-secret-change-in-production',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production', // HTTPS only in production
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      }
    })
  );

  // Initialize Passport
  app.use(passport.default.initialize());
  app.use(passport.default.session());

  console.log('✓ Authentication features enabled');
} else {
  // CORS without auth features
  const developmentOrigins = ['http://localhost:5173', 'http://localhost:5174'];

  if (process.env.ALLOWED_ORIGINS) {
    const customOrigins = process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim());
    developmentOrigins.push(...customOrigins);
  }

  const corsOptions = {
    origin: process.env.NODE_ENV === 'production'
      ? (process.env.ALLOWED_ORIGINS || 'https://codescribe-ai.vercel.app')
      : developmentOrigins,
    credentials: false,
    exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset']
  };
  app.use(cors(corsOptions));

  app.use(express.json({ limit: '10mb' }));

  console.log('ℹ Authentication features disabled (ENABLE_AUTH=false)');
}

// Mount routes
if (ENABLE_AUTH && authRoutes) {
  app.use('/api/auth', authRoutes);
}
app.use('/api/migrate', migrateRoutes);
app.use('/api', apiRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
