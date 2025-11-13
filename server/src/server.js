import express from 'express';
import cors from 'cors';
import passport from 'passport';

import apiRoutes from './routes/api.js';
import migrateRoutes from './routes/migrate.js';
import webhookRoutes from './routes/webhooks.js';
import paymentRoutes from './routes/payments.js';
import contactRoutes from './routes/contact.js';
import legalRoutes from './routes/legal.js';
import cronRoutes from './routes/cron.js';
import adminRoutes from './routes/admin.js';
import errorHandler from './middleware/errorHandler.js';
import { initializeDatabase, testConnection } from './db/connection.js';
import authRoutesModule from './routes/auth.js';
import './config/passport.js'; // Initialize passport strategies

const app = express();

// Trust proxy - required for Vercel deployment
// Allows Express to trust X-Forwarded-* headers from Vercel's proxy
// This is necessary for express-rate-limit to identify real client IPs
app.set('trust proxy', 1);

// Feature flag for authentication
const ENABLE_AUTH = process.env.ENABLE_AUTH === 'true';

// Conditional initialization for auth features
let authRoutes;
if (ENABLE_AUTH) {
  authRoutes = authRoutesModule;

  // Initialize database on startup
  (async () => {
    try {
      await testConnection();
      console.log('✓ Database connection established');

      await initializeDatabase();
      console.log('✓ Database tables initialized');

      console.log('✓ Permanent deletion cron job configured via Vercel Cron (Daily at 2:00 AM UTC)');
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

  // IMPORTANT: Webhooks route MUST come BEFORE express.json()
  // Stripe webhooks need raw body for signature verification
  app.use('/api/webhooks', webhookRoutes);

  app.use(express.json({ limit: '10mb' }));

  // Initialize Passport (JWT-only, no sessions)
  // Both email/password and GitHub OAuth use JWT tokens
  app.use(passport.initialize());

  console.log('✓ Authentication features enabled (JWT-only)');
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

  // IMPORTANT: Webhooks route MUST come BEFORE express.json()
  // Stripe webhooks need raw body for signature verification
  app.use('/api/webhooks', webhookRoutes);

  app.use(express.json({ limit: '10mb' }));

  console.log('ℹ Authentication features disabled (ENABLE_AUTH=false)');
}

// API root endpoint - provides API metadata and documentation
app.get('/api', (req, res) => {
  res.json({
    name: 'CodeScribe AI API',
    version: '2.7.7',
    status: 'operational',
    description: 'AI-powered code documentation generator',
    documentation: 'https://github.com/jmcoleman/codescribe-ai/blob/main/docs/api/API-Reference.md',
    endpoints: {
      health: {
        path: '/api/health',
        method: 'GET',
        description: 'Health check endpoint'
      },
      generate: {
        path: '/api/generate',
        method: 'POST',
        description: 'Generate documentation (non-streaming)',
        authentication: false
      },
      generateStream: {
        path: '/api/generate-stream',
        method: 'POST',
        description: 'Generate documentation (streaming SSE)',
        authentication: false
      },
      upload: {
        path: '/api/upload',
        method: 'POST',
        description: 'Upload code file for documentation',
        authentication: false
      },
      ...(ENABLE_AUTH && {
        auth: {
          path: '/api/auth/*',
          methods: ['POST', 'GET'],
          description: 'Authentication endpoints (signup, login, OAuth)',
          authentication: 'none'
        },
        payments: {
          path: '/api/payments/*',
          methods: ['GET', 'POST'],
          description: 'Subscription and payment management',
          authentication: 'required'
        },
        contact: {
          path: '/api/contact/*',
          methods: ['POST'],
          description: 'Contact sales and support',
          authentication: 'required'
        },
        legal: {
          path: '/api/legal/*',
          methods: ['GET', 'POST'],
          description: 'Legal documents and acceptance (GET /versions is public)',
          authentication: 'mixed'
        },
        admin: {
          path: '/api/admin/*',
          methods: ['GET'],
          description: 'Admin dashboard and analytics',
          authentication: 'admin-only'
        }
      })
    },
    features: {
      authentication: ENABLE_AUTH,
      streaming: true,
      rateLimiting: true,
      fileUpload: true,
      supportedLanguages: [
        'javascript', 'typescript', 'python', 'java', 'csharp',
        'cpp', 'go', 'rust', 'ruby', 'php', 'swift', 'kotlin',
        'scala', 'r', 'dart', 'shell', 'sql', 'html', 'css'
      ]
    },
    links: {
      website: 'https://codescribeai.com',
      github: 'https://github.com/jmcoleman/codescribe-ai',
      roadmap: 'https://jmcoleman.github.io/codescribe-ai/docs/roadmap/'
    }
  });
});

// Mount routes
if (ENABLE_AUTH && authRoutes) {
  app.use('/api/auth', authRoutes);
}
if (ENABLE_AUTH) {
  app.use('/api/payments', paymentRoutes);
  app.use('/api/contact', contactRoutes);
  app.use('/api/legal', legalRoutes);
  app.use('/api/admin', adminRoutes); // Admin routes (requires auth + admin email)
}
app.use('/api/cron', cronRoutes);
app.use('/api/migrate', migrateRoutes);
app.use('/api', apiRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 3000;

// Determine email mock status (matches shouldMockEmails logic in emailService.js)
function getEmailStatus() {
  const IS_PRODUCTION = process.env.NODE_ENV === 'production';
  const MOCK_EMAILS = process.env.MOCK_EMAILS;
  const HAS_RESEND_KEY = !!process.env.RESEND_API_KEY;

  // If MOCK_EMAILS is explicitly set, respect it
  if (MOCK_EMAILS === 'true') {
    return 'MOCKED (MOCK_EMAILS=true)';
  }

  if (MOCK_EMAILS === 'false') {
    if (!HAS_RESEND_KEY) {
      return 'MOCKED (no API key - forced)';
    }
    return IS_PRODUCTION ? 'ENABLED (Resend)' : 'ENABLED (Resend - dev mode)';
  }

  // Otherwise: mock in dev/test, real in production (safe default)
  if (IS_PRODUCTION) {
    return HAS_RESEND_KEY ? 'ENABLED (Resend)' : 'DISABLED (no API key)';
  } else {
    return HAS_RESEND_KEY ? 'MOCKED (development)' : 'MOCKED (no API key)';
  }
}

const server = app.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 CodeScribe AI Server');
  console.log('='.repeat(60));
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`🔐 Auth: ${ENABLE_AUTH ? 'ENABLED' : 'DISABLED'}`);
  console.log(`📧 Emails: ${getEmailStatus()}`);
  console.log('='.repeat(60) + '\n');
  console.log('✅ Server is listening and ready to accept requests');
});

// Prevent premature exit
server.on('error', (error) => {
  console.error('❌ Server error:', error);
  process.exit(1);
});

// Log if server closes unexpectedly
server.on('close', () => {
  console.log('⚠️ Server closed');
});
