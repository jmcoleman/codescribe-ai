# Analytics Implementation Guide

**Status:** ✅ Fully Implemented
**Platform:** Vercel Analytics
**Package:** `@vercel/analytics` v1.x
**Privacy:** Anonymous, GDPR compliant, no cookies

---

## 📊 Overview

CodeScribe AI uses Vercel Analytics to track user behavior, performance metrics, and product insights. All tracking is **anonymous** and **privacy-friendly** with no personal information collected.

### Why Vercel Analytics?

1. **Zero configuration** - Already on Vercel platform
2. **Privacy-first** - No cookies, GDPR compliant
3. **Core Web Vitals** - Automatic tracking of FCP, LCP, TBT, CLS
4. **Free tier** - 2,500 events/month
5. **Real User Monitoring** - Actual performance data from users

---

## 🎯 What We Track

### 1. Documentation Generation Events

**Event:** `doc_generation`

Tracks every documentation generation attempt (success or failure).

**Data Points:**
- `doc_type` - Type of documentation (README, JSDoc, API, ARCHITECTURE)
- `success` - Whether generation succeeded (true/false)
- `duration_ms` - Time taken in milliseconds
- `code_size_kb` - Size of input code in KB
- `language` - Programming language detected

**Use Cases:**
- Success rate by doc type
- Average generation time
- Most popular documentation types
- Language distribution

---

### 2. Quality Score Events

**Event:** `quality_score`

Tracks quality scores for generated documentation.

**Data Points:**
- `score` - Overall quality score (0-100)
- `grade` - Letter grade (A, B, C, D, F)
- `doc_type` - Type of documentation
- `score_range` - Grouped score (90-100, 80-89, etc.)

**Use Cases:**
- Quality score distribution
- Grade distribution by doc type
- Improvement trends over time

---

### 3. Code Input Events

**Event:** `code_input`

Tracks how users provide code to the application.

**Data Points:**
- `method` - Input method (paste, upload, example)
- `code_size_kb` - Size of code in KB
- `language` - Programming language

**Use Cases:**
- Most common input method
- Average code size by method
- Language preferences

---

### 4. File Upload Events

**Event:** `file_upload`

Tracks file upload attempts and success rates.

**Data Points:**
- `file_type` - File extension
- `file_size_kb` - File size in KB
- `success` - Upload success (true/false)

**Use Cases:**
- Upload success rate
- Most common file types
- Average file size

---

### 5. Example Usage Events

**Event:** `example_usage`

Tracks when users load example code.

**Data Points:**
- `example_name` - Name of example loaded

**Use Cases:**
- Most popular examples
- Example usage rate vs manual input

---

### 6. User Interaction Events

**Event:** `user_interaction`

Tracks specific user actions in the UI.

**Data Points:**
- `action` - Action performed (e.g., view_quality_breakdown, copy_code, copy_docs)
- `metadata` - Additional context (varies by action)

**Use Cases:**
- Feature engagement
- User behavior patterns
- UI optimization insights

---

### 7. Performance Metrics

**Event:** `performance`

Tracks performance metrics for operations.

**Data Points:**
- `parse_time_ms` - Time to parse code
- `generate_time_ms` - Time to generate docs
- `total_time_ms` - Total time

**Use Cases:**
- Performance benchmarking
- Bottleneck identification
- Optimization tracking

---

### 8. Error Events

**Event:** `error`

Tracks errors for debugging and reliability monitoring.

**Data Points:**
- `error_type` - Type of error (network, validation, api, server)
- `error_message` - Sanitized error message (max 100 chars)
- `context` - Where error occurred

**Privacy Note:** Error messages are sanitized to remove API keys, tokens, and email addresses.

**Use Cases:**
- Error rate monitoring
- Most common error types
- Reliability metrics

---

## 🔧 Implementation Details

### Core Files

1. **[client/src/utils/analytics.js](../client/src/utils/analytics.js)** - Analytics utility functions
2. **[client/src/main.jsx](../client/src/main.jsx)** - Analytics component initialization
3. **[client/src/hooks/useDocGeneration.js](../client/src/hooks/useDocGeneration.js)** - Doc generation tracking
4. **[client/src/App.jsx](../client/src/App.jsx)** - Code input and interaction tracking

### Analytics Utility API

```javascript
import {
  trackDocGeneration,
  trackQualityScore,
  trackCodeInput,
  trackFileUpload,
  trackExampleUsage,
  trackInteraction,
  trackPerformance,
  trackError,
} from './utils/analytics';

// Example: Track doc generation
trackDocGeneration({
  docType: 'README',
  success: true,
  duration: 3500,
  codeSize: 2048,
  language: 'javascript',
});

// Example: Track quality score
trackQualityScore({
  score: 92,
  grade: 'A',
  docType: 'README',
});

// Example: Track user interaction
trackInteraction('view_quality_breakdown', {
  score: 92,
  grade: 'A',
});
```

### Integration Points

