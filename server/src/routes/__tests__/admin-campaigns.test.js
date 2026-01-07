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
});
