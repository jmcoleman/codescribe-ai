# Analytics & Reporting Scaling Plan

> **Status**: Reference documentation
> **Created**: January 2026
> **Applies to**: `analytics_events` table and Admin Analytics Dashboard

## Overview

This document outlines the scaling strategy for CodeScribe's analytics system, defining when to use different approaches based on data volume and query complexity.

---

## Current Architecture

### Event Storage
- **Table**: `analytics_events` in PostgreSQL (Neon)
- **Schema**: Flexible JSONB `event_data` column for event-specific attributes
- **Categories**: `workflow`, `business`, `usage`, `system`

### Indexes (Migration 046)
```sql
-- Primary query pattern: filter by event type and time
idx_analytics_events_name_created (event_name, created_at DESC)

-- Tab filtering in dashboard
idx_analytics_events_category_created (event_category, created_at DESC)

-- Most dashboard queries exclude internal users
idx_analytics_events_external (created_at DESC) WHERE is_internal = FALSE

-- User-specific analytics
idx_analytics_events_user (user_id, created_at DESC) WHERE user_id IS NOT NULL

-- Session funnel analysis
idx_analytics_events_session (session_id, created_at) WHERE session_id IS NOT NULL
```

### Query Patterns
1. **Funnel metrics**: Count distinct sessions per stage
2. **Time series**: Aggregate by day/week/month
3. **Breakdowns**: Group by doc_type, language, origin, etc.
4. **KPIs**: Simple counts with date range filters

---

## Event Reference

The analytics system captures user behavior and product performance as atomic events. Each event serves a specific purpose in understanding the user journey and product health.

### Workflow Events
Track user progression through the core workflow.

| Event | Purpose | Key Attributes |
|-------|---------|----------------|
| `session_start` | New browser session begins | `referrer`, `landing_page` |
| `code_input` | Code loaded into editor | `origin` (paste/upload/sample/github), `language`, `filename`, `repo.*` |
| `generation_started` | Doc generation attempt initiated | Derived from `doc_generation` events |
| `generation_completed` | Doc generation succeeded | Derived from `doc_generation` where success=true |
| `doc_export` | User exports documentation | `action` (copy/download), `doc_type`, `filename`, `format` |

### Business Events
Track conversion and monetization milestones.

| Event | Purpose | Key Attributes |
|-------|---------|----------------|
| `login` | User authenticates | `method` (email/github/google) |
| `signup` | New account created | `method`, `tier`, `has_trial` |
| `trial` | Trial lifecycle event | `action` (started/expired/converted), `source`, `days_active` |
| `tier_change` | Subscription tier changed | `action` (upgrade/downgrade/cancel), `previous_tier`, `new_tier`, `reason` |
| `checkout_completed` | Payment successful | `tier`, `amount` |
| `usage_alert` | Usage threshold reached | `action` (warning_shown/limit_hit), `tier`, `percent_used` |

### Usage Events
Track product usage patterns.

| Event | Purpose | Key Attributes |
|-------|---------|----------------|
| `doc_generation` | Generation attempt with full details | `success`, `doc_type`, `language`, `duration`, `llm.*` |
| `batch_generation` | Multi-file batch generation | `file_count`, `success_count`, `duration` |
| `quality_score` | Quality score recorded | `score`, `grade`, `doc_type` |
| `oauth_flow` | OAuth authentication flow | `provider`, `action`, `duration` |
| `user_interaction` | Generic UI interactions | `action`, varies by interaction |

### System Events
Track infrastructure and technical metrics.

| Event | Purpose | Key Attributes |
|-------|---------|----------------|
| `error` | Error occurred | `error_type`, `error_message`, `context` |
| `performance` | LLM performance metrics | `latency.*` (ttft, tpot), `throughput.*`, `cache.*` |

### Event Actions Reference

Some events use an `action` field to distinguish sub-types:

**`code_input` origins:**
- `paste` - User typed or pasted code
- `upload` - File uploaded from local machine
- `sample` - Sample code loaded from gallery
- `github` - File imported from GitHub repository

**`doc_export` actions:**
- `copy` - Documentation copied to clipboard
- `download` - Documentation downloaded as file

**`trial` actions:**
- `started` - Trial period began
- `expired` - Trial period ended without conversion
- `converted` - Trial user upgraded to paid

**`tier_change` actions:**
- `upgrade` - User upgraded to a higher tier
- `downgrade` - User downgraded to a lower tier
- `cancel` - User cancelled their subscription

**`usage_alert` actions:**
- `warning_shown` - 80% usage warning banner displayed
- `limit_hit` - 100% usage limit modal displayed

**`user_interaction` actions:**
- `view_quality_breakdown` - User viewed quality score details
- `pricing_page_viewed` - Pricing page opened
- `upgrade_cta_clicked` - Upgrade button clicked
- `checkout_started` - Stripe checkout initiated
- `regeneration_complete` - Doc regeneration finished
- `batch_generation_complete` - Batch generation finished