**1. Documentation Generation** ([useDocGeneration.js:87-109](../client/src/hooks/useDocGeneration.js#L87-L109))
- Tracks generation start time
- On success: Tracks generation, quality score, and performance
- On error: Tracks failed generation and error details

**2. File Upload** ([App.jsx:204-211](../client/src/App.jsx#L204-L211))
- Tracks successful uploads with file type and size
- Tracks failed uploads with error context

**3. Example Loading** ([App.jsx:273-275](../client/src/App.jsx#L273-L275))
- Tracks which examples users load
- Tracks code input method

**4. User Interactions** ([App.jsx:393-396](../client/src/App.jsx#L393-L396))
- Tracks quality modal views
- Can be extended for copy button clicks, etc.

---

## 📈 Viewing Analytics

### Access Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select the `codescribe-ai` project
3. Click on the **Analytics** tab
4. View real-time and historical data

### Available Reports

- **Overview** - Page views, unique visitors, top pages
- **Audience** - Geographic distribution, devices, browsers
- **Web Vitals** - FCP, LCP, CLS, FID, TTFB performance metrics
- **Custom Events** - All custom events tracked via `track()` function

### Filtering Data

You can filter analytics by:
- Time range (24h, 7d, 30d, custom)
- Geographic location
- Device type
- Browser
- Referrer
- Custom event properties

---

## 🔐 Privacy & Security

### Data Privacy

✅ **Anonymous tracking** - No user identification
✅ **No cookies** - Compliant with GDPR/CCPA
✅ **Sanitized errors** - API keys and tokens removed
✅ **Minimal data** - Only necessary metrics collected
✅ **No PII** - No personal information tracked

### Error Sanitization

The `sanitizeErrorMessage()` function removes:
- API keys (pattern: `sk-[...]`)
- Bearer tokens (pattern: `Bearer [...]`)
- Email addresses (pattern: `[...]@[...]`)

### Data Retention

Vercel Analytics retains data according to your plan:
- **Free tier:** 30 days
- **Pro tier:** 90 days
- **Enterprise:** Custom retention

---

## 🚀 Deployment

### Production Setup

**No additional configuration required!** Analytics will automatically start tracking once deployed to Vercel.

The `<Analytics />` component in [main.jsx](../client/src/main.jsx) handles initialization automatically.

### Local Development

In local development, analytics events are logged to the console but **not sent to Vercel**. This prevents development data from polluting production analytics.

To test analytics locally:
```bash
cd client
npm run dev
# Open browser console to see analytics events
```

---

## 📊 Key Metrics to Monitor

### Success Metrics

1. **Generation Success Rate** - Percentage of successful doc generations
   - Target: >95%
   - Formula: (Successful generations / Total attempts) × 100

2. **Quality Score Distribution** - Distribution of quality grades
   - Target: >50% A/B grades
   - Monitor: Percentage of A, B, C, D, F grades

3. **Average Generation Time** - Time to generate documentation
   - Target: <5 seconds for typical code
   - Monitor: Median and P95 generation times

4. **Upload Success Rate** - Percentage of successful file uploads
   - Target: >98%
   - Formula: (Successful uploads / Total attempts) × 100

### Engagement Metrics

1. **Input Method Distribution** - How users provide code
   - Paste vs Upload vs Examples
   - Indicates user preferences

2. **Example Usage** - Which examples are most popular
   - Guides example selection
   - Indicates user needs

3. **Feature Engagement** - Quality breakdown views, copy actions
   - Indicates valuable features
   - Guides feature development

### Performance Metrics

1. **Core Web Vitals** - Automatically tracked by Vercel
   - FCP (First Contentful Paint): Target <1.8s
   - LCP (Largest Contentful Paint): Target <2.5s
   - CLS (Cumulative Layout Shift): Target <0.1
   - FID (First Input Delay): Target <100ms

2. **Generation Performance** - Time to generate docs
   - Parse time + Generate time
   - Monitor P50, P95, P99

### Reliability Metrics

1. **Error Rate** - Percentage of operations that error
   - Target: <5%
   - Formula: (Error events / Total events) × 100

2. **Error Type Distribution** - Most common error types
   - Network, Validation, API, Server
   - Guides debugging priorities

---

## 🔮 Future Enhancements

Potential additions for Phase 4 (optional):

### Advanced Tracking

- **Session replay** - Visual playback of user sessions (privacy considerations!)
- **Funnel analysis** - Multi-step conversion tracking
- **Cohort analysis** - User behavior over time
- **A/B testing** - Feature variant testing

### Custom Dashboards

- **Real-time dashboard** - Live metrics visualization
- **Alert system** - Notifications for errors/anomalies
- **Weekly reports** - Automated email summaries

### Performance Monitoring

- **Distributed tracing** - End-to-end request tracking
- **Backend metrics** - Claude API latency, server response times
- **Resource timing** - Network, compute, parsing breakdowns

---

## 📚 References

- [Vercel Analytics Docs](https://vercel.com/docs/analytics)
- [Custom Events Guide](https://vercel.com/docs/analytics/custom-events)
- [Web Vitals](https://web.dev/vitals/)
- [Privacy Best Practices](https://vercel.com/docs/analytics/privacy-policy)

---

**Last Updated:** October 20, 2025
**Version:** 1.0
**Status:** Production Ready ✅
