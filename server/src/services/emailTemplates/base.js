/**
 * Base Email Template Components
 *
 * Shared components and utilities for all email templates
 */

/**
 * Email header with gradient purple background
 * @param {string} title - Main heading text
 * @param {string} subtitle - Subtitle/greeting text (optional)
 */
export function emailHeader(title, subtitle = '') {
  return `
    <div style="background: linear-gradient(135deg, #9333ea 0%, #7c3aed 100%); padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
      ${subtitle ? `<p style="color: rgba(255, 255, 255, 0.95); margin: 0 0 12px 0; font-size: 16px; font-weight: 500; letter-spacing: 0.3px;">${subtitle}</p>` : ''}
      <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">${title}</h1>
    </div>
  `;
}

/**
 * Email footer with brand colors
 * @param {string} clientUrl - Base URL for the application
 */
export function emailFooter(clientUrl) {
  return `
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center;">
      <p style="color: #1e293b; font-size: 15px; font-weight: 600; margin: 0 0 6px 0;">CodeScribe AI</p>
      <p style="color: #64748b; font-size: 13px; margin: 0 0 12px 0;">Secure documentation automation for engineering teams</p>
      <p style="color: #64748b; font-size: 12px; margin: 0;">
        <a href="${clientUrl}/contact" style="color: #9333ea; text-decoration: none;">Support</a> ·
        <a href="${clientUrl}/privacy" style="color: #9333ea; text-decoration: none;">Privacy</a> ·
        <a href="${clientUrl}/terms" style="color: #9333ea; text-decoration: none;">Terms</a>
      </p>
    </div>
  `;
}

/**
 * Tier badge component - plain text for emails (no UI badge styling)
 * @param {string} tier - User's tier (free, starter, pro, team, enterprise)
 * @param {string} environment - Current environment (optional, for display purposes)
 */
export function tierBadge(tier, environment) {
  const tierNames = {
    enterprise: 'Priority',
    team: 'Priority',
    pro: 'Pro',
    starter: 'Starter',
    free: 'Free'
  };

  const tierName = tierNames[tier?.toLowerCase()] || 'Free';
  const envSuffix = environment && environment !== 'production'
    ? ` (${environment.charAt(0).toUpperCase() + environment.slice(1)})`
    : '';

  return `Plan: ${tierName}${envSuffix}`;
}

/**
 * Environment badge component (only shown in non-production)
 * @param {string} env - Environment name (development, staging, test)
 */
export function environmentBadge(env) {
  if (env === 'production') return '';

  const envName = env?.toUpperCase() || 'DEV';

  return `
    <span style="display: inline-flex; align-items: center; padding: 4px 8px; background: #ecfeff; color: #155e75; font-size: 11px; font-weight: 500; text-transform: uppercase; border-radius: 6px;">
      ${envName}
    </span>
  `;
}

/**
 * Section heading with left border accent
 * @param {string} title - Section title
 */
export function sectionHeading(title) {
  return `
    <h3 style="color: #475569; margin: 0 0 12px 0; font-size: 16px; font-weight: 600; border-left: 4px solid #9333ea; padding-left: 12px;">${title}</h3>
  `;
}

/**
 * Content box with light background
 * @param {string} content - HTML content to wrap
 */
export function contentBox(content) {
  return `
    <div style="background: #f8fafc; padding: 20px; border-radius: 8px;">
      ${content}
    </div>
  `;
}

/**
 * Primary button (refined light theme)
 * @param {string} text - Button text
 * @param {string} url - Button URL
 */
export function primaryButton(text, url) {
  return `
    <a href="${url}" style="display: inline-block; padding: 12px 30px; background: #9333ea; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">${text}</a>
  `;
}

/**
 * Base HTML wrapper
 * @param {string} title - Email title (for <title> tag)
 * @param {string} content - Email body content
 */
export function baseHTML(title, content) {
  return `
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #334155; max-width: 600px; margin: 0 auto; padding: 20px;">
        ${content}
      </body>
    </html>
  `;
}