---

## LLM Performance Benchmarks

### Latency Metrics

| Metric | Excellent | Good | Acceptable | Slow |
|--------|-----------|------|------------|------|
| **TTFT** (Time to First Token) | <500ms | 500ms-1s | 1-2s | >2s |
| **TPOT** (Time Per Output Token) | <20ms | 20-40ms | 40-60ms | >60ms |
| **Throughput** | >50 tok/s | 30-50 tok/s | 15-30 tok/s | <15 tok/s |

**TTFT** measures API overhead - how quickly streaming begins. This is the primary UX metric since users see immediate feedback.

**TPOT/Throughput** measures generation speed. Claude Sonnet typically achieves 25-40 tokens/second.

### Total Generation Time

Total time scales with output length. Typical times at ~30ms/token:

| Doc Type | Output Size | Typical Time |
|----------|-------------|--------------|
| README | ~500 tokens | 15-20s |
| JSDoc | ~800 tokens | 25-35s |
| API Docs | ~1200 tokens | 35-50s |
| Architecture | ~2000 tokens | 60-90s |

**Key insight**: For streaming UIs, TTFT matters most. Total generation time is less critical because users see continuous progress.

### Cache Performance

| Metric | Target |
|--------|--------|
| Cache hit rate | >70% (with prompt caching enabled) |
| Cache savings | 90% cost reduction on cached tokens |

---

## Scaling Thresholds

| Event Volume | Query Performance | Recommended Approach |
|--------------|-------------------|---------------------|
| < 100K | Instant (< 100ms) | Raw queries |
| 100K - 500K | Fast (< 500ms) | Raw queries + monitoring |
| 500K - 2M | Noticeable (1-3s) | Add materialized views |
| 2M - 10M | Slow (3-10s) | Pre-aggregated rollups |
| 10M+ | Very slow | Partitioning + external tools |

### Estimated Growth (CodeScribe)
- **Current**: ~100-500 events/day
- **Growth projection**: ~1K-5K events/day at scale
- **Time to 1M events**: 12-18 months at growth rate
- **Recommendation**: Raw queries sufficient for 12-18 months

---

## Phase 1: Raw Event Queries (Current)

### When to Use
- < 500K total events
- Dashboard queries returning in < 2 seconds
- Simple aggregations (counts, group by)

### Optimization Checklist
- [x] Indexes on (event_name, created_at)
- [x] Partial index for external events (is_internal = FALSE)
- [x] Session and user indexes for funnel/cohort queries
- [ ] Monitor query performance in production
- [ ] Add `EXPLAIN ANALYZE` for slow queries

### Warning Signs to Watch
- Dashboard taking > 2 seconds to load
- Date range queries slowing significantly
- Complex funnel queries timing out

---

## Phase 2: Materialized Views (500K - 2M events)

### When to Implement
- Dashboard queries consistently > 1-2 seconds
- Repeated queries for same KPIs
- Need for faster real-time dashboard

### Implementation

```sql
-- Daily rollup for common metrics
CREATE MATERIALIZED VIEW analytics_daily_rollup AS
SELECT
  DATE(created_at) as date,
  event_name,
  COUNT(*) as event_count,
  COUNT(DISTINCT session_id) as unique_sessions,
  COUNT(DISTINCT user_id) as unique_users
FROM analytics_events
WHERE is_internal = FALSE
GROUP BY DATE(created_at), event_name;

-- Refresh strategy: hourly or on-demand
CREATE UNIQUE INDEX ON analytics_daily_rollup (date, event_name);
REFRESH MATERIALIZED VIEW CONCURRENTLY analytics_daily_rollup;
```

### Views to Consider
1. **Daily rollup**: Event counts by day
2. **Funnel snapshot**: Pre-computed stage counts
3. **Conversion metrics**: Pre-computed rates
4. **Performance averages**: Pre-aggregated latency stats

### Refresh Strategy
- **Hourly**: For near-real-time dashboards
- **Daily**: For historical views (overnight job)
- **On-demand**: After bulk imports or corrections

---

## Phase 3: Pre-Aggregated Tables (2M - 10M events)

### When to Implement
- Materialized view refreshes taking too long
- Need for historical trend queries over months/years
- Multiple dashboard users causing load

### Implementation

