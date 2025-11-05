/**
 * Permanent Deletion Cron Job Tests
 *
 * Tests the automated permanent deletion system that processes expired user deletion requests.
 * Covers:
 * - Finding expired users
 * - Processing deletions in batch
 * - Error handling for individual failures
 * - Results tracking
 * - Cron job lifecycle (start/stop)
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock User model BEFORE importing the job
jest.mock('../../models/User.js', () => ({
  __esModule: true,
  default: {
    findExpiredDeletions: jest.fn(),
    permanentlyDelete: jest.fn(),
  },
}));

// Mock node-cron BEFORE importing the job
const mockStop = jest.fn();
const mockSchedule = jest.fn();

// Set up the mock to return a job object with stop function
mockSchedule.mockImplementation((schedule, callback, options) => {
  return {
    stop: mockStop,
  };
});

jest.mock('node-cron', () => ({
  __esModule: true,
  default: {
    get schedule() {
      return mockSchedule;
    },
  },
}));

// Import after mocking
import { processPermanentDeletions, startPermanentDeletionJob, stopPermanentDeletionJob } from '../permanentDeletionJob.js';
import User from '../../models/User.js';
import cron from 'node-cron';

describe('Permanent Deletion Cron Job', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStop.mockClear();
    mockSchedule.mockClear();
    // Re-apply the mock implementation
    mockSchedule.mockImplementation((schedule, callback, options) => {
      return {
        stop: mockStop,
      };
    });
  });

  describe('processPermanentDeletions()', () => {
    it('should return zero results when no users are expired', async () => {
      User.findExpiredDeletions.mockResolvedValue([]);

      const results = await processPermanentDeletions();

      expect(results).toEqual({
        found: 0,
        deleted: 0,
        failed: 0,
        errors: [],
      });
      expect(User.findExpiredDeletions).toHaveBeenCalledTimes(1);
      expect(User.permanentlyDelete).not.toHaveBeenCalled();
    });

    it('should successfully delete all expired users', async () => {
      const expiredUsers = [
        {
          id: 1,
          email: 'user1@example.com',
          deletion_scheduled_at: '2024-10-01T00:00:00.000Z',
        },
        {
          id: 2,
          email: 'user2@example.com',
          deletion_scheduled_at: '2024-10-02T00:00:00.000Z',
        },
        {
          id: 3,
          email: 'user3@example.com',
          deletion_scheduled_at: '2024-10-03T00:00:00.000Z',
        },
      ];

      User.findExpiredDeletions.mockResolvedValue(expiredUsers);
      User.permanentlyDelete.mockResolvedValue({ success: true });

      const results = await processPermanentDeletions();

      expect(results).toEqual({
        found: 3,
        deleted: 3,
        failed: 0,
        errors: [],
      });
      expect(User.findExpiredDeletions).toHaveBeenCalledTimes(1);
      expect(User.permanentlyDelete).toHaveBeenCalledTimes(3);
      expect(User.permanentlyDelete).toHaveBeenCalledWith(1);
      expect(User.permanentlyDelete).toHaveBeenCalledWith(2);
      expect(User.permanentlyDelete).toHaveBeenCalledWith(3);
    });

    it('should handle individual deletion failures without stopping batch', async () => {
      const expiredUsers = [
        {
          id: 1,
          email: 'user1@example.com',
          deletion_scheduled_at: '2024-10-01T00:00:00.000Z',
        },
        {
          id: 2,
          email: 'user2@example.com',
          deletion_scheduled_at: '2024-10-02T00:00:00.000Z',
        },
        {
          id: 3,
          email: 'user3@example.com',
          deletion_scheduled_at: '2024-10-03T00:00:00.000Z',
        },
      ];

      User.findExpiredDeletions.mockResolvedValue(expiredUsers);

      // User 2 fails, others succeed
      User.permanentlyDelete
        .mockResolvedValueOnce({ success: true })
        .mockRejectedValueOnce(new Error('Database connection lost'))
        .mockResolvedValueOnce({ success: true });

      const results = await processPermanentDeletions();

      expect(results).toEqual({
        found: 3,
        deleted: 2,
        failed: 1,
        errors: [
          {
            userId: 2,
            email: 'user2@example.com',
            error: 'Database connection lost',
          },
        ],
      });
      expect(User.permanentlyDelete).toHaveBeenCalledTimes(3);
    });

    it('should handle all deletions failing', async () => {
      const expiredUsers = [
        {
          id: 1,
          email: 'user1@example.com',
          deletion_scheduled_at: '2024-10-01T00:00:00.000Z',
        },
        {
          id: 2,
          email: 'user2@example.com',
          deletion_scheduled_at: '2024-10-02T00:00:00.000Z',
        },
      ];

      User.findExpiredDeletions.mockResolvedValue(expiredUsers);
      User.permanentlyDelete
        .mockRejectedValueOnce(new Error('Error 1'))
        .mockRejectedValueOnce(new Error('Error 2'));

      const results = await processPermanentDeletions();

      expect(results).toEqual({
        found: 2,
        deleted: 0,
        failed: 2,
        errors: [
          { userId: 1, email: 'user1@example.com', error: 'Error 1' },
          { userId: 2, email: 'user2@example.com', error: 'Error 2' },
        ],
      });
    });

    it('should throw error if findExpiredDeletions fails', async () => {
      User.findExpiredDeletions.mockRejectedValue(new Error('Database query failed'));

      await expect(processPermanentDeletions()).rejects.toThrow('Database query failed');
      expect(User.permanentlyDelete).not.toHaveBeenCalled();
    });

    it('should process users in order by deletion_scheduled_at', async () => {
      const expiredUsers = [
        {
          id: 10,
          email: 'oldest@example.com',
          deletion_scheduled_at: '2024-09-01T00:00:00.000Z',
        },
        {
          id: 20,
          email: 'middle@example.com',
          deletion_scheduled_at: '2024-09-15T00:00:00.000Z',
        },
        {
          id: 30,
          email: 'newest@example.com',
          deletion_scheduled_at: '2024-09-30T00:00:00.000Z',
        },
      ];

      User.findExpiredDeletions.mockResolvedValue(expiredUsers);
      User.permanentlyDelete.mockResolvedValue({ success: true });

      await processPermanentDeletions();

      const callOrder = User.permanentlyDelete.mock.calls.map(call => call[0]);
      expect(callOrder).toEqual([10, 20, 30]);
    });
  });

  describe('startPermanentDeletionJob()', () => {
    it('should schedule cron job with correct schedule', () => {
      startPermanentDeletionJob();

      expect(cron.schedule).toHaveBeenCalledTimes(1);
      expect(cron.schedule).toHaveBeenCalledWith(
        '0 2 * * *', // Daily at 2:00 AM
        expect.any(Function),
        expect.objectContaining({
          scheduled: true,
          timezone: 'UTC',
        })
      );
    });

    it('should return cron job instance', () => {
      const job = startPermanentDeletionJob();

      expect(job).toBeDefined();
      expect(job).toHaveProperty('stop');
      expect(typeof job.stop).toBe('function');
    });

    it('should not run immediately by default', () => {
      User.findExpiredDeletions.mockResolvedValue([]);

      startPermanentDeletionJob();

      // Process should not be called immediately
      expect(User.findExpiredDeletions).not.toHaveBeenCalled();
    });

    it('should run immediately when runImmediately option is true', async () => {
      User.findExpiredDeletions.mockResolvedValue([]);

      startPermanentDeletionJob({ runImmediately: true });

      // Give async operation time to start
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(User.findExpiredDeletions).toHaveBeenCalled();
    });

    it('should handle errors in immediate run gracefully', async () => {
      User.findExpiredDeletions.mockRejectedValue(new Error('Database error'));

      // Should not throw - errors are logged but not thrown
      expect(() => {
        startPermanentDeletionJob({ runImmediately: true });
      }).not.toThrow();

      // Give async operation time to complete
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    it('should call processPermanentDeletions when scheduled callback runs', async () => {
      User.findExpiredDeletions.mockResolvedValue([]);

      startPermanentDeletionJob();

      // Get the callback from the cron.schedule mock call
      const callback = cron.schedule.mock.calls[0][1];
      await callback();

      expect(User.findExpiredDeletions).toHaveBeenCalled();
    });

    it('should handle errors in scheduled runs gracefully', async () => {
      User.findExpiredDeletions.mockRejectedValue(new Error('Scheduled run failed'));

      startPermanentDeletionJob();

      // Get the callback from the cron.schedule mock call - should not throw
      const callback = cron.schedule.mock.calls[0][1];
      await expect(callback()).resolves.toBeUndefined();
    });
  });

  describe('stopPermanentDeletionJob()', () => {
    it('should stop the cron job', () => {
      const job = startPermanentDeletionJob();

      stopPermanentDeletionJob(job);

      expect(mockStop).toHaveBeenCalledTimes(1);
    });

    it('should handle null job gracefully', () => {
      expect(() => {
        stopPermanentDeletionJob(null);
      }).not.toThrow();
    });

    it('should handle undefined job gracefully', () => {
      expect(() => {
        stopPermanentDeletionJob(undefined);
      }).not.toThrow();
    });

    it('should handle job without stop method gracefully', () => {
      const invalidJob = { something: 'else' };

      expect(() => {
        stopPermanentDeletionJob(invalidJob);
      }).not.toThrow();
    });
  });

  describe('Integration scenarios', () => {
    it('should complete full lifecycle: start, run, stop', async () => {
      User.findExpiredDeletions.mockResolvedValue([
        {
          id: 1,
          email: 'user@example.com',
          deletion_scheduled_at: '2024-10-01T00:00:00.000Z',
        },
      ]);
      User.permanentlyDelete.mockResolvedValue({ success: true });

      // Start the job
      const job = startPermanentDeletionJob();

      // Run the scheduled callback
      const callback = cron.schedule.mock.calls[0][1];
      await callback();

      // Verify deletion occurred
      expect(User.permanentlyDelete).toHaveBeenCalledWith(1);

      // Stop the job
      stopPermanentDeletionJob(job);
      expect(mockStop).toHaveBeenCalled();
    });

    it('should handle large batch of deletions efficiently', async () => {
      // Create 100 expired users
      const expiredUsers = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        email: `user${i + 1}@example.com`,
        deletion_scheduled_at: `2024-10-${String(i % 30 + 1).padStart(2, '0')}T00:00:00.000Z`,
      }));

      User.findExpiredDeletions.mockResolvedValue(expiredUsers);
      User.permanentlyDelete.mockResolvedValue({ success: true });

      const results = await processPermanentDeletions();

      expect(results.found).toBe(100);
      expect(results.deleted).toBe(100);
      expect(results.failed).toBe(0);
      expect(User.permanentlyDelete).toHaveBeenCalledTimes(100);
    });

    it('should provide detailed error information for failed deletions', async () => {
      const expiredUsers = [
        { id: 1, email: 'user1@example.com', deletion_scheduled_at: '2024-10-01T00:00:00.000Z' },
        { id: 2, email: 'user2@example.com', deletion_scheduled_at: '2024-10-02T00:00:00.000Z' },
        { id: 3, email: 'user3@example.com', deletion_scheduled_at: '2024-10-03T00:00:00.000Z' },
      ];

      User.findExpiredDeletions.mockResolvedValue(expiredUsers);
      User.permanentlyDelete
        .mockResolvedValueOnce({ success: true })
        .mockRejectedValueOnce(new Error('Foreign key constraint violation'))
        .mockRejectedValueOnce(new Error('User not found'));

      const results = await processPermanentDeletions();

      expect(results.errors).toHaveLength(2);
      expect(results.errors[0]).toEqual({
        userId: 2,
        email: 'user2@example.com',
        error: 'Foreign key constraint violation',
      });
      expect(results.errors[1]).toEqual({
        userId: 3,
        email: 'user3@example.com',
        error: 'User not found',
      });
    });
  });
});
