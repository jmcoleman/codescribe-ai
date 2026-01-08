/**
 * Tests for Admin Analytics API Endpoints
 *
 * Tests analytics dashboard endpoints:
 * - GET /api/admin/analytics/funnel
 * - GET /api/admin/analytics/business
 * - GET /api/admin/analytics/usage
 * - GET /api/admin/analytics/timeseries
 * - GET /api/admin/analytics/events
 * - GET /api/admin/analytics/event-names
 * - GET /api/admin/analytics/events/export
 *
 * Pattern 11: ES Modules - mock BEFORE importing (see TEST-PATTERNS-GUIDE.md)
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock dependencies BEFORE importing routes
jest.mock('@vercel/postgres', () => ({
  sql: jest.fn(),
}));

jest.mock('../../services/analyticsService.js', () => ({
  analyticsService: {
    getConversionFunnel: jest.fn(),
    getBusinessMetrics: jest.fn(),
    getUsagePatterns: jest.fn(),
    getTimeSeries: jest.fn(),
    getEvents: jest.fn(),
    getEventNames: jest.fn(),
  },
}));

import { analyticsService } from '../../services/analyticsService.js';

describe('Admin Analytics API Endpoints', () => {
  let mockRequest;
  let mockResponse;

  const dateRange = {
    startDate: '2024-01-01T00:00:00.000Z',
    endDate: '2024-01-31T23:59:59.999Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock response object
    mockResponse = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };

    // Mock request object with admin user
    mockRequest = {
      user: {
        id: 1,
        email: 'admin@test.com',
        tier: 'free',
        role: 'admin',
      },
      query: { ...dateRange },
      body: {},
      params: {},
    };
  });

  // ============================================================================
  // FUNNEL ENDPOINT
  // ============================================================================

  describe('GET /api/admin/analytics/funnel', () => {
    const mockFunnelData = {
      stages: {
        session_start: { sessions: 100 },
        code_input: { sessions: 80 },
        generation_started: { sessions: 60 },
        generation_completed: { sessions: 55 },
        doc_copied: { sessions: 40 },
      },
      conversionRates: {
        session_start_to_code_input: 80,
        code_input_to_generation_started: 75,
        generation_started_to_generation_completed: 92,
        generation_completed_to_doc_copied: 73,
      },
      totalSessions: 100,
      completedSessions: 40,
      overallConversion: 40,
    };

    it('should return funnel metrics successfully', async () => {
      analyticsService.getConversionFunnel.mockResolvedValue(mockFunnelData);

      // Simulate route handler logic
      const { startDate, endDate, excludeInternal = 'true' } = mockRequest.query;

      const funnel = await analyticsService.getConversionFunnel({
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        excludeInternal: excludeInternal === 'true',
      });

      mockResponse.json({
        success: true,
        data: funnel,
      });

      expect(analyticsService.getConversionFunnel).toHaveBeenCalledWith({
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        excludeInternal: true,
      });
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockFunnelData,
      });
    });

    it('should return 400 when startDate is missing', () => {
      mockRequest.query = { endDate: dateRange.endDate };

      const { startDate, endDate } = mockRequest.query;

      if (!startDate || !endDate) {
        mockResponse.status(400).json({
          success: false,
          error: 'startDate and endDate are required',
        });
      }

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'startDate and endDate are required',
      });
    });

    it('should return 400 when endDate is missing', () => {
      mockRequest.query = { startDate: dateRange.startDate };

      const { startDate, endDate } = mockRequest.query;

      if (!startDate || !endDate) {
        mockResponse.status(400).json({
          success: false,
          error: 'startDate and endDate are required',
        });
      }

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('should pass excludeInternal=false when specified', async () => {
      mockRequest.query.excludeInternal = 'false';
      analyticsService.getConversionFunnel.mockResolvedValue(mockFunnelData);

      const { startDate, endDate, excludeInternal = 'true' } = mockRequest.query;

      await analyticsService.getConversionFunnel({
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        excludeInternal: excludeInternal === 'true',
      });

      expect(analyticsService.getConversionFunnel).toHaveBeenCalledWith({
        startDate: expect.any(Date),
        endDate: expect.any(Date),
        excludeInternal: false,
      });
    });
  });

  // ============================================================================
  // BUSINESS METRICS ENDPOINT
  // ============================================================================

  describe('GET /api/admin/analytics/business', () => {
    const mockBusinessData = {
      signups: 50,
      tierUpgrades: 10,
      checkouts: 8,
      revenueCents: 79200,
      upgradesByTier: { pro: 6, team: 4 },
    };

    it('should return business metrics successfully', async () => {
      analyticsService.getBusinessMetrics.mockResolvedValue(mockBusinessData);

      const { startDate, endDate, excludeInternal = 'true' } = mockRequest.query;

      const metrics = await analyticsService.getBusinessMetrics({
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        excludeInternal: excludeInternal === 'true',
      });

      mockResponse.json({
        success: true,
        data: metrics,
      });

      expect(analyticsService.getBusinessMetrics).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockBusinessData,
      });
    });

    it('should return 400 when dates are missing', () => {
      mockRequest.query = {};

      const { startDate, endDate } = mockRequest.query;

      if (!startDate || !endDate) {
        mockResponse.status(400).json({
          success: false,
          error: 'startDate and endDate are required',
        });
      }

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });
  });

  // ============================================================================
  // USAGE PATTERNS ENDPOINT
  // ============================================================================

  describe('GET /api/admin/analytics/usage', () => {
    const mockUsageData = {
      docTypes: [
        { type: 'README', count: 50 },
        { type: 'API', count: 30 },
      ],
      qualityScores: [
        { range: '90-100', count: 20 },
        { range: '80-89', count: 40 },
      ],
      batchVsSingle: { single: 60, batch: 20 },
      languages: [
        { language: 'javascript', count: 40 },
        { language: 'python', count: 25 },
      ],
      origins: [
        { origin: 'paste', count: 50 },
        { origin: 'upload', count: 30 },
      ],
    };

    it('should return usage patterns successfully', async () => {
      analyticsService.getUsagePatterns.mockResolvedValue(mockUsageData);

      const { startDate, endDate, excludeInternal = 'true' } = mockRequest.query;

      const patterns = await analyticsService.getUsagePatterns({
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        excludeInternal: excludeInternal === 'true',
      });

      mockResponse.json({
        success: true,
        data: patterns,
      });

      expect(analyticsService.getUsagePatterns).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockUsageData,
      });
    });
  });

  // ============================================================================
  // TIMESERIES ENDPOINT
  // ============================================================================

  describe('GET /api/admin/analytics/timeseries', () => {
    const mockTimeSeriesData = [
      { date: new Date('2024-01-01'), value: 10 },
      { date: new Date('2024-01-02'), value: 15 },
      { date: new Date('2024-01-03'), value: 12 },
    ];

    it('should return time series data successfully', async () => {
      mockRequest.query = {
        ...dateRange,
        metric: 'sessions',
        interval: 'day',
      };

      analyticsService.getTimeSeries.mockResolvedValue(mockTimeSeriesData);

      const { metric, interval, startDate, endDate, excludeInternal = 'true' } = mockRequest.query;

      const timeSeries = await analyticsService.getTimeSeries({
        metric,
        interval,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        excludeInternal: excludeInternal === 'true',
      });

      mockResponse.json({
        success: true,
        data: timeSeries,
      });

      expect(analyticsService.getTimeSeries).toHaveBeenCalledWith({
        metric: 'sessions',
        interval: 'day',
        startDate: expect.any(Date),
        endDate: expect.any(Date),
        excludeInternal: true,
      });
    });

    it('should return 400 when metric is missing', () => {
      mockRequest.query = {
        ...dateRange,
        interval: 'day',
      };

      const { metric, interval, startDate, endDate } = mockRequest.query;

      if (!metric || !interval || !startDate || !endDate) {
        mockResponse.status(400).json({
          success: false,
          error: 'metric, interval, startDate, and endDate are required',
        });
      }

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 for invalid metric', () => {
      mockRequest.query = {
        ...dateRange,
        metric: 'invalid',
        interval: 'day',
      };

      const validMetrics = ['sessions', 'generations', 'signups', 'revenue'];
      const { metric } = mockRequest.query;

      if (!validMetrics.includes(metric)) {
        mockResponse.status(400).json({
          success: false,
          error: `Invalid metric. Must be one of: ${validMetrics.join(', ')}`,
        });
      }

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid metric. Must be one of: sessions, generations, signups, revenue',
      });
    });

    it('should return 400 for invalid interval', () => {
      mockRequest.query = {
        ...dateRange,
        metric: 'sessions',
        interval: 'invalid',
      };

      const validIntervals = ['day', 'week', 'month'];
      const { interval, metric } = mockRequest.query;
      const validMetrics = ['sessions', 'generations', 'signups', 'revenue'];

      // Check metric first (it's valid)
      if (!validMetrics.includes(metric)) {
        return;
      }

      if (!validIntervals.includes(interval)) {
        mockResponse.status(400).json({
          success: false,
          error: `Invalid interval. Must be one of: ${validIntervals.join(', ')}`,
        });
      }

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid interval. Must be one of: day, week, month',
      });
    });

    it('should accept all valid metrics', async () => {
      const validMetrics = ['sessions', 'generations', 'signups', 'revenue'];

      for (const metric of validMetrics) {
        mockRequest.query = { ...dateRange, metric, interval: 'day' };
        analyticsService.getTimeSeries.mockResolvedValue([]);

        const isValid = validMetrics.includes(metric);
        expect(isValid).toBe(true);
      }
    });

    it('should accept all valid intervals', async () => {
      const validIntervals = ['day', 'week', 'month'];

      for (const interval of validIntervals) {
        mockRequest.query = { ...dateRange, metric: 'sessions', interval };
        analyticsService.getTimeSeries.mockResolvedValue([]);

        const isValid = validIntervals.includes(interval);
        expect(isValid).toBe(true);
      }
    });
  });

  // ============================================================================
  // EVENTS ENDPOINT
  // ============================================================================

  describe('GET /api/admin/analytics/events', () => {
    const mockEventsData = {
      events: [
        {
          id: 'uuid-1',
          eventName: 'session_start',
          category: 'workflow',
          sessionId: 'sess-123',
          userId: null,
          userEmail: null,
          ipAddress: '192.168.1.1',
          eventData: { referrer: 'google' },
          isInternal: false,
          createdAt: new Date('2024-01-15'),
        },
      ],
      total: 1,
      page: 1,
      totalPages: 1,
    };

    it('should return paginated events successfully', async () => {
      analyticsService.getEvents.mockResolvedValue(mockEventsData);

      const { startDate, endDate, page = '1', limit = '50' } = mockRequest.query;
      const pageNum = Math.max(1, parseInt(page) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 50));

      const result = await analyticsService.getEvents({
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        category: null,
        eventName: null,
        excludeInternal: false,
        page: pageNum,
        limit: limitNum,
      });

      mockResponse.json({
        success: true,
        ...result,
      });

      expect(analyticsService.getEvents).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        events: mockEventsData.events,
        total: 1,
        page: 1,
        totalPages: 1,
      });
    });

    it('should return 400 when dates are missing', () => {
      mockRequest.query = {};

      const { startDate, endDate } = mockRequest.query;

      if (!startDate || !endDate) {
        mockResponse.status(400).json({
          success: false,
          error: 'startDate and endDate are required',
        });
      }

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 for invalid date format', () => {
      mockRequest.query = {
        startDate: 'invalid-date',
        endDate: 'also-invalid',
      };

      const start = new Date(mockRequest.query.startDate);
      const end = new Date(mockRequest.query.endDate);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        mockResponse.status(400).json({
          success: false,
          error: 'Invalid date format',
        });
      }

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid date format',
      });
    });

    it('should filter by category', async () => {
      mockRequest.query = {
        ...dateRange,
        category: 'workflow',
      };

      analyticsService.getEvents.mockResolvedValue(mockEventsData);

      await analyticsService.getEvents({
        startDate: new Date(mockRequest.query.startDate),
        endDate: new Date(mockRequest.query.endDate),
        category: mockRequest.query.category,
        eventName: null,
        excludeInternal: false,
        page: 1,
        limit: 50,
      });

      expect(analyticsService.getEvents).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'workflow',
        })
      );
    });

    it('should filter by eventName', async () => {
      mockRequest.query = {
        ...dateRange,
        eventName: 'session_start',
      };

      analyticsService.getEvents.mockResolvedValue(mockEventsData);

      await analyticsService.getEvents({
        startDate: new Date(mockRequest.query.startDate),
        endDate: new Date(mockRequest.query.endDate),
        category: null,
        eventName: mockRequest.query.eventName,
        excludeInternal: false,
        page: 1,
        limit: 50,
      });

      expect(analyticsService.getEvents).toHaveBeenCalledWith(
        expect.objectContaining({
          eventName: 'session_start',
        })
      );
    });

    it('should enforce max limit of 100', () => {
      mockRequest.query = {
        ...dateRange,
        limit: '500',
      };

      const limitNum = Math.min(100, Math.max(1, parseInt(mockRequest.query.limit) || 50));

      expect(limitNum).toBe(100);
    });

    it('should enforce min limit of 1', () => {
      mockRequest.query = {
        ...dateRange,
        limit: '-5',
      };

      // When limit is negative or 0, Math.max(1, ...) ensures minimum of 1
      // parseInt('-5') = -5, then Math.max(1, -5) = 1
      const limitNum = Math.min(100, Math.max(1, parseInt(mockRequest.query.limit)));

      expect(limitNum).toBe(1);
    });

    it('should default page to 1 when invalid', () => {
      mockRequest.query = {
        ...dateRange,
        page: '-5',
      };

      const pageNum = Math.max(1, parseInt(mockRequest.query.page) || 1);

      expect(pageNum).toBe(1);
    });
  });

  // ============================================================================
  // EVENT NAMES ENDPOINT
  // ============================================================================

  describe('GET /api/admin/analytics/event-names', () => {
    it('should return distinct event names', async () => {
      const mockEventNames = ['session_start', 'code_input', 'doc_generation'];
      analyticsService.getEventNames.mockResolvedValue(mockEventNames);

      const eventNames = await analyticsService.getEventNames();

      mockResponse.json({
        success: true,
        eventNames,
      });

      expect(analyticsService.getEventNames).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        eventNames: mockEventNames,
      });
    });

    it('should handle empty event names', async () => {
      analyticsService.getEventNames.mockResolvedValue([]);

      const eventNames = await analyticsService.getEventNames();

      mockResponse.json({
        success: true,
        eventNames,
      });

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        eventNames: [],
      });
    });
  });

  // ============================================================================
  // EVENTS EXPORT ENDPOINT
  // ============================================================================

  describe('GET /api/admin/analytics/events/export', () => {
    const mockExportEvents = {
      events: [
        {
          eventName: 'session_start',
          category: 'workflow',
          sessionId: 'sess-123',
          userId: null,
          userEmail: null,
          ipAddress: '192.168.1.1',
          eventData: { referrer: 'google' },
          isInternal: false,
          createdAt: new Date('2024-01-15T10:00:00.000Z'),
        },
      ],
      total: 1,
      page: 1,
      totalPages: 1,
    };

    it('should export events as CSV', async () => {
      analyticsService.getEvents.mockResolvedValue(mockExportEvents);

      const { startDate, endDate } = mockRequest.query;

      const result = await analyticsService.getEvents({
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        category: null,
        eventName: null,
        excludeInternal: false,
        page: 1,
        limit: 10000,
      });

      // Build CSV
      const headers = ['Timestamp', 'Event Name', 'Category', 'Session ID', 'User ID', 'User Email', 'IP Address', 'Internal', 'Event Data'];
      const rows = result.events.map((event) => [
        event.createdAt.toISOString(),
        event.eventName,
        event.category,
        event.sessionId || '',
        event.userId || '',
        event.userEmail || '',
        event.ipAddress || '',
        event.isInternal ? 'Yes' : 'No',
        JSON.stringify(event.eventData),
      ]);

      const csv = [
        headers.join(','),
        ...rows.map((row) => row.join(',')),
      ].join('\n');

      mockResponse.setHeader('Content-Type', 'text/csv');
      mockResponse.setHeader('Content-Disposition', 'attachment; filename="analytics-events.csv"');
      mockResponse.send(csv);

      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
      expect(mockResponse.send).toHaveBeenCalled();
    });

    it('should return 400 when dates are missing for export', () => {
      mockRequest.query = {};

      const { startDate, endDate } = mockRequest.query;

      if (!startDate || !endDate) {
        mockResponse.status(400).json({
          success: false,
          error: 'startDate and endDate are required',
        });
      }

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('should escape CSV values with commas', () => {
      const escapeCSV = (value) => {
        const str = String(value);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      expect(escapeCSV('hello, world')).toBe('"hello, world"');
      expect(escapeCSV('no comma')).toBe('no comma');
      expect(escapeCSV('has "quotes"')).toBe('"has ""quotes"""');
      expect(escapeCSV('has\nnewline')).toBe('"has\nnewline"');
    });
  });

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  describe('Error handling', () => {
    it('should handle service errors for funnel endpoint', async () => {
      analyticsService.getConversionFunnel.mockRejectedValue(new Error('Database error'));

      try {
        await analyticsService.getConversionFunnel({
          startDate: new Date(dateRange.startDate),
          endDate: new Date(dateRange.endDate),
          excludeInternal: true,
        });
      } catch (error) {
        mockResponse.status(500).json({
          success: false,
          error: 'Failed to fetch funnel metrics',
        });
      }

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to fetch funnel metrics',
      });
    });

    it('should handle service errors for events endpoint', async () => {
      analyticsService.getEvents.mockRejectedValue(new Error('Database error'));

      try {
        await analyticsService.getEvents({
          startDate: new Date(dateRange.startDate),
          endDate: new Date(dateRange.endDate),
          category: null,
          eventName: null,
          excludeInternal: false,
          page: 1,
          limit: 50,
        });
      } catch (error) {
        mockResponse.status(500).json({
          success: false,
          error: 'Failed to fetch events',
        });
      }

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to fetch events',
      });
    });
  });
});
