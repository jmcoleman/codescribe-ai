/**
 * Permanent Deletion Cron Job
 *
 * Automatically deletes user accounts that have passed their 30-day grace period.
 * Runs daily at 2:00 AM to process expired deletion requests.
 *
 * GDPR/CCPA Compliance:
 * - Ensures right to erasure is fulfilled within reasonable timeframe
 * - Maintains audit trail of deletion operations
 * - Implements tombstone approach to preserve billing/legal records
 *
 * Schedule: Daily at 2:00 AM (cron: '0 2 * * *')
 */

import cron from 'node-cron';
import User from '../models/User.js';

/**
 * Process all expired deletion requests
 * Finds users past grace period and permanently deletes their data
 *
 * @returns {Promise<Object>} Results of deletion job
 */
export async function processPermanentDeletions() {
  const startTime = Date.now();
  const results = {
    found: 0,
    deleted: 0,
    failed: 0,
    errors: [],
  };

  try {
    // Step 1: Find all users whose deletion grace period has expired
    const expiredUsers = await User.findExpiredDeletions();
    results.found = expiredUsers.length;

    console.log(`[PermanentDeletionJob] Found ${results.found} users ready for permanent deletion`);

    // Step 2: Process each user
    for (const user of expiredUsers) {
      try {
        console.log(`[PermanentDeletionJob] Deleting user ${user.id} (${user.email}) - Scheduled: ${user.deletion_scheduled_at}`);

        // Permanently delete the user (tombstone approach)
        await User.permanentlyDelete(user.id);

        results.deleted++;
        console.log(`[PermanentDeletionJob] Successfully deleted user ${user.id}`);
      } catch (error) {
        results.failed++;
        results.errors.push({
          userId: user.id,
          email: user.email,
          error: error.message,
        });
        console.error(`[PermanentDeletionJob] Failed to delete user ${user.id}:`, error.message);
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[PermanentDeletionJob] Completed in ${duration}ms - Deleted: ${results.deleted}, Failed: ${results.failed}`);

    return results;
  } catch (error) {
    console.error('[PermanentDeletionJob] Job failed:', error);
    throw error;
  }
}

/**
 * Start the permanent deletion cron job
 * Runs daily at 2:00 AM
 *
 * @param {Object} options - Configuration options
 * @param {boolean} options.runImmediately - Run the job immediately on startup (for testing)
 * @returns {Object} Cron job instance
 */
export function startPermanentDeletionJob(options = {}) {
  const { runImmediately = false } = options;

  // Run immediately if requested (useful for testing/development)
  if (runImmediately) {
    console.log('[PermanentDeletionJob] Running immediately on startup');
    processPermanentDeletions().catch((error) => {
      console.error('[PermanentDeletionJob] Initial run failed:', error);
    });
  }

  // Schedule daily job at 2:00 AM
  const job = cron.schedule('0 2 * * *', async () => {
    console.log('[PermanentDeletionJob] Starting scheduled run at 2:00 AM');
    try {
      await processPermanentDeletions();
    } catch (error) {
      console.error('[PermanentDeletionJob] Scheduled run failed:', error);
    }
  }, {
    scheduled: true,
    timezone: 'UTC', // Use UTC for consistency across deployments
  });

  console.log('[PermanentDeletionJob] Cron job scheduled - Daily at 2:00 AM UTC');

  return job;
}

/**
 * Stop the permanent deletion cron job
 *
 * @param {Object} job - Cron job instance
 */
export function stopPermanentDeletionJob(job) {
  if (job && typeof job.stop === 'function') {
    job.stop();
    console.log('[PermanentDeletionJob] Cron job stopped');
  }
}
