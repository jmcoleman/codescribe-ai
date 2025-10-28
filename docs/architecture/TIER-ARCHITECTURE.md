# Tier Architecture Guide

**Last Updated:** October 27, 2025
**Status:** 🚧 In Development (Phase 2.0)

---

## Overview

The tier system provides a flexible, configuration-driven approach to feature gating and usage limiting across CodeScribe AI. Built on a **single source of truth** pattern, it enables easy tier modifications, feature rollouts, and business model experimentation without touching core business logic.

**Key Principles:**
- **Configuration-Driven**: All tier definitions in one centralized config file
- **Type-Safe**: Strongly typed for IDE autocomplete and compile-time validation
- **Testable**: Pure functions for tier logic, easy to unit test
- **Auditable**: Changes tracked in version control
- **Scalable**: Add new tiers/features without refactoring routes

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Configuration Structure](#configuration-structure)
3. [Middleware System](#middleware-system)
4. [Route Integration](#route-integration)
5. [Frontend Integration](#frontend-integration)
6. [Usage Tracking](#usage-tracking)
7. [Admin Overrides](#admin-overrides)
8. [Testing Strategy](#testing-strategy)
9. [Migration Guide](#migration-guide)
10. [Best Practices](#best-practices)

---

## Architecture Overview

```mermaid
graph TB
    subgraph "Configuration Layer"
        TC[tiers.js<br/>Tier Definitions]
        TO[tierOverrides.js<br/>User Overrides]
    end

    subgraph "Middleware Layer"
        TG[tierGate.js<br/>Feature/Limit Checks]
        UM[usageMiddleware.js<br/>Usage Tracking]
    end

    subgraph "Database Layer"
        UT[usage_tracking table<br/>Daily/Monthly Counts]
        US[users table<br/>Tier Assignment]
    end

    subgraph "Route Layer"
        R1[/generate]
        R2[/generate-stream]
        R3[/export/pdf]
    end

    subgraph "Frontend Layer"
        UI[TierGate Component]
        UB[Upgrade Banner]
    end

    TC --> TG
    TO --> TG
    TG --> R1
    TG --> R2
    TG --> R3
    UM --> UT
    US --> TG
    TC --> UI
    TG --> UB

    classDef config fill:#e0e7ff,stroke:#4f46e5,stroke-width:2px
    classDef middleware fill:#fef3c7,stroke:#f59e0b,stroke-width:2px
    classDef database fill:#dcfce7,stroke:#10b981,stroke-width:2px
    classDef route fill:#ddd6fe,stroke:#7c3aed,stroke-width:2px
    classDef frontend fill:#fce7f3,stroke:#ec4899,stroke-width:2px

    class TC,TO config
    class TG,UM middleware
    class UT,US database
    class R1,R2,R3 route
    class UI,UB frontend
```

**Flow:**
1. Request hits route with `requireFeature()` or `checkLimit()` middleware
2. Middleware reads user tier from `req.user.tier` (populated by auth)
3. Looks up tier config in `tiers.js`, applies any user-specific overrides
4. Validates access, increments usage counters if allowed
5. Responds with 200 (allowed), 403 (feature locked), or 429 (limit exceeded)

---

## Configuration Structure

### Core Config: `server/src/config/tiers.js`

```javascript
export const TIER_CONFIG = {
  free: {
    id: 'free',
    name: 'Free',
    price: { monthly: 0, yearly: 0 },

    limits: {
      // Generation limits
      generationsPerDay: 5,
      generationsPerMonth: 10,

      // File limits
      maxFileSize: 1024 * 100, // 100KB in bytes
      maxFilesPerUpload: 1,

      // Document types (array of allowed types)
      documentTypes: ['readme', 'jsdoc', 'api', 'architecture'],

      // Data retention
      retentionDays: 7,

      // Rate limiting
      apiCallsPerMinute: 10
    },

    features: {
      // Core features (boolean flags)
      qualityScoring: true,
      streamingGeneration: true,

      // Export formats (array)
      exportFormats: ['markdown'],

      // Support & priority
      priorityQueue: false,
      emailSupport: false,

      // Customization
      customTemplates: false,
      batchProcessing: false,
      teamWorkspace: false,
      versionHistory: false,
      integrations: false,
      auditLogs: false,
      whiteLabel: false,
      onPremise: false,
      apiAccess: false,
      ssoIntegration: false,
      customBranding: false
    }
  },

  starter: {
    id: 'starter',
    name: 'Starter',
    price: { monthly: 12, yearly: 120 },

    limits: {
      generationsPerDay: 20,
      generationsPerMonth: 50,
      maxFileSize: 1024 * 500, // 500KB
      maxFilesPerUpload: 3,
      documentTypes: ['readme', 'jsdoc', 'api', 'architecture'],
      retentionDays: 30,
      apiCallsPerMinute: 30
    },

    features: {
      qualityScoring: true,
      streamingGeneration: true,
      exportFormats: ['markdown'],
      priorityQueue: true, // Soft feature (flag only)
      emailSupport: true, // 48h response time
      customTemplates: false,
      apiAccess: false,
      batchProcessing: false,
      teamWorkspace: false,
      versionHistory: false,
      integrations: false,
      auditLogs: false,
      whiteLabel: false,
      onPremise: false,
      ssoIntegration: false,
      customBranding: false
    }
  },

  pro: {
    id: 'pro',
    name: 'Pro',
    price: { monthly: 29, yearly: 290 },

    limits: {
      generationsPerDay: 20,
      generationsPerMonth: 200,
      maxFileSize: 1024 * 1024 * 1, // 1MB
      maxFilesPerUpload: 10,
      documentTypes: ['readme', 'jsdoc', 'api', 'architecture'],
      retentionDays: 90,
      apiCallsPerMinute: 60
    },

    features: {
      qualityScoring: true,
      streamingGeneration: true,
      exportFormats: ['markdown', 'pdf', 'html'], // Planned Phase 4
      priorityQueue: true,
      emailSupport: true, // 24h response time
      customTemplates: false, // Planned Phase 4
      batchProcessing: false, // Planned Phase 3
      apiAccess: false,
      teamWorkspace: false,
      versionHistory: false,
      integrations: false,
      ssoIntegration: false,
      auditLogs: false,
      whiteLabel: false,
      onPremise: false,
      customBranding: false
    }
  },

  team: {
    id: 'team',
    name: 'Team',
    price: { monthly: 99, yearly: 990 },

    limits: {
      generationsPerDay: 100,
      generationsPerMonth: 1000,
      maxFileSize: 1024 * 1024 * 5, // 5MB
      maxFilesPerUpload: 50,
      maxTeamMembers: 10,
      documentTypes: ['readme', 'jsdoc', 'api', 'architecture'],
      retentionDays: 90,
      apiCallsPerMinute: 120
    },

    features: {
      qualityScoring: true,
      streamingGeneration: true,
      exportFormats: ['markdown', 'pdf', 'html'],
      priorityQueue: true,
      emailSupport: true, // 24h priority response
      customTemplates: true,
      batchProcessing: true, // 50 files
      apiAccess: true, // REST + CLI
      teamWorkspace: true, // 10 users
      versionHistory: true, // 90 days
      integrations: true, // Slack, GitHub, CI/CD
      ssoIntegration: false,
      auditLogs: false,
      whiteLabel: false,
      onPremise: false,
      customBranding: false
    }
  },

  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: { monthly: null, yearly: null }, // Custom pricing

    limits: {
      generationsPerDay: -1, // -1 = unlimited
      generationsPerMonth: -1,
      maxFileSize: 1024 * 1024 * 50, // 50MB
      maxFilesPerUpload: -1, // Unlimited
      maxTeamMembers: -1, // Unlimited
      documentTypes: ['readme', 'jsdoc', 'api', 'architecture', 'custom'],
      retentionDays: -1, // Unlimited
      apiCallsPerMinute: 300
    },

    features: {
      qualityScoring: true,
      streamingGeneration: true,
      exportFormats: ['markdown', 'pdf', 'html', 'docx'],
      priorityQueue: true, // Dedicated infrastructure
      emailSupport: true, // Real-time via dedicated Slack
      customTemplates: true,
      batchProcessing: true, // Unlimited files
      apiAccess: true,
      teamWorkspace: true, // Unlimited users
      versionHistory: true, // Unlimited
      integrations: true, // Custom integrations
      ssoIntegration: true, // SAML, OAuth
      auditLogs: true,
      whiteLabel: true,
      onPremise: true,
      customBranding: true,
      accountManager: true,
      sla: '99.9%'
    }
  }
};

// Helper functions
export const getTierConfig = (tierId) => {
  return TIER_CONFIG[tierId] || TIER_CONFIG.free;
};

export const hasFeature = (tierId, featureName) => {
  const config = getTierConfig(tierId);
  return config.features[featureName] === true;
};

export const getLimit = (tierId, limitName) => {
  const config = getTierConfig(tierId);
  return config.limits[limitName];
};

export const isUnlimited = (limit) => {
  return limit === -1;
};

export const canAccessDocumentType = (tierId, docType) => {
  const allowedTypes = getLimit(tierId, 'documentTypes');
  return allowedTypes.includes(docType);
};

export const canExportFormat = (tierId, format) => {
  const config = getTierConfig(tierId);
  return config.features.exportFormats.includes(format);
};

// Validation helper
export const validateTierAccess = (tierId, requiredFeature) => {
  if (!hasFeature(tierId, requiredFeature)) {
    const config = getTierConfig(tierId);
    const minTier = Object.values(TIER_CONFIG).find(t =>
      t.features[requiredFeature] === true
    );

    throw new Error(
      `Feature '${requiredFeature}' requires ${minTier?.name || 'Pro'} or higher (current: ${config.name})`
    );
  }
};

// Get all tier IDs
export const getAllTierIds = () => Object.keys(TIER_CONFIG);

// Compare tiers (returns -1, 0, 1 like sort comparator)
export const compareTiers = (tierA, tierB) => {
  const order = ['free', 'starter', 'pro', 'team', 'enterprise'];
  return order.indexOf(tierA) - order.indexOf(tierB);
};

// Check if tier A is >= tier B
export const isTierAtLeast = (userTier, requiredTier) => {
  return compareTiers(userTier, requiredTier) >= 0;
};
```

### Design Decisions

**Why `-1` for unlimited?**
- Simple to check: `limit === -1`
- Works with numeric comparisons: `currentUsage < limit` (never true)
- Clear intent vs. `null`/`Infinity`

**Why separate `limits` and `features`?**
- **Limits**: Numeric/countable constraints (5 generations/day)
- **Features**: Boolean flags or enumerated options (streaming on/off)
- Easier to extend (e.g., add `limits.teamMembers`)

**Why arrays for `documentTypes` and `exportFormats`?**
- Supports incremental feature unlocking
- Easy to check: `allowedTypes.includes(requestedType)`
- Scales to future doc types without config restructure

---

## Middleware System

### Feature Gate: `server/src/middleware/tierGate.js`

```javascript
import { getTierConfig, hasFeature, getLimit, isUnlimited } from '../config/tiers.js';
import { applyUserOverrides } from '../config/tierOverrides.js';

/**
 * Middleware: Require a specific feature to be enabled
 * @param {string} featureName - Feature key from tier config
 * @returns {Function} Express middleware
 *
 * @example
 * router.post('/stream', authenticate, requireFeature('streamingGeneration'), handler);
 */
export const requireFeature = (featureName) => {
  return (req, res, next) => {
    const userTier = req.user?.tier || 'free';
    const config = getTierConfig(userTier);

    // Apply user-specific overrides (e.g., beta access)
    const effectiveConfig = applyUserOverrides(req.user?.id, config);

    if (!effectiveConfig.features[featureName]) {
      // Find minimum tier with this feature
      const minTier = Object.values(TIER_CONFIG).find(t =>
        t.features[featureName] === true
      );

      return res.status(403).json({
        error: 'Feature not available',
        message: `This feature is not available on the ${config.name} plan`,
        currentTier: config.name,
        requiredTier: minTier?.name || 'Pro',
        feature: featureName,
        upgradeUrl: '/pricing'
      });
    }

    // Attach tier info to request for downstream use
    req.tierConfig = effectiveConfig;
    next();
  };
};

/**
 * Middleware: Check usage limit before allowing request
 * @param {string} limitName - Limit key from tier config
 * @param {string} period - 'day' or 'month'
 * @returns {Function} Express middleware
 *
 * @example
 * router.post('/generate', authenticate, checkLimit('generationsPerDay', 'day'), handler);
 */
export const checkLimit = (limitName, period = 'day') => {
  return async (req, res, next) => {
    const userTier = req.user?.tier || 'free';
    const config = getTierConfig(userTier);
    const effectiveConfig = applyUserOverrides(req.user?.id, config);

    const limit = effectiveConfig.limits[limitName];

    // Unlimited tier
    if (isUnlimited(limit)) {
      req.tierLimit = { limit: -1, currentUsage: 0, unlimited: true };
      return next();
    }

    // Check current usage (queries database)
    const currentUsage = await getUserUsage(req.user.id, limitName, period);

    if (currentUsage >= limit) {
      const resetDate = getResetDate(period);

      return res.status(429).json({
        error: 'Limit exceeded',
        message: `You have reached your ${period}ly ${limitName} limit`,
        limit,
        currentUsage,
        resetDate: resetDate.toISOString(),
        upgradeUrl: '/pricing'
      });
    }

    // Attach limit info for logging/analytics
    req.tierLimit = {
      limit,
      currentUsage,
      remaining: limit - currentUsage,
      unlimited: false
    };

    next();
  };
};

/**
 * Middleware: Validate file upload against tier limits
 */
export const validateFileUpload = (req, res, next) => {
  const userTier = req.user?.tier || 'free';
  const config = getTierConfig(userTier);

  const maxSize = config.limits.maxFileSize;
  const maxFiles = config.limits.maxFilesPerUpload;

  // Check file count
  const fileCount = req.files?.length || 0;
  if (fileCount > maxFiles) {
    return res.status(413).json({
      error: 'Too many files',
      message: `Maximum ${maxFiles} file(s) allowed on ${config.name} plan`,
      maxFiles,
      receivedFiles: fileCount
    });
  }

  // Check file sizes
  const oversizedFiles = req.files?.filter(f => f.size > maxSize) || [];
  if (oversizedFiles.length > 0) {
    return res.status(413).json({
      error: 'File too large',
      message: `Maximum file size is ${(maxSize / 1024).toFixed(0)}KB on ${config.name} plan`,
      maxSize,
      oversizedFiles: oversizedFiles.map(f => ({
        name: f.originalname,
        size: f.size
      }))
    });
  }

  next();
};

/**
 * Middleware: Validate requested document type
 */
export const validateDocumentType = (req, res, next) => {
  const userTier = req.user?.tier || 'free';
  const config = getTierConfig(userTier);
  const requestedType = req.body.documentType;

  const allowedTypes = config.limits.documentTypes;

  if (!allowedTypes.includes(requestedType)) {
    return res.status(403).json({
      error: 'Document type not available',
      message: `Document type '${requestedType}' is not available on ${config.name} plan`,
      allowedTypes,
      requestedType
    });
  }

  next();
};

// Helper functions (not exported as middleware)
async function getUserUsage(userId, limitName, period) {
  // Query usage_tracking table
  // Implementation depends on your database schema
  const { rows } = await pool.query(
    `SELECT COUNT(*) as usage
     FROM usage_tracking
     WHERE user_id = $1
       AND limit_type = $2
       AND period = $3
       AND created_at >= $4`,
    [userId, limitName, period, getStartOfPeriod(period)]
  );

  return parseInt(rows[0]?.usage || 0);
}

function getResetDate(period) {
  const now = new Date();
  if (period === 'day') {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  } else if (period === 'month') {
    return new Date(now.getFullYear(), now.getMonth() + 1, 1);
  }
  return now;
}

function getStartOfPeriod(period) {
  const now = new Date();
  if (period === 'day') {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (period === 'month') {
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }
  return now;
}
```

### Usage Tracking: `server/src/middleware/usageMiddleware.js`

```javascript
import pool from '../config/database.js';

/**
 * Middleware: Track successful API usage
 * Call AFTER route handler completes successfully
 *
 * @example
 * router.post('/generate', authenticate, checkLimit('generationsPerDay'),
 *   handler, trackUsage('generationsPerDay', 'day'));
 */
export const trackUsage = (limitName, period = 'day') => {
  return async (req, res, next) => {
    // Only track if request was successful (2xx status)
    if (res.statusCode >= 200 && res.statusCode < 300) {
      try {
        await pool.query(
          `INSERT INTO usage_tracking (user_id, limit_type, period, created_at)
           VALUES ($1, $2, $3, NOW())`,
          [req.user.id, limitName, period]
        );
      } catch (error) {
        console.error('Failed to track usage:', error);
        // Don't fail the request if tracking fails
      }
    }
    next();
  };
};

/**
 * Get current usage stats for a user
 */
export const getUsageStats = async (userId) => {
  const { rows } = await pool.query(
    `SELECT
       limit_type,
       period,
       COUNT(*) as usage,
       DATE(created_at) as date
     FROM usage_tracking
     WHERE user_id = $1
       AND created_at >= NOW() - INTERVAL '30 days'
     GROUP BY limit_type, period, DATE(created_at)
     ORDER BY date DESC`,
    [userId]
  );

  return rows;
};
```

---

## Route Integration

### Example Routes: `server/src/routes/generation.js`

```javascript
import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  requireFeature,
  checkLimit,
  validateDocumentType,
  validateFileUpload
} from '../middleware/tierGate.js';
import { trackUsage } from '../middleware/usageMiddleware.js';

const router = express.Router();

/**
 * Standard generation (all tiers)
 */
router.post('/generate',
  authenticate,
  validateDocumentType,
  checkLimit('generationsPerDay', 'day'),
  async (req, res) => {
    // Handle generation
    const result = await generateDocumentation(req.body);
    res.json(result);
  },
  trackUsage('generationsPerDay', 'day')
);

/**
 * Streaming generation (Pro+)
 */
router.post('/generate-stream',
  authenticate,
  requireFeature('streamingGeneration'),
  validateDocumentType,
  checkLimit('generationsPerDay', 'day'),
  async (req, res) => {
    // Handle SSE streaming
    res.setHeader('Content-Type', 'text/event-stream');
    // ... streaming logic
  },
  trackUsage('generationsPerDay', 'day')
);

/**
 * File upload (all tiers, size limits vary)
 */
router.post('/upload',
  authenticate,
  upload.array('files', 20), // Multer middleware
  validateFileUpload,
  async (req, res) => {
    // Handle file upload
    const files = req.files;
    res.json({ uploadedFiles: files.length });
  }
);

/**
 * Export to PDF (Pro+)
 */
router.post('/export/pdf',
  authenticate,
  async (req, res) => {
    const userTier = req.user.tier;
    const config = getTierConfig(userTier);

    // Check if PDF export is allowed
    if (!config.features.exportFormats.includes('pdf')) {
      return res.status(403).json({
        error: 'Export format not available',
        message: 'PDF export requires Pro plan or higher',
        allowedFormats: config.features.exportFormats
      });
    }

    // Handle PDF export
    const pdf = await exportToPDF(req.body);
    res.contentType('application/pdf').send(pdf);
  }
);

/**
 * Custom templates (Enterprise only)
 */
router.post('/templates/custom',
  authenticate,
  requireFeature('customTemplates'),
  async (req, res) => {
    // Handle custom template creation
    const template = await createCustomTemplate(req.body);
    res.json(template);
  }
);

export default router;
```

### Middleware Order Best Practices

```javascript
// ✅ CORRECT ORDER:
router.post('/endpoint',
  authenticate,           // 1. Auth first (sets req.user)
  requireFeature('...'),  // 2. Feature gate (fast, no DB)
  checkLimit('...'),      // 3. Usage check (DB query)
  validateDocumentType,   // 4. Input validation
  handler,                // 5. Business logic
  trackUsage('...')       // 6. Track usage (after success)
);

// ❌ WRONG ORDER:
router.post('/endpoint',
  checkLimit('...'),      // ❌ No req.user yet!
  authenticate,
  handler,
  requireFeature('...')   // ❌ Too late, already processed
);
```

---

## Frontend Integration

### TierGate Component: `client/src/components/TierGate.jsx`

```javascript
import { useTier } from '../hooks/useTier';
import UpgradeBanner from './UpgradeBanner';

/**
 * Conditionally render children based on tier access
 * @param {string} feature - Feature name to check
 * @param {string} requiredTier - Minimum tier required (optional)
 * @param {React.ReactNode} fallback - Component to show if locked
 */
export default function TierGate({
  feature,
  requiredTier,
  fallback = <UpgradeBanner />,
  children
}) {
  const { tier, hasFeature, isTierAtLeast } = useTier();

  // Check feature flag
  if (feature && !hasFeature(feature)) {
    return fallback;
  }

  // Check tier level
  if (requiredTier && !isTierAtLeast(requiredTier)) {
    return fallback;
  }

  return <>{children}</>;
}

// Usage examples:
<TierGate feature="streamingGeneration">
  <StreamingToggle />
</TierGate>

<TierGate requiredTier="pro">
  <PDFExportButton />
</TierGate>

<TierGate
  feature="customTemplates"
  fallback={<ProBadge message="Enterprise only" />}
>
  <TemplateEditor />
</TierGate>
```

### useTier Hook: `client/src/hooks/useTier.js`

```javascript
import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

// Import tier config (same file as backend)
import { TIER_CONFIG, hasFeature as hasFeatureConfig } from '../../../server/src/config/tiers';

export function useTier() {
  const { user } = useContext(AuthContext);
  const tierConfig = TIER_CONFIG[user?.tier || 'free'];

  return {
    tier: user?.tier || 'free',
    tierConfig,

    hasFeature: (featureName) => {
      return hasFeatureConfig(user?.tier || 'free', featureName);
    },

    getLimit: (limitName) => {
      return tierConfig.limits[limitName];
    },

    isTierAtLeast: (requiredTier) => {
      const order = ['free', 'starter', 'pro', 'team', 'enterprise'];
      const currentIndex = order.indexOf(user?.tier || 'free');
      const requiredIndex = order.indexOf(requiredTier);
      return currentIndex >= requiredIndex;
    },

    canExportFormat: (format) => {
      return tierConfig.features.exportFormats.includes(format);
    }
  };
}
```

### Upgrade Banner Component

```javascript
// client/src/components/UpgradeBanner.jsx
export default function UpgradeBanner({ feature, requiredTier = 'Pro' }) {
  return (
    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-indigo-400" /* ... */ />
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-indigo-800">
            Upgrade to {requiredTier}
          </h3>
          <p className="mt-1 text-sm text-indigo-700">
            This feature requires a {requiredTier} plan or higher.
          </p>
          <a
            href="/pricing"
            className="mt-2 inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            View pricing
            <svg className="ml-1 h-4 w-4" /* ... */ />
          </a>
        </div>
      </div>
    </div>
  );
}
```

---

## Usage Tracking

### Database Schema

```sql
-- usage_tracking table
CREATE TABLE usage_tracking (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  limit_type VARCHAR(50) NOT NULL, -- 'generationsPerDay', 'generationsPerMonth', etc.
  period VARCHAR(10) NOT NULL, -- 'day' or 'month'
  created_at TIMESTAMP DEFAULT NOW(),

  -- Indexes for fast lookups
  INDEX idx_user_limit_period (user_id, limit_type, period, created_at),
  INDEX idx_created_at (created_at)
);

-- Optional: Materialized view for current period usage
CREATE MATERIALIZED VIEW current_usage AS
SELECT
  user_id,
  limit_type,
  'day' as period,
  COUNT(*) as usage,
  DATE(created_at) as date
FROM usage_tracking
WHERE created_at >= CURRENT_DATE
GROUP BY user_id, limit_type, DATE(created_at)

UNION ALL

SELECT
  user_id,
  limit_type,
  'month' as period,
  COUNT(*) as usage,
  DATE_TRUNC('month', created_at) as date
FROM usage_tracking
WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)
GROUP BY user_id, limit_type, DATE_TRUNC('month', created_at);

-- Refresh daily via cron
CREATE INDEX ON current_usage (user_id, limit_type, period);
```

### Cleanup Strategy

```javascript
// server/src/jobs/cleanupUsageTracking.js
import pool from '../config/database.js';

/**
 * Delete old usage tracking records (keep last 90 days)
 * Run daily via cron or scheduler
 */
export async function cleanupOldUsageRecords() {
  const { rowCount } = await pool.query(
    `DELETE FROM usage_tracking
     WHERE created_at < NOW() - INTERVAL '90 days'`
  );

  console.log(`Cleaned up ${rowCount} old usage records`);
  return rowCount;
}

// Schedule with node-cron
import cron from 'node-cron';

// Run at 2 AM daily
cron.schedule('0 2 * * *', cleanupOldUsageRecords);
```

---

## Admin Overrides

### Override Config: `server/src/config/tierOverrides.js`

```javascript
/**
 * User-specific tier overrides
 * Use cases:
 * - Beta testers (unlock features early)
 * - Customer success (temporary limit increases)
 * - Partnerships (custom feature sets)
 * - Grandfathered users (legacy plan features)
 */
export const USER_OVERRIDES = {
  // Beta tester: Unlock Enterprise features on Free tier
  'user-123': {
    features: {
      customTemplates: true,
      apiAccess: true
    }
  },

  // Customer success: Temporary limit increase
  'user-456': {
    limits: {
      generationsPerDay: 200,
      maxFileSize: 1024 * 1024 * 5 // 5MB
    },
    expiresAt: '2025-12-31' // Auto-revert after date
  },

  // Partner: Custom feature set
  'user-789': {
    features: {
      customBranding: true
    },
    limits: {
      generationsPerMonth: 5000
    },
    note: 'Partnership agreement #2025-03'
  }
};

/**
 * Apply user overrides to base tier config
 */
export function applyUserOverrides(userId, baseTierConfig) {
  const override = USER_OVERRIDES[userId];

  if (!override) {
    return baseTierConfig;
  }

  // Check expiration
  if (override.expiresAt && new Date(override.expiresAt) < new Date()) {
    console.log(`Override expired for user ${userId}`);
    return baseTierConfig;
  }

  // Merge overrides (shallow merge for limits/features)
  return {
    ...baseTierConfig,
    limits: {
      ...baseTierConfig.limits,
      ...(override.limits || {})
    },
    features: {
      ...baseTierConfig.features,
      ...(override.features || {})
    }
  };
}

/**
 * Get all active overrides (for admin dashboard)
 */
export function getActiveOverrides() {
  const now = new Date();

  return Object.entries(USER_OVERRIDES)
    .filter(([_, config]) => {
      if (!config.expiresAt) return true;
      return new Date(config.expiresAt) >= now;
    })
    .map(([userId, config]) => ({
      userId,
      ...config
    }));
}
```

### Admin API Routes

```javascript
// server/src/routes/admin.js
import { USER_OVERRIDES, applyUserOverrides } from '../config/tierOverrides.js';

/**
 * List all tier overrides
 */
router.get('/admin/overrides',
  authenticate,
  requireAdmin,
  (req, res) => {
    res.json({
      overrides: getActiveOverrides(),
      total: Object.keys(USER_OVERRIDES).length
    });
  }
);

/**
 * Add/update user override
 */
router.post('/admin/overrides/:userId',
  authenticate,
  requireAdmin,
  async (req, res) => {
    const { userId } = req.params;
    const { limits, features, expiresAt, note } = req.body;

    // Update in-memory config (or database if using dynamic system)
    USER_OVERRIDES[userId] = {
      limits,
      features,
      expiresAt,
      note,
      updatedBy: req.user.id,
      updatedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      override: USER_OVERRIDES[userId]
    });
  }
);
```

---

## Testing Strategy

### Unit Tests: `server/tests/unit/tiers.test.js`

```javascript
import { describe, it, expect } from 'vitest';
import {
  getTierConfig,
  hasFeature,
  getLimit,
  isUnlimited,
  compareTiers,
  isTierAtLeast
} from '../../src/config/tiers.js';

describe('Tier Configuration', () => {
  describe('getTierConfig', () => {
    it('should return free tier for invalid tier ID', () => {
      const config = getTierConfig('invalid');
      expect(config.id).toBe('free');
    });

    it('should return correct config for valid tier', () => {
      const config = getTierConfig('pro');
      expect(config.id).toBe('pro');
      expect(config.name).toBe('Pro');
    });
  });

  describe('hasFeature', () => {
    it('should return false for free tier streaming', () => {
      expect(hasFeature('free', 'streamingGeneration')).toBe(true);
    });

    it('should return true for pro tier streaming', () => {
      expect(hasFeature('pro', 'streamingGeneration')).toBe(true);
    });
  });

  describe('Limits', () => {
    it('should return correct daily generation limit', () => {
      expect(getLimit('free', 'generationsPerDay')).toBe(5);
      expect(getLimit('pro', 'generationsPerDay')).toBe(20);
    });

    it('should identify unlimited correctly', () => {
      expect(isUnlimited(-1)).toBe(true);
      expect(isUnlimited(100)).toBe(false);
      expect(isUnlimited(0)).toBe(false);
    });
  });

  describe('Tier Comparison', () => {
    it('should compare tiers correctly', () => {
      expect(compareTiers('free', 'pro')).toBeLessThan(0);
      expect(compareTiers('pro', 'free')).toBeGreaterThan(0);
      expect(compareTiers('pro', 'pro')).toBe(0);
    });

    it('should check tier level correctly', () => {
      expect(isTierAtLeast('pro', 'free')).toBe(true);
      expect(isTierAtLeast('free', 'pro')).toBe(false);
      expect(isTierAtLeast('enterprise', 'pro')).toBe(true);
    });
  });
});
```

### Integration Tests: `server/tests/integration/tierGate.test.js`

```javascript
import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { createTestUser, getAuthToken } from '../helpers/auth.js';

describe('Tier Gate Middleware', () => {
  let freeUser, proUser, freeToken, proToken;

  beforeEach(async () => {
    freeUser = await createTestUser({ tier: 'free' });
    proUser = await createTestUser({ tier: 'pro' });
    freeToken = await getAuthToken(freeUser);
    proToken = await getAuthToken(proUser);
  });

  describe('Feature Gating', () => {
    it('should block free user from streaming generation', async () => {
      const res = await request(app)
        .post('/api/generate-stream')
        .set('Authorization', `Bearer ${freeToken}`)
        .send({ code: 'test', documentType: 'readme' });

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Feature not available');
      expect(res.body.requiredTier).toBe('Pro');
    });

    it('should allow pro user streaming generation', async () => {
      const res = await request(app)
        .post('/api/generate-stream')
        .set('Authorization', `Bearer ${proToken}`)
        .send({ code: 'test', documentType: 'readme' });

      expect(res.status).toBe(200);
    });
  });

  describe('Usage Limits', () => {
    it('should block after daily limit exceeded', async () => {
      // Make 5 requests (free tier limit)
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/generate')
          .set('Authorization', `Bearer ${freeToken}`)
          .send({ code: 'test', documentType: 'readme' });
      }

      // 6th request should be blocked
      const res = await request(app)
        .post('/api/generate')
        .set('Authorization', `Bearer ${freeToken}`)
        .send({ code: 'test', documentType: 'readme' });

      expect(res.status).toBe(429);
      expect(res.body.error).toBe('Limit exceeded');
      expect(res.body.limit).toBe(5);
      expect(res.body.currentUsage).toBe(5);
    });
  });

  describe('File Upload Validation', () => {
    it('should block files over tier size limit', async () => {
      const largeFile = Buffer.alloc(1024 * 200); // 200KB (free limit is 100KB)

      const res = await request(app)
        .post('/api/upload')
        .set('Authorization', `Bearer ${freeToken}`)
        .attach('files', largeFile, 'large.js');

      expect(res.status).toBe(413);
      expect(res.body.error).toBe('File too large');
    });
  });
});
```

### Frontend Tests: `client/tests/TierGate.test.jsx`

```javascript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import TierGate from '../src/components/TierGate';
import { AuthContext } from '../src/contexts/AuthContext';

describe('TierGate Component', () => {
  const renderWithAuth = (user, children) => {
    return render(
      <AuthContext.Provider value={{ user }}>
        {children}
      </AuthContext.Provider>
    );
  };

  it('should show children for allowed feature', () => {
    const user = { tier: 'pro' };

    renderWithAuth(
      user,
      <TierGate feature="streamingGeneration">
        <div>Streaming Enabled</div>
      </TierGate>
    );

    expect(screen.getByText('Streaming Enabled')).toBeInTheDocument();
  });

  it('should show fallback for blocked feature', () => {
    const user = { tier: 'free' };

    renderWithAuth(
      user,
      <TierGate
        feature="streamingGeneration"
        fallback={<div>Upgrade Required</div>}
      >
        <div>Streaming Enabled</div>
      </TierGate>
    );

    expect(screen.queryByText('Streaming Enabled')).not.toBeInTheDocument();
    expect(screen.getByText('Upgrade Required')).toBeInTheDocument();
  });

  it('should check tier level correctly', () => {
    const user = { tier: 'free' };

    renderWithAuth(
      user,
      <TierGate requiredTier="pro">
        <div>Pro Feature</div>
      </TierGate>
    );

    expect(screen.queryByText('Pro Feature')).not.toBeInTheDocument();
  });
});
```

---

## Migration Guide

### Phase 1: Setup Configuration (Day 1)

```bash
# 1. Create tier configuration
touch server/src/config/tiers.js
touch server/src/config/tierOverrides.js

# 2. Add database schema
psql $DATABASE_URL -f migrations/001_usage_tracking.sql

# 3. Add middleware
touch server/src/middleware/tierGate.js
touch server/src/middleware/usageMiddleware.js

# 4. Run tests
npm test -- tiers.test.js
```

### Phase 2: Migrate Existing Routes (Days 2-3)

```javascript
// Before:
router.post('/generate-stream', authenticate, async (req, res) => {
  // No tier check
  await handleStreaming(req, res);
});

// After:
router.post('/generate-stream',
  authenticate,
  requireFeature('streamingGeneration'),
  checkLimit('generationsPerDay', 'day'),
  async (req, res) => {
    await handleStreaming(req, res);
  },
  trackUsage('generationsPerDay', 'day')
);
```

**Migration Checklist:**
- [ ] Identify all routes needing tier gates
- [ ] Add `requireFeature()` for premium features
- [ ] Add `checkLimit()` for rate-limited endpoints
- [ ] Add `trackUsage()` after successful operations
- [ ] Update error handling for 403/429 responses
- [ ] Test with free/pro/enterprise test users

### Phase 3: Frontend Integration (Day 4)

```bash
# 1. Copy tier config to frontend (or expose via API)
cp server/src/config/tiers.js client/src/config/tiers.js

# 2. Create hooks and components
touch client/src/hooks/useTier.js
touch client/src/components/TierGate.jsx
touch client/src/components/UpgradeBanner.jsx

# 3. Update UI
# - Add TierGate wrappers to premium features
# - Show upgrade banners for locked features
# - Display usage stats in user dashboard
```

### Phase 4: Monitoring & Optimization (Day 5+)

```javascript
// Add logging/analytics
import { trackEvent } from './analytics';

export const requireFeature = (featureName) => {
  return (req, res, next) => {
    const userTier = req.user?.tier || 'free';

    if (!hasFeature(userTier, featureName)) {
      // Track feature gate hits for conversion optimization
      trackEvent('feature_gate_hit', {
        feature: featureName,
        userTier,
        userId: req.user?.id
      });

      return res.status(403).json({ /* ... */ });
    }

    next();
  };
};
```

---

## Best Practices

### ✅ DO

1. **Always use middleware for tier checks** (don't inline in handlers)
2. **Track usage after successful operations** (avoid double-counting)
3. **Provide clear upgrade paths** (include `upgradeUrl` in error responses)
4. **Use `-1` for unlimited** (consistent pattern)
5. **Apply overrides before tier checks** (beta users, partners)
6. **Log feature gate hits** (conversion funnel analytics)
7. **Keep tier config in version control** (audit trail)
8. **Test all tier transitions** (free → pro, pro → enterprise)
9. **Document tier-specific features** (in API docs, UI)
10. **Cache tier configs** (reduce DB queries)

### ❌ DON'T

1. **Don't hardcode tier logic in routes** (use centralized config)
2. **Don't trust client-side tier checks** (always validate server-side)
3. **Don't use magic numbers** (`if (limit === 5)` → use named constants)
4. **Don't block non-premium users entirely** (show upgrade paths)
5. **Don't forget to track usage** (inaccurate limits frustrate users)
6. **Don't use floats for limits** (stick to integers or `-1`)
7. **Don't expose internal tier IDs to clients** (use friendly names)
8. **Don't skip expiration checks** (expired overrides should revert)
9. **Don't make tier changes backward-incompatible** (gradual rollout)
10. **Don't ignore usage tracking failures** (log but don't block requests)

### Performance Optimization

```javascript
// ✅ GOOD: Cache tier config in memory
const tierConfigCache = new Map();

export const getTierConfigCached = (tierId) => {
  if (!tierConfigCache.has(tierId)) {
    tierConfigCache.set(tierId, TIER_CONFIG[tierId] || TIER_CONFIG.free);
  }
  return tierConfigCache.get(tierId);
};

// ✅ GOOD: Use materialized views for usage stats
// (See Database Schema section)

// ❌ BAD: Query database on every request
export const checkLimit = (limitName) => {
  return async (req, res, next) => {
    // This hits DB every time - consider caching for 1min
    const currentUsage = await getUserUsage(req.user.id, limitName);
    // ...
  };
};
```

---

## Related Documentation

- **[TIER-FEATURE-MATRIX.md](../planning/TIER-FEATURE-MATRIX.md)** - Visual tier comparison table
- **[tiers.js](../../server/src/config/tiers.js)** - Live tier configuration
- **[ROADMAP.md](../planning/roadmap/ROADMAP.md)** - Tier system in Phase 2.0
- **[API-Reference.md](../api/API-Reference.md)** - API error codes (403, 429)
- **[AUTHENTICATION.md](./AUTHENTICATION.md)** - User tier assignment (future)

---

## Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2025-10-27 | 1.0 | Initial tier architecture guide |

---

**Questions or improvements?** Update this guide as the system evolves. Keep tier changes backward-compatible and document breaking changes in [ROADMAP.md](../planning/roadmap/ROADMAP.md).
