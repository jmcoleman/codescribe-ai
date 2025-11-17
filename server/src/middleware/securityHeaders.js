/**
 * Security Headers Middleware
 *
 * Adds HTTP security headers to all responses to protect against common web vulnerabilities.
 *
 * Headers implemented:
 * - X-Frame-Options: Prevents clickjacking attacks by disallowing iframe embedding
 * - X-Content-Type-Options: Prevents MIME type sniffing attacks
 * - X-XSS-Protection: Enables XSS filtering in older browsers (modern browsers have built-in protection)
 * - Referrer-Policy: Prevents leaking sensitive URLs to third parties
 * - Permissions-Policy: Restricts access to browser features (camera, microphone, geolocation)
 *
 * @see https://owasp.org/www-project-secure-headers/
 * @see docs/architecture/SECURITY-HEADERS.md (future documentation)
 */

/**
 * Apply security headers to all responses
 *
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next middleware function
 */
export function securityHeaders(req, res, next) {
  // Prevent clickjacking: Disallow embedding in iframes
  // Alternative: 'SAMEORIGIN' to allow same-origin iframes
  res.setHeader('X-Frame-Options', 'DENY');

  // Prevent MIME type sniffing: Force browser to respect Content-Type
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Enable XSS filter in older browsers (legacy support)
  // Modern browsers (Chrome 78+, Edge 79+) have deprecated this in favor of CSP
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Control referrer information sent to external sites
  // strict-origin-when-cross-origin: Send full URL to same origin, origin only to cross-origin
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Restrict browser feature access (Permissions Policy)
  // Denies access to camera, microphone, geolocation, payment APIs
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=()'
  );

  next();
}

/**
 * Optional: Strict security headers for production
 * Includes stricter CSP and additional protections
 *
 * Note: Content-Security-Policy (CSP) not included yet as it requires:
 * - Nonce generation for inline scripts
 * - Allowlisting external script sources (Monaco, analytics, etc.)
 * - Testing to ensure no functionality breaks
 *
 * Future enhancement: Add CSP in separate PR with thorough testing
 * @see TODO.md - Security Improvements (Priority 1)
 */
export function strictSecurityHeaders(req, res, next) {
  // Apply base security headers
  securityHeaders(req, res, next);

  // Additional strict headers for production
  // Uncomment when CSP is ready:
  // res.setHeader(
  //   'Content-Security-Policy',
  //   "default-src 'self'; script-src 'self' 'nonce-{RANDOM}'; style-src 'self' 'unsafe-inline';"
  // );
}

// Export default middleware
export default securityHeaders;
