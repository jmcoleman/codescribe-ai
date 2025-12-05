/**
 * Trial Expiration Job
 *
 * Scheduled job to handle trial expirations and send reminder emails.
 * Called by Vercel Cron daily at 9:00 AM EST (14:00 UTC).
 *
 * Tasks:
 * 1. Send 3-day expiration reminders
 * 2. Send 1-day expiration reminders
 * 3. Process expired trials (mark as expired)
 * 4. Update exhausted invite codes
 */

import trialService from '../services/trialService.js';
// TODO: Import email service when email templates are ready
// import { sendTrialExpiringEmail, sendTrialExpiredEmail } from '../services/emailService.js';

/**
 * Process trial expirations
 * @returns {Promise<Object>} Job results
 */
export async function processTrialExpirations() {
  const results = {
    reminders3Day: { sent: 0, failed: 0 },
    reminders1Day: { sent: 0, failed: 0 },
    expired: { processed: 0, failed: 0, errors: [] },
    timestamp: new Date().toISOString()
  };

  console.log('[TrialJob] Starting trial expiration check');

  // 1. Get trials expiring in 3 days (for reminder emails)
  try {
    const expiringIn3Days = await trialService.getExpiringTrials(3);
    console.log(`[TrialJob] Found ${expiringIn3Days.length} trials expiring in 3 days`);

    for (const trial of expiringIn3Days) {
      try {
        // TODO: Send email reminder when email templates are ready
        // await sendTrialExpiringEmail(trial.user_id, 3, trial);
        console.log(`[TrialJob] Would send 3-day reminder to user ${trial.user_id} (${trial.user_email})`);
        results.reminders3Day.sent++;
      } catch (error) {
        console.error(`[TrialJob] Failed to process 3-day reminder for user ${trial.user_id}:`, error.message);
        results.reminders3Day.failed++;
      }
    }
  } catch (error) {
    console.error('[TrialJob] Error fetching 3-day expiring trials:', error.message);
  }

  // 2. Get trials expiring in 1 day (for final reminder)
  try {
    const expiringIn1Day = await trialService.getExpiringTrials(1);
    console.log(`[TrialJob] Found ${expiringIn1Day.length} trials expiring in 1 day`);

    for (const trial of expiringIn1Day) {
      try {
        // TODO: Send email reminder when email templates are ready
        // await sendTrialExpiringEmail(trial.user_id, 1, trial);
        console.log(`[TrialJob] Would send 1-day reminder to user ${trial.user_id} (${trial.user_email})`);
        results.reminders1Day.sent++;
      } catch (error) {
        console.error(`[TrialJob] Failed to process 1-day reminder for user ${trial.user_id}:`, error.message);
        results.reminders1Day.failed++;
      }
    }
  } catch (error) {
    console.error('[TrialJob] Error fetching 1-day expiring trials:', error.message);
  }

  // 3. Process expired trials
  try {
    const expiredResults = await trialService.processExpiredTrials();
    results.expired.processed = expiredResults.processed;
    results.expired.failed = expiredResults.failed;
    results.expired.errors = expiredResults.errors;

    console.log(`[TrialJob] Processed ${expiredResults.processed} expired trials, ${expiredResults.failed} failed`);

    // TODO: Send expiration emails when email templates are ready
    // for (const trial of expiredTrials) {
    //   await sendTrialExpiredEmail(trial.user_id, trial);
    // }
  } catch (error) {
    console.error('[TrialJob] Error processing expired trials:', error.message);
    results.expired.errors.push({
      type: 'processing',
      error: error.message
    });
  }

  console.log('[TrialJob] Trial expiration check complete:', results);

  return results;
}

export default processTrialExpirations;
