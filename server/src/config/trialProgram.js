/**
 * Trial Program Configuration
 *
 * Database-driven campaign configuration for auto-trial grants.
 * Campaigns are managed via the admin UI - no code changes needed.
 */

import TrialProgram from '../models/TrialProgram.js';

// Cache for active campaign (refreshed on each check)
let cachedCampaign = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 30 * 1000; // 30 second cache

/**
 * Get the currently active campaign (with caching)
 * Returns null if no campaign is active
 *
 * @returns {Promise<Object|null>} Active campaign or null
 */
export async function getActiveCampaign() {
  const now = Date.now();

  // Return cached value if still valid
  if (cachedCampaign !== null && (now - cacheTimestamp) < CACHE_TTL_MS) {
    return cachedCampaign;
  }

  // Fetch from database
  try {
    cachedCampaign = await TrialProgram.getActive();
    cacheTimestamp = now;
    return cachedCampaign;
  } catch (error) {
    console.error('[Trial Program] Error fetching active campaign:', error);
    // On error, return cached value if we have one, otherwise null
    return cachedCampaign;
  }
}

/**
 * Check if any auto-trial campaign is currently active
 *
 * @returns {Promise<boolean>} True if a campaign is active
 */
export async function isCampaignActive() {
  const trialProgram = await getActiveCampaign();
  return trialProgram !== null;
}

/**
 * Clear the campaign cache (call after campaign updates)
 */
export function clearCampaignCache() {
  cachedCampaign = null;
  cacheTimestamp = 0;
}

/**
 * Get campaign status for admin visibility
 *
 * @returns {Promise<Object>} Trial Program status
 */
export async function getCampaignStatus() {
  const trialProgram = await getActiveCampaign();

  return {
    active: trialProgram !== null,
    trialProgram: trialProgram ? {
      id: trialProgram.id,
      name: trialProgram.name,
      tier: trialProgram.trial_tier,
      days: trialProgram.trial_days,
      startsAt: trialProgram.starts_at,
      endsAt: trialProgram.ends_at,
      signupsCount: trialProgram.signups_count,
      conversionsCount: trialProgram.conversions_count,
    } : null,
  };
}
