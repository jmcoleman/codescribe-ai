# Analytics Production Debugging Guide

## Issue: No Events Appearing in Production Raw Events Table

**Symptoms:**
- Analytics events work in development
- After deployment, no events appear in `analytics_events` table
- Admin analytics dashboard shows no data

**Root Causes:**
1. Missing `VITE_ANALYTICS_API_KEY` environment variable (frontend events)
2. Server-side analytics failures (database/SQL errors)
3. Wrong database being queried (dev vs production)

---

## Quick Fix Checklist

### 1. Verify Environment Variables in Vercel

**Go to:** Vercel Dashboard → Your Project → Settings → Environment Variables

**Required Variables:**

#### Server (Production Environment)
```bash
# Must exist with a secure random value (32+ chars)
ANALYTICS_API_KEY=your-generated-secret-here

# Generate with: openssl rand -base64 32
```

#### Client (Production Environment)
```bash
# Must MATCH server ANALYTICS_API_KEY exactly
VITE_ANALYTICS_API_KEY=your-generated-secret-here
```

**⚠️ After adding/updating environment variables:**
- Click "Redeploy" in Vercel Dashboard → Deployments → Latest Deployment → ⋯ Menu → Redeploy
- **Important:** Simply git pushing won't pick up new env vars - you must explicitly redeploy!

---

### 2. Check Vercel Production Logs

**Go to:** Vercel Dashboard → Your Project → Deployments → Latest Production → Runtime Logs

**Search for these error patterns:**

```bash
# Server-side analytics errors
[DEBUG] doc_generation analytics error:
[DEBUG] quality_score analytics error:

# Database errors
error: relation "analytics_events" does not exist
error: column "event_data" of relation "analytics_events" does not exist
permission denied for table analytics_events

# Frontend analytics errors (check browser console)
Analytics] Backend tracking failed: 401
[Analytics] Backend tracking failed: 500
```

**Common Errors & Fixes:**

| Error Message | Cause | Fix |
|--------------|-------|-----|
| `401 Unauthorized` on `/api/analytics/track` | Missing or mismatched `VITE_ANALYTICS_API_KEY` | Add/update client env var to match server |
| `relation "analytics_events" does not exist` | Migration not run on production DB | Run `npm run migrate` in production |
| `Invalid event name: xyz` | Code is tracking an event not in `ALLOWED_EVENTS` | Fix event name in code or add to service |
| `column "event_data" of relation "analytics_events" does not exist` | Schema mismatch | Verify migration 046 ran successfully |

---

### 3. Test Analytics Flow

**Open browser DevTools (F12) → Network tab, then:**

1. **Visit production site** → Should trigger:
   ```
   POST /api/analytics/track
   Payload: { eventName: "session_start", ... }
   ```
   - ✅ **Status 200:** Event recorded successfully
   - ❌ **Status 401:** API key missing/wrong
   - ❌ **Status 500:** Server error (check Vercel logs)

2. **Paste code** → Should trigger:
   ```
   POST /api/analytics/track
   Payload: { eventName: "code_input", ... }
   ```