```sql
-- Permanent aggregation table (not materialized view)
CREATE TABLE analytics_daily_stats (
  date DATE NOT NULL,
  event_name VARCHAR(100) NOT NULL,
  event_count INTEGER NOT NULL DEFAULT 0,
  unique_sessions INTEGER NOT NULL DEFAULT 0,
  unique_users INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (date, event_name)
);

-- Populate via scheduled job (cron)
-- Run nightly to aggregate previous day
INSERT INTO analytics_daily_stats (date, event_name, event_count, unique_sessions, unique_users)
SELECT
  DATE(created_at),
  event_name,
  COUNT(*),
  COUNT(DISTINCT session_id),
  COUNT(DISTINCT user_id)
FROM analytics_events
WHERE DATE(created_at) = CURRENT_DATE - 1
  AND is_internal = FALSE
GROUP BY DATE(created_at), event_name
ON CONFLICT (date, event_name) DO UPDATE SET
  event_count = EXCLUDED.event_count,
  unique_sessions = EXCLUDED.unique_sessions,
  unique_users = EXCLUDED.unique_users;
```

### Benefits
- Query aggregated table for historical data (instant)
- Query raw events only for today/recent data
- Combine in application layer

---

## Phase 4: Table Partitioning (10M+ events)

### When to Implement
- Raw event table exceeding 10M rows
- Need to archive old data
- Maintenance operations (VACUUM) taking too long

### Implementation

```sql
-- Convert to partitioned table by month
CREATE TABLE analytics_events_partitioned (
  LIKE analytics_events INCLUDING ALL
) PARTITION BY RANGE (created_at);

-- Create monthly partitions
CREATE TABLE analytics_events_2026_01
  PARTITION OF analytics_events_partitioned
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

-- Automate partition creation with pg_partman or cron
```

### Partition Management
- **Hot partitions**: Current + previous month (fast queries)
- **Warm partitions**: 3-12 months (queryable, less frequent)
- **Cold partitions**: 12+ months (archive to S3/cheaper storage)

---

## Phase 5: External Analytics Tools

### When to Use
- Need ad-hoc exploration beyond dashboard capabilities
- Correlating with external data (marketing, revenue)
- Historical analysis over 1+ years
- Data science / ML workloads

### Options

| Tool | Best For | Cost |
|------|----------|------|
| **CSV Export** | Quick analysis in Excel/Sheets | Free |
| **BigQuery** | Large-scale SQL analytics | Pay-per-query |
| **Snowflake** | Enterprise data warehouse | Subscription |
| **Metabase** | Self-hosted BI dashboards | Free (OSS) |
| **Amplitude/Mixpanel** | Product analytics SaaS | Subscription |

### CSV Export (Already Available)
The Admin Dashboard includes a CSV export feature for:
- Raw events with filters applied
- Ad-hoc analysis in spreadsheet tools
- Data backup and portability

### When to Graduate to External Tools
- Need joins across multiple data sources
- Want predictive analytics / ML
- Multiple teams need different views
- Compliance requires data warehouse

---

## Monitoring & Alerts

### Metrics to Track
```sql
-- Event volume trend
SELECT DATE(created_at), COUNT(*)
FROM analytics_events
GROUP BY DATE(created_at)
ORDER BY 1 DESC LIMIT 30;

-- Table size
SELECT pg_size_pretty(pg_total_relation_size('analytics_events'));

-- Index usage
SELECT indexrelname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
WHERE relname = 'analytics_events';
```

### Alert Thresholds
- Table size > 1GB: Consider optimization
- Query p95 > 2s: Add materialized views
- Daily events > 10K: Plan for Phase 2
- Table size > 10GB: Plan for partitioning

---

## Decision Matrix

```
START
  │
  ▼
┌─────────────────────────┐
│ Events < 500K?          │──Yes──▶ Raw queries (Phase 1)
└─────────────────────────┘
  │ No
  ▼
┌─────────────────────────┐
│ Dashboard queries < 2s? │──Yes──▶ Stay with raw queries
└─────────────────────────┘
  │ No
  ▼
┌─────────────────────────┐
│ Events < 2M?            │──Yes──▶ Materialized views (Phase 2)
└─────────────────────────┘
  │ No
  ▼
┌─────────────────────────┐
│ Events < 10M?           │──Yes──▶ Pre-aggregated tables (Phase 3)
└─────────────────────────┘
  │ No
  ▼
┌─────────────────────────┐
│ Partitioning (Phase 4)  │
│ + External tools        │
└─────────────────────────┘
```

---

## Quick Reference

### Current State (January 2026)
- **Phase**: 1 (Raw queries)
- **Event volume**: < 10K
- **Query performance**: Instant
- **Next checkpoint**: Monitor monthly, review at 100K events

### Action Items by Phase
| Phase | Trigger | Action |
|-------|---------|--------|
| 1 → 2 | Queries > 2s consistently | Add materialized views |
| 2 → 3 | Refresh time > 5 min | Switch to pre-aggregated tables |
| 3 → 4 | Table > 10GB | Implement partitioning |
| Any | Deep analysis needed | Use CSV export → external tool |

---

## Related Documentation
- [ANALYTICS-STORYTELLING-PLAN.md](./ANALYTICS-STORYTELLING-PLAN.md) - Dashboard feature roadmap
- [Migration 046](../../server/src/db/migrations/046-create-analytics-events-table.sql) - Table schema
