/**
 * Unit tests for analyticsService
 *
 * Tests analytics operations including:
 * - Recording events with validation
 * - Getting conversion funnel metrics
 * - Getting business metrics
 * - Getting usage patterns
 * - Getting time series data
 * - Getting raw events with pagination
 *
 * Pattern 11: ES Modules - mock BEFORE importing (see TEST-PATTERNS-GUIDE.md)
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock @vercel/postgres BEFORE importing analyticsService
jest.mock('@vercel/postgres', () => ({
  sql: jest.fn(),
}));

import { analyticsService } from '../analyticsService.js';
import { sql } from '@vercel/postgres';

describe('AnalyticsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================================
  // EVENT VALIDATION
  // ============================================================================

  describe('isValidEvent', () => {
    it('should return true for valid funnel events', () => {
      expect(analyticsService.isValidEvent('session_start')).toBe(true);
      expect(analyticsService.isValidEvent('code_input')).toBe(true);
      expect(analyticsService.isValidEvent('generation_completed')).toBe(true);
    });

    it('should return true for valid business events', () => {
      expect(analyticsService.isValidEvent('signup')).toBe(true);
      expect(analyticsService.isValidEvent('tier_upgrade')).toBe(true);
      expect(analyticsService.isValidEvent('checkout_completed')).toBe(true);
    });

    it('should return true for valid usage events', () => {
      expect(analyticsService.isValidEvent('doc_generation')).toBe(true);
      expect(analyticsService.isValidEvent('batch_generation')).toBe(true);
      expect(analyticsService.isValidEvent('quality_score')).toBe(true);
    });

    it('should return false for invalid events', () => {
      expect(analyticsService.isValidEvent('invalid_event')).toBe(false);
      expect(analyticsService.isValidEvent('')).toBe(false);
      expect(analyticsService.isValidEvent(null)).toBe(false);
    });
  });

  describe('getEventCategory', () => {
    it('should return funnel for funnel events', () => {
      expect(analyticsService.getEventCategory('session_start')).toBe('funnel');
      expect(analyticsService.getEventCategory('doc_copied')).toBe('funnel');
    });

    it('should return business for business events', () => {
      expect(analyticsService.getEventCategory('signup')).toBe('business');
      expect(analyticsService.getEventCategory('subscription_cancelled')).toBe('business');
    });

    it('should return usage for usage events', () => {
      expect(analyticsService.getEventCategory('doc_generation')).toBe('usage');
      expect(analyticsService.getEventCategory('error')).toBe('usage');
    });

    it('should return null for invalid events', () => {
      expect(analyticsService.getEventCategory('invalid')).toBeNull();
    });
  });

  // ============================================================================
  // RECORD EVENT
  // ============================================================================

  describe('recordEvent', () => {
    it('should record a valid event', async () => {
      const mockResult = {
        rows: [{ id: 'uuid-123', created_at: new Date() }],
      };
      sql.mockResolvedValue(mockResult);

      const result = await analyticsService.recordEvent('session_start', { referrer: 'google' }, {
        sessionId: 'sess-123',
        ipAddress: '192.168.1.1',
      });

      expect(sql).toHaveBeenCalled();
      expect(result).toHaveProperty('id', 'uuid-123');
      expect(result).toHaveProperty('eventName', 'session_start');
      expect(result).toHaveProperty('category', 'funnel');
    });

    it('should throw error for invalid event name', async () => {
      await expect(
        analyticsService.recordEvent('invalid_event', {})
      ).rejects.toThrow('Invalid event name: invalid_event');

      expect(sql).not.toHaveBeenCalled();
    });

    it('should include userId when provided', async () => {
      const mockResult = {
        rows: [{ id: 'uuid-456', created_at: new Date() }],
      };
      sql.mockResolvedValue(mockResult);

      await analyticsService.recordEvent('signup', { tier: 'free' }, {
        userId: 42,
        isInternal: false,
      });

      expect(sql).toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      sql.mockRejectedValue(new Error('Database connection failed'));

      await expect(
        analyticsService.recordEvent('session_start', {})
      ).rejects.toThrow('Database connection failed');
    });
  });

  // ============================================================================
  // CONVERSION FUNNEL
  // ============================================================================

  describe('getConversionFunnel', () => {
    const dateRange = {
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
    };

    it('should return funnel metrics with conversion rates', async () => {
      sql.mockResolvedValue({
        rows: [
          { event_name: 'session_start', unique_sessions: '100', total_events: '120' },
          { event_name: 'code_input', unique_sessions: '80', total_events: '90' },
          { event_name: 'generation_started', unique_sessions: '60', total_events: '70' },
          { event_name: 'generation_completed', unique_sessions: '55', total_events: '60' },
          { event_name: 'doc_copied', unique_sessions: '40', total_events: '45' },
        ],
      });

      const result = await analyticsService.getConversionFunnel(dateRange);

      expect(result).toHaveProperty('stages');
      expect(result.stages.session_start.sessions).toBe(100);
      expect(result.stages.code_input.sessions).toBe(80);
      expect(result).toHaveProperty('conversionRates');
      expect(result.conversionRates.session_start_to_code_input).toBe(80);
      expect(result.totalSessions).toBe(100);
      expect(result.completedSessions).toBe(40);
      expect(result.overallConversion).toBe(40);
    });

    it('should handle empty data', async () => {
      sql.mockResolvedValue({ rows: [] });

      const result = await analyticsService.getConversionFunnel(dateRange);

      expect(result.totalSessions).toBe(0);
      expect(result.completedSessions).toBe(0);
      expect(result.overallConversion).toBe(0);
    });

    it('should exclude internal users when specified', async () => {
      sql.mockResolvedValue({ rows: [] });

      await analyticsService.getConversionFunnel({ ...dateRange, excludeInternal: true });

      // Verify the SQL was called (we can't easily check the exact query)
      expect(sql).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // BUSINESS METRICS
  // ============================================================================

  describe('getBusinessMetrics', () => {
    const dateRange = {
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
    };

    it('should return business metrics', async () => {
      // First call for event counts
      sql.mockResolvedValueOnce({
        rows: [
          { event_name: 'signup', count: '50', revenue_cents: '0' },
          { event_name: 'tier_upgrade', count: '10', revenue_cents: '0' },
          { event_name: 'checkout_completed', count: '8', revenue_cents: '79200' },
        ],
      });
      // Second call for tier breakdown
      sql.mockResolvedValueOnce({
        rows: [
          { tier: 'pro', count: '6' },
          { tier: 'team', count: '4' },
        ],
      });

      const result = await analyticsService.getBusinessMetrics(dateRange);

      expect(result.signups).toBe(50);
      expect(result.tierUpgrades).toBe(10);
      expect(result.checkouts).toBe(8);
      expect(result.revenueCents).toBe(79200);
      expect(result.upgradesByTier).toEqual({ pro: 6, team: 4 });
    });

    it('should handle no data', async () => {
      sql.mockResolvedValue({ rows: [] });

      const result = await analyticsService.getBusinessMetrics(dateRange);

      expect(result.signups).toBe(0);
      expect(result.tierUpgrades).toBe(0);
      expect(result.revenueCents).toBe(0);
    });
  });

  // ============================================================================
  // USAGE PATTERNS
  // ============================================================================

  describe('getUsagePatterns', () => {
    const dateRange = {
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
    };

    it('should return usage pattern data', async () => {
      // Doc types
      sql.mockResolvedValueOnce({
        rows: [
          { doc_type: 'README', count: '50' },
          { doc_type: 'API', count: '30' },
        ],
      });
      // Quality scores
      sql.mockResolvedValueOnce({
        rows: [
          { score_range: '90-100', count: '20' },
          { score_range: '80-89', count: '40' },
        ],
      });
      // Batch vs single
      sql.mockResolvedValueOnce({
        rows: [
          { type: 'single', count: '60' },
          { type: 'batch', count: '20' },
        ],
      });
      // Languages
      sql.mockResolvedValueOnce({
        rows: [
          { language: 'javascript', count: '40' },
          { language: 'python', count: '25' },
        ],
      });
      // Origins
      sql.mockResolvedValueOnce({
        rows: [
          { origin: 'paste', count: '50' },
          { origin: 'upload', count: '30' },
        ],
      });

      const result = await analyticsService.getUsagePatterns(dateRange);

      expect(result.docTypes).toHaveLength(2);
      expect(result.docTypes[0]).toEqual({ type: 'README', count: 50 });
      expect(result.qualityScores).toHaveLength(2);
      expect(result.batchVsSingle).toEqual({ single: 60, batch: 20 });
      expect(result.languages).toHaveLength(2);
      expect(result.origins).toHaveLength(2);
    });
  });

  // ============================================================================
  // TIME SERIES
  // ============================================================================

  describe('getTimeSeries', () => {
    const options = {
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
      interval: 'day',
    };

    it('should return sessions time series', async () => {
      sql.mockResolvedValue({
        rows: [
          { date: new Date('2024-01-01'), value: '10' },
          { date: new Date('2024-01-02'), value: '15' },
          { date: new Date('2024-01-03'), value: '12' },
        ],
      });

      const result = await analyticsService.getTimeSeries({ ...options, metric: 'sessions' });

      expect(result).toHaveLength(3);
      expect(result[0].value).toBe(10);
      expect(result[1].value).toBe(15);
    });

    it('should return generations time series', async () => {
      sql.mockResolvedValue({
        rows: [
          { date: new Date('2024-01-01'), value: '5' },
          { date: new Date('2024-01-02'), value: '8' },
        ],
      });

      const result = await analyticsService.getTimeSeries({ ...options, metric: 'generations' });

      expect(result).toHaveLength(2);
    });

    it('should return signups time series', async () => {
      sql.mockResolvedValue({
        rows: [{ date: new Date('2024-01-01'), value: '3' }],
      });

      const result = await analyticsService.getTimeSeries({ ...options, metric: 'signups' });

      expect(result).toHaveLength(1);
      expect(result[0].value).toBe(3);
    });

    it('should return revenue time series', async () => {
      sql.mockResolvedValue({
        rows: [{ date: new Date('2024-01-01'), value: '9900' }],
      });

      const result = await analyticsService.getTimeSeries({ ...options, metric: 'revenue' });

      expect(result[0].value).toBe(9900);
    });

    it('should throw error for invalid metric', async () => {
      await expect(
        analyticsService.getTimeSeries({ ...options, metric: 'invalid' })
      ).rejects.toThrow('Invalid metric: invalid');
    });

    it('should handle different intervals', async () => {
      sql.mockResolvedValue({ rows: [] });

      await analyticsService.getTimeSeries({ ...options, metric: 'sessions', interval: 'week' });
      await analyticsService.getTimeSeries({ ...options, metric: 'sessions', interval: 'month' });

      expect(sql).toHaveBeenCalledTimes(2);
    });
  });

  // ============================================================================
  // RAW EVENTS
  // ============================================================================

  describe('getEvents', () => {
    const options = {
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
      page: 1,
      limit: 50,
    };

    it('should return paginated events', async () => {
      sql.mockResolvedValueOnce({
        rows: [
          {
            id: 'uuid-1',
            event_name: 'session_start',
            event_category: 'funnel',
            session_id: 'sess-123',
            user_id: null,
            user_email: null,
            ip_address: '192.168.1.1',
            event_data: { referrer: 'google' },
            is_internal: false,
            created_at: new Date('2024-01-15'),
          },
        ],
      });
      sql.mockResolvedValueOnce({
        rows: [{ total: '1' }],
      });

      const result = await analyticsService.getEvents(options);

      expect(result.events).toHaveLength(1);
      expect(result.events[0].eventName).toBe('session_start');
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('should filter by category', async () => {
      sql.mockResolvedValueOnce({ rows: [] });
      sql.mockResolvedValueOnce({ rows: [{ total: '0' }] });

      await analyticsService.getEvents({ ...options, category: 'funnel' });

      expect(sql).toHaveBeenCalledTimes(2);
    });

    it('should filter by event name', async () => {
      sql.mockResolvedValueOnce({ rows: [] });
      sql.mockResolvedValueOnce({ rows: [{ total: '0' }] });

      await analyticsService.getEvents({ ...options, eventName: 'session_start' });

      expect(sql).toHaveBeenCalledTimes(2);
    });

    it('should exclude internal when specified', async () => {
      sql.mockResolvedValueOnce({ rows: [] });
      sql.mockResolvedValueOnce({ rows: [{ total: '0' }] });

      await analyticsService.getEvents({ ...options, excludeInternal: true });

      expect(sql).toHaveBeenCalledTimes(2);
    });
  });

  describe('getEventNames', () => {
    it('should return list of distinct event names', async () => {
      sql.mockResolvedValue({
        rows: [
          { event_name: 'code_input' },
          { event_name: 'doc_generation' },
          { event_name: 'session_start' },
        ],
      });

      const result = await analyticsService.getEventNames();

      expect(result).toEqual(['code_input', 'doc_generation', 'session_start']);
    });

    it('should return empty array when no events', async () => {
      sql.mockResolvedValue({ rows: [] });

      const result = await analyticsService.getEventNames();

      expect(result).toEqual([]);
    });
  });

  // ============================================================================
  // BUSINESS CONVERSION FUNNEL
  // ============================================================================

  describe('getBusinessConversionFunnel', () => {
    const dateRange = {
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
    };

    it('should return business funnel with conversion rates and breakdowns', async () => {
      // Visitors
      sql.mockResolvedValueOnce({ rows: [{ count: '1000' }] });
      // Engaged (used product)
      sql.mockResolvedValueOnce({ rows: [{ count: '500' }] });
      // Signups
      sql.mockResolvedValueOnce({ rows: [{ count: '100' }] });
      // Trials (with breakdown: campaign vs individual)
      sql.mockResolvedValueOnce({ rows: [{ total: '50', campaign: '30', individual: '20' }] });
      // Paid (with breakdown: via_trial vs direct)
      sql.mockResolvedValueOnce({ rows: [{ total: '20', via_trial: '15', direct: '5' }] });

      const result = await analyticsService.getBusinessConversionFunnel(dateRange);

      expect(result.stages.visitors.count).toBe(1000);
      expect(result.stages.engaged.count).toBe(500);
      expect(result.stages.signups.count).toBe(100);

      // Trial stage with breakdown
      expect(result.stages.trials.count).toBe(50);
      expect(result.stages.trials.breakdown.campaign.count).toBe(30);
      expect(result.stages.trials.breakdown.individual.count).toBe(20);

      // Paid stage with breakdown
      expect(result.stages.paid.count).toBe(20);
      expect(result.stages.paid.breakdown.viaTrial.count).toBe(15);
      expect(result.stages.paid.breakdown.direct.count).toBe(5);

      // Conversion rates
      expect(result.conversionRates.visitor_to_engaged).toBe(50);
      expect(result.conversionRates.engaged_to_signup).toBe(20);
      expect(result.conversionRates.signup_to_trial).toBe(50);
      expect(result.conversionRates.trial_to_paid).toBe(30); // 15 (via trial) / 50 (trials) = 30%
      expect(result.conversionRates.signup_to_paid).toBe(20); // 20 (total paid) / 100 (signups) = 20%
      expect(result.conversionRates.signup_to_direct_paid).toBe(5); // 5 (direct) / 100 (signups) = 5%
      expect(result.overallConversion).toBe(2);
    });

    it('should handle zero values without division errors', async () => {
      // Visitors, engaged, signups return 0
      sql.mockResolvedValueOnce({ rows: [{ count: '0' }] });
      sql.mockResolvedValueOnce({ rows: [{ count: '0' }] });
      sql.mockResolvedValueOnce({ rows: [{ count: '0' }] });
      // Trials with breakdown
      sql.mockResolvedValueOnce({ rows: [{ total: '0', campaign: '0', individual: '0' }] });
      // Paid with breakdown
      sql.mockResolvedValueOnce({ rows: [{ total: '0', via_trial: '0', direct: '0' }] });

      const result = await analyticsService.getBusinessConversionFunnel(dateRange);

      expect(result.totalVisitors).toBe(0);
      expect(result.overallConversion).toBe(0);
    });

    it('should include internal users when excludeInternal is false', async () => {
      sql.mockResolvedValueOnce({ rows: [{ count: '10' }] });
      sql.mockResolvedValueOnce({ rows: [{ count: '10' }] });
      sql.mockResolvedValueOnce({ rows: [{ count: '10' }] });
      sql.mockResolvedValueOnce({ rows: [{ total: '10', campaign: '5', individual: '5' }] });
      sql.mockResolvedValueOnce({ rows: [{ total: '10', via_trial: '8', direct: '2' }] });

      await analyticsService.getBusinessConversionFunnel({ ...dateRange, excludeInternal: false });

      // 5 queries: visitors, engaged, signups, trials, paid
      expect(sql).toHaveBeenCalledTimes(5);
    });
  });

  // ============================================================================
  // EVENTS WITH MULTIPLE EVENT NAMES FILTER
  // ============================================================================

  describe('getEvents with eventNames array', () => {
    const options = {
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
      page: 1,
      limit: 50,
    };

    it('should filter by multiple event names', async () => {
      sql.mockResolvedValueOnce({ rows: [] });
      sql.mockResolvedValueOnce({ rows: [{ total: '0' }] });

      await analyticsService.getEvents({
        ...options,
        eventNames: ['session_start', 'code_input', 'generation_completed'],
      });

      expect(sql).toHaveBeenCalledTimes(2);
    });

    it('should filter by category and multiple event names', async () => {
      sql.mockResolvedValueOnce({ rows: [] });
      sql.mockResolvedValueOnce({ rows: [{ total: '0' }] });

      await analyticsService.getEvents({
        ...options,
        category: 'funnel',
        eventNames: ['session_start', 'code_input'],
      });

      expect(sql).toHaveBeenCalledTimes(2);
    });

    it('should filter by category, event names, and excludeInternal', async () => {
      sql.mockResolvedValueOnce({ rows: [] });
      sql.mockResolvedValueOnce({ rows: [{ total: '0' }] });

      await analyticsService.getEvents({
        ...options,
        category: 'funnel',
        eventNames: ['session_start'],
        excludeInternal: true,
      });

      expect(sql).toHaveBeenCalledTimes(2);
    });

    it('should filter by event names and excludeInternal without category', async () => {
      sql.mockResolvedValueOnce({ rows: [] });
      sql.mockResolvedValueOnce({ rows: [{ total: '0' }] });

      await analyticsService.getEvents({
        ...options,
        eventNames: ['doc_generation', 'batch_generation'],
        excludeInternal: true,
      });

      expect(sql).toHaveBeenCalledTimes(2);
    });

    it('should filter by category and excludeInternal without event names', async () => {
      sql.mockResolvedValueOnce({ rows: [] });
      sql.mockResolvedValueOnce({ rows: [{ total: '0' }] });

      await analyticsService.getEvents({
        ...options,
        category: 'usage',
        excludeInternal: true,
      });

      expect(sql).toHaveBeenCalledTimes(2);
    });

    it('should filter by only event names without excludeInternal', async () => {
      sql.mockResolvedValueOnce({ rows: [] });
      sql.mockResolvedValueOnce({ rows: [{ total: '0' }] });

      await analyticsService.getEvents({
        ...options,
        eventNames: ['signup', 'tier_upgrade'],
      });

      expect(sql).toHaveBeenCalledTimes(2);
    });

    it('should filter by only excludeInternal without category or event names', async () => {
      sql.mockResolvedValueOnce({ rows: [] });
      sql.mockResolvedValueOnce({ rows: [{ total: '0' }] });

      await analyticsService.getEvents({
        ...options,
        excludeInternal: true,
      });

      expect(sql).toHaveBeenCalledTimes(2);
    });

    it('should handle empty eventNames array as no filter', async () => {
      sql.mockResolvedValueOnce({ rows: [] });
      sql.mockResolvedValueOnce({ rows: [{ total: '0' }] });

      await analyticsService.getEvents({
        ...options,
        eventNames: [],
      });

      expect(sql).toHaveBeenCalledTimes(2);
    });
  });

  // ============================================================================
  // USAGE PATTERNS EDGE CASES
  // ============================================================================

  describe('getUsagePatterns edge cases', () => {
    const dateRange = {
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
    };

    it('should handle empty results for all queries', async () => {
      sql.mockResolvedValue({ rows: [] });

      const result = await analyticsService.getUsagePatterns(dateRange);

      expect(result.docTypes).toEqual([]);
      expect(result.qualityScores).toEqual([]);
      expect(result.batchVsSingle).toEqual({ single: 0, batch: 0 });
      expect(result.languages).toEqual([]);
      expect(result.origins).toEqual([]);
    });

    it('should exclude internal when specified', async () => {
      sql.mockResolvedValue({ rows: [] });

      await analyticsService.getUsagePatterns({ ...dateRange, excludeInternal: true });

      expect(sql).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // TIME SERIES EDGE CASES
  // ============================================================================

  describe('getTimeSeries edge cases', () => {
    const options = {
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
      interval: 'day',
    };

    it('should exclude internal when specified', async () => {
      sql.mockResolvedValue({ rows: [] });

      await analyticsService.getTimeSeries({ ...options, metric: 'sessions', excludeInternal: true });

      expect(sql).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // PERFORMANCE METRICS
  // ============================================================================

  describe('getPerformanceMetrics', () => {
    const dateRange = {
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
    };

    it('should return performance metrics with exclude internal', async () => {
      // Mock all three queries (metrics, provider, model)
      sql.mockResolvedValueOnce({
        rows: [{
          total_generations: '100',
          avg_latency_ms: '1500',
          median_latency_ms: '1200',
          p95_latency_ms: '3500',
          cached_count: '30',
          total_input_tokens: '50000',
          total_output_tokens: '75000',
          total_latency_ms: '150000',
        }],
      });
      sql.mockResolvedValueOnce({
        rows: [
          { provider: 'claude', count: '80', avg_latency_ms: '1400', cached_count: '25' },
          { provider: 'openai', count: '20', avg_latency_ms: '1900', cached_count: '5' },
        ],
      });
      sql.mockResolvedValueOnce({
        rows: [
          { model: 'claude-sonnet-4', count: '60', avg_latency_ms: '1300' },
          { model: 'gpt-5', count: '40', avg_latency_ms: '1800' },
        ],
      });

      const result = await analyticsService.getPerformanceMetrics(dateRange);

      expect(sql).toHaveBeenCalledTimes(3);
      expect(result.totalGenerations).toBe(100);
      expect(result.avgLatencyMs).toBe(1500);
      expect(result.medianLatencyMs).toBe(1200);
      expect(result.p95LatencyMs).toBe(3500);
      expect(result.cacheHitRate).toBe(30);
      expect(result.totalInputTokens).toBe(50000);
      expect(result.totalOutputTokens).toBe(75000);
      expect(result.providerBreakdown).toHaveProperty('claude');
      expect(result.providerBreakdown.claude.count).toBe(80);
      expect(result.modelUsage).toHaveProperty('claude-sonnet-4');
      expect(result.modelUsage['claude-sonnet-4'].count).toBe(60);
    });

    it('should handle empty results', async () => {
      sql.mockResolvedValue({ rows: [{}] });

      const result = await analyticsService.getPerformanceMetrics(dateRange);

      expect(result.totalGenerations).toBe(0);
      expect(result.avgLatencyMs).toBe(0);
      expect(result.cacheHitRate).toBe(0);
      expect(result.avgThroughput).toBe(0);
    });

    it('should include all users when excludeInternal is false', async () => {
      sql.mockResolvedValue({ rows: [{}] });

      await analyticsService.getPerformanceMetrics({ ...dateRange, excludeInternal: false });

      expect(sql).toHaveBeenCalledTimes(3);
    });

    it('should calculate throughput correctly', async () => {
      sql.mockResolvedValueOnce({
        rows: [{
          total_generations: '10',
          avg_latency_ms: '1000',
          median_latency_ms: '900',
          p95_latency_ms: '2000',
          cached_count: '2',
          total_input_tokens: '5000',
          total_output_tokens: '10000',
          total_latency_ms: '10000', // 10 seconds total
        }],
      });
      sql.mockResolvedValue({ rows: [] });

      const result = await analyticsService.getPerformanceMetrics(dateRange);

      // 10000 tokens / 10 seconds = 1000 tokens/sec
      expect(result.avgThroughput).toBe(1000);
    });
  });

  // ============================================================================
  // PERFORMANCE TIME SERIES METRICS
  // ============================================================================

  describe('getTimeSeries performance metrics', () => {
    const options = {
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
      interval: 'day',
    };

    it('should return latency time series', async () => {
      sql.mockResolvedValue({
        rows: [
          { date: new Date('2024-01-01'), value: '1500' },
          { date: new Date('2024-01-02'), value: '1400' },
          { date: new Date('2024-01-03'), value: '1600' },
        ],
      });

      const result = await analyticsService.getTimeSeries({ ...options, metric: 'latency' });

      expect(sql).toHaveBeenCalled();
      expect(result.length).toBe(3);
      expect(result[0]).toHaveProperty('date');
      expect(result[0]).toHaveProperty('value');
    });

    it('should return cache hit rate time series', async () => {
      sql.mockResolvedValue({
        rows: [
          { date: new Date('2024-01-01'), value: '25.5' },
          { date: new Date('2024-01-02'), value: '30.0' },
        ],
      });

      const result = await analyticsService.getTimeSeries({ ...options, metric: 'cache_hit_rate' });

      expect(sql).toHaveBeenCalled();
      expect(result.length).toBe(2);
    });

    it('should return throughput time series', async () => {
      sql.mockResolvedValue({
        rows: [
          { date: new Date('2024-01-01'), value: '500' },
          { date: new Date('2024-01-02'), value: '600' },
        ],
      });

      const result = await analyticsService.getTimeSeries({ ...options, metric: 'throughput' });

      expect(sql).toHaveBeenCalled();
      expect(result.length).toBe(2);
    });

    it('should exclude internal users for performance metrics', async () => {
      sql.mockResolvedValue({ rows: [] });

      await analyticsService.getTimeSeries({ ...options, metric: 'latency', excludeInternal: true });

      expect(sql).toHaveBeenCalled();
    });

    it('should include all users for performance metrics when excludeInternal is false', async () => {
      sql.mockResolvedValue({ rows: [] });

      await analyticsService.getTimeSeries({ ...options, metric: 'cache_hit_rate', excludeInternal: false });

      expect(sql).toHaveBeenCalled();
    });

    it('should throw error for invalid metric', async () => {
      await expect(
        analyticsService.getTimeSeries({ ...options, metric: 'invalid_metric' })
      ).rejects.toThrow('Invalid metric: invalid_metric');
    });
  });

  // ============================================================================
  // CSV EXPORT UTILITIES
  // ============================================================================

  describe('CSV Export utilities', () => {
    describe('getNestedValue', () => {
      it('should get top-level value', () => {
        const obj = { foo: 'bar' };
        expect(analyticsService.getNestedValue(obj, 'foo')).toBe('bar');
      });

      it('should get nested value', () => {
        const obj = { latency: { ttft_ms: 100, total_ms: 500 } };
        expect(analyticsService.getNestedValue(obj, 'latency.ttft_ms')).toBe(100);
      });

      it('should return undefined for missing path', () => {
        const obj = { foo: 'bar' };
        expect(analyticsService.getNestedValue(obj, 'missing')).toBeUndefined();
      });

      it('should return undefined for null object', () => {
        expect(analyticsService.getNestedValue(null, 'foo')).toBeUndefined();
      });

      it('should return undefined for empty path', () => {
        expect(analyticsService.getNestedValue({ foo: 'bar' }, '')).toBeUndefined();
      });
    });

    describe('normalizeValue', () => {
      it('should return empty string for null', () => {
        expect(analyticsService.normalizeValue(null)).toBe('');
      });

      it('should return empty string for undefined', () => {
        expect(analyticsService.normalizeValue(undefined)).toBe('');
      });

      it('should stringify boolean true', () => {
        expect(analyticsService.normalizeValue(true)).toBe('true');
      });

      it('should stringify boolean false', () => {
        expect(analyticsService.normalizeValue(false)).toBe('false');
      });

      it('should JSON stringify objects', () => {
        expect(analyticsService.normalizeValue({ foo: 'bar' })).toBe('{"foo":"bar"}');
      });

      it('should convert numbers to string', () => {
        expect(analyticsService.normalizeValue(42)).toBe('42');
      });

      it('should return strings as-is', () => {
        expect(analyticsService.normalizeValue('hello')).toBe('hello');
      });
    });

    describe('escapeCSV', () => {
      it('should return simple value as-is', () => {
        expect(analyticsService.escapeCSV('hello')).toBe('hello');
      });

      it('should quote value with comma', () => {
        expect(analyticsService.escapeCSV('hello,world')).toBe('"hello,world"');
      });

      it('should quote value with newline', () => {
        expect(analyticsService.escapeCSV('hello\nworld')).toBe('"hello\nworld"');
      });

      it('should escape quotes', () => {
        expect(analyticsService.escapeCSV('say "hello"')).toBe('"say ""hello"""');
      });

      it('should handle carriage return', () => {
        expect(analyticsService.escapeCSV('line1\rline2')).toBe('"line1\rline2"');
      });
    });

    describe('FIXED_COLUMNS', () => {
      it('should have expected columns', () => {
        expect(analyticsService.FIXED_COLUMNS).toContain('id');
        expect(analyticsService.FIXED_COLUMNS).toContain('event_name');
        expect(analyticsService.FIXED_COLUMNS).toContain('event_category');
        expect(analyticsService.FIXED_COLUMNS).toContain('session_id');
        expect(analyticsService.FIXED_COLUMNS).toContain('user_id');
        expect(analyticsService.FIXED_COLUMNS).toContain('user_email');
        expect(analyticsService.FIXED_COLUMNS).toContain('created_at');
      });
    });

    describe('EXPORT_LIMITS', () => {
      it('should have max days of 90', () => {
        expect(analyticsService.EXPORT_LIMITS.MAX_DAYS).toBe(90);
      });

      it('should have max rows of 100000', () => {
        expect(analyticsService.EXPORT_LIMITS.MAX_ROWS).toBe(100000);
      });

      it('should have batch size of 1000', () => {
        expect(analyticsService.EXPORT_LIMITS.BATCH_SIZE).toBe(1000);
      });
    });
  });

  describe('discoverEventSchema', () => {
    const dateRange = {
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
    };

    it('should discover unique JSONB paths', async () => {
      sql.mockResolvedValue({
        rows: [
          { path: 'doc_type' },
          { path: 'latency.total_ms' },
          { path: 'latency.ttft_ms' },
          { path: 'success' },
        ],
      });

      const result = await analyticsService.discoverEventSchema(dateRange);

      expect(result).toEqual(['doc_type', 'latency.total_ms', 'latency.ttft_ms', 'success']);
      expect(sql).toHaveBeenCalled();
    });

    it('should return empty array when no keys found', async () => {
      sql.mockResolvedValue({ rows: [] });

      const result = await analyticsService.discoverEventSchema(dateRange);

      expect(result).toEqual([]);
    });

    it('should handle category filter', async () => {
      sql.mockResolvedValue({ rows: [] });

      await analyticsService.discoverEventSchema({ ...dateRange, category: 'funnel' });

      expect(sql).toHaveBeenCalled();
    });

    it('should handle eventNames filter', async () => {
      sql.mockResolvedValue({ rows: [] });

      await analyticsService.discoverEventSchema({ ...dateRange, eventNames: ['session_start', 'code_input'] });

      expect(sql).toHaveBeenCalled();
    });

    it('should handle excludeInternal filter', async () => {
      sql.mockResolvedValue({ rows: [] });

      await analyticsService.discoverEventSchema({ ...dateRange, excludeInternal: true });

      expect(sql).toHaveBeenCalled();
    });
  });

  describe('fetchEventBatch', () => {
    const options = {
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
      offset: 0,
      limit: 1000,
    };

    it('should fetch batch of events', async () => {
      sql.mockResolvedValue({
        rows: [
          {
            id: 'uuid-1',
            event_name: 'session_start',
            event_category: 'funnel',
            session_id: 'sess-1',
            user_id: 1,
            ip_address: '192.168.1.1',
            event_data: { referrer: 'google' },
            is_internal: false,
            created_at: new Date('2024-01-15'),
            user_email: 'test@example.com',
          },
        ],
      });

      const result = await analyticsService.fetchEventBatch(options);

      expect(result.length).toBe(1);
      expect(result[0].event_name).toBe('session_start');
      expect(result[0].user_email).toBe('test@example.com');
    });

    it('should filter by category', async () => {
      sql.mockResolvedValue({ rows: [] });

      await analyticsService.fetchEventBatch({ ...options, category: 'funnel' });

      expect(sql).toHaveBeenCalled();
    });

    it('should filter by eventNames', async () => {
      sql.mockResolvedValue({ rows: [] });

      await analyticsService.fetchEventBatch({ ...options, eventNames: ['session_start'] });

      expect(sql).toHaveBeenCalled();
    });

    it('should exclude internal users', async () => {
      sql.mockResolvedValue({ rows: [] });

      await analyticsService.fetchEventBatch({ ...options, excludeInternal: true });

      expect(sql).toHaveBeenCalled();
    });
  });

  describe('streamEventsToCSV', () => {
    const options = {
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
    };

    it('should write CSV header and rows', async () => {
      // Mock schema discovery
      sql.mockResolvedValueOnce({
        rows: [{ path: 'doc_type' }, { path: 'success' }],
      });
      // Mock event batch
      sql.mockResolvedValueOnce({
        rows: [{
          id: 'uuid-1',
          event_name: 'doc_generation',
          event_category: 'usage',
          session_id: 'sess-1',
          user_id: 1,
          ip_address: '192.168.1.1',
          event_data: { doc_type: 'README', success: true },
          is_internal: false,
          created_at: new Date('2024-01-15'),
          user_email: 'test@example.com',
        }],
      });
      // Mock empty batch (end of data)
      sql.mockResolvedValueOnce({ rows: [] });

      const mockRes = {
        write: jest.fn(),
      };

      await analyticsService.streamEventsToCSV({ ...options, res: mockRes });

      // Verify header was written
      expect(mockRes.write).toHaveBeenCalledWith(expect.stringContaining('id,event_name,event_category'));
      // Verify variant columns in header
      expect(mockRes.write).toHaveBeenCalledWith(expect.stringContaining('v_doc_type,v_success'));
      // Verify data row was written
      expect(mockRes.write).toHaveBeenCalledWith(expect.stringContaining('uuid-1'));
    });

    it('should handle empty data', async () => {
      sql.mockResolvedValueOnce({ rows: [] }); // No schema
      sql.mockResolvedValueOnce({ rows: [] }); // No events

      const mockRes = {
        write: jest.fn(),
      };

      await analyticsService.streamEventsToCSV({ ...options, res: mockRes });

      // Should write header even with no data
      expect(mockRes.write).toHaveBeenCalled();
    });
  });
});
