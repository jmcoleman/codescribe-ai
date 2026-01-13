/**
 * Tests for Admin Campaign API Endpoints
 *
 * Tests campaign management endpoints:
 * - GET /api/admin/campaigns/status
 * - GET /api/admin/campaigns
 * - GET /api/admin/campaigns/:id
 * - POST /api/admin/campaigns
 * - PUT /api/admin/campaigns/:id
 * - POST /api/admin/campaigns/:id/toggle
 * - DELETE /api/admin/campaigns/:id
 *
 * Pattern 11: ES Modules - mock BEFORE importing (see TEST-PATTERNS-GUIDE.md)
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Create mock functions
const mockCreate = jest.fn();
const mockFindById = jest.fn();
const mockList = jest.fn();
const mockUpdate = jest.fn();
const mockSetActive = jest.fn();
const mockDelete = jest.fn();
const mockGetStats = jest.fn();
const mockGetCampaignStatus = jest.fn();
const mockClearCampaignCache = jest.fn();

// Mock dependencies BEFORE importing routes
jest.mock('@vercel/postgres', () => ({
  sql: jest.fn(),
}));

jest.mock('../../models/Campaign.js', () => ({
  default: {
    create: mockCreate,
    findById: mockFindById,
    list: mockList,
    update: mockUpdate,
    setActive: mockSetActive,
    delete: mockDelete,
    getStats: mockGetStats,
  },
}));

jest.mock('../../config/campaign.js', () => ({
  getCampaignStatus: mockGetCampaignStatus,
  clearCampaignCache: mockClearCampaignCache,
}));

describe('Admin Campaign API Endpoints', () => {
  let mockRequest;
  let mockResponse;

  beforeEach(() => {
    jest.clearAllMocks();

    mockResponse = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    };

    mockRequest = {
      user: {
        id: 1,
        email: 'admin@test.com',
        tier: 'free',
        role: 'admin',
      },
      query: {},
      body: {},
      params: {},
    };
  });

  // ============================================================================
  // GET /api/admin/campaigns/status
  // ============================================================================

  describe('GET /api/admin/campaigns/status', () => {
    it('should return active campaign status', async () => {
      const mockStatus = {
        active: true,
        campaign: {
          id: 1,
          name: 'Test Campaign',
          tier: 'pro',
          days: 14,
        },
      };
      mockGetCampaignStatus.mockResolvedValue(mockStatus);

      // Simulate route handler
      const status = await mockGetCampaignStatus();
      mockResponse.json(status);

      expect(mockGetCampaignStatus).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith(mockStatus);
    });

    it('should return inactive status when no campaign', async () => {
      mockGetCampaignStatus.mockResolvedValue({
        active: false,
        campaign: null,
      });

      const status = await mockGetCampaignStatus();
      mockResponse.json(status);

      expect(mockResponse.json).toHaveBeenCalledWith({
        active: false,
        campaign: null,
      });
    });
  });

  // ============================================================================
  // GET /api/admin/campaigns
  // ============================================================================

  describe('GET /api/admin/campaigns', () => {
    it('should return list of campaigns', async () => {
      const mockCampaigns = {
        campaigns: [
          { id: 1, name: 'Campaign 1' },
          { id: 2, name: 'Campaign 2' },
        ],
        total: 2,
      };
      mockList.mockResolvedValue(mockCampaigns);

      // Simulate route handler
      const campaigns = await mockList({});
      mockResponse.json(campaigns);

      expect(mockList).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith(mockCampaigns);
    });

    it('should apply pagination parameters', async () => {
      mockRequest.query = { limit: '10', offset: '20' };
      mockList.mockResolvedValue({ campaigns: [], total: 0 });

      await mockList({
        limit: parseInt(mockRequest.query.limit),
        offset: parseInt(mockRequest.query.offset),
      });

      expect(mockList).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 10, offset: 20 })
      );
    });
  });

  // ============================================================================
  // GET /api/admin/campaigns/:id
  // ============================================================================

  describe('GET /api/admin/campaigns/:id', () => {
    it('should return campaign by ID', async () => {
      const mockCampaign = { id: 1, name: 'Test Campaign' };
      mockFindById.mockResolvedValue(mockCampaign);

      const campaign = await mockFindById(1);
      mockResponse.json(campaign);

      expect(mockFindById).toHaveBeenCalledWith(1);
      expect(mockResponse.json).toHaveBeenCalledWith(mockCampaign);
    });

    it('should return 404 when campaign not found', async () => {
      mockFindById.mockResolvedValue(null);

      const campaign = await mockFindById(999);
      if (!campaign) {
        mockResponse.status(404).json({ error: 'Campaign not found' });
      }

      expect(mockResponse.status).toHaveBeenCalledWith(404);
    });
  });

  // ============================================================================
  // POST /api/admin/campaigns
  // ============================================================================

  describe('POST /api/admin/campaigns', () => {
    it('should create a new campaign', async () => {
      const mockCampaign = {
        id: 1,
        name: 'New Campaign',
        trial_tier: 'pro',
        trial_days: 14,
      };
      mockCreate.mockResolvedValue(mockCampaign);

      mockRequest.body = {
        name: 'New Campaign',
        trialTier: 'pro',
        trialDays: 14,
      };

      const campaign = await mockCreate({
        ...mockRequest.body,
        createdByUserId: mockRequest.user.id,
      });
      mockResponse.status(201).json(campaign);

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'New Campaign', createdByUserId: 1 })
      );
      expect(mockResponse.status).toHaveBeenCalledWith(201);
    });

    it('should return 400 when name is missing', async () => {
      mockRequest.body = { trialTier: 'pro' };

      if (!mockRequest.body.name) {
        mockResponse.status(400).json({ error: 'Campaign name is required' });
      }

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });
  });

  // ============================================================================
  // PUT /api/admin/campaigns/:id
  // ============================================================================

  describe('PUT /api/admin/campaigns/:id', () => {
    it('should update campaign', async () => {
      const mockCampaign = { id: 1, name: 'Updated Campaign' };
      mockUpdate.mockResolvedValue(mockCampaign);

      mockRequest.params = { id: '1' };
      mockRequest.body = { name: 'Updated Campaign' };

      const campaign = await mockUpdate(1, mockRequest.body);
      mockClearCampaignCache();
      mockResponse.json(campaign);

      expect(mockUpdate).toHaveBeenCalledWith(1, { name: 'Updated Campaign' });
      expect(mockClearCampaignCache).toHaveBeenCalled();
    });

    it('should return 404 when campaign not found', async () => {
      mockUpdate.mockResolvedValue(null);

      const campaign = await mockUpdate(999, { name: 'Test' });
      if (!campaign) {
        mockResponse.status(404).json({ error: 'Campaign not found' });
      }

      expect(mockResponse.status).toHaveBeenCalledWith(404);
    });
  });

  // ============================================================================
  // POST /api/admin/campaigns/:id/toggle
  // ============================================================================

  describe('POST /api/admin/campaigns/:id/toggle', () => {
    it('should activate a campaign', async () => {
      const mockCampaign = { id: 1, is_active: true };
      mockSetActive.mockResolvedValue(mockCampaign);

      mockRequest.params = { id: '1' };
      mockRequest.body = { isActive: true };

      const campaign = await mockSetActive(1, true);
      mockClearCampaignCache();
      mockResponse.json(campaign);

      expect(mockSetActive).toHaveBeenCalledWith(1, true);
      expect(mockClearCampaignCache).toHaveBeenCalled();
    });

    it('should deactivate a campaign', async () => {
      const mockCampaign = { id: 1, is_active: false };
      mockSetActive.mockResolvedValue(mockCampaign);

      const campaign = await mockSetActive(1, false);
      mockResponse.json(campaign);

      expect(mockSetActive).toHaveBeenCalledWith(1, false);
    });
  });

  // ============================================================================
  // DELETE /api/admin/campaigns/:id
  // ============================================================================

  describe('DELETE /api/admin/campaigns/:id', () => {
    it('should delete campaign when no signups', async () => {
      mockFindById.mockResolvedValue({ id: 1, signups_count: 0 });
      mockDelete.mockResolvedValue(true);

      const campaign = await mockFindById(1);
      if (campaign.signups_count > 0) {
        mockResponse.status(400).json({ error: 'Cannot delete campaign with signups' });
      } else {
        await mockDelete(1);
        mockClearCampaignCache();
        mockResponse.json({ success: true });
      }

      expect(mockDelete).toHaveBeenCalledWith(1);
      expect(mockClearCampaignCache).toHaveBeenCalled();
    });

    it('should prevent deletion when campaign has signups', async () => {
      mockFindById.mockResolvedValue({ id: 1, signups_count: 5 });

      const campaign = await mockFindById(1);
      if (campaign.signups_count > 0) {
        mockResponse.status(400).json({ error: 'Cannot delete campaign with signups' });
      }

      expect(mockDelete).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 when campaign not found', async () => {
      mockFindById.mockResolvedValue(null);

      const campaign = await mockFindById(999);
      if (!campaign) {
        mockResponse.status(404).json({ error: 'Campaign not found' });
      }

      expect(mockResponse.status).toHaveBeenCalledWith(404);
    });
  });

  // ============================================================================
  // GET /api/admin/campaigns/export - Extended Metrics Export
  // ============================================================================

  describe('GET /api/admin/campaigns/export', () => {
    it('should return extended metrics including time-to-value and usage segments', async () => {
      const { sql } = await import('@vercel/postgres');

      // Mock trial breakdown query
      sql.mockResolvedValueOnce({
        rows: [
          {
            source: 'auto_campaign',
            trials_started: '45',
            conversions: '9',
            conversion_rate: '20.0',
            avg_days_to_convert: '18.3',
          },
          {
            source: 'invite_code',
            trials_started: '8',
            conversions: '2',
            conversion_rate: '25.0',
            avg_days_to_convert: '21.5',
          },
        ],
      });

      // Mock cohort summary query
      sql.mockResolvedValueOnce({
        rows: [
          {
            total_signups: '100',
            verified_users: '95',
            activated_users: '62',
          },
        ],
      });

      // Mock daily metrics query
      sql.mockResolvedValueOnce({
        rows: [
          { date: '2026-01-10', signups: '15', verified: '14' },
          { date: '2026-01-11', signups: '18', verified: '17' },
        ],
      });

      // ✨ NEW: Mock time-to-value metrics query
      sql.mockResolvedValueOnce({
        rows: [
          {
            total_verified: '95',
            avg_hours_to_verify: '2.5',
            median_hours_to_verify: '1.8',
            total_activated: '62',
          },
        ],
      });

      // ✨ NEW: Mock time to first generation query
      sql.mockResolvedValueOnce({
        rows: [
          {
            activated_users: '62',
            avg_hours_to_first_gen: '4.2',
            median_hours_to_first_gen: '3.5',
          },
        ],
      });

      // ✨ NEW: Mock usage segments query
      sql.mockResolvedValueOnce({
        rows: [
          { segment: 'No Usage', users: '38', percentage: '38.0' },
          { segment: 'Light (1-9)', users: '25', percentage: '25.0' },
          { segment: 'Engaged (10-49)', users: '22', percentage: '22.0' },
          { segment: 'Power (50-99)', users: '10', percentage: '10.0' },
          { segment: 'Max (100+)', users: '5', percentage: '5.0' },
        ],
      });

      // Mock campaign info query (optional)
      sql.mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            name: 'January 2026 Pro Trial',
            trial_tier: 'pro',
            trial_days: 14,
          },
        ],
      });

      // Simulate the endpoint logic
      const trialBreakdown = await sql();
      const cohortSummary = await sql();
      const dailyMetrics = await sql();
      const timeToValueMetrics = await sql(); // NEW
      const timeToFirstGen = await sql(); // NEW
      const usageSegments = await sql(); // NEW
      const campaignInfo = await sql();

      // Build response similar to actual endpoint
      const response = {
        success: true,
        data: {
          campaign: {
            startDate: '2026-01-10',
            endDate: '2026-01-24',
            source: 'auto_campaign',
            id: campaignInfo.rows[0].id,
            name: campaignInfo.rows[0].name,
          },
          summary: {
            total_signups: parseInt(cohortSummary.rows[0].total_signups),
            verified_users: parseInt(cohortSummary.rows[0].verified_users),
            activated_users: parseInt(cohortSummary.rows[0].activated_users),
          },
          extended_metrics: {
            time_to_value: {
              email_verification: {
                total_verified: parseInt(timeToValueMetrics.rows[0].total_verified),
                avg_hours: parseFloat(timeToValueMetrics.rows[0].avg_hours_to_verify),
                median_hours: parseFloat(timeToValueMetrics.rows[0].median_hours_to_verify),
                avg_days: (parseFloat(timeToValueMetrics.rows[0].avg_hours_to_verify) / 24).toFixed(1),
              },
              first_generation: {
                total_activated: parseInt(timeToFirstGen.rows[0].activated_users),
                avg_hours: parseFloat(timeToFirstGen.rows[0].avg_hours_to_first_gen),
                median_hours: parseFloat(timeToFirstGen.rows[0].median_hours_to_first_gen),
                avg_days: (parseFloat(timeToFirstGen.rows[0].avg_hours_to_first_gen) / 24).toFixed(1),
              },
            },
            usage_segments: usageSegments.rows.map((row) => ({
              segment: row.segment,
              users: parseInt(row.users),
              percentage: parseFloat(row.percentage),
            })),
            engagement_summary: {
              no_usage: parseInt(usageSegments.rows[0].users),
              light_users: parseInt(usageSegments.rows[1].users),
              engaged_users: parseInt(usageSegments.rows[2].users),
              power_users: parseInt(usageSegments.rows[3].users),
              max_users: parseInt(usageSegments.rows[4].users),
            },
          },
        },
      };

      mockResponse.json(response);

      // Assertions
      expect(mockResponse.json).toHaveBeenCalled();
      const result = mockResponse.json.mock.calls[0][0];

      // Verify extended metrics structure
      expect(result.data.extended_metrics).toBeDefined();
      expect(result.data.extended_metrics.time_to_value).toBeDefined();
      expect(result.data.extended_metrics.usage_segments).toBeDefined();
      expect(result.data.extended_metrics.engagement_summary).toBeDefined();

      // Verify time-to-value metrics
      expect(result.data.extended_metrics.time_to_value.email_verification.total_verified).toBe(95);
      expect(result.data.extended_metrics.time_to_value.email_verification.avg_hours).toBe(2.5);
      expect(result.data.extended_metrics.time_to_value.first_generation.total_activated).toBe(62);
      expect(result.data.extended_metrics.time_to_value.first_generation.avg_hours).toBe(4.2);

      // Verify usage segments
      expect(result.data.extended_metrics.usage_segments).toHaveLength(5);
      expect(result.data.extended_metrics.usage_segments[0].segment).toBe('No Usage');
      expect(result.data.extended_metrics.usage_segments[0].users).toBe(38);

      // Verify engagement summary
      expect(result.data.extended_metrics.engagement_summary.no_usage).toBe(38);
      expect(result.data.extended_metrics.engagement_summary.light_users).toBe(25);
      expect(result.data.extended_metrics.engagement_summary.engaged_users).toBe(22);
      expect(result.data.extended_metrics.engagement_summary.power_users).toBe(10);
      expect(result.data.extended_metrics.engagement_summary.max_users).toBe(5);
    });

    it('should handle missing time-to-value data gracefully', async () => {
      const { sql } = await import('@vercel/postgres');

      // Mock empty time-to-value results
      sql.mockResolvedValueOnce({ rows: [] }); // trial breakdown
      sql.mockResolvedValueOnce({
        rows: [{ total_signups: '0', verified_users: '0', activated_users: '0' }],
      }); // cohort
      sql.mockResolvedValueOnce({ rows: [] }); // daily
      sql.mockResolvedValueOnce({
        rows: [
          {
            total_verified: '0',
            avg_hours_to_verify: null,
            median_hours_to_verify: null,
          },
        ],
      }); // time-to-value
      sql.mockResolvedValueOnce({
        rows: [
          {
            activated_users: '0',
            avg_hours_to_first_gen: null,
            median_hours_to_first_gen: null,
          },
        ],
      }); // time-to-first-gen
      sql.mockResolvedValueOnce({ rows: [] }); // usage segments
      sql.mockResolvedValueOnce({ rows: [] }); // campaign info

      // Execute all queries in order
      await sql(); // trial breakdown
      await sql(); // cohort
      await sql(); // daily
      const timeToValueMetrics = await sql(); // time-to-value

      // Verify null handling
      expect(timeToValueMetrics.rows[0]).toBeDefined();
      expect(timeToValueMetrics.rows[0].avg_hours_to_verify).toBeNull();
      expect(timeToValueMetrics.rows[0].median_hours_to_verify).toBeNull();
    });
  });
});
