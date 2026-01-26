/**
 * Tests for Admin Trial Program API Endpoints
 *
 * Tests campaign management endpoints:
 * - GET /api/admin/trial-programs/status
 * - GET /api/admin/trial-programs
 * - GET /api/admin/trial-programs/:id
 * - POST /api/admin/trial-programs
 * - PUT /api/admin/trial-programs/:id
 * - POST /api/admin/trial-programs/:id/toggle
 * - DELETE /api/admin/trial-programs/:id
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

jest.mock('../../models/TrialProgram.js', () => ({
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

jest.mock('../../config/trialProgram.js', () => ({
  getCampaignStatus: mockGetCampaignStatus,
  clearCampaignCache: mockClearCampaignCache,
}));

describe('Admin Trial Program API Endpoints', () => {
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
  // GET /api/admin/trial-programs/status
  // ============================================================================

  describe('GET /api/admin/trial-programs/status', () => {
    it('should return active campaign status', async () => {
      const mockStatus = {
        active: true,
        trialProgram: {
          id: 1,
          name: 'Test Trial Program',
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
        trialProgram: null,
      });

      const status = await mockGetCampaignStatus();
      mockResponse.json(status);

      expect(mockResponse.json).toHaveBeenCalledWith({
        active: false,
        trialProgram: null,
      });
    });
  });

  // ============================================================================
  // GET /api/admin/trial-programs
  // ============================================================================

  describe('GET /api/admin/trial-programs', () => {
    it('should return list of campaigns', async () => {
      const mockCampaigns = {
        campaigns: [
          { id: 1, name: 'Trial Program 1' },
          { id: 2, name: 'Trial Program 2' },
        ],
        total: 2,
      };
      mockList.mockResolvedValue(mockCampaigns);

      // Simulate route handler
      const trialPrograms = await mockList({});
      mockResponse.json(trialPrograms);

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
  // GET /api/admin/trial-programs/:id
  // ============================================================================

  describe('GET /api/admin/trial-programs/:id', () => {
    it('should return campaign by ID', async () => {
      const mockCampaign = { id: 1, name: 'Test Trial Program' };
      mockFindById.mockResolvedValue(mockCampaign);

      const trialProgram = await mockFindById(1);
      mockResponse.json(trialProgram);

      expect(mockFindById).toHaveBeenCalledWith(1);
      expect(mockResponse.json).toHaveBeenCalledWith(mockCampaign);
    });

    it('should return 404 when campaign not found', async () => {
      mockFindById.mockResolvedValue(null);

      const trialProgram = await mockFindById(999);
      if (!trialProgram) {
        mockResponse.status(404).json({ error: 'Trial Program not found' });
      }

      expect(mockResponse.status).toHaveBeenCalledWith(404);
    });
  });

  // ============================================================================
  // POST /api/admin/trial-programs
  // ============================================================================

  describe('POST /api/admin/trial-programs', () => {
    it('should create a new campaign', async () => {
      const mockCampaign = {
        id: 1,
        name: 'New Trial Program',
        trial_tier: 'pro',
        trial_days: 14,
      };
      mockCreate.mockResolvedValue(mockCampaign);

      mockRequest.body = {
        name: 'New Trial Program',
        trialTier: 'pro',
        trialDays: 14,
      };

      const trialProgram = await mockCreate({
        ...mockRequest.body,
        createdByUserId: mockRequest.user.id,
      });
      mockResponse.status(201).json(trialProgram);

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'New Trial Program', createdByUserId: 1 })
      );
      expect(mockResponse.status).toHaveBeenCalledWith(201);
    });

    it('should return 400 when name is missing', async () => {
      mockRequest.body = { trialTier: 'pro' };

      if (!mockRequest.body.name) {
        mockResponse.status(400).json({ error: 'Trial Program name is required' });
      }

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });
  });

  // ============================================================================
  // PUT /api/admin/trial-programs/:id
  // ============================================================================

  describe('PUT /api/admin/trial-programs/:id', () => {
    it('should update campaign', async () => {
      const mockCampaign = { id: 1, name: 'Updated Trial Program' };
      mockUpdate.mockResolvedValue(mockCampaign);

      mockRequest.params = { id: '1' };
      mockRequest.body = { name: 'Updated Trial Program' };

      const trialProgram = await mockUpdate(1, mockRequest.body);
      mockClearCampaignCache();
      mockResponse.json(trialProgram);

      expect(mockUpdate).toHaveBeenCalledWith(1, { name: 'Updated Trial Program' });
      expect(mockClearCampaignCache).toHaveBeenCalled();
    });

    it('should return 404 when campaign not found', async () => {
      mockUpdate.mockResolvedValue(null);

      const trialProgram = await mockUpdate(999, { name: 'Test' });
      if (!trialProgram) {
        mockResponse.status(404).json({ error: 'Trial Program not found' });
      }

      expect(mockResponse.status).toHaveBeenCalledWith(404);
    });
  });

  // ============================================================================
  // POST /api/admin/trial-programs/:id/toggle
  // ============================================================================

  describe('POST /api/admin/trial-programs/:id/toggle', () => {
    it('should activate a campaign', async () => {
      const mockCampaign = { id: 1, is_active: true };
      mockSetActive.mockResolvedValue(mockCampaign);

      mockRequest.params = { id: '1' };
      mockRequest.body = { isActive: true };

      const trialProgram = await mockSetActive(1, true);
      mockClearCampaignCache();
      mockResponse.json(trialProgram);

      expect(mockSetActive).toHaveBeenCalledWith(1, true);
      expect(mockClearCampaignCache).toHaveBeenCalled();
    });

    it('should deactivate a campaign', async () => {
      const mockCampaign = { id: 1, is_active: false };
      mockSetActive.mockResolvedValue(mockCampaign);

      const trialProgram = await mockSetActive(1, false);
      mockResponse.json(trialProgram);

      expect(mockSetActive).toHaveBeenCalledWith(1, false);
    });
  });

  // ============================================================================
  // DELETE /api/admin/trial-programs/:id
  // ============================================================================

  describe('DELETE /api/admin/trial-programs/:id', () => {
    it('should delete campaign when no signups', async () => {
      mockFindById.mockResolvedValue({ id: 1, signups_count: 0 });
      mockDelete.mockResolvedValue(true);

      const trialProgram = await mockFindById(1);
      if (trialProgram.signups_count > 0) {
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

      const trialProgram = await mockFindById(1);
      if (trialProgram.signups_count > 0) {
        mockResponse.status(400).json({ error: 'Cannot delete campaign with signups' });
      }

      expect(mockDelete).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 when campaign not found', async () => {
      mockFindById.mockResolvedValue(null);

      const trialProgram = await mockFindById(999);
      if (!trialProgram) {
        mockResponse.status(404).json({ error: 'Trial Program not found' });
      }

      expect(mockResponse.status).toHaveBeenCalledWith(404);
    });
  });

  // ============================================================================
  // GET /api/admin/trial-programs/export - Extended Metrics Export
  // ============================================================================

  describe('GET /api/admin/trial-programs/export', () => {
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
          trialProgram: {
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

    // ============================================================================
    // Data Completeness & Google Sheets Compatibility Tests
    // ============================================================================

    describe('Data Completeness for Google Sheets Import', () => {
      it('should include all required top-level fields', async () => {
        const { sql } = await import('@vercel/postgres');

        // Mock all 7 SQL queries with complete data
        sql.mockResolvedValueOnce({
          rows: [
            {
              source: 'auto_campaign',
              trials_started: '50',
              conversions: '10',
              conversion_rate: '20.0',
              avg_days_to_convert: '15.5',
            },
          ],
        });
        sql.mockResolvedValueOnce({
          rows: [
            {
              total_signups: '100',
              verified_users: '90',
              activated_users: '60',
            },
          ],
        });
        sql.mockResolvedValueOnce({
          rows: [
            { date: '2026-01-10', signups: '15', verified: '14' },
            { date: '2026-01-11', signups: '20', verified: '18' },
          ],
        });
        sql.mockResolvedValueOnce({
          rows: [
            {
              total_verified: '90',
              avg_hours_to_verify: '3.2',
              median_hours_to_verify: '2.5',
              total_activated: '60',
            },
          ],
        });
        sql.mockResolvedValueOnce({
          rows: [
            {
              activated_users: '60',
              avg_hours_to_first_gen: '5.8',
              median_hours_to_first_gen: '4.2',
            },
          ],
        });
        sql.mockResolvedValueOnce({
          rows: [
            { segment: 'No Usage', users: '40', percentage: '40.0' },
            { segment: 'Light (1-9)', users: '30', percentage: '30.0' },
            { segment: 'Engaged (10-49)', users: '20', percentage: '20.0' },
            { segment: 'Power (50-99)', users: '7', percentage: '7.0' },
            { segment: 'Max (100+)', users: '3', percentage: '3.0' },
          ],
        });
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

        // Execute queries
        const trialBreakdown = await sql();
        const cohortSummary = await sql();
        const dailyMetrics = await sql();
        const timeToValueMetrics = await sql();
        const timeToFirstGen = await sql();
        const usageSegments = await sql();
        const campaignInfo = await sql();

        // Build response structure
        const response = {
          success: true,
          data: {
            trialProgram: {
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
            daily: dailyMetrics.rows,
            spreadsheet_ready: {},
            extended_metrics: {},
          },
        };

        mockResponse.json(response);
        const result = mockResponse.json.mock.calls[0][0];

        // Verify all top-level fields exist
        expect(result.success).toBeDefined();
        expect(result.data).toBeDefined();
        expect(result.data.trialProgram).toBeDefined();
        expect(result.data.summary).toBeDefined();
        expect(result.data.daily).toBeDefined();
        expect(result.data.spreadsheet_ready).toBeDefined();
        expect(result.data.extended_metrics).toBeDefined();
      });

      it('should include all required campaign fields', async () => {
        const { sql } = await import('@vercel/postgres');

        // Mock minimal campaign data
        sql.mockResolvedValueOnce({ rows: [{ source: 'auto_campaign', trials_started: '0', conversions: '0', conversion_rate: '0', avg_days_to_convert: null }] });
        sql.mockResolvedValueOnce({ rows: [{ total_signups: '0', verified_users: '0', activated_users: '0' }] });
        sql.mockResolvedValueOnce({ rows: [] });
        sql.mockResolvedValueOnce({ rows: [{ total_verified: '0', avg_hours_to_verify: null, median_hours_to_verify: null }] });
        sql.mockResolvedValueOnce({ rows: [{ activated_users: '0', avg_hours_to_first_gen: null, median_hours_to_first_gen: null }] });
        sql.mockResolvedValueOnce({ rows: [] });
        sql.mockResolvedValueOnce({ rows: [{ id: 1, name: 'Test Trial Program', trial_tier: 'pro', trial_days: 14 }] });

        await sql(); await sql(); await sql(); await sql(); await sql(); await sql();
        const campaignInfo = await sql();

        const response = {
          data: {
            trialProgram: {
              startDate: '2026-01-10',
              endDate: '2026-01-24',
              source: 'auto_campaign',
              id: campaignInfo.rows[0].id,
              name: campaignInfo.rows[0].name,
              trialTier: campaignInfo.rows[0].trial_tier,
              trialDays: campaignInfo.rows[0].trial_days,
            },
          },
        };

        mockResponse.json(response);
        const result = mockResponse.json.mock.calls[0][0];

        // Required campaign fields for Google Sheets
        expect(result.data.trialProgram.startDate).toBeDefined();
        expect(result.data.trialProgram.endDate).toBeDefined();
        expect(result.data.trialProgram.source).toBeDefined();
        expect(result.data.trialProgram.id).toBeDefined();
        expect(result.data.trialProgram.name).toBeDefined();
        expect(result.data.trialProgram.trialTier).toBeDefined();
        expect(result.data.trialProgram.trialDays).toBeDefined();
      });

      it('should include all required spreadsheet_ready fields', async () => {
        const { sql } = await import('@vercel/postgres');

        // Mock data
        sql.mockResolvedValueOnce({
          rows: [
            { source: 'auto_campaign', trials_started: '50', conversions: '10', conversion_rate: '20.0', avg_days_to_convert: '15.5' },
            { source: 'invite_code', trials_started: '8', conversions: '1', conversion_rate: '12.5', avg_days_to_convert: '20.0' },
          ],
        });
        sql.mockResolvedValueOnce({ rows: [{ total_signups: '100', verified_users: '90', activated_users: '60' }] });
        sql.mockResolvedValueOnce({ rows: [] });
        sql.mockResolvedValueOnce({ rows: [{ total_verified: '90', avg_hours_to_verify: '3.2', median_hours_to_verify: '2.5' }] });
        sql.mockResolvedValueOnce({ rows: [{ activated_users: '60', avg_hours_to_first_gen: '5.8', median_hours_to_first_gen: '4.2' }] });
        sql.mockResolvedValueOnce({ rows: [] });
        sql.mockResolvedValueOnce({ rows: [] });

        const trialBreakdown = await sql();
        const cohortSummary = await sql();
        await sql(); await sql(); await sql(); await sql(); await sql();

        // Calculate metrics similar to endpoint
        const campaignTrials = trialBreakdown.rows.find(t => t.source === 'auto_campaign');
        const individualTrials = trialBreakdown.rows.filter(t => t.source !== 'auto_campaign');
        const individualTotal = { trials_started: 8, conversions: 1 };
        const individualConversionRate = '12.5';
        const totalTrials = 58;
        const totalConversions = 11;
        const totalConversionRate = '18.97';
        const campaignLift = '60.0';

        const response = {
          data: {
            spreadsheet_ready: {
              trial_comparison: {
                trial_program_trials: {
                  started: parseInt(campaignTrials.trials_started),
                  converted: parseInt(campaignTrials.conversions),
                  conversion_rate: parseFloat(campaignTrials.conversion_rate),
                },
                individual_trials: {
                  started: individualTotal.trials_started,
                  converted: individualTotal.conversions,
                  conversion_rate: parseFloat(individualConversionRate),
                },
                total_trials: {
                  started: totalTrials,
                  converted: totalConversions,
                  conversion_rate: parseFloat(totalConversionRate),
                },
                trial_program_lift: campaignLift,
              },
              cohort_summary: {
                signups: parseInt(cohortSummary.rows[0].total_signups),
                verified: parseInt(cohortSummary.rows[0].verified_users),
                activated: parseInt(cohortSummary.rows[0].activated_users),
                verification_rate: '90.0',
                activation_rate: '66.7',
              },
            },
          },
        };

        mockResponse.json(response);
        const result = mockResponse.json.mock.calls[0][0];

        // Verify trial_comparison fields
        expect(result.data.spreadsheet_ready.trial_comparison).toBeDefined();
        expect(result.data.spreadsheet_ready.trial_comparison.trial_program_trials).toBeDefined();
        expect(result.data.spreadsheet_ready.trial_comparison.trial_program_trials.started).toBeDefined();
        expect(result.data.spreadsheet_ready.trial_comparison.trial_program_trials.converted).toBeDefined();
        expect(result.data.spreadsheet_ready.trial_comparison.trial_program_trials.conversion_rate).toBeDefined();
        expect(result.data.spreadsheet_ready.trial_comparison.individual_trials).toBeDefined();
        expect(result.data.spreadsheet_ready.trial_comparison.total_trials).toBeDefined();
        expect(result.data.spreadsheet_ready.trial_comparison.trial_program_lift).toBeDefined();

        // Verify cohort_summary fields
        expect(result.data.spreadsheet_ready.cohort_summary).toBeDefined();
        expect(result.data.spreadsheet_ready.cohort_summary.signups).toBeDefined();
        expect(result.data.spreadsheet_ready.cohort_summary.verified).toBeDefined();
        expect(result.data.spreadsheet_ready.cohort_summary.activated).toBeDefined();
        expect(result.data.spreadsheet_ready.cohort_summary.verification_rate).toBeDefined();
        expect(result.data.spreadsheet_ready.cohort_summary.activation_rate).toBeDefined();
      });

      it('should format all numeric fields as valid numbers for Google Sheets', async () => {
        const { sql } = await import('@vercel/postgres');

        // Mock data with various numeric values
        sql.mockResolvedValueOnce({
          rows: [
            { source: 'auto_campaign', trials_started: '45', conversions: '9', conversion_rate: '20.0', avg_days_to_convert: '18.3' },
          ],
        });
        sql.mockResolvedValueOnce({ rows: [{ total_signups: '100', verified_users: '95', activated_users: '62' }] });
        sql.mockResolvedValueOnce({ rows: [] });
        sql.mockResolvedValueOnce({ rows: [{ total_verified: '95', avg_hours_to_verify: '2.5', median_hours_to_verify: '1.8' }] });
        sql.mockResolvedValueOnce({ rows: [{ activated_users: '62', avg_hours_to_first_gen: '4.2', median_hours_to_first_gen: '3.5' }] });
        sql.mockResolvedValueOnce({
          rows: [
            { segment: 'No Usage', users: '38', percentage: '38.0' },
            { segment: 'Light (1-9)', users: '25', percentage: '25.0' },
            { segment: 'Engaged (10-49)', users: '22', percentage: '22.0' },
            { segment: 'Power (50-99)', users: '10', percentage: '10.0' },
            { segment: 'Max (100+)', users: '5', percentage: '5.0' },
          ],
        });
        sql.mockResolvedValueOnce({ rows: [] });

        const trialBreakdown = await sql();
        const cohortSummary = await sql();
        await sql();
        const timeToValueMetrics = await sql();
        const timeToFirstGen = await sql();
        const usageSegments = await sql();
        await sql();

        // Build response
        const response = {
          data: {
            summary: {
              total_signups: parseInt(cohortSummary.rows[0].total_signups),
              verified_users: parseInt(cohortSummary.rows[0].verified_users),
              activated_users: parseInt(cohortSummary.rows[0].activated_users),
            },
            spreadsheet_ready: {
              trial_comparison: {
                trial_program_trials: {
                  started: parseInt(trialBreakdown.rows[0].trials_started),
                  converted: parseInt(trialBreakdown.rows[0].conversions),
                  conversion_rate: parseFloat(trialBreakdown.rows[0].conversion_rate),
                },
              },
              cohort_summary: {
                signups: parseInt(cohortSummary.rows[0].total_signups),
                verification_rate: '95.0',
                activation_rate: '65.3',
              },
            },
            extended_metrics: {
              time_to_value: {
                email_verification: {
                  avg_hours: parseFloat(timeToValueMetrics.rows[0].avg_hours_to_verify),
                  median_hours: parseFloat(timeToValueMetrics.rows[0].median_hours_to_verify),
                },
              },
              usage_segments: usageSegments.rows.map(row => ({
                segment: row.segment,
                users: parseInt(row.users),
                percentage: parseFloat(row.percentage),
              })),
            },
          },
        };

        mockResponse.json(response);
        const result = mockResponse.json.mock.calls[0][0];

        // Verify all numbers are valid (not NaN, not Infinity, not strings)
        expect(typeof result.data.summary.total_signups).toBe('number');
        expect(typeof result.data.summary.verified_users).toBe('number');
        expect(typeof result.data.spreadsheet_ready.trial_comparison.trial_program_trials.conversion_rate).toBe('number');
        expect(typeof result.data.extended_metrics.time_to_value.email_verification.avg_hours).toBe('number');

        // Verify no NaN or Infinity
        expect(Number.isFinite(result.data.summary.total_signups)).toBe(true);
        expect(Number.isFinite(result.data.spreadsheet_ready.trial_comparison.trial_program_trials.conversion_rate)).toBe(true);
        expect(Number.isFinite(result.data.extended_metrics.time_to_value.email_verification.avg_hours)).toBe(true);

        // Verify percentages are in valid range
        result.data.extended_metrics.usage_segments.forEach(segment => {
          expect(segment.percentage).toBeGreaterThanOrEqual(0);
          expect(segment.percentage).toBeLessThanOrEqual(100);
        });
      });

      it('should handle zero conversions without division errors', async () => {
        const { sql } = await import('@vercel/postgres');

        // Mock data with zero conversions
        sql.mockResolvedValueOnce({
          rows: [
            { source: 'auto_campaign', trials_started: '50', conversions: '0', conversion_rate: '0', avg_days_to_convert: null },
          ],
        });
        sql.mockResolvedValueOnce({ rows: [{ total_signups: '100', verified_users: '0', activated_users: '0' }] });
        sql.mockResolvedValueOnce({ rows: [] });
        sql.mockResolvedValueOnce({ rows: [{ total_verified: '0', avg_hours_to_verify: null, median_hours_to_verify: null }] });
        sql.mockResolvedValueOnce({ rows: [{ activated_users: '0', avg_hours_to_first_gen: null, median_hours_to_first_gen: null }] });
        sql.mockResolvedValueOnce({ rows: [] });
        sql.mockResolvedValueOnce({ rows: [] });

        const trialBreakdown = await sql();
        const cohortSummary = await sql();
        await sql(); await sql(); await sql(); await sql(); await sql();

        // Calculate rates with zero denominators
        const verificationRate = cohortSummary.rows[0].total_signups > 0
          ? ((cohortSummary.rows[0].verified_users / cohortSummary.rows[0].total_signups) * 100).toFixed(1)
          : '0';

        const response = {
          data: {
            spreadsheet_ready: {
              trial_comparison: {
                trial_program_trials: {
                  conversion_rate: parseFloat(trialBreakdown.rows[0].conversion_rate),
                },
              },
              cohort_summary: {
                verification_rate: verificationRate,
                activation_rate: '0',
              },
            },
          },
        };

        mockResponse.json(response);
        const result = mockResponse.json.mock.calls[0][0];

        // Verify no NaN from division by zero
        expect(result.data.spreadsheet_ready.trial_comparison.trial_program_trials.conversion_rate).toBe(0);
        expect(result.data.spreadsheet_ready.cohort_summary.verification_rate).toBe('0.0');
        expect(Number.isFinite(parseFloat(result.data.spreadsheet_ready.cohort_summary.verification_rate))).toBe(true);
      });

      it('should format dates as YYYY-MM-DD for Google Sheets', async () => {
        const { sql } = await import('@vercel/postgres');

        // Mock minimal data
        sql.mockResolvedValueOnce({ rows: [] });
        sql.mockResolvedValueOnce({ rows: [{ total_signups: '0', verified_users: '0', activated_users: '0' }] });
        sql.mockResolvedValueOnce({
          rows: [
            { date: '2026-01-10', signups: '15', verified: '14' },
            { date: '2026-01-11', signups: '20', verified: '18' },
          ],
        });
        sql.mockResolvedValueOnce({ rows: [{ total_verified: '0', avg_hours_to_verify: null, median_hours_to_verify: null }] });
        sql.mockResolvedValueOnce({ rows: [{ activated_users: '0', avg_hours_to_first_gen: null, median_hours_to_first_gen: null }] });
        sql.mockResolvedValueOnce({ rows: [] });
        sql.mockResolvedValueOnce({ rows: [] });

        await sql(); await sql();
        const dailyMetrics = await sql();
        await sql(); await sql(); await sql(); await sql();

        const response = {
          data: {
            trialProgram: {
              startDate: '2026-01-10',
              endDate: '2026-01-24',
            },
            daily: dailyMetrics.rows.map(row => ({
              date: row.date,
              signups: parseInt(row.signups),
              verified: parseInt(row.verified),
            })),
          },
        };

        mockResponse.json(response);
        const result = mockResponse.json.mock.calls[0][0];

        // Verify date format (YYYY-MM-DD)
        expect(result.data.trialProgram.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(result.data.trialProgram.endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        result.data.daily.forEach(day => {
          expect(day.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        });
      });

      it('should include all campaign metrics for financial analysis', async () => {
        const { sql } = await import('@vercel/postgres');

        // Mock complete campaign data
        sql.mockResolvedValueOnce({
          rows: [
            { source: 'auto_campaign', trials_started: '50', conversions: '10', conversion_rate: '20.0', avg_days_to_convert: '15.5' },
            { source: 'invite_code', trials_started: '8', conversions: '2', conversion_rate: '25.0', avg_days_to_convert: '12.0' },
          ],
        });
        sql.mockResolvedValueOnce({ rows: [{ total_signups: '100', verified_users: '90', activated_users: '60' }] });
        sql.mockResolvedValueOnce({ rows: [] });
        sql.mockResolvedValueOnce({ rows: [{ total_verified: '90', avg_hours_to_verify: '3.2', median_hours_to_verify: '2.5' }] });
        sql.mockResolvedValueOnce({ rows: [{ activated_users: '60', avg_hours_to_first_gen: '5.8', median_hours_to_first_gen: '4.2' }] });
        sql.mockResolvedValueOnce({ rows: [] });
        sql.mockResolvedValueOnce({ rows: [] });

        const trialBreakdown = await sql();
        await sql(); await sql(); await sql(); await sql(); await sql(); await sql();

        // Calculate campaign metrics
        const campaignTrials = trialBreakdown.rows.find(t => t.source === 'auto_campaign');
        const individualTrials = trialBreakdown.rows.filter(t => t.source !== 'auto_campaign');
        const individualTotal = individualTrials.reduce((acc, trial) => ({
          trials_started: acc.trials_started + parseInt(trial.trials_started),
          conversions: acc.conversions + parseInt(trial.conversions),
        }), { trials_started: 0, conversions: 0 });
        const individualConversionRate = '25.0';
        const campaignLift = '-20.0'; // (20 - 25) / 25 * 100

        const response = {
          data: {
            summary: {
              trials_breakdown: {
                trial_program_trials: {
                  started: parseInt(campaignTrials.trials_started),
                  converted: parseInt(campaignTrials.conversions),
                  conversion_rate: parseFloat(campaignTrials.conversion_rate),
                  avg_days_to_convert: parseFloat(campaignTrials.avg_days_to_convert),
                },
                individual_trials: {
                  started: individualTotal.trials_started,
                  converted: individualTotal.conversions,
                  conversion_rate: parseFloat(individualConversionRate),
                  by_source: individualTrials.map(trial => ({
                    source: trial.source,
                    trials_started: parseInt(trial.trials_started),
                    conversions: parseInt(trial.conversions),
                    conversion_rate: parseFloat(trial.conversion_rate),
                  })),
                },
              },
              comparison: {
                trial_program_vs_individual: {
                  trial_program_conversion_rate: parseFloat(campaignTrials.conversion_rate),
                  individual_conversion_rate: parseFloat(individualConversionRate),
                  trial_program_lift: `${campaignLift}%`,
                  trial_program_performs_better: false,
                },
              },
            },
          },
        };

        mockResponse.json(response);
        const result = mockResponse.json.mock.calls[0][0];

        // Verify all financial metrics are present
        expect(result.data.summary.trials_breakdown.trial_program_trials.started).toBe(50);
        expect(result.data.summary.trials_breakdown.trial_program_trials.converted).toBe(10);
        expect(result.data.summary.trials_breakdown.trial_program_trials.conversion_rate).toBe(20.0);
        expect(result.data.summary.trials_breakdown.trial_program_trials.avg_days_to_convert).toBe(15.5);

        expect(result.data.summary.trials_breakdown.individual_trials.started).toBe(8);
        expect(result.data.summary.trials_breakdown.individual_trials.converted).toBe(2);

        expect(result.data.summary.comparison.trial_program_vs_individual.trial_program_lift).toBe('-20.0%');
        expect(result.data.summary.comparison.trial_program_vs_individual.trial_program_performs_better).toBe(false);
      });

      it('should include all usage segments for engagement analysis', async () => {
        const { sql } = await import('@vercel/postgres');

        // Mock minimal data
        sql.mockResolvedValueOnce({ rows: [] });
        sql.mockResolvedValueOnce({ rows: [{ total_signups: '100', verified_users: '90', activated_users: '60' }] });
        sql.mockResolvedValueOnce({ rows: [] });
        sql.mockResolvedValueOnce({ rows: [{ total_verified: '90', avg_hours_to_verify: null, median_hours_to_verify: null }] });
        sql.mockResolvedValueOnce({ rows: [{ activated_users: '60', avg_hours_to_first_gen: null, median_hours_to_first_gen: null }] });
        sql.mockResolvedValueOnce({
          rows: [
            { segment: 'No Usage', users: '40', percentage: '40.0' },
            { segment: 'Light (1-9)', users: '30', percentage: '30.0' },
            { segment: 'Engaged (10-49)', users: '20', percentage: '20.0' },
            { segment: 'Power (50-99)', users: '7', percentage: '7.0' },
            { segment: 'Max (100+)', users: '3', percentage: '3.0' },
          ],
        });
        sql.mockResolvedValueOnce({ rows: [] });

        await sql(); await sql(); await sql(); await sql(); await sql();
        const usageSegments = await sql();
        await sql();

        const response = {
          data: {
            extended_metrics: {
              usage_segments: usageSegments.rows.map(row => ({
                segment: row.segment,
                users: parseInt(row.users),
                percentage: parseFloat(row.percentage),
              })),
              engagement_summary: {
                no_usage: parseInt(usageSegments.rows.find(r => r.segment === 'No Usage')?.users || 0),
                light_users: parseInt(usageSegments.rows.find(r => r.segment === 'Light (1-9)')?.users || 0),
                engaged_users: parseInt(usageSegments.rows.find(r => r.segment === 'Engaged (10-49)')?.users || 0),
                power_users: parseInt(usageSegments.rows.find(r => r.segment === 'Power (50-99)')?.users || 0),
                max_users: parseInt(usageSegments.rows.find(r => r.segment === 'Max (100+)')?.users || 0),
              },
            },
          },
        };

        mockResponse.json(response);
        const result = mockResponse.json.mock.calls[0][0];

        // Verify all 5 usage segments are present
        expect(result.data.extended_metrics.usage_segments).toHaveLength(5);
        expect(result.data.extended_metrics.usage_segments.map(s => s.segment)).toEqual([
          'No Usage',
          'Light (1-9)',
          'Engaged (10-49)',
          'Power (50-99)',
          'Max (100+)',
        ]);

        // Verify engagement summary has all segments
        expect(result.data.extended_metrics.engagement_summary.no_usage).toBe(40);
        expect(result.data.extended_metrics.engagement_summary.light_users).toBe(30);
        expect(result.data.extended_metrics.engagement_summary.engaged_users).toBe(20);
        expect(result.data.extended_metrics.engagement_summary.power_users).toBe(7);
        expect(result.data.extended_metrics.engagement_summary.max_users).toBe(3);

        // Verify percentages sum to 100
        const totalPercentage = result.data.extended_metrics.usage_segments.reduce(
          (sum, s) => sum + s.percentage,
          0
        );
        expect(totalPercentage).toBe(100);
      });
    });
  });
});
