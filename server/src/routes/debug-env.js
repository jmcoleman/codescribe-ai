/**
 * DEBUG ROUTE - Verify environment variables
 * REMOVE THIS FILE AFTER DEBUGGING
 *
 * Test with: curl https://codescribeai.com/api/debug/env-check
 */

import express from 'express';

const router = express.Router();

router.get('/env-check', (req, res) => {
  const envStatus = {
    // Server-side analytics key
    ANALYTICS_API_KEY: process.env.ANALYTICS_API_KEY ? {
      exists: true,
      length: process.env.ANALYTICS_API_KEY.length,
      first4: process.env.ANALYTICS_API_KEY.substring(0, 4),
      last4: process.env.ANALYTICS_API_KEY.slice(-4),
    } : {
      exists: false,
    },

    // Database
    POSTGRES_URL: process.env.POSTGRES_URL ? {
      exists: true,
      host: process.env.POSTGRES_URL.match(/postgresql:\/\/[^@]+@([^\/]+)/)?.[1] || 'unknown',
    } : {
      exists: false,
    },

    // Node environment
    NODE_ENV: process.env.NODE_ENV,

    // Build info
    buildTime: new Date().toISOString(),
  };

  res.json({
    message: 'Environment variable check',
    status: envStatus,
    allGood: !!(envStatus.ANALYTICS_API_KEY.exists && envStatus.POSTGRES_URL.exists),
  });
});

export default router;
