/**
 * Campaign Configuration
 *
 * Database-driven campaign configuration for auto-trial grants.
 * Campaigns are managed via the admin UI - no code changes needed.
 */

import Campaign from '../models/Campaign.js';

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
    cachedCampaign = await Campaign.getActive();
    cacheTimestamp = now;
    return cachedCampaign;
  } catch (error) {
    console.error('[Campaign] Error fetching active campaign:', error);
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
  const campaign = await getActiveCampaign();
  return campaign !== null;
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
 * @returns {Promise<Object>} Campaign status
 */
export async function getCampaignStatus() {
  const campaign = await getActiveCampaign();

  return {
    active: campaign !== null,
    campaign: campaign ? {
      id: campaign.id,
      name: campaign.name,
      tier: campaign.trial_tier,
      days: campaign.trial_days,
      startsAt: campaign.starts_at,
      endsAt: campaign.ends_at,
      signupsCount: campaign.signups_count,
      conversionsCount: campaign.conversions_count,
    } : null,
  };
}
