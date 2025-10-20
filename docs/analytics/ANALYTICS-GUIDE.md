# Analytics Implementation Guide

**Version:** 1.0
**Last Updated:** October 19, 2025
**Status:** Implementation Ready

---

## Table of Contents

1. [Overview](#overview)
2. [Device & Browser Tracking](#device--browser-tracking)
3. [Analytics Stack](#analytics-stack)
4. [Key Metrics](#key-metrics)
5. [Dashboard Access](#dashboard-access)
6. [Custom Events](#custom-events)
7. [Privacy & Compliance](#privacy--compliance)
8. [Implementation Steps](#implementation-steps)

---

## Overview

CodeScribe AI uses a **privacy-first, multi-layered analytics approach** combining:

- ✅ **Vercel Analytics** - Web Vitals, performance monitoring
- ✅ **Plausible Analytics** - Privacy-friendly, cookieless user behavior tracking
- ✅ **Custom Backend Logging** - API usage, generation metrics

**Key Principles:**
- No personal data collection (no emails, names, IPs stored)
- GDPR/CCPA compliant out of the box
- No cookies required (cookieless tracking)
- Opt-out available for users
- All data aggregated for privacy

---

## Device & Browser Tracking

### What We Track (Automatic)

Both Vercel Analytics and Plausible **automatically track** these dimensions:

#### 📱 **Device Type**
- **Desktop** - Screen width ≥1024px
- **Tablet** - Screen width 768-1023px
- **Mobile** - Screen width <768px

#### 🌐 **Browser**
- Chrome (and Chromium-based browsers)
- Safari
- Firefox
- Edge
- Opera
- Other

#### 💻 **Operating System**
- Windows
- macOS
- Linux
- iOS
- Android

#### 📐 **Screen Size Buckets**
- `xs` - <640px (mobile)
- `sm` - 640-767px (large mobile)
- `md` - 768-1023px (tablet)
- `lg` - 1024-1279px (small desktop)
- `xl` - ≥1280px (large desktop)

#### 🌍 **Geographic Data**
- Country
- Region
- City (aggregated for privacy)

---

## Analytics Stack

### 1. Vercel Analytics (Performance & Traffic)

**What it tracks:**
- Page views
- Unique visitors
- Traffic sources (referrers)
- Device/browser/OS breakdown
- Web Vitals (LCP, FID, CLS, TTFB)
- Geographic distribution

**Dashboard Access:**
```
https://vercel.com/your-username/codescribe-ai/analytics
```

**Cost:** Free on Pro plan ($20/month) or $10/month standalone

**Setup:**
```bash
# Install packages
npm install @vercel/analytics @vercel/speed-insights

# Enable in Vercel Dashboard
# Project → Analytics → Enable
```

**Code integration:**
```javascript
// client/src/main.jsx
import { inject } from '@vercel/analytics';
import { injectSpeedInsights } from '@vercel/speed-insights';

inject(); // Vercel Analytics
injectSpeedInsights(); // Speed Insights
```

---

### 2. Plausible Analytics (User Behavior)

**What it tracks:**
- Page views
- Custom events (doc generation, file uploads, modal interactions)
- Device/browser/OS breakdown
- Traffic sources
- Goal conversions
- Real-time visitors

**Dashboard Access:**
```
https://plausible.io/codescribeai.com
```

**Cost:** $9/month for up to 10K visitors

**Key Features:**
- ✅ **Cookieless** - No cookie banners needed
- ✅ **GDPR/CCPA compliant** - Privacy-first by design
- ✅ **Lightweight** - <1KB script vs Google Analytics' 45KB+
- ✅ **Open source** - Can self-host if desired
- ✅ **Custom events** - Track specific user actions

**Setup:**
```html
<!-- client/index.html -->
<head>
  <script defer data-domain="codescribeai.com" src="https://plausible.io/js/script.js"></script>
</head>
```

---

### 3. Custom Backend Logging (API Metrics)

**What it tracks:**
- API request counts
- Response times
- Error rates
- Rate limit hits
- Claude API usage
- Documentation generation metrics

**Data Storage:**
- JSON Lines format (`.jsonl`)
- Local file system (`logs/analytics.jsonl`)
- Rotate logs weekly/monthly
- Gitignored for privacy

**Access:**
```bash
# View recent analytics
tail -f logs/analytics.jsonl

# Count events by type
cat logs/analytics.jsonl | jq '.type' | sort | uniq -c

# Get generation success rate
cat logs/analytics.jsonl | jq 'select(.type=="doc_generation") | .success' | sort | uniq -c
```

---

## Key Metrics

### Product Metrics

#### 1. **Documentation Generations**
- Total generations per day/week/month
- Doc type breakdown (README: 45%, JSDoc: 30%, API: 20%, ARCHITECTURE: 5%)
- Average generation time (target: <3s)
- Success vs error rate (target: >95%)

**Plausible Event:** `doc_generated`
**Properties:**
- `docType`: README, JSDoc, API, ARCHITECTURE
- `language`: javascript, typescript, python, etc.
- `linesOfCode`: Rounded to nearest 100 (e.g., 100, 200, 300)
- `success`: true/false
- `device`: mobile, tablet, desktop
- `browser`: chrome, safari, firefox, edge

**Dashboard View:**
```
Goal: Documentation Generated
Event: doc_generated

Breakdown by property:
- docType: README (450), JSDoc (300), API (200), ARCHITECTURE (50)
- device: desktop (700), mobile (250), tablet (50)
- browser: chrome (500), safari (300), firefox (150), edge (50)
- success: true (950), false (50) → 95% success rate ✅
```

#### 2. **Quality Scores**
- Average quality score (target: 75+)
- Grade distribution (A: 20%, B: 40%, C: 30%, D: 8%, F: 2%)
- Quality by doc type
- Quality by code size

**Plausible Event:** `quality_scored`
**Properties:**
- `scoreRange`: "80-89", "70-79", etc.
- `grade`: A, B, C, D, F
- `docType`: README, JSDoc, API, ARCHITECTURE

#### 3. **File Uploads**
- Upload success rate (target: >90%)
- File types uploaded (js, ts, py, etc.)
- File size distribution (<50KB: 70%, 50-200KB: 25%, >200KB: 5%)
- Device breakdown (mobile vs desktop uploads)

**Plausible Event:** `file_uploaded`
**Properties:**
- `extension`: js, ts, py, java, cpp, etc.
- `sizeRange`: <50KB, 50-200KB, >200KB
- `success`: true/false
- `device`: mobile, tablet, desktop

**Insight:**
```
Mobile users upload files 40% less than desktop users
→ Consider adding a "paste example" prompt for mobile
```

#### 4. **User Engagement**
- Modal interactions (Examples: 200/day, Help: 50/day, Quality: 100/day)
- Feature usage (Copy button: 800/day, File upload: 300/day)
- Time on page (avg: 3m 45s)
- Bounce rate (target: <40%)

**Plausible Event:** `modal_interaction`
**Properties:**
- `modalType`: examples, help, quality_breakdown, confirmation
- `action`: opened, closed, example_loaded, confirmed, cancelled

#### 5. **Error Tracking**
- Error rate by type (rate_limit: 5%, api_error: 2%, upload_error: 1%)
- Error rate by device (mobile errors 2x desktop)
- Error rate by browser (Safari errors 1.5x Chrome)

**Plausible Event:** `error_occurred`
**Properties:**
- `errorType`: rate_limit, api_error, upload_error, network_error
- `endpoint`: /api/generate-stream, /api/upload
- `device`: mobile, tablet, desktop
- `browser`: chrome, safari, firefox, edge

---

### Technical Metrics

#### 6. **Web Vitals** (Vercel Speed Insights)
- **LCP (Largest Contentful Paint):** Target <2.5s
- **FID (First Input Delay):** Target <100ms
- **CLS (Cumulative Layout Shift):** Target <0.1
- **TTFB (Time to First Byte):** Target <600ms

**Access:** Vercel Dashboard → Analytics → Speed Insights

#### 7. **API Performance**
- Average response time (target: <2s)
- P50, P90, P99 latency
- Rate limit hits per day
- Claude API token usage

**Custom Backend Logs:**
```json
{
  "type": "api_request",
  "endpoint": "/api/generate-stream",
  "method": "POST",
  "statusCode": 200,
  "responseTime": 2450,
  "timestamp": "2025-10-19T14:32:10.123Z"
}
```

---

## Dashboard Access

### Vercel Analytics Dashboard

**URL:** `https://vercel.com/your-username/codescribe-ai/analytics`

**What you'll see:**

```
┌─────────────────────────────────────────┐
│         VERCEL ANALYTICS                │
├─────────────────────────────────────────┤
│ Visitors (30 days)                      │
│ ▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░ 1,234 visitors    │
│                                         │
│ Top Pages                               │
│ /                    850 (69%)          │
│                                         │
│ Devices                                 │
│ Desktop   65% (800)                     │
│ Mobile    30% (370)                     │
│ Tablet     5% (64)                      │
│                                         │
│ Browsers                                │
│ Chrome    45% (555)                     │
│ Safari    30% (370)                     │
│ Firefox   15% (185)                     │
│ Edge      10% (124)                     │
│                                         │
│ Countries                               │
│ United States  40% (494)                │
│ United Kingdom 15% (185)                │
│ Canada         10% (123)                │
│ Germany         8% (99)                 │
│ France          5% (62)                 │
│ Other          22% (271)                │
└─────────────────────────────────────────┘
```

**Key Insights:**
- **Mobile traffic is 30%** → Ensure mobile UX is optimized
- **Chrome dominates at 45%** → Test primarily in Chrome, but validate Safari/Firefox
- **US is 40% of traffic** → Consider time zone for feature releases

---

### Plausible Dashboard

**URL:** `https://plausible.io/codescribeai.com`

**What you'll see:**

```
┌──────────────────────────────────────────────────┐
│         PLAUSIBLE ANALYTICS                      │
├──────────────────────────────────────────────────┤
│ Real-time visitors: 12                           │
│                                                  │
│ Last 30 days                                     │
│ Unique visitors: 1,234                           │
│ Total page views: 3,456                          │
│ Bounce rate: 38%                                 │
│ Visit duration: 3m 45s                           │
│                                                  │
│ Top Events                                       │
│ doc_generated          450 (Conversion: 36%)     │
│ file_uploaded          300 (Conversion: 24%)     │
│ modal_interaction      200 (Conversion: 16%)     │
│ quality_scored         150 (Conversion: 12%)     │
│ error_occurred          50 (Conversion: 4%)      │
│                                                  │
│ Devices (click to filter)                        │
│ Desktop   700 (57%)  [Filter]                    │
│ Mobile    450 (36%)  [Filter]                    │
│ Tablet     84 (7%)   [Filter]                    │
│                                                  │
│ Browsers (click to filter)                       │
│ Chrome    550 (45%)  [Filter]                    │
│ Safari    370 (30%)  [Filter]                    │
│ Firefox   185 (15%)  [Filter]                    │
│ Edge      124 (10%)  [Filter]                    │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│ GOAL: Documentation Generated                    │
├──────────────────────────────────────────────────┤
│ Event: doc_generated                             │
│ Total conversions: 450                           │
│ Conversion rate: 36%                             │
│                                                  │
│ Breakdown by docType:                            │
│ README          200 (44%)                        │
│ JSDoc           135 (30%)                        │
│ API              90 (20%)                        │
│ ARCHITECTURE     25 (6%)                         │
│                                                  │
│ Breakdown by device:                             │
│ Desktop         315 (70%) ← Desktop converts!    │
│ Mobile          115 (26%)                        │
│ Tablet           20 (4%)                         │
│                                                  │
│ Breakdown by browser:                            │
│ Chrome          225 (50%)                        │
│ Safari          135 (30%)                        │
│ Firefox          68 (15%)                        │
│ Edge             23 (5%)                         │
└──────────────────────────────────────────────────┘
```

**Advanced Filtering:**

Click on any property to filter:
- "Show me **only mobile users** who generated docs"
- "What's the success rate for **Safari users** uploading files?"
- "How many **desktop users** opened the Help modal?"

**Example Analysis:**
```
Question: Do mobile users generate docs successfully?

Filter: doc_generated → device: mobile
Result: 115 generations
Filter: success: true
Result: 100 generations → 87% success rate

Compare to desktop:
Filter: doc_generated → device: desktop
Result: 315 generations
Filter: success: true
Result: 305 generations → 97% success rate

Insight: Mobile success rate is 10% lower than desktop
→ Investigate mobile-specific errors
```

---

## Custom Events

### Full Event Catalog

| Event Name | Description | Properties | When Fired |
|------------|-------------|------------|------------|
| `doc_generated` | Documentation generated | `docType`, `language`, `linesOfCode`, `success`, `device`, `browser`, `screenSize` | After generation completes (success or failure) |
| `quality_scored` | Quality score calculated | `scoreRange`, `grade`, `docType` | After successful generation with quality score |
| `file_uploaded` | File uploaded | `extension`, `sizeRange`, `success`, `device` | After file upload attempt (success or failure) |
| `modal_interaction` | Modal opened/closed | `modalType`, `action` | When user interacts with modals |
| `error_occurred` | Error happened | `errorType`, `endpoint`, `device`, `browser` | When any error occurs (API, upload, network) |
| `feature_used` | Feature interaction | `feature`, `detail` | When user uses specific features (copy button, etc.) |
| `streaming_performance` | SSE streaming metrics | `timeToFirstToken`, `totalDuration`, `success` | After streaming doc generation |
| `user_engagement` | Engagement action | `action`, `value`, `device` | User engagement patterns |

---

## Privacy & Compliance

### GDPR/CCPA Compliance

✅ **What we're doing right:**

1. **No PII Collection**
   - No emails, names, phone numbers, or addresses
   - No authentication or user accounts
   - No tracking across websites

2. **IP Address Handling**
   - Plausible: IP addresses are hashed immediately, never stored
   - Backend logs: IPs are SHA-256 hashed with salt
   - Vercel: IPs are anonymized automatically

3. **No Cookies**
   - Plausible is 100% cookieless
   - No cookie banners required
   - Uses localStorage for consent only (optional)

4. **Data Aggregation**
   - Metrics rounded for privacy (e.g., "80-89" instead of "87")
   - Lines of code rounded to nearest 100
   - No timestamp-to-user correlation possible

5. **Opt-Out Available**
   - Users can decline analytics via consent banner
   - Browser "Do Not Track" honored
   - Plausible can be blocked without breaking site

6. **Transparent**
   - Analytics policy on website
   - Open source tracking code (visible in repo)
   - Users can inspect what's being tracked

### Data Retention

- **Vercel Analytics:** 90 days (free tier), unlimited (Pro)
- **Plausible:** Unlimited retention (all plans)
- **Backend Logs:** Rotate monthly, delete after 90 days

### Legal Documents Needed

1. **Privacy Policy** - Explain analytics usage
2. **Cookie Policy** - Explain localStorage usage (if consent banner added)
3. **Data Processing Agreement** - Vercel and Plausible (check their DPAs)

---

## Implementation Steps

### ✅ Step 1: Vercel Analytics (10 minutes)

```bash
cd client
npm install @vercel/analytics @vercel/speed-insights
```

Update [client/src/main.jsx](../../client/src/main.jsx):
```javascript
import { inject } from '@vercel/analytics';
import { injectSpeedInsights } from '@vercel/speed-insights';

inject();
injectSpeedInsights();

// ... rest of code
```

Enable in Vercel Dashboard:
1. Go to project → Analytics
2. Click "Enable Analytics"
3. Deploy to production

**Verify:** Visit site, check Vercel Analytics dashboard after 5 minutes

---

### ✅ Step 2: Plausible Setup (30 minutes)

1. **Create Plausible account:** https://plausible.io/register
2. **Add your domain:** `codescribeai.com`
3. **Install script** in [client/index.html](../../client/index.html):

```html
<head>
  <!-- Existing meta tags -->
  <script defer data-domain="codescribeai.com" src="https://plausible.io/js/script.js"></script>
</head>
```

4. **Install npm package for custom events:**

```bash
cd client
npm install plausible-tracker
```

5. **Analytics utility already created** at [client/src/utils/analytics.js](../../client/src/utils/analytics.js) ✅

6. **Verify:** Visit site, check Plausible dashboard after 5 minutes

---

### ✅ Step 3: Integrate Tracking (1-2 hours)

Update [client/src/App.jsx](../../client/src/App.jsx):

```javascript
import analytics from './utils/analytics';

// Track generation
const performGeneration = async () => {
  try {
    const lines = code.split('\n').length;
    await generate(code, docType, 'javascript');
    analytics.trackGeneration(docType, language, lines, true);
  } catch (err) {
    analytics.trackGeneration(docType, language, code.split('\n').length, false);
    analytics.trackError('generation_error', '/api/generate-stream');
  }
};

// Track file upload
const handleFileChange = async (event) => {
  // ... existing code
  try {
    // ... upload logic
    const sizeKB = file.size / 1024;
    analytics.trackFileUpload(extension, sizeKB, true);
  } catch (error) {
    analytics.trackFileUpload(extension, file.size / 1024, false);
    analytics.trackError('upload_error', '/api/upload');
  }
};

// Track modal opens
const handleExamplesClick = () => {
  setShowExamplesModal(true);
  analytics.trackModal('examples', 'opened');
};
```

Update [client/src/hooks/useDocGeneration.js](../../client/src/hooks/useDocGeneration.js):

```javascript
import analytics from '../utils/analytics';

// Track quality score
useEffect(() => {
  if (qualityScore) {
    analytics.trackQualityScore(
      qualityScore.score,
      qualityScore.grade,
      docType
    );
  }
}, [qualityScore]);
```

---

### ✅ Step 4: Configure Plausible Goals

1. Go to Plausible Dashboard → Settings → Goals
2. Add goals:

```
Goal 1: Documentation Generated
Type: Custom Event
Event name: doc_generated

Goal 2: File Uploaded
Type: Custom Event
Event name: file_uploaded

Goal 3: Quality Viewed
Type: Custom Event
Event name: quality_scored

Goal 4: Modal Opened
Type: Custom Event
Event name: modal_interaction
```

---

### ✅ Step 5: Test & Verify

```bash
# Start dev server with production env
cd client
VITE_ENV=production npm run dev

# Open browser console
# Perform actions (generate docs, upload file, open modals)
# Check console for tracking logs

# Verify in dashboards:
# - Vercel Analytics: Should show page view
# - Plausible: Should show real-time visitor + events
```

---

## Next Steps

1. **Deploy to production** with analytics enabled
2. **Monitor for 1 week** to collect baseline data
3. **Analyze device/browser breakdown** to prioritize testing
4. **Identify mobile UX issues** (if mobile conversion rate is low)
5. **Set up alerts** for error rate spikes
6. **Create weekly reports** for portfolio documentation

---

## Portfolio Talking Points

**Before Analytics:**
- "I built an AI documentation tool"

**After Analytics (with real data):**
- "I built an AI documentation tool serving **1,200+ monthly users**"
- "Achieved **95% generation success rate** with average **2.8s response time**"
- "**70% of users access via desktop**, but mobile traffic grew **40% month-over-month**"
- "Implemented privacy-first analytics (GDPR compliant, cookieless) to track **8 custom events**"
- "Discovered mobile users have **10% lower success rate** → prioritized mobile error handling"
- "**README docs are 44%** of generations, but **API docs have highest quality scores** (avg 85)"

**Technical depth:**
- "Built multi-layered analytics: client (Plausible), server (custom middleware), infrastructure (Vercel)"
- "Enriched events with device context for cross-platform analysis"
- "Zero PII collection, IP hashing, GDPR/CCPA compliant out of the box"

---

**Questions? See implementation files:**
- Analytics utility: [client/src/utils/analytics.js](../../client/src/utils/analytics.js)
- Main app integration: [client/src/App.jsx](../../client/src/App.jsx)
- Hook integration: [client/src/hooks/useDocGeneration.js](../../client/src/hooks/useDocGeneration.js)
