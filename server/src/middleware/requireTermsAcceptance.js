/**
 * Middleware: Require Terms Acceptance
 *
 * Checks if authenticated users have accepted the current version of
 * Terms of Service and Privacy Policy. If not, returns 403 with info
 * about which documents need to be accepted.
 *
 * Usage:
 * - Apply to protected routes that require current legal acceptance
 * - Returns 403 with reacceptance_required flag and missing documents
 * - Frontend shows TermsAcceptanceModal to collect new acceptance
 */

import {
  CURRENT_TERMS_VERSION,
  CURRENT_PRIVACY_VERSION,
  needsLegalReacceptance,
} from '../constants/legalVersions.js';

/**
 * Middleware to check if user needs to re-accept legal documents
 * Only applies to authenticated users (requires req.user from JWT middleware)
 *
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next middleware
 */
export function requireTermsAcceptance(req, res, next) {
  // Skip if user is not authenticated (handled by requireAuth middleware)
  if (!req.user) {
    return next();
  }

  const reacceptance = needsLegalReacceptance(req.user);

  // If user needs to re-accept any legal documents
  if (reacceptance.needsAny) {
    return res.status(403).json({
      error: 'Terms acceptance required',
      reacceptance_required: true,
      missing_acceptance: {
        terms: reacceptance.needsTerms ? CURRENT_TERMS_VERSION : null,
        privacy: reacceptance.needsPrivacy ? CURRENT_PRIVACY_VERSION : null,
      },
      current_versions: {
        terms: CURRENT_TERMS_VERSION,
        privacy: CURRENT_PRIVACY_VERSION,
      },
      message: 'You must accept the current Terms of Service and Privacy Policy to continue.',
    });
  }

  // User has accepted current versions, proceed
  next();
}

/**
 * Optional middleware - warns but doesn't block
 * Useful for non-critical routes where you want to inform but not block
 *
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next middleware
 */
export function warnTermsAcceptance(req, res, next) {
  if (!req.user) {
    return next();
  }

  const reacceptance = needsLegalReacceptance(req.user);

  if (reacceptance.needsAny) {
    // Add warning to response headers (frontend can check)
    res.setHeader('X-Terms-Reacceptance-Required', 'true');
    res.setHeader('X-Terms-Missing', JSON.stringify({
      terms: reacceptance.needsTerms,
      privacy: reacceptance.needsPrivacy,
    }));
  }

  next();
}

export default requireTermsAcceptance;
