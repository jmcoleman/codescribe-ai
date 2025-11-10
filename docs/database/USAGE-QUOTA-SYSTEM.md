# Usage Quota System

**Status:** ✅ **IMPLEMENTED** (October 28, 2025)
**Purpose:** Track and enforce usage limits for tiered pricing model
**Architecture:** Lazy/On-Demand resets with dual tracking (authenticated + anonymous)

---

## 📋 Table of Contents

- [System Overview](#system-overview)
- [How It Works](#how-it-works)
  - [IP Address Tracking Limitations](#ip-address-tracking-limitations)
- [Reset Mechanism](#reset-mechanism)
- [Database Schema](#database-schema)
- [Code Architecture](#code-architecture)
- [User Journeys](#user-journeys)
- [Lazy Reset vs Cron Jobs](#lazy-reset-vs-cron-jobs)
- [API Reference](#api-reference)
- [Testing](#testing)
- [Monitoring](#monitoring)

---

## System Overview

### What We Built

**Dual-Tracking System:**
- **Authenticated users** → Tracked by user ID in `user_quotas` table
- **Anonymous users** → Tracked by IP address in `anonymous_quotas` table
- **Seamless migration** → Anonymous usage migrates to user account on signup/login

**Quota Enforcement:**
- Checks usage **before** generation (blocks over-quota requests)
- Increments usage **after** successful generation
- Lazy resets (automatic on first request after period rollover)

**Current Tier Limits:**
| Tier | Daily | Monthly | Price |
|------|-------|---------|-------|
| Free | 3 | 10 | $0 |
| Starter | 10 | 50 | $12/mo |
| Pro | 50 | 200 | $29/mo |
| Team | 250 | 1,000 | $99/mo |
| Enterprise | Unlimited | Unlimited | Custom |

---

## How It Works

### Request Flow

```
1. POST /api/generate
   ↓
2. checkUsage() middleware
   ├─ Get user/IP from request
   ├─ Call Usage.getUserUsage(userIdentifier)
   │  ├─ Check if daily reset needed (today > last_reset_date)
   │  ├─ Check if monthly reset needed (new period_start_date)
   │  └─ Return current usage stats
   ├─ Check against tier limits (Free: 3/day, 10/month)
   ├─ If OVER limit → 429 response with upgrade info
   └─ If UNDER limit → Continue to generation
   ↓
3. Generate documentation
   ↓
4. incrementUsage(userIdentifier)
   ├─ Atomic UPDATE (daily_count++, monthly_count++)
   └─ Save to database
   ↓
5. Return response to user
```

### Anonymous User Journey

```
┌─────────────────────────────────────────────────────────────┐
│ Step 1: Visit Site (No Auth)                               │
├─────────────────────────────────────────────────────────────┤
│ User visits codescribeai.com                                │
│ → Tracked by IP: "ip:192.168.1.100"                       │
│ → No user_quotas record yet                                │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 2: Generate 5 Documents                                │
├─────────────────────────────────────────────────────────────┤
│ POST /api/generate (5 times)                                │
│ → checkUsage('ip:192.168.1.100')                           │
│   → Query anonymous_quotas table                           │
│   → Verify under limit (Free: 3/day, 10/month)            │
│ → incrementUsage('ip:192.168.1.100')                       │
│   → anonymous_quotas: daily_count=5, monthly_count=5       │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 3: Sign Up                                             │
├─────────────────────────────────────────────────────────────┤
│ POST /api/auth/signup                                        │
│ → User.create(email, password) → user.id = 123            │
│ → migrateAnonymousUsage('192.168.1.100', 123)             │
│   ├─ Get anonymous_quotas (daily=5, monthly=5)            │
│   ├─ INSERT/UPDATE user_quotas (user_id=123)              │
│   ├─ Merge counts: daily=5, monthly=5                     │
│   └─ DELETE anonymous_quotas record                       │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 4: Continue as Authenticated User                      │
├─────────────────────────────────────────────────────────────┤
│ POST /api/generate (5 more times)                           │
│ → checkUsage(123) → Query user_quotas                      │
│   → Current: daily=5, monthly=5                            │
│   → Limit: Free tier = 10/month                           │
│   → 5 more = 10 total → ALLOWED                           │
│ → incrementUsage(123)                                       │
│   → user_quotas: daily=10, monthly=10                      │
│                                                             │
│ 11th request:                                               │
│ → checkUsage(123) → monthly=10 >= limit(10)               │
│ → 429 Too Many Requests (Upgrade to Starter)              │
└─────────────────────────────────────────────────────────────┘
```

### IP Address Tracking Limitations

**Important:** Anonymous user tracking by IP address is a **rough approximation** with known limitations:

#### How IP Addressing Works

**Public IP (what the server sees):**
- Assigned by ISP to your router/modem
- **Shared by all devices** on the same network (home, office, coffee shop)
- This is what `req.ip` returns to the backend

**Private IP (local network only):**
- Assigned by router to each device (192.168.x.x, 10.x.x.x)
- Unique within your network but invisible to external servers
- Cannot be used for tracking

#### Real-World Scenarios

| Scenario | Behavior | Impact |
|----------|----------|--------|
| **Same household** | All devices share one public IP | Family members share 10 docs/month quota |
| **Office network** | All employees share one public IP | Entire office shares 10 docs/month quota |
| **Coffee shop WiFi** | All customers share one public IP | Everyone collectively gets 10 docs/month |
| **Mobile network** | IP can change between sessions | Same user might get different quotas |
| **VPN users** | Share VPN exit node IP with others | May share quota with strangers on same VPN |
| **Cellular data** | IP changes as you move between towers | Quota may reset unexpectedly |

#### Why This Is Acceptable

**For Free Tier:**
- ✅ **Privacy-friendly** - No cookies, fingerprinting, or persistent tracking
- ✅ **Simple implementation** - No consent banners or GDPR complexity
- ✅ **Conversion driver** - Limitations encourage signup for individual tracking
- ✅ **Reasonable for 10 docs/month** - Prevents abuse while allowing evaluation
- ⚠️ **Imperfect accuracy** - Trade-off for privacy and simplicity

**Better alternatives require:**
- Browser fingerprinting → Privacy concerns, easily defeated
- Mandatory accounts → Friction, reduces trial conversions
- Cookies/localStorage → Can be cleared, requires consent banners
- Device IDs → Privacy invasive, platform-specific

**Design Decision:** IP-based tracking is the right balance between privacy, simplicity, and abuse prevention for a generous free tier. Users who need reliable individual quotas can sign up for a free account (still 10 docs/month, but tracked individually).

**Migration on Signup:**
When an anonymous user creates an account, their IP-based usage **migrates to their user account** (see Step 3 above). This preserves their quota consumption and prevents double-counting.

---

## Reset Mechanism

### 🔄 Lazy/On-Demand Reset (Current Implementation)

**How Daily Reset Works:**

Every request calls `getUserUsage()` which checks:

```javascript
// server/src/models/Usage.js lines 113-123

const today = new Date();
today.setHours(0, 0, 0, 0); // Today at midnight UTC

const lastResetDate = new Date(usage.last_reset_date);
lastResetDate.setHours(0, 0, 0, 0); // Last reset at midnight

// Check if daily reset is needed
if (today.getTime() > lastResetDate.getTime()) {
  // It's a new day! Reset daily counter
  await this.resetDailyUsage(userIdentifier);
  return {
    dailyGenerations: 0,                      // ← Reset to 0
    monthlyGenerations: usage.monthly_count,  // ← Preserved
    resetDate: new Date(today.getTime() + 24 * 60 * 60 * 1000),
    periodStart: new Date(usage.period_start_date),
  };
}
```

**How Monthly Reset Works:**

Uses `period_start_date` (YYYY-MM-01) as part of the primary key:

```javascript
// server/src/models/Usage.js line 64

const periodStart = new Date(today.getFullYear(), today.getMonth(), 1);

// Query for current month's record:
SELECT * FROM user_quotas
WHERE user_id = 123
  AND period_start_date = '2025-11-01'  // New month!

// Old record had period_start_date = '2025-10-01' → NOT FOUND
// getUserUsage() returns { daily: 0, monthly: 0 }
// Next incrementUsage() creates NEW record for November
```

**Timeline Example:**

```
┌─────────────────────────────────────────────────────────────┐
│ October 28, 2025 11:59 PM                                   │
├─────────────────────────────────────────────────────────────┤
│ User makes request #3 (daily limit reached)                 │
│ → getUserUsage()                                             │
│   → daily_count=3, last_reset_date='2025-10-28'            │
│ → checkUsage() → "3/3 daily limit reached"                 │
│ → 429 Too Many Requests ❌                                   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ October 29, 2025 12:01 AM (2 minutes later)                │
├─────────────────────────────────────────────────────────────┤
│ User makes request again                                     │
│ → getUserUsage()                                             │
│   → Check: today(Oct 29) > lastReset(Oct 28)? YES!         │
│   → resetDailyUsage() → daily_count=0                       │
│   → last_reset_date='2025-10-29'                            │
│ → checkUsage() → "0/3 daily limit"                         │
│ → ALLOW ✅                                                   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ October 31, 2025 11:59 PM                                   │
├─────────────────────────────────────────────────────────────┤
│ User has used 10/10 monthly limit                           │
│ → user_quotas record:                                       │
│   period_start_date='2025-10-01'                            │
│   monthly_count=10                                          │
│ → checkUsage() → "10/10 monthly limit reached"             │
│ → 429 Too Many Requests ❌                                   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ November 1, 2025 12:01 AM (2 minutes later)                │
├─────────────────────────────────────────────────────────────┤
│ User makes request                                           │
│ → getUserUsage() looks for period_start_date='2025-11-01'  │
│ → NOT FOUND (old record was '2025-10-01')                  │
│ → Returns { daily: 0, monthly: 0 } ✅                       │
│ → checkUsage() → "0/10 monthly limit"                      │
│ → ALLOW ✅                                                   │
│ → incrementUsage() creates NEW record for November          │
└─────────────────────────────────────────────────────────────┘
```

### ⚖️ Lazy Reset vs Cron Jobs

#### ✅ Lazy Reset (Current Implementation)

**Pros:**
- ✅ No cron jobs needed (simpler deployment)
- ✅ No scheduled tasks to monitor
- ✅ Works on serverless (Vercel Functions)
- ✅ Zero maintenance overhead
- ✅ Self-healing (always accurate on next request)
- ✅ Scales efficiently (only resets active users)
- ✅ Lower database load (no bulk updates)

**Cons:**
- ⚠️ User's **first request** after midnight does the reset (~10-50ms latency)
- ⚠️ Inactive users keep old data in database until they return
- ⚠️ Can't send "Your quota has reset!" notifications at midnight

**Performance Impact:**
- Reset query: ~10-50ms (UPDATE + SELECT)
- Happens once per user per day (first request after midnight)
- For most users: negligible

**Industry Examples:**
- GitHub API rate limits: Reset on next request after window
- Stripe API: Lazy evaluation of subscription periods
- Many SaaS tools: On-demand quota resets

---

#### 🕐 Cron Job Alternative (Not Implemented)

**What it would look like:**

```javascript
import cron from 'node-cron';
import Usage from './models/Usage.js';

// Run at midnight UTC every day
cron.schedule('0 0 * * *', async () => {
  console.log('[Cron] Running daily reset...');

  // Get all active users
  const users = await sql`SELECT DISTINCT user_id FROM user_quotas`;

  // Reset each user's daily counter
  for (const { user_id } of users.rows) {
    await Usage.resetDailyUsage(user_id);
  }

  console.log(`[Cron] Reset daily usage for ${users.rows.length} users`);
});

// Run at midnight on 1st of month
cron.schedule('0 0 1 * *', async () => {
  console.log('[Cron] Running monthly reset...');

  const users = await sql`SELECT DISTINCT user_id FROM user_quotas`;

  for (const { user_id } of users.rows) {
    await Usage.resetMonthlyUsage(user_id);
  }

  console.log(`[Cron] Reset monthly usage for ${users.rows.length} users`);
});
```

**Pros:**
- ✅ All users reset at exact same time
- ✅ No latency on first request after midnight
- ✅ Can send "Quota reset!" emails/notifications
- ✅ Clean database (old data immediately updated)

**Cons:**
- ❌ Requires persistent process (doesn't work on Vercel serverless)
- ❌ Needs monitoring (what if cron fails?)
- ❌ Expensive: Reset ALL users every day (100K users = 100K DB queries)
- ❌ More complex deployment
- ❌ Need to handle timezone edge cases
- ❌ Single point of failure

**When to Add Cron Jobs:**
- ✅ If you want to send "quota reset" notifications
- ✅ If you need exact midnight resets for compliance
- ✅ If you move to a persistent server (not serverless)
- ✅ If you want to clean up stale data periodically
- ✅ If you need analytics on exactly when quotas reset

---

## Database Schema

### user_quotas Table (Authenticated Users)

```sql
CREATE TABLE user_quotas (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  daily_count INTEGER DEFAULT 0 NOT NULL,
  monthly_count INTEGER DEFAULT 0 NOT NULL,
  last_reset_date TIMESTAMP NOT NULL DEFAULT NOW(),
  period_start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_user_period UNIQUE (user_id, period_start_date),
  CONSTRAINT check_positive_daily_count CHECK (daily_count >= 0),
  CONSTRAINT check_positive_monthly_count CHECK (monthly_count >= 0)
);

-- Indexes
CREATE INDEX idx_user_quotas_user_period ON user_quotas(user_id, period_start_date);
CREATE INDEX idx_user_quotas_last_reset ON user_quotas(last_reset_date);
```

**Key Design Decisions:**
- `period_start_date` is always the 1st of the month (YYYY-MM-01)
- `unique_user_period` ensures one record per user per month
- Old month's records are preserved for analytics (not deleted)
- `ON DELETE CASCADE` cleans up when user is deleted

### anonymous_quotas Table (Anonymous Users)

```sql
CREATE TABLE anonymous_quotas (
  id SERIAL PRIMARY KEY,
  ip_address VARCHAR(45) NOT NULL,  -- Supports IPv4 and IPv6
  daily_count INTEGER DEFAULT 0 NOT NULL,
  monthly_count INTEGER DEFAULT 0 NOT NULL,
  last_reset_date TIMESTAMP NOT NULL DEFAULT NOW(),
  period_start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_ip_period UNIQUE (ip_address, period_start_date),
  CONSTRAINT check_positive_daily_count CHECK (daily_count >= 0),
  CONSTRAINT check_positive_monthly_count CHECK (monthly_count >= 0)
);

-- Indexes
CREATE INDEX idx_anonymous_quotas_ip_period ON anonymous_quotas(ip_address, period_start_date);
CREATE INDEX idx_anonymous_quotas_last_reset ON anonymous_quotas(last_reset_date);
CREATE INDEX idx_anonymous_quotas_period_start ON anonymous_quotas(period_start_date);
```

**Key Design Decisions:**
- `VARCHAR(45)` supports both IPv4 (15 chars) and IPv6 (39 chars)
- Records are deleted after migration to user_quotas
- Can be cleaned up periodically (e.g., delete records > 90 days old)

---

## Code Architecture

### Files Structure

```
server/src/
├── models/
│   └── Usage.js                    # Usage tracking model
├── middleware/
│   └── tierGate.js                 # Quota enforcement middleware
└── routes/
    ├── auth.js                     # Auth routes (signup, login, OAuth)
    └── api.js                      # Generation routes
```

### Usage Model Methods

**Location:** `server/src/models/Usage.js`

```javascript
class Usage {
  // Core Methods
  static async getUserUsage(userIdentifier)      // Get current usage (with lazy reset)
  static async incrementUsage(userIdentifier, count = 1) // Increment counters
  static async resetDailyUsage(userIdentifier)   // Reset daily counter
  static async resetMonthlyUsage(userIdentifier) // Reset monthly counter

  // Analytics Methods
  static async getUsageHistory(userId, startDate, endDate) // Historical data
  static async getSystemUsageStats()             // System-wide metrics

  // Admin Methods
  static async deleteUserUsage(userId)           // Cleanup when user deleted
  static async migrateAnonymousUsage(ipAddress, userId) // Migrate IP → User
}
```

**Usage Example:**

```javascript
// Get current usage (triggers lazy reset if needed)
const usage = await Usage.getUserUsage(123);
// Returns: { dailyGenerations: 5, monthlyGenerations: 25, resetDate, periodStart }

// Increment after successful generation
await Usage.incrementUsage(123);

// Migrate anonymous usage on signup
await Usage.migrateAnonymousUsage('192.168.1.100', 123);
```

### Middleware Integration

**Location:** `server/src/middleware/tierGate.js`

```javascript
// Check usage BEFORE generation (enforces limits)
export const checkUsage = () => {
  return async (req, res, next) => {
    const userIdentifier = req.user?.id || `ip:${req.ip}`;
    const usage = await Usage.getUserUsage(userIdentifier);
    const tierConfig = getTierFeatures(req.user?.tier || 'free');

    const result = checkUsageLimits(usage, tierConfig);

    if (!result.allowed) {
      return res.status(429).json({
        error: 'Usage Limit Exceeded',
        message: result.reason,
        usage: usage,
        limits: tierConfig.limits,
        upgradeUrl: result.upgradeUrl
      });
    }

    next();
  };
};

// Helper function (called manually after generation)
export async function incrementUsage(userIdentifier, count = 1) {
  return await Usage.incrementUsage(userIdentifier, count);
}
```

**Route Integration:**

```javascript
// server/src/routes/api.js

import { checkUsage, incrementUsage } from '../middleware/tierGate.js';

// Enforce limits BEFORE generation
router.post('/generate', apiLimiter, generationLimiter, checkUsage(), async (req, res) => {
  // Generate documentation
  const result = await docGenerator.generateDocumentation(code, options);

  // Track usage AFTER successful generation
  const userIdentifier = req.user?.id || `ip:${req.ip}`;
  await incrementUsage(userIdentifier);

  res.json(result);
});
```

**Auth Integration:**

```javascript
// server/src/routes/auth.js

import Usage from '../models/Usage.js';

// Migrate anonymous usage on signup
router.post('/signup', async (req, res) => {
  const user = await User.create({ email, password });

  // Migrate any anonymous usage from this IP
  const ipAddress = req.ip || req.socket.remoteAddress;
  await Usage.migrateAnonymousUsage(ipAddress, user.id);

  res.json({ success: true, user, token });
});

// Also runs on login and GitHub OAuth callback
```

---

## User Journeys

### Scenario 1: Free Tier User Hits Daily Limit

```
Day 1:
  9:00 AM: Generate doc #1 → daily=1, monthly=1 ✅
  10:00 AM: Generate doc #2 → daily=2, monthly=2 ✅
  11:00 AM: Generate doc #3 → daily=3, monthly=3 ✅
  12:00 PM: Generate doc #4 → 429 "Daily limit reached (3/day)" ❌

Day 2:
  9:00 AM: Generate doc → daily=0→1, monthly=4 ✅ (daily reset!)
  10:00 AM: Generate doc → daily=2, monthly=5 ✅
  11:00 AM: Generate doc → daily=3, monthly=6 ✅
  12:00 PM: Generate doc → 429 "Daily limit reached" ❌
```

### Scenario 2: Free Tier User Hits Monthly Limit

```
Throughout October:
  - Generates 10 docs total (monthly limit)

October 31:
  - Generate doc → 429 "Monthly limit reached (10/month)" ❌

November 1:
  - Generate doc → monthly=0→1 ✅ (monthly reset!)
  - New period_start_date='2025-11-01'
```

### Scenario 3: Anonymous User Signs Up

```
Before Signup:
  - IP: 192.168.1.100
  - anonymous_quotas: daily=3, monthly=5

Sign Up:
  - POST /api/auth/signup
  - migrateAnonymousUsage('192.168.1.100', 123)
  - user_quotas: user_id=123, daily=3, monthly=5
  - anonymous_quotas record deleted

After Signup:
  - Tracked by user_id=123
  - Inherits 5 generations (5/10 monthly used)
  - Can make 5 more before hitting limit
```

### Scenario 4: User Upgrades to Pro Mid-Month

```
October 1-15 (Free Tier):
  - Generates 10 docs (monthly limit reached)
  - 429 on 11th request

October 16 (Upgrades to Pro):
  - Stripe webhook → user.tier='pro'
  - Same user_quotas record (daily=X, monthly=10)
  - Pro limit: 200/month

October 16 onward:
  - Can now generate 190 more docs (200-10=190 remaining)
  - No reset needed, just higher limit
```

---

## API Reference

### GET /api/user/usage - Get Current Usage

**Purpose:** Retrieve current usage statistics for authenticated or anonymous users

**Authentication:** Optional (supports both authenticated and anonymous users)

**Headers:**
```javascript
Authorization: Bearer <token>  // Optional - omit for anonymous users
```

**Response (200 OK):**
```json
{
  "tier": "free",
  "daily": {
    "used": 2,
    "limit": 3,
    "remaining": 1
  },
  "monthly": {
    "used": 8,
    "limit": 10,
    "remaining": 2
  },
  "resetTimes": {
    "daily": "2025-10-29T00:00:00.000Z",
    "monthly": "2025-11-01T00:00:00.000Z"
  }
}
```

**Implementation Details:**
- **Authenticated users:** Uses `req.user.id` from JWT token
- **Anonymous users:** Uses `ip:${req.ip}` (see [IP Address Tracking Limitations](#ip-address-tracking-limitations))
- Always returns 'free' tier for anonymous users
- Queries `user_quotas` table for authenticated users
- Queries `anonymous_quotas` table for anonymous users

**Example Usage:**
```javascript
// Frontend: Fetch usage (works with or without auth)
const headers = {};
if (token) {
  headers['Authorization'] = `Bearer ${token}`;
}

const response = await fetch('/api/user/usage', {
  method: 'GET',
  headers,
});

const data = await response.json();
console.log(`Used ${data.monthly.used} of ${data.monthly.limit} docs this month`);
```

### checkUsage() Middleware

**Purpose:** Enforce quota limits BEFORE generation

**Usage:**
```javascript
router.post('/generate', checkUsage(), async (req, res) => { ... });
```

**Behavior:**
- Gets user identifier (user.id or `ip:xxx`)
- Calls `Usage.getUserUsage()` (lazy reset happens here)
- Checks usage against tier limits
- If over limit: Returns 429 with upgrade info
- If under limit: Calls `next()`

**Response (429 Over Quota):**
```json
{
  "error": "Usage Limit Exceeded",
  "message": "You've reached your monthly limit of 10 generations. Upgrade to continue.",
  "usage": {
    "dailyGenerations": 3,
    "monthlyGenerations": 10,
    "resetDate": "2025-11-01T00:00:00.000Z",
    "periodStart": "2025-10-01T00:00:00.000Z"
  },
  "limits": {
    "daily": 3,
    "monthly": 10
  },
  "upgradeUrl": "/upgrade?from=free&to=starter"
}
```

### incrementUsage() Function

**Purpose:** Track usage AFTER successful generation

**Usage:**
```javascript
const userIdentifier = req.user?.id || `ip:${req.ip}`;
await incrementUsage(userIdentifier);
```

**Behavior:**
- Increments `daily_count++` and `monthly_count++`
- Uses atomic UPDATE (no race conditions)
- Creates new record if none exists (UPSERT)
- Graceful error handling (doesn't fail request)

### Usage.migrateAnonymousUsage()

**Purpose:** Migrate IP-based usage to user account

**Usage:**
```javascript
const ipAddress = req.ip;
await Usage.migrateAnonymousUsage(ipAddress, user.id);
```

**Behavior:**
1. Get anonymous_quotas for IP + current period
2. If found: UPSERT into user_quotas (merge counts)
3. DELETE anonymous_quotas record
4. Return migration result

**Response:**
```javascript
{
  migrated: true,
  message: 'Anonymous usage migrated successfully',
  usage: {
    dailyGenerations: 5,
    monthlyGenerations: 8,
    resetDate: Date,
    periodStart: Date
  }
}
```

---

## Testing

### Unit Tests (28 tests)

**Location:** `server/src/models/__tests__/Usage.test.js`

**Coverage:**
- ✅ getUserUsage() - all scenarios (anonymous, authenticated, no record, daily reset)
- ✅ incrementUsage() - create, update, custom count
- ✅ resetDailyUsage() - preserves monthly count
- ✅ resetMonthlyUsage() - creates new period
- ✅ migrateAnonymousUsage() - migration with merge
- ✅ Edge cases - IPv6, negative counts, database errors

**Run Tests:**
```bash
cd server
npm test Usage.test.js
```

### Integration Tests (Needed)

**TODO: Add integration tests for:**
- [ ] Anonymous user → authenticated user flow
- [ ] Quota enforcement (block 11th request for free tier)
- [ ] Lazy daily reset (first request after midnight)
- [ ] Lazy monthly reset (first request of new month)
- [ ] Concurrent requests (race conditions)

---

## Monitoring

### Manual Reset (Administrative)

**When to use:** After clearing production sessions or for fresh baseline tracking

```sql
-- Reset all usage counts to zero for authenticated users
UPDATE user_quotas
SET daily_count = 0,
    monthly_count = 0,
    last_reset_date = NOW(),
    period_start_date = CURRENT_DATE,
    updated_at = NOW();

-- Reset anonymous quotas
UPDATE anonymous_quotas
SET daily_count = 0,
    monthly_count = 0,
    last_reset_date = NOW(),
    period_start_date = CURRENT_DATE,
    updated_at = NOW();

-- Verify reset
SELECT
    COUNT(*) as total_users,
    SUM(daily_count) as total_daily,
    SUM(monthly_count) as total_monthly
FROM user_quotas;
-- Should return: all zeros

SELECT
    COUNT(*) as total_anonymous,
    SUM(daily_count) as total_daily,
    SUM(monthly_count) as total_monthly
FROM anonymous_quotas;
-- Should return: all zeros
```

**What gets reset:**
- ✅ Daily generation counts → 0
- ✅ Monthly generation counts → 0
- ✅ Reset timestamps → NOW() (establishes new baseline)

**What stays intact:**
- ✅ User accounts and profiles
- ✅ Subscription tiers
- ✅ Quota limits (daily_limit, monthly_limit)
- ✅ All other user data

**Use cases:**
- Clean baseline after session cleanup
- Fresh start for improved codebase
- Debugging usage tracking issues
- Zero active users during maintenance window

---

### Key Metrics to Track

**Usage Statistics:**
```sql
-- System-wide usage
SELECT
  COUNT(DISTINCT user_id) as active_users,
  SUM(daily_count) as total_daily_gens,
  SUM(monthly_count) as total_monthly_gens,
  AVG(monthly_count) as avg_per_user
FROM user_quotas
WHERE period_start_date = DATE_TRUNC('month', CURRENT_DATE);
```

**Quota Enforcement:**
```sql
-- Users hitting limits
SELECT
  COUNT(*) as users_at_limit,
  tier
FROM users u
JOIN user_quotas uq ON u.id = uq.user_id
WHERE period_start_date = DATE_TRUNC('month', CURRENT_DATE)
  AND (
    (tier = 'free' AND monthly_count >= 10) OR
    (tier = 'starter' AND monthly_count >= 50) OR
    (tier = 'pro' AND monthly_count >= 200)
  )
GROUP BY tier;
```

**Migration Success Rate:**
```sql
-- Anonymous users who signed up
SELECT
  COUNT(*) as anonymous_users,
  COUNT(CASE WHEN migrated_to_user_id IS NOT NULL THEN 1 END) as migrated
FROM anonymous_quotas
WHERE created_at > NOW() - INTERVAL '30 days';
```

### Logging

**Current Log Points:**

```javascript
// Auth migration
console.log(`[Auth] Migrated anonymous usage for IP ${ip} to user ${userId}`);

// Usage tracking
console.log(`[Usage] Incremented usage for user ${userId}`);
console.log(`[Usage] Incremented usage for IP ${ip} (stream)`);

// Errors
console.error('[Auth] Failed to migrate anonymous usage:', error);
console.error('[Usage] Failed to increment usage:', error);
```

**Recommended:** Add structured logging with timestamps and request IDs:

```javascript
// Example with winston or pino
logger.info('usage.migrated', {
  ipAddress: '192.168.1.100',
  userId: 123,
  usage: { daily: 5, monthly: 8 },
  timestamp: new Date().toISOString()
});
```

---

## Troubleshooting

### Issue: User can't generate after midnight

**Symptom:** User hit daily limit yesterday, still blocked today

**Diagnosis:**
```sql
-- Check user's last reset date
SELECT
  user_id,
  daily_count,
  last_reset_date,
  NOW() as current_time
FROM user_quotas
WHERE user_id = 123
  AND period_start_date = DATE_TRUNC('month', CURRENT_DATE);
```

**Cause:** Lazy reset hasn't triggered yet (user hasn't made a request today)

**Solution:** User needs to make a request, which will trigger automatic reset

### Issue: Anonymous usage not migrating

**Symptom:** User signs up but starts with 0 usage instead of migrated usage

**Diagnosis:**
```javascript
// Check if anonymous record exists
const anon = await sql`
  SELECT * FROM anonymous_quotas
  WHERE ip_address = '192.168.1.100'
    AND period_start_date = CURRENT_DATE
`;
console.log('Anonymous record:', anon.rows);
```

**Common Causes:**
- IP address format mismatch (`192.168.1.100` vs `ip:192.168.1.100`)
- Different period_start_date (old month vs new month)
- User accessed site from different IP

**Solution:** Ensure IP address extraction is consistent:
```javascript
const ipAddress = req.ip || req.socket?.remoteAddress || 'unknown';
```

### Issue: Database query slow

**Symptom:** `getUserUsage()` takes > 100ms

**Diagnosis:**
```sql
-- Check if indexes exist
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'user_quotas';

-- Explain query plan
EXPLAIN ANALYZE
SELECT * FROM user_quotas
WHERE user_id = 123
  AND period_start_date = '2025-10-01';
```

**Solution:** Ensure indexes are created:
```sql
CREATE INDEX IF NOT EXISTS idx_user_quotas_user_period
  ON user_quotas(user_id, period_start_date);
```

---

## Future Enhancements

### Potential Improvements

**1. Usage Analytics Dashboard**
- Show usage trends over time
- Compare against tier limits
- Predict when user will hit limit

**2. Proactive Upgrade Prompts**
- Email when 80% of quota used
- Toast notification in UI
- Suggest optimal tier based on usage

**3. Cron-Based Resets (if needed)**
- Exact midnight resets
- "Quota reset!" email notifications
- Cleanup of old anonymous_quotas records

**4. Usage Alerts**
- Slack/email when system-wide usage spikes
- Alert if reset queries are slow
- Monitor 429 response rates

**5. Rollover Unused Quota**
- Allow Pro users to carry over unused quota
- "Rollover up to 50 generations to next month"
- More flexible than strict monthly caps

---

## Related Documentation

- [Database Naming Standards](DB-NAMING-STANDARDS.md)
- [Database Migration Management](DB-MIGRATION-MANAGEMENT.MD)
- [Tier Configuration](../../server/src/config/tiers.js)
- [Tier Feature Matrix](../planning/TIER-FEATURE-MATRIX.md)

---

**Document Version:** 1.0
**Last Updated:** October 28, 2025
**Author:** CodeScribe AI Development Team
