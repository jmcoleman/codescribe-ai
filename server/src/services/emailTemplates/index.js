/**
 * Email Templates Export
 *
 * Central export point for all email templates
 */

// Base components
export * from './base.js';

// Email templates
export { passwordResetTemplate } from './passwordReset.js';
export { emailVerificationTemplate } from './emailVerification.js';
export { supportRequestTemplate } from './supportRequest.js';
export { contactSalesTemplate } from './contactSales.js';
export {
  deletionScheduledTemplate,
  accountRestoredTemplate,
  finalDeletionWarningTemplate
} from './accountDeletion.js';
