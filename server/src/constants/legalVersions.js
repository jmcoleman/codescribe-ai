/**
 * Legal Document Version Management
 *
 * This file defines current versions of Terms of Service and Privacy Policy.
 * When you update legal documents, increment the version here to trigger
 * re-acceptance prompts for all existing users.
 *
 * Version Format: YYYY-MM-DD (ISO date format)
 *
 * Example: When updating Terms of Service on Jan 15, 2026:
 * 1. Update the Terms of Service content in client/src/pages/TermsOfService.jsx
 * 2. Update CURRENT_TERMS_VERSION below to '2026-01-15'
 * 3. All users will be prompted to re-accept on next login/action
 */

// Current version of Terms of Service
// Last updated: November 2, 2025 (v2.5.0 - Initial version)
export const CURRENT_TERMS_VERSION = '2025-11-02';

// Current version of Privacy Policy
// Last updated: November 2, 2025 (v2.5.0 - Initial version)
export const CURRENT_PRIVACY_VERSION = '2025-11-02';

/**
 * Version History (for reference):
 *
 * TERMS OF SERVICE:
 * - 2025-11-02: Initial version (v2.5.0)
 *   - Subscription policies
 *   - Cancellation (no refunds, reverts to Free tier)
 *   - Usage limits and tier policies
 *   - Intellectual property
 *
 * PRIVACY POLICY:
 * - 2025-11-02: Initial version (v2.5.0)
 *   - IP address tracking for anonymous users
 *   - Usage tracking and quotas
 *   - Stripe data processing
 *   - Resend email service usage
 *   - GDPR compliance
 */

/**
 * Check if user has accepted current version of terms
 * @param {Object} user - User object from database
 * @returns {boolean} - True if user has accepted current terms version
 */
export function hasAcceptedCurrentTerms(user) {
  return user.terms_version_accepted === CURRENT_TERMS_VERSION;
}

/**
 * Check if user has accepted current version of privacy policy
 * @param {Object} user - User object from database
 * @returns {boolean} - True if user has accepted current privacy version
 */
export function hasAcceptedCurrentPrivacy(user) {
  return user.privacy_version_accepted === CURRENT_PRIVACY_VERSION;
}

/**
 * Check if user needs to re-accept legal documents
 * @param {Object} user - User object from database
 * @returns {Object} - Object with needsTerms and needsPrivacy booleans
 */
export function needsLegalReacceptance(user) {
  return {
    needsTerms: !hasAcceptedCurrentTerms(user),
    needsPrivacy: !hasAcceptedCurrentPrivacy(user),
    needsAny: !hasAcceptedCurrentTerms(user) || !hasAcceptedCurrentPrivacy(user),
  };
}
