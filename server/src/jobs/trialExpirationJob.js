/**
 * Trial Expiration Job
 *
 * Scheduled job to handle trial expirations and send reminder emails.
 * Called by Vercel Cron daily at 9:00 AM EST (14:00 UTC).
 *
 * Tasks:
 * 1. Send 3-day expiration reminders
 * 2. Send 1-day expiration reminders
 * 3. Process expired trials (mark as expired, send expiry email)
 * 4. Update exhausted invite codes
 *
 * Email Deduplication:
 * Uses trial_email_history table to prevent duplicate sends.
 * Each email type per trial can only be sent once.
 */

import trialService from '../services/trialService.js';
import {
  sendTrialExpiringEmail,
  sendTrialExpiredEmail
} from '../services/emailService.js';
import TrialEmailHistory from '../models/TrialEmailHistory.js';

/**
 * Send email with deduplication tracking
 * @param {Object} trial - Trial object with user info
 * @param {string} emailType - Type of email to send
 * @param {Function} sendFn - Email sending function
 * @param {Object} emailParams - Parameters for the email function
 * @returns {Promise<Object>} Result with status
 */
async function sendEmailWithTracking(trial, emailType, sendFn, emailParams) {
  // Create pending record (returns null if already exists)
  const record = await TrialEmailHistory.createPending({
    trialId: trial.id,
    userId: trial.user_id,
    emailType
  });

  // If null, email was already sent
  if (!record) {
    console.log(`[TrialJob] Email ${emailType} already sent for trial ${trial.id}, skipping`);
    return { status: 'skipped', reason: 'already_sent' };
  }

  try {
    // Attempt to send the email
    await sendFn(emailParams);

    // Mark as sent
    await TrialEmailHistory.markSent(record.id);

    console.log(`[TrialJob] Successfully sent ${emailType} email to ${emailParams.to}`);
    return { status: 'sent' };
  } catch (error) {
    // Mark as failed with error message
    await TrialEmailHistory.markFailed(record.id, error.message);

    console.error(`[TrialJob] Failed to send ${emailType} email to ${emailParams.to}:`, error.message);
    return { status: 'failed', error: error.message };
  }
}

/**
 * Process trial expirations
 * @returns {Promise<Object>} Job results
 */
export async function processTrialExpirations() {
  const results = {
    reminders3Day: { sent: 0, failed: 0, skipped: 0 },
    reminders1Day: { sent: 0, failed: 0, skipped: 0 },
    expired: { processed: 0, failed: 0, emailsSent: 0, emailsFailed: 0, errors: [] },
    timestamp: new Date().toISOString()
  };

  console.log('[TrialJob] Starting trial expiration check');

  // 1. Get trials expiring in 3 days (for reminder emails)
  try {
    const expiringIn3Days = await trialService.getExpiringTrials(3);
    console.log(`[TrialJob] Found ${expiringIn3Days.length} trials expiring in 3 days`);

    for (const trial of expiringIn3Days) {
      const result = await sendEmailWithTracking(
        trial,
        TrialEmailHistory.EMAIL_TYPES.THREE_DAY_REMINDER,
        sendTrialExpiringEmail,
        {
          to: trial.user_email,
          userName: trial.user_name || trial.user_email.split('@')[0],
          daysRemaining: 3,
          trialTier: trial.trial_tier,
          expiresAt: trial.ends_at
        }
      );

      if (result.status === 'sent') results.reminders3Day.sent++;
      else if (result.status === 'failed') results.reminders3Day.failed++;
      else if (result.status === 'skipped') results.reminders3Day.skipped++;
    }
  } catch (error) {
    console.error('[TrialJob] Error fetching 3-day expiring trials:', error.message);
    results.expired.errors.push({
      type: '3_day_fetch',
      error: error.message
    });
  }

  // 2. Get trials expiring in 1 day (for final reminder)
  try {
    const expiringIn1Day = await trialService.getExpiringTrials(1);
    console.log(`[TrialJob] Found ${expiringIn1Day.length} trials expiring in 1 day`);

    for (const trial of expiringIn1Day) {
      const result = await sendEmailWithTracking(
        trial,
        TrialEmailHistory.EMAIL_TYPES.ONE_DAY_REMINDER,
        sendTrialExpiringEmail,
        {
          to: trial.user_email,
          userName: trial.user_name || trial.user_email.split('@')[0],
          daysRemaining: 1,
          trialTier: trial.trial_tier,
          expiresAt: trial.ends_at
        }
      );

      if (result.status === 'sent') results.reminders1Day.sent++;
      else if (result.status === 'failed') results.reminders1Day.failed++;
      else if (result.status === 'skipped') results.reminders1Day.skipped++;
    }
  } catch (error) {
    console.error('[TrialJob] Error fetching 1-day expiring trials:', error.message);
    results.expired.errors.push({
      type: '1_day_fetch',
      error: error.message
    });
  }

  // 3. Process expired trials
  try {
    const expiredResults = await trialService.processExpiredTrials();
    results.expired.processed = expiredResults.processed;
    results.expired.failed = expiredResults.failed;
    results.expired.errors.push(...(expiredResults.errors || []));

    console.log(`[TrialJob] Processed ${expiredResults.processed} expired trials, ${expiredResults.failed} failed`);

    // Send expiration emails for newly expired trials
    if (expiredResults.expiredTrials && expiredResults.expiredTrials.length > 0) {
      for (const trial of expiredResults.expiredTrials) {
        const result = await sendEmailWithTracking(
          trial,
          TrialEmailHistory.EMAIL_TYPES.TRIAL_EXPIRED,
          sendTrialExpiredEmail,
          {
            to: trial.user_email,
            userName: trial.user_name || trial.user_email.split('@')[0],
            trialTier: trial.trial_tier,
            expiredAt: trial.ends_at
          }
        );

        if (result.status === 'sent') results.expired.emailsSent++;
        else if (result.status === 'failed') results.expired.emailsFailed++;
      }
    }
  } catch (error) {
    console.error('[TrialJob] Error processing expired trials:', error.message);
    results.expired.errors.push({
      type: 'processing',
      error: error.message
    });
  }

  console.log('[TrialJob] Trial expiration check complete:', JSON.stringify(results, null, 2));

  return results;
}

export default processTrialExpirations;
