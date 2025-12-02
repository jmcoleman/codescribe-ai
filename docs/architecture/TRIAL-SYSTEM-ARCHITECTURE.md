# Trial System Architecture

**Status:** Planned
**Author:** Claude (AI Assistant)
**Created:** November 25, 2025
**Related Docs:** [SUBSCRIPTION-FLOWS.md](./SUBSCRIPTION-FLOWS.md) | [SUBSCRIPTION-MANAGEMENT.md](./SUBSCRIPTION-MANAGEMENT.md) | [TIER-ARCHITECTURE.md](./TIER-ARCHITECTURE.md)

---

## Executive Summary

**Objective:** Allow new users to experience all Pro-tier features for a limited time to increase conversion to paid subscriptions.

**Recommended Approach:** 14-day time-based trial of Pro tier with optional credit card upfront, leveraging existing Stripe trial support.

**Existing Infrastructure:** The database already has `trial_start`, `trial_end` columns in the subscriptions table and supports the `trialing` status enum. This architecture builds on that foundation.

---

## Table of Contents

1. [Strategic Design Decisions](#1-strategic-design-decisions)
2. [Database Schema Changes](#2-database-schema-changes)
3. [Backend Architecture](#3-backend-architecture)
4. [Frontend Architecture](#4-frontend-architecture)
5. [Email Templates](#5-email-templates)
6. [Stripe Integration Options](#6-stripe-integration-options)
7. [Security & Abuse Prevention](#7-security--abuse-prevention)
8. [Analytics & Metrics](#8-analytics--metrics)
9. [Implementation Phases](#9-implementation-phases)
10. [Configuration](#10-configuration)

---

## 1. Strategic Design Decisions

### 1.1 Trial Parameters

| Parameter | Recommendation | Rationale |
|-----------|---------------|-----------|
| **Duration** | 14 days | Industry standard; enough time to evaluate without losing urgency |
| **Trial Tier** | Pro ($29/mo) | Best value showcase without giving away Team/Enterprise features |
| **Credit Card Required** | No (configurable) | Lower barrier to entry; can A/B test later |
| **Eligibility** | One per user (email-based) | Prevents abuse while allowing genuine new users |
| **End Behavior** | Auto-downgrade to Free | Less aggressive; builds trust |

### 1.2 Business Logic Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      TRIAL LIFECYCLE                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [New User Signup] ──► [Trial Eligible?] ──► [Start Trial]     │
│         │                    │                    │             │
│         │                    │ No                 │             │
│         │                    ▼                    ▼             │
│         │              [Free Tier]         [Pro Access]         │
│         │                                        │              │
│         │                              ┌─────────┴─────────┐    │
│         │                              │   14 Days Pass    │    │
│         │                              └─────────┬─────────┘    │
│         │                                        │              │
│         │                    ┌───────────────────┼──────────┐   │
│         │                    │                   │          │   │
│         │                    ▼                   ▼          ▼   │
│         │             [No Action]         [Subscribe]  [Extend] │
│         │                    │                   │          │   │
│         │                    ▼                   ▼          ▼   │
│         │              [Free Tier]         [Paid Tier]  [+7d]   │
│         │                                                       │
└─────────────────────────────────────────────────────────────────┘
```

### 1.3 Trial State Machine

```
                    ┌──────────┐
                    │ eligible │
                    └────┬─────┘
                         │ startTrial()
                         ▼
                    ┌──────────┐
        ┌───────────│  active  │───────────┐
        │           └────┬─────┘           │
        │                │                 │
        │ convert()      │ expire()        │ cancel()
        │                │                 │
        ▼                ▼                 ▼
   ┌──────────┐    ┌──────────┐     ┌──────────┐
   │converted │    │ expired  │     │cancelled │
   └──────────┘    └──────────┘     └──────────┘
        │                │
        │                │ extend() (admin only)
        │                ▼
        │          ┌──────────┐
        │          │ extended │──► [active]
        │          └──────────┘
        │
        └──► [Paid Subscription Created]
```

---

## 2. Database Schema Changes

### 2.1 New Table: `user_trials`

```sql
-- Migration: XXX-create-user-trials-table.sql
CREATE TABLE user_trials (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Trial configuration
  trial_tier VARCHAR(50) NOT NULL DEFAULT 'pro',
  trial_duration_days INTEGER NOT NULL DEFAULT 14,

  -- Trial period
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at TIMESTAMPTZ NOT NULL,

  -- Status tracking
  status VARCHAR(50) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'expired', 'converted', 'extended', 'cancelled')),

  -- Conversion tracking
  converted_at TIMESTAMPTZ DEFAULT NULL,
  converted_to_tier VARCHAR(50) DEFAULT NULL,
  converted_subscription_id INTEGER REFERENCES subscriptions(id),

  -- Extension tracking (for sales/support)
  extended_count INTEGER DEFAULT 0,
  extended_by_user_id INTEGER REFERENCES users(id),
  extension_reason TEXT,

  -- Source tracking (analytics)
  source VARCHAR(100) DEFAULT 'signup', -- signup, promotion, referral, support
  promo_code VARCHAR(50) DEFAULT NULL,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_user_trials_user_id ON user_trials(user_id);
CREATE INDEX idx_user_trials_status ON user_trials(status);
CREATE INDEX idx_user_trials_ends_at ON user_trials(ends_at);
CREATE UNIQUE INDEX idx_user_trials_active ON user_trials(user_id)
  WHERE status = 'active'; -- Only one active trial per user
```

### 2.2 Modify Table: `users`

```sql
-- Migration: XXX-add-trial-columns-to-users.sql
ALTER TABLE users
  ADD COLUMN trial_eligible BOOLEAN DEFAULT TRUE,
  ADD COLUMN trial_used_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN trial_source VARCHAR(100) DEFAULT NULL;

-- Index for eligibility checks
CREATE INDEX idx_users_trial_eligible ON users(trial_eligible) WHERE trial_eligible = TRUE;
```

### 2.3 New Table: `trial_email_history`

```sql
-- Migration: XXX-create-trial-email-history.sql
-- Tracks reminder emails to prevent duplicates
CREATE TABLE trial_email_history (
  id SERIAL PRIMARY KEY,
  user_trial_id INTEGER NOT NULL REFERENCES user_trials(id) ON DELETE CASCADE,
  email_type VARCHAR(50) NOT NULL, -- 'started', '7_days_left', '3_days_left', '1_day_left', 'expired', 'extended'
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_trial_email UNIQUE (user_trial_id, email_type)
);
```

### 2.4 Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────────┐
│     users       │       │   user_trials   │       │ trial_email_history │
├─────────────────┤       ├─────────────────┤       ├─────────────────────┤
│ id (PK)         │◄──┐   │ id (PK)         │◄──────│ user_trial_id (FK)  │
│ email           │   │   │ user_id (FK)────┼───┘   │ email_type          │
│ tier            │   │   │ trial_tier      │       │ sent_at             │
│ trial_eligible  │   │   │ status          │       └─────────────────────┘
│ trial_used_at   │   │   │ started_at      │
│ trial_source    │   │   │ ends_at         │       ┌─────────────────────┐
└─────────────────┘   │   │ converted_at    │       │   subscriptions     │
                      │   │ extended_by (FK)┼───┐   ├─────────────────────┤
                      │   │ subscription_id ┼───┼──►│ id (PK)             │
                      │   └─────────────────┘   │   │ user_id (FK)        │
                      │                         │   │ trial_start         │
                      └─────────────────────────┘   │ trial_end           │
                                                    │ status              │
                                                    └─────────────────────┘
```

---

## 3. Backend Architecture

### 3.1 New Service: `trialService.js`

**Location:** `server/src/services/trialService.js`

```javascript
export const trialService = {
  /**
   * Check if user is eligible for a trial
   * @param {number} userId
   * @returns {Promise<{eligible: boolean, reason?: string}>}
   */
  async checkEligibility(userId),

  /**
   * Start a new trial for user
   * @param {number} userId
   * @param {Object} options - { source, promoCode, durationDays, tier }
   * @returns {Promise<Trial>}
   */
  async startTrial(userId, options = {}),

  /**
   * Get active trial for user (if any)
   * @param {number} userId
   * @returns {Promise<Trial|null>}
   */
  async getActiveTrial(userId),

  /**
   * Check if user has an active, valid trial
   * @param {number} userId
   * @returns {Promise<boolean>}
   */
  async isTrialActive(userId),

  /**
   * Get comprehensive trial status
   * @param {number} userId
   * @returns {Promise<TrialStatus>}
   * TrialStatus: { hasActiveTrial, trialTier, daysRemaining, endsAt, isEligible }
   */
  async getTrialStatus(userId),

  /**
   * End a trial (expire, convert, or cancel)
   * @param {number} userId
   * @param {'expired'|'converted'|'cancelled'} reason
   */
  async endTrial(userId, reason),

  /**
   * Extend a trial (admin/support only)
   * @param {number} userId
   * @param {number} days - Additional days (max 14)
   * @param {number} extendedByUserId - Admin who extended
   * @param {string} reason - Required justification
   */
  async extendTrial(userId, days, extendedByUserId, reason),

  /**
   * Mark trial as converted when user subscribes
   * @param {number} userId
   * @param {number} subscriptionId
   * @param {string} tier - Tier they converted to
   */
  async convertTrial(userId, subscriptionId, tier),

  /**
   * Get trials expiring within N days (for cron job)
   * @param {number} withinDays
   * @returns {Promise<Trial[]>}
   */
  async getExpiringTrials(withinDays),

  /**
   * Process all expired trials (daily cron)
   * Updates status, sends emails, downgrades tier
   */
  async processExpiredTrials()
};
```

### 3.2 New Model: `Trial.js`

**Location:** `server/src/models/Trial.js`

```javascript
export const Trial = {
  // CRUD Operations
  async create(userId, trialTier, durationDays, source, promoCode),
  async findById(id),
  async findActiveByUserId(userId),
  async findAllByUserId(userId), // Full trial history
  async update(id, updates),

  // Status transitions
  async expire(id),
  async convert(id, subscriptionId, tier),
  async extend(id, additionalDays, extendedByUserId, reason),
  async cancel(id),

  // Queries
  async getExpiring(withinDays),
  async getExpired(), // Active trials past ends_at
  async getBySource(source), // Analytics

  // Analytics
  async getStats() // Conversion rates, avg duration, etc.
};
```

### 3.3 Modify: Tier Gate Middleware

**Location:** `server/src/middleware/tierGate.js`

```javascript
import { trialService } from '../services/trialService.js';

/**
 * Get the effective tier for a user, considering:
 * 1. Admin/support overrides (highest priority)
 * 2. Active paid subscription
 * 3. Active trial
 * 4. Default tier from database
 */
export const getEffectiveTier = async (user) => {
  // Priority 1: Admin/support override (existing functionality)
  if (hasActiveOverride(user)) {
    return user.viewing_as_tier;
  }

  // Priority 2: Active paid subscription (not free)
  if (user.tier !== 'free') {
    return user.tier;
  }

  // Priority 3: Active trial
  const activeTrial = await trialService.getActiveTrial(user.id);
  if (activeTrial && activeTrial.status === 'active') {
    return activeTrial.trial_tier; // Returns 'pro' (or configured trial tier)
  }

  // Priority 4: Default tier from database
  return user.tier || 'free';
};

/**
 * Middleware to attach effective tier to request
 * Should run after requireAuth
 */
export const attachEffectiveTier = async (req, res, next) => {
  if (req.user) {
    req.user.effectiveTier = await getEffectiveTier(req.user);
    req.user.isOnTrial = await trialService.isTrialActive(req.user.id);
  }
  next();
};
```

### 3.4 New Routes: `trials.js`

**Location:** `server/src/routes/trials.js`

```javascript
import express from 'express';
import { requireAuth, requireVerifiedEmail, requireRole } from '../middleware/auth.js';
import { trialService } from '../services/trialService.js';

const router = express.Router();

/**
 * GET /api/trials/status
 * Get current trial status for authenticated user
 */
router.get('/status', requireAuth, async (req, res) => {
  const status = await trialService.getTrialStatus(req.user.id);
  res.json(status);
  // Response: { hasActiveTrial, trialTier, daysRemaining, endsAt, isEligible, history }
});

/**
 * POST /api/trials/start
 * Start a new trial (requires verified email)
 */
router.post('/start',
  requireAuth,
  requireVerifiedEmail,
  trialStartLimiter, // Rate limit: 3 per IP per day
  async (req, res) => {
    const { source, promoCode } = req.body;

    // Check eligibility
    const eligibility = await trialService.checkEligibility(req.user.id);
    if (!eligibility.eligible) {
      return res.status(400).json({
        error: 'Not eligible for trial',
        reason: eligibility.reason
      });
    }

    // Start trial
    const trial = await trialService.startTrial(req.user.id, { source, promoCode });

    res.status(201).json({
      message: 'Trial started successfully',
      trial: {
        tier: trial.trial_tier,
        endsAt: trial.ends_at,
        daysRemaining: 14
      }
    });
  }
);

/**
 * POST /api/trials/:id/extend
 * Extend a trial (admin/support only)
 */
router.post('/:id/extend',
  requireAuth,
  requireRole(['admin', 'support', 'super_admin']),
  async (req, res) => {
    const { days, reason } = req.body;

    // Validation
    if (!days || days < 1 || days > 14) {
      return res.status(400).json({ error: 'Days must be between 1 and 14' });
    }
    if (!reason || reason.length < 10) {
      return res.status(400).json({ error: 'Reason required (min 10 characters)' });
    }

    const trial = await trialService.extendTrial(
      req.params.id,
      days,
      req.user.id,
      reason
    );

    res.json({
      message: `Trial extended by ${days} days`,
      newEndsAt: trial.ends_at
    });
  }
);

/**
 * GET /api/trials/analytics
 * Trial analytics (admin only)
 */
router.get('/analytics',
  requireAuth,
  requireRole(['admin', 'super_admin']),
  async (req, res) => {
    const stats = await Trial.getStats();
    res.json(stats);
    // Response: { totalTrials, activeTrials, conversionRate, avgDaysToConvert, bySource }
  }
);

export default router;
```

### 3.5 Cron Jobs: `trialJobs.js`

**Location:** `server/src/jobs/trialJobs.js`

```javascript
import { trialService } from '../services/trialService.js';
import { Trial } from '../models/Trial.js';
import { sendTrialReminderEmail } from '../services/emailService.js';

/**
 * Daily trial reminder job
 * Runs at 9 AM EST every day
 * Schedule: '0 9 * * *' (with TZ=America/New_York)
 */
export const trialReminderJob = {
  name: 'trial-reminders',
  schedule: '0 14 * * *', // 9 AM EST = 2 PM UTC

  async run() {
    console.log('[TrialJob] Starting daily trial reminder job');

    // 1. Send 7-day reminder emails
    const sevenDayTrials = await trialService.getExpiringTrials(7);
    for (const trial of sevenDayTrials) {
      await sendTrialReminderEmail(trial.user_id, '7_days_left', trial);
    }
    console.log(`[TrialJob] Sent ${sevenDayTrials.length} 7-day reminders`);

    // 2. Send 3-day reminder emails
    const threeDayTrials = await trialService.getExpiringTrials(3);
    for (const trial of threeDayTrials) {
      await sendTrialReminderEmail(trial.user_id, '3_days_left', trial);
    }
    console.log(`[TrialJob] Sent ${threeDayTrials.length} 3-day reminders`);

    // 3. Send 1-day reminder emails
    const oneDayTrials = await trialService.getExpiringTrials(1);
    for (const trial of oneDayTrials) {
      await sendTrialReminderEmail(trial.user_id, '1_day_left', trial);
    }
    console.log(`[TrialJob] Sent ${oneDayTrials.length} 1-day reminders`);

    // 4. Process expired trials (update status, downgrade tier)
    const expiredCount = await trialService.processExpiredTrials();
    console.log(`[TrialJob] Processed ${expiredCount} expired trials`);

    // 5. Send expired notification emails
    const newlyExpired = await Trial.getByStatus('expired', {
      since: new Date(Date.now() - 24 * 60 * 60 * 1000)
    });
    for (const trial of newlyExpired) {
      await sendTrialReminderEmail(trial.user_id, 'expired', trial);
    }
    console.log(`[TrialJob] Sent ${newlyExpired.length} expiration notices`);

    console.log('[TrialJob] Daily trial reminder job complete');
  }
};
```

---

## 4. Frontend Architecture

### 4.1 New Context: `TrialContext.jsx`

**Location:** `client/src/context/TrialContext.jsx`

```jsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { STORAGE_KEYS } from '../constants/storage';

const TrialContext = createContext();

export const TrialProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [trialStatus, setTrialStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchTrialStatus = useCallback(async () => {
    if (!isAuthenticated) {
      setTrialStatus(null);
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      const response = await fetch(`${API_URL}/api/trials/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setTrialStatus(data);
    } catch (error) {
      console.error('Failed to fetch trial status:', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchTrialStatus();
  }, [fetchTrialStatus]);

  const startTrial = async (source = 'manual') => {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const response = await fetch(`${API_URL}/api/trials/start`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ source })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.reason || 'Failed to start trial');
    }

    await fetchTrialStatus(); // Refresh status
    return response.json();
  };

  const value = {
    trialStatus,
    loading,
    isOnTrial: trialStatus?.hasActiveTrial ?? false,
    trialTier: trialStatus?.trialTier,
    daysRemaining: trialStatus?.daysRemaining,
    isEligible: trialStatus?.isEligible ?? false,
    startTrial,
    refreshTrialStatus: fetchTrialStatus
  };

  return (
    <TrialContext.Provider value={value}>
      {children}
    </TrialContext.Provider>
  );
};

export const useTrial = () => {
  const context = useContext(TrialContext);
  if (!context) {
    throw new Error('useTrial must be used within TrialProvider');
  }
  return context;
};
```

### 4.2 New Components

| Component | File | Purpose |
|-----------|------|---------|
| `TrialBanner` | `components/trial/TrialBanner.jsx` | Persistent banner showing trial status and days remaining |
| `TrialStartModal` | `components/trial/TrialStartModal.jsx` | Modal to start trial (shown on signup or from pricing) |
| `TrialExpiringModal` | `components/trial/TrialExpiringModal.jsx` | Warning modal when <3 days remaining |
| `TrialExpiredModal` | `components/trial/TrialExpiredModal.jsx` | Prompt to subscribe after trial ends |
| `TrialStatusBadge` | `components/trial/TrialStatusBadge.jsx` | Small badge "Pro Trial - 12 days" |

### 4.3 TrialBanner Component

```jsx
// client/src/components/trial/TrialBanner.jsx
import { useTrial } from '../../context/TrialContext';
import { Link } from 'react-router-dom';

export const TrialBanner = () => {
  const { isOnTrial, daysRemaining, trialTier } = useTrial();

  if (!isOnTrial) return null;

  const urgency = daysRemaining <= 3 ? 'urgent' : 'normal';

  return (
    <div className={`trial-banner trial-banner--${urgency}`}>
      <span className="trial-banner__icon">
        {urgency === 'urgent' ? '⚠️' : '🎉'}
      </span>
      <span className="trial-banner__text">
        You're on a <strong>{trialTier}</strong> trial!
        {daysRemaining === 1
          ? ' Last day remaining.'
          : ` ${daysRemaining} days remaining.`
        }
      </span>
      <Link to="/pricing" className="trial-banner__cta">
        Upgrade Now
      </Link>
    </div>
  );
};
```

### 4.4 UI Integration Points

```
┌────────────────────────────────────────────────────────────────────┐
│ Header                                     [Trial: 12d] [Profile] │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ 🎉 You're on a Pro trial! 12 days remaining.      [Upgrade]  │ │ ◄── TrialBanner
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                                                              │ │
│  │                   [Main App Content]                         │ │
│  │                                                              │ │
│  │              Full Pro Features Available                     │ │
│  │                                                              │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                    │
├────────────────────────────────────────────────────────────────────┤
│ Pricing Page Integration:                                          │
│                                                                    │
│  ┌────────────┐    ┌────────────┐    ┌────────────┐               │
│  │    Free    │    │    Pro     │    │    Team    │               │
│  │   $0/mo    │    │  $29/mo    │    │   $99/mo   │               │
│  │            │    │ ─────────  │    │            │               │
│  │            │    │ YOU'RE ON  │    │            │               │
│  │ [Current]  │    │  TRIAL     │    │ [Upgrade]  │               │
│  │            │    │ [12 days]  │    │            │               │
│  │            │    │ [Upgrade]  │    │            │               │
│  └────────────┘    └────────────┘    └────────────┘               │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### 4.5 Trial Start Flow (New User)

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Signup Page    │────►│ Verify Email    │────►│ Trial Offer     │
│                 │     │                 │     │     Modal       │
│ [Create Account]│     │ [Check Inbox]   │     │                 │
└─────────────────┘     └─────────────────┘     │ "Start your     │
                                                │  14-day Pro     │
                                                │  trial!"        │
                                                │                 │
                                                │ [Start Trial]   │
                                                │ [Maybe Later]   │
                                                └────────┬────────┘
                                                         │
                                        ┌────────────────┴────────────────┐
                                        │                                 │
                                        ▼                                 ▼
                               ┌─────────────────┐               ┌─────────────────┐
                               │  Trial Active   │               │   Free Tier     │
                               │  Pro Features   │               │   (Can trial    │
                               │  Unlocked       │               │    later)       │
                               └─────────────────┘               └─────────────────┘
```

---

## 5. Email Templates

### 5.1 Required Templates

| Template ID | Trigger | Subject Line | Key Content |
|-------------|---------|--------------|-------------|
| `trial-started` | Trial begins | "Your Pro trial has started!" | Welcome, features list, 14-day timeline |
| `trial-7-days` | 7 days left | "7 days left in your Pro trial" | Feature highlights, upgrade CTA |
| `trial-3-days` | 3 days left | "Only 3 days left!" | Urgency, what you'll lose, upgrade CTA |
| `trial-1-day` | 1 day left | "Last day of your Pro trial" | Final warning, upgrade now |
| `trial-expired` | Trial ends | "Your Pro trial has ended" | What happened, features lost, upgrade to continue |
| `trial-extended` | Extension granted | "Good news! Your trial was extended" | New end date, admin message |
| `trial-converted` | User subscribes | "Welcome to Pro!" | Thank you, next steps, getting started |

### 5.2 Email Template Structure

```javascript
// server/src/templates/emails/trial-started.js
export const trialStartedTemplate = {
  subject: 'Your Pro trial has started!',

  html: (data) => `
    <h1>Welcome to your CodeScribe AI Pro trial!</h1>

    <p>Hi ${data.userName},</p>

    <p>Your 14-day Pro trial is now active. Here's what you can explore:</p>

    <ul>
      <li><strong>Batch Processing</strong> - Generate docs for up to 50 files at once</li>
      <li><strong>Custom Templates</strong> - Create your own documentation templates</li>
      <li><strong>HTML/PDF Export</strong> - Export in multiple formats</li>
      <li><strong>Advanced Parsing</strong> - Better code analysis</li>
      <li><strong>50 daily generations</strong> (vs 3 on Free)</li>
    </ul>

    <p>Your trial ends on <strong>${data.trialEndsAt}</strong>.</p>

    <a href="${data.appUrl}" class="button">Start Generating Docs</a>

    <p>Questions? Reply to this email or visit our help center.</p>
  `,

  text: (data) => `
    Welcome to your CodeScribe AI Pro trial!

    Your 14-day Pro trial is now active...
  `
};
```

---

## 6. Stripe Integration Options

### Option A: Stripe-Managed Trial (Recommended for CC-required)

```javascript
// When creating checkout session with trial
const session = await stripe.checkout.sessions.create({
  customer: user.stripe_customer_id,
  mode: 'subscription',
  subscription_data: {
    trial_period_days: 14,
  },
  line_items: [{
    price: STRIPE_PRICE_PRO_MONTHLY,
    quantity: 1
  }],
  payment_method_collection: 'always', // Require CC upfront
  success_url: `${APP_URL}/trial-started?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${APP_URL}/pricing`,
});
```

**Pros:**
- Stripe handles trial expiration
- Automatic charge at end
- `customer.subscription.trial_will_end` webhook

**Cons:**
- Requires payment method upfront
- Less flexibility

### Option B: Application-Managed Trial (Recommended for No-CC)

```javascript
// Trial managed entirely in CodeScribe
// No Stripe involvement until user decides to subscribe

// Start trial
await trialService.startTrial(userId, { source: 'signup' });
// Sets trial_tier='pro', ends_at=NOW()+14 days

// When user converts, create subscription with immediate charge
const session = await stripe.checkout.sessions.create({
  customer: user.stripe_customer_id,
  mode: 'subscription',
  // No trial_period_days - charges immediately
  line_items: [{
    price: STRIPE_PRICE_PRO_MONTHLY,
    quantity: 1
  }],
  // ...
});

// On successful payment, mark trial as converted
await trialService.convertTrial(userId, subscriptionId, 'pro');
```

**Pros:**
- No credit card required
- Full control over trial logic
- Better for conversion optimization

**Cons:**
- More code to maintain
- No automatic conversion

### Recommendation: Hybrid Approach

1. **Default:** Application-managed trial (no CC required)
2. **Option:** Offer "Start trial with card" for committed users
3. **Configuration flag:** `TRIAL_CONFIG.requirePaymentMethod`

---

## 7. Security & Abuse Prevention

### 7.1 Abuse Prevention Matrix

| Attack Vector | Mitigation | Implementation |
|---------------|------------|----------------|
| Same email, multiple trials | `trial_used_at` timestamp | Check before starting trial |
| Email aliases (user+1@gmail.com) | Normalize email | Strip `+` suffixes before check |
| Multiple accounts same person | Optional phone verification | Future enhancement |
| Automated signups | Rate limiting | 3 trials per IP per 24h |
| Trial farming (create, use, abandon) | Analytics tracking | Monitor source/conversion |

### 7.2 Email Normalization

```javascript
// server/src/utils/emailNormalizer.js
export const normalizeEmail = (email) => {
  const [local, domain] = email.toLowerCase().split('@');

  // Remove + aliases (user+tag@gmail.com → user@gmail.com)
  const normalizedLocal = local.split('+')[0];

  // Remove dots for Gmail (u.s.e.r@gmail.com → user@gmail.com)
  const isGmail = ['gmail.com', 'googlemail.com'].includes(domain);
  const finalLocal = isGmail
    ? normalizedLocal.replace(/\./g, '')
    : normalizedLocal;

  return `${finalLocal}@${domain}`;
};

// Usage in eligibility check
const normalizedEmail = normalizeEmail(user.email);
const existingTrial = await Trial.findByNormalizedEmail(normalizedEmail);
```

### 7.3 Rate Limiting

```javascript
// server/src/middleware/rateLimiter.js
import rateLimit from 'express-rate-limit';

export const trialStartLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 3, // 3 trial start attempts per IP
  message: {
    error: 'Too many trial requests',
    retryAfter: '24 hours'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
```

---

## 8. Analytics & Metrics

### 8.1 Key Metrics

| Metric | Formula | Target |
|--------|---------|--------|
| **Trial Start Rate** | trials_started / new_signups | >50% |
| **Trial Completion Rate** | trials_used_full_duration / trials_started | >70% |
| **Trial → Paid Conversion** | converted_trials / expired_trials | >15% |
| **Time to Convert** | AVG(converted_at - started_at) | <10 days |
| **Feature Engagement** | generations_during_trial / trial_users | >10 |
| **Extension Rate** | extended_trials / all_trials | <10% |

### 8.2 Analytics Queries

```sql
-- Trial conversion funnel
SELECT
  COUNT(*) FILTER (WHERE status != 'cancelled') as started,
  COUNT(*) FILTER (WHERE status = 'converted') as converted,
  COUNT(*) FILTER (WHERE status = 'expired') as expired,
  ROUND(
    COUNT(*) FILTER (WHERE status = 'converted')::numeric /
    NULLIF(COUNT(*) FILTER (WHERE status IN ('converted', 'expired')), 0) * 100,
    2
  ) as conversion_rate
FROM user_trials
WHERE started_at > NOW() - INTERVAL '30 days';

-- Average days to convert
SELECT
  AVG(EXTRACT(EPOCH FROM (converted_at - started_at)) / 86400) as avg_days_to_convert
FROM user_trials
WHERE status = 'converted';

-- Conversion by source
SELECT
  source,
  COUNT(*) as trials,
  COUNT(*) FILTER (WHERE status = 'converted') as converted,
  ROUND(
    COUNT(*) FILTER (WHERE status = 'converted')::numeric / COUNT(*) * 100,
    2
  ) as conversion_rate
FROM user_trials
GROUP BY source
ORDER BY conversion_rate DESC;
```

### 8.3 Admin Dashboard Widget

```
┌─────────────────────────────────────────────────────────────┐
│                    Trial Analytics                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Active Trials: 47        Conversion Rate: 18.5%           │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                Trial Funnel (30 days)               │   │
│  │                                                     │   │
│  │  Started ████████████████████████████████ 156       │   │
│  │  Active  ██████████████                    47       │   │
│  │  Expired ████████████████                  72       │   │
│  │  Converted ███████                         29       │   │
│  │  Cancelled █                                8       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Top Sources:                   Avg Days to Convert: 8.3   │
│  • signup (62%)                                            │
│  • pricing_page (24%)                                      │
│  • referral (14%)                                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 9. Implementation Phases

### Phase 1: Foundation (Backend) - Est. Complexity: Medium

- [ ] Create database migrations (3 tables)
- [ ] Implement `Trial` model with CRUD operations
- [ ] Implement `trialService` with core logic
- [ ] Modify `tierGate` middleware for trial support
- [ ] Create trial API routes
- [ ] Add trial eligibility check to signup flow
- [ ] Write unit tests for trial service

**Dependencies:** None
**Testing:** Backend unit tests, manual API testing

### Phase 2: User Experience (Frontend) - Est. Complexity: Medium

- [ ] Create `TrialContext` provider
- [ ] Build `TrialBanner` component
- [ ] Build `TrialStartModal` component
- [ ] Build `TrialStatusBadge` component
- [ ] Integrate trial status in header
- [ ] Update pricing page with trial state
- [ ] Build trial expiring/expired modals

**Dependencies:** Phase 1 complete
**Testing:** Component tests, E2E tests

### Phase 3: Communications - Est. Complexity: Low-Medium

- [ ] Create 7 email templates
- [ ] Implement `sendTrialReminderEmail` function
- [ ] Set up cron job for daily reminders
- [ ] Add `trial_email_history` tracking
- [ ] Test email delivery flow

**Dependencies:** Phase 1 complete
**Testing:** Email preview, manual send testing

### Phase 4: Admin & Analytics - Est. Complexity: Low

- [ ] Add trial management to admin dashboard
- [ ] Implement trial extension UI for support
- [ ] Create analytics dashboard widget
- [ ] Add trial metrics to existing analytics
- [ ] Set up conversion tracking

**Dependencies:** Phases 1-2 complete
**Testing:** Admin flow testing

### Phase 5: Polish & Optimization - Est. Complexity: Low

- [ ] A/B testing infrastructure for trial duration
- [ ] Promo code support
- [ ] Trial extension self-service (optional)
- [ ] Documentation update
- [ ] Performance optimization

**Dependencies:** Phases 1-4 complete

---

## 10. Configuration

### 10.1 Trial Configuration File

**Location:** `server/src/config/trials.js`

```javascript
export const TRIAL_CONFIG = {
  // Trial parameters
  defaultDurationDays: 14,
  defaultTier: 'pro',
  maxExtensionDays: 14,
  maxExtensions: 2,

  // Email reminder schedule (days before expiration)
  reminderDays: [7, 3, 1],

  // Feature flags
  enabled: true,
  requireEmailVerification: true,
  requirePaymentMethod: false,
  allowSelfServiceExtension: false,
  showTrialOnSignup: true,

  // Eligibility rules
  eligibility: {
    newUsersOnly: true,
    excludeTiers: ['starter', 'pro', 'team', 'enterprise'],
    cooldownDays: 365, // Before re-trial allowed (if enabled)
    allowRetrial: false,
  },

  // Rate limiting
  rateLimit: {
    maxTrialStartsPerIP: 3,
    windowHours: 24,
  },

  // Analytics
  tracking: {
    sources: ['signup', 'pricing_page', 'referral', 'promotion', 'support'],
  }
};
```

### 10.2 Environment Variables

```bash
# .env additions
TRIAL_ENABLED=true
TRIAL_DEFAULT_DAYS=14
TRIAL_DEFAULT_TIER=pro
TRIAL_REQUIRE_PAYMENT_METHOD=false
TRIAL_REMINDER_DAYS=7,3,1
```

---

## Appendix A: API Reference

### Trial Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/trials/status` | Required | Get user's trial status |
| POST | `/api/trials/start` | Required + Verified | Start a new trial |
| POST | `/api/trials/:id/extend` | Admin | Extend a trial |
| GET | `/api/trials/analytics` | Admin | Get trial analytics |
| GET | `/api/trials/history` | Required | Get user's trial history |

### Response Schemas

```typescript
// GET /api/trials/status
interface TrialStatus {
  hasActiveTrial: boolean;
  trialTier: string | null;
  daysRemaining: number | null;
  endsAt: string | null; // ISO date
  isEligible: boolean;
  eligibilityReason?: string;
}

// POST /api/trials/start
interface TrialStartResponse {
  message: string;
  trial: {
    id: number;
    tier: string;
    endsAt: string;
    daysRemaining: number;
  };
}
```

---

## Appendix B: Migration Checklist

Before going live:

- [ ] All migrations applied to dev/staging
- [ ] Email templates approved by marketing
- [ ] Cron job tested in staging
- [ ] Rate limiting verified
- [ ] Admin extension flow tested
- [ ] Analytics dashboard updated
- [ ] Documentation updated
- [ ] CLAUDE.md updated with trial references
- [ ] Support team briefed on trial extension process

---

## Appendix C: Related Documentation

- [SUBSCRIPTION-FLOWS.md](./SUBSCRIPTION-FLOWS.md) - Subscription purchase flows
- [SUBSCRIPTION-MANAGEMENT.md](./SUBSCRIPTION-MANAGEMENT.md) - Upgrade/downgrade logic
- [TIER-ARCHITECTURE.md](./TIER-ARCHITECTURE.md) - Tier definitions and limits
- [EMAIL-TEMPLATING-GUIDE.md](../components/EMAIL-TEMPLATING-GUIDE.md) - Email template patterns
- [STRIPE-SETUP.md](../deployment/STRIPE-SETUP.md) - Stripe configuration

---

*Document version: 1.0.0*
*Last updated: November 25, 2025*