3. **Generate documentation** → Should trigger:
   ```
   POST /api/generate OR /api/generate-stream
   Response headers: (no analytics headers, server-side only)
   ```
   - Server logs `doc_generation` and `quality_score` events internally
   - No frontend API call for these events (they're server-side)

4. **Copy documentation** → Should trigger:
   ```
   POST /api/analytics/track
   Payload: { eventName: "doc_export", action: "copy", ... }
   ```

---

### 4. Verify Database Connection

**Check which database is being used:**

1. **In Vercel Dashboard:**
   - Settings → Environment Variables → Production
   - Find `POSTGRES_URL` or `DATABASE_URL`
   - Note the hostname (should be your production Neon endpoint)

2. **Connect to production database:**
   ```bash
   # From your local machine (requires psql installed)
   psql "<your-production-POSTGRES_URL>"

   # Check if table exists
   \dt analytics_events

   # Check recent events
   SELECT event_name, created_at, event_data
   FROM analytics_events
   ORDER BY created_at DESC
   LIMIT 10;

   # Check total event count
   SELECT COUNT(*) FROM analytics_events;
   ```

3. **If table doesn't exist:**
   ```bash
   # Run migrations on production
   cd server
   POSTGRES_URL="<your-production-url>" npm run migrate
   ```

---

### 5. Test Server-Side Analytics Directly

**Server-side events (doc_generation, quality_score) bypass frontend entirely.**

**Test endpoint:**
```bash
# Get your production token (login to production, then in browser console:)
localStorage.getItem('codescribe_auth_token')

# Test doc generation (replace TOKEN and adjust URL)
curl -X POST https://codescribeai.com/api/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-Session-Id: test-session-123" \
  -d '{
    "code": "function hello() { return \"world\"; }",
    "language": "javascript",
    "docType": "README"
  }'
```

**Check production logs immediately after** for:
- ✅ No `[DEBUG] doc_generation analytics error:` → Success
- ❌ Error logged → Check database connection/schema

---

### 6. Verify Event Categories

**All tracked events must be in the whitelist:**

```javascript
// server/src/services/analyticsService.js
const EVENT_CATEGORIES = {
  // Workflow events
  session_start: 'workflow',
  code_input: 'workflow',
  generation_started: 'workflow',
  generation_completed: 'workflow',
  first_generation: 'workflow',
  doc_export: 'workflow',

  // Business events
  login: 'business',
  signup: 'business',
  // ... etc

  // Usage events
  doc_generation: 'usage',
  quality_score: 'usage',
  batch_generation: 'usage',
  // ... etc
};
```

If you're tracking a new event, add it to this map first.

---

## Complete Fix Steps (Step-by-Step)

### Step 1: Add Missing Environment Variable

1. **Generate API key** (if server doesn't have one yet):
   ```bash
   openssl rand -base64 32
   ```

2. **Add to Vercel:**
   - Go to Vercel Dashboard → Settings → Environment Variables
   - **If `ANALYTICS_API_KEY` doesn't exist:**
     - Add `ANALYTICS_API_KEY` = `<your-generated-key>`
     - Environment: Production
   - Add `VITE_ANALYTICS_API_KEY` = `<same-key-as-above>`
     - Environment: Production

3. **Redeploy:**
   - Deployments → Latest → ⋯ → Redeploy (WITH new env vars)

### Step 2: Verify Database Schema

```bash
# Check if migration ran
cd server
POSTGRES_URL="<production-url>" npm run migrate:status

# If migration 046 is missing, run it
POSTGRES_URL="<production-url>" npm run migrate
```

### Step 3: Test End-to-End

1. Visit production site
2. Open DevTools → Console + Network tabs
3. Paste code → Check for `POST /api/analytics/track` with status 200
4. Generate doc → Check Vercel logs for no errors
5. Go to Admin Analytics Dashboard → Verify events appear

---

## Understanding Event Flow

### Frontend Events (require VITE_ANALYTICS_API_KEY)
```
Browser → POST /api/analytics/track (with X-Analytics-Key header)
       → requireAnalyticsKey middleware checks key
       → analyticsService.recordEvent()
       → INSERT INTO analytics_events
```

**Events:** `session_start`, `code_input`, `doc_export`, `login`, `signup`, `performance`, etc.

### Server-Side Events (no API key needed)
```
Client → POST /api/generate
      → docGenerator.js generates doc
      → analyticsService.recordEvent() called directly in api.js
      → INSERT INTO analytics_events
```

**Events:** `doc_generation`, `quality_score`

---

## Still Not Working?

### Check for Silent Failures

Server-side events use `.catch()` to prevent breaking the main flow:

```javascript
analyticsService.recordEvent('doc_generation', {...}).catch((error) => {
  console.error('[DEBUG] doc_generation analytics error:', error);
});
```

**These errors ONLY appear in Vercel logs**, not client console.

### Enable Detailed Logging (Temporary)

Add to `server/src/services/analyticsService.js` (line 107):

```javascript
async recordEvent(eventName, eventData = {}, context = {}) {
  console.log('[Analytics] Recording event:', eventName, { eventData, context }); // ADD THIS

  if (!ALLOWED_EVENTS.has(eventName)) {
    throw new Error(`Invalid event name: ${eventName}`);
  }
  // ... rest of function
```

Redeploy, test, check Vercel logs for the debug output.

### Check Database Permissions

```sql
-- Connect to production DB and verify permissions
\dp analytics_events

-- Should show: your_user=arwdDxt/your_user
-- If "permission denied", contact Neon support or check role grants
```

---

## Prevention (Add to Deployment Checklist)

Update `docs/deployment/DEPLOYMENT-CHECKLIST.md`:

```markdown
### Analytics Configuration
- [ ] Server `ANALYTICS_API_KEY` set in Vercel (generate with `openssl rand -base64 32`)
- [ ] Client `VITE_ANALYTICS_API_KEY` matches server key
- [ ] Migration 046 (analytics_events table) ran on production DB
- [ ] Test analytics by visiting site + checking admin dashboard
- [ ] Verify Vercel logs show no `[DEBUG] analytics error:` messages
```

---

## Quick Reference

| Component | File Path | What It Does |
|-----------|-----------|--------------|
| Frontend tracking | `client/src/utils/analytics.js` | Sends events to `/api/analytics/track` |
| Analytics API | `server/src/routes/analytics.js` | Receives frontend events, validates API key |
| Analytics service | `server/src/services/analyticsService.js` | Records events to database |
| Server-side tracking | `server/src/routes/api.js` | Tracks `doc_generation`/`quality_score` |
| Database schema | `server/src/db/migrations/046-create-analytics-events-table.sql` | Creates table |
| Event whitelist | `server/src/services/analyticsService.js` lines 11-40 | `EVENT_CATEGORIES` map |

---

**Last Updated:** January 29, 2026
**Related Docs:**
- [WORKFLOW-OUTCOME-METRICS-PLAN.md](../planning/WORKFLOW-OUTCOME-METRICS-PLAN.md) - Analytics architecture
- [DEPLOYMENT-CHECKLIST.md](../deployment/DEPLOYMENT-CHECKLIST.md) - General deployment steps
- [VERCEL-DEPLOYMENT-GUIDE.md](../deployment/VERCEL-DEPLOYMENT-GUIDE.md) - Environment variables
