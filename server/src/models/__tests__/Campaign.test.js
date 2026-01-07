/**
 * Unit tests for Campaign model
 * Tests campaign CRUD operations, active campaign retrieval, and statistics
 *
 * Pattern 11: ES Modules vs CommonJS (see TEST-PATTERNS-GUIDE.md)
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock @vercel/postgres BEFORE importing Campaign
jest.mock('@vercel/postgres', () => ({
  sql: Object.assign(jest.fn(), {
    query: jest.fn(),
  }),
}));

import Campaign from '../Campaign.js';
import { sql } from '@vercel/postgres';

describe('Campaign Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================================
  // CREATE
  // ============================================================================

  describe('create', () => {
    it('should create a campaign with default values', async () => {
      const mockCampaign = {
        id: 1,
        name: 'Test Campaign',
        description: null,
        trial_tier: 'pro',
        trial_days: 14,
        is_active: false,
        signups_count: 0,
        conversions_count: 0,
        created_at: new Date().toISOString(),
      };

      sql.mockResolvedValue({ rows: [mockCampaign] });

      const result = await Campaign.create({ name: 'Test Campaign' });

      expect(sql).toHaveBeenCalled();
      expect(result.name).toBe('Test Campaign');
      expect(result.trial_tier).toBe('pro');
      expect(result.trial_days).toBe(14);
    });

    it('should create a campaign with custom tier and duration', async () => {
      const mockCampaign = {
        id: 2,
        name: 'Team Trial',
        trial_tier: 'team',
        trial_days: 30,
        is_active: false,
      };

      sql.mockResolvedValue({ rows: [mockCampaign] });

      const result = await Campaign.create({
        name: 'Team Trial',
        trialTier: 'team',
        trialDays: 30,
      });

      expect(result.trial_tier).toBe('team');
      expect(result.trial_days).toBe(30);
    });

    it('should create a campaign with end date', async () => {
      const endsAt = new Date('2024-12-31T23:59:59Z');
      const mockCampaign = {
        id: 3,
        name: 'Holiday Campaign',
        ends_at: endsAt.toISOString(),
      };

      sql.mockResolvedValue({ rows: [mockCampaign] });

      const result = await Campaign.create({
        name: 'Holiday Campaign',
        endsAt,
      });

      expect(result.ends_at).toBe(endsAt.toISOString());
    });

    it('should throw error if database fails', async () => {
      sql.mockRejectedValue(new Error('Database error'));

      await expect(Campaign.create({ name: 'Test' })).rejects.toThrow('Database error');
    });
  });

  // ============================================================================
  // FIND BY ID
  // ============================================================================

  describe('findById', () => {
    it('should return campaign when found', async () => {
      const mockCampaign = { id: 1, name: 'Test Campaign' };
      sql.mockResolvedValue({ rows: [mockCampaign] });

      const result = await Campaign.findById(1);

      expect(result).toEqual(mockCampaign);
    });

    it('should return null when not found', async () => {
      sql.mockResolvedValue({ rows: [] });

      const result = await Campaign.findById(999);

      expect(result).toBeNull();
    });
  });

  // ============================================================================
  // GET ACTIVE
  // ============================================================================

  describe('getActive', () => {
    it('should return active campaign within date range', async () => {
      const mockCampaign = {
        id: 1,
        name: 'Active Campaign',
        is_active: true,
        starts_at: new Date(Date.now() - 86400000).toISOString(),
        ends_at: new Date(Date.now() + 86400000).toISOString(),
      };
      sql.mockResolvedValue({ rows: [mockCampaign] });

      const result = await Campaign.getActive();

      expect(result).toEqual(mockCampaign);
      expect(result.is_active).toBe(true);
    });

    it('should return null when no active campaign', async () => {
      sql.mockResolvedValue({ rows: [] });

      const result = await Campaign.getActive();

      expect(result).toBeNull();
    });

    it('should return campaign with null ends_at (indefinite)', async () => {
      const mockCampaign = {
        id: 1,
        name: 'Indefinite Campaign',
        is_active: true,
        ends_at: null,
      };
      sql.mockResolvedValue({ rows: [mockCampaign] });

      const result = await Campaign.getActive();

      expect(result.ends_at).toBeNull();
    });
  });

  // ============================================================================
  // LIST
  // ============================================================================

  describe('list', () => {
    it('should return campaigns with default pagination', async () => {
      const mockCampaigns = [
        { id: 1, name: 'Campaign 1' },
        { id: 2, name: 'Campaign 2' },
      ];

      sql.query.mockResolvedValue({ rows: mockCampaigns });
      sql.mockResolvedValue({ rows: [{ total: '2' }] });

      const result = await Campaign.list();

      expect(result.campaigns).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(sql.query).toHaveBeenCalledWith(expect.any(String), [50, 0]);
    });

    it('should apply custom sort order', async () => {
      sql.query.mockResolvedValue({ rows: [] });
      sql.mockResolvedValue({ rows: [{ total: '0' }] });

      await Campaign.list({ sortBy: 'name', sortOrder: 'ASC' });

      expect(sql.query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY name ASC'),
        expect.any(Array)
      );
    });

    it('should prevent SQL injection in sort column', async () => {
      sql.query.mockResolvedValue({ rows: [] });
      sql.mockResolvedValue({ rows: [{ total: '0' }] });

      // Malicious sortBy should default to created_at
      await Campaign.list({ sortBy: 'DROP TABLE; --' });

      expect(sql.query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY created_at'),
        expect.any(Array)
      );
    });
  });

  // ============================================================================
  // UPDATE
  // ============================================================================

  describe('update', () => {
    it('should update campaign name', async () => {
      const mockCampaign = { id: 1, name: 'Updated Name' };
      sql.query.mockResolvedValue({ rows: [mockCampaign] });

      const result = await Campaign.update(1, { name: 'Updated Name' });

      expect(result.name).toBe('Updated Name');
    });

    it('should update multiple fields', async () => {
      const mockCampaign = {
        id: 1,
        name: 'Updated',
        trial_tier: 'team',
        trial_days: 30,
      };
      sql.query.mockResolvedValue({ rows: [mockCampaign] });

      const result = await Campaign.update(1, {
        name: 'Updated',
        trialTier: 'team',
        trialDays: 30,
      });

      expect(result.trial_tier).toBe('team');
      expect(result.trial_days).toBe(30);
    });

    it('should return null if campaign not found', async () => {
      sql.query.mockResolvedValue({ rows: [] });

      const result = await Campaign.update(999, { name: 'Test' });

      expect(result).toBeNull();
    });
  });

  // ============================================================================
  // SET ACTIVE
  // ============================================================================

  describe('setActive', () => {
    it('should activate a campaign', async () => {
      const mockCampaign = { id: 1, is_active: true };
      sql.mockResolvedValue({ rows: [mockCampaign] });

      const result = await Campaign.setActive(1, true);

      expect(result.is_active).toBe(true);
    });

    it('should deactivate a campaign', async () => {
      const mockCampaign = { id: 1, is_active: false };
      sql.mockResolvedValue({ rows: [mockCampaign] });

      const result = await Campaign.setActive(1, false);

      expect(result.is_active).toBe(false);
    });
  });

  // ============================================================================
  // INCREMENT COUNTERS
  // ============================================================================

  describe('incrementSignups', () => {
    it('should call sql to increment signups', async () => {
      sql.mockResolvedValue({ rows: [] });

      await Campaign.incrementSignups(1);

      expect(sql).toHaveBeenCalled();
    });
  });

  describe('incrementConversions', () => {
    it('should call sql to increment conversions', async () => {
      sql.mockResolvedValue({ rows: [] });

      await Campaign.incrementConversions(1);

      expect(sql).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // DELETE
  // ============================================================================

  describe('delete', () => {
    it('should return true when campaign deleted', async () => {
      sql.mockResolvedValue({ rows: [{ id: 1 }] });

      const result = await Campaign.delete(1);

      expect(result).toBe(true);
    });

    it('should return false when campaign not found', async () => {
      sql.mockResolvedValue({ rows: [] });

      const result = await Campaign.delete(999);

      expect(result).toBe(false);
    });
  });

  // ============================================================================
  // GET STATS
  // ============================================================================

  describe('getStats', () => {
    it('should return campaign with trial statistics', async () => {
      const mockCampaign = { id: 1, name: 'Test Campaign' };
      const mockStats = {
        total_trials: '10',
        active_trials: '5',
        converted_trials: '3',
        expired_trials: '2',
      };

      // First call for findById, second for trial stats
      sql.mockResolvedValueOnce({ rows: [mockCampaign] });
      sql.mockResolvedValueOnce({ rows: [mockStats] });

      const result = await Campaign.getStats(1);

      expect(result.name).toBe('Test Campaign');
      expect(result.trialStats).toEqual(mockStats);
    });

    it('should return null when campaign not found', async () => {
      sql.mockResolvedValue({ rows: [] });

      const result = await Campaign.getStats(999);

      expect(result).toBeNull();
    });
  });
});
