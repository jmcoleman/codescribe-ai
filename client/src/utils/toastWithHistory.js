/**
 * Enhanced Toast Utilities with Automatic History Tracking
 *
 * This module wraps the standard toast utilities and automatically
 * tracks all notifications in the toast history/notification center.
 *
 * Usage:
 * Instead of importing from './toast', import from './toastWithHistory'
 * to get automatic tracking:
 *
 * @example
 * // Before
 * import { toastSuccess } from './utils/toast';
 *
 * // After (with history tracking)
 * import { toastSuccess } from './utils/toastWithHistory';
 */

import {
  toastSuccess as originalToastSuccess,
  toastError as originalToastError,
  toastWarning as originalToastWarning,
  toastInfo as originalToastInfo,
  toastLoading as originalToastLoading,
  toastCopied as originalToastCopied,
  toastFileUploaded as originalToastFileUploaded,
  toastDocGenerated as originalToastDocGenerated,
  toastWelcomeBack as originalToastWelcomeBack,
  toastRateLimited as originalToastRateLimited,
  toastNetworkError as originalToastNetworkError,
  toastCompact as originalToastCompact,
  // Re-export everything else as-is
  toastPromise,
  toastWithActions,
  toastProgress,
  toastUndo,
  toastConfirm,
  toastGrouped,
  toastExpandable,
  toastAvatar,
  toastPersistent,
  toastBatch,
  toastShortcut,
  toastFeature,
  toastDebug,
  toastCustom,
  dismissToast,
  dismissAllToasts,
  clearToastGroup,
  toastQueue,
  toast,
} from './toast';

import { emitToastEvent } from '../components/toast/ToastHistory';

/**
 * Helper to emit toast event for history tracking
 */
const trackToast = (type, message, title, id) => {
  emitToastEvent({
    id,
    type,
    title: title || message,
    message: title ? message : undefined,
    timestamp: Date.now(),
  });
};

/**
 * Success toast with history tracking
 */
export const toastSuccess = (message, options = {}) => {
  const id = originalToastSuccess(message, options);
  trackToast('success', message, null, id);
  return id;
};

/**
 * Error toast with history tracking
 */
export const toastError = (message, options = {}) => {
  const id = originalToastError(message, options);
  trackToast('error', message, null, id);
  return id;
};

/**
 * Warning toast with history tracking
 */
export const toastWarning = (title, message, action = null, options = {}) => {
  const id = originalToastWarning(title, message, action, options);
  trackToast('warning', message, title, id);
  return id;
};

/**
 * Info toast with history tracking
 */
export const toastInfo = (message, options = {}) => {
  const id = originalToastInfo(message, options);
  trackToast('info', message, null, id);
  return id;
};

/**
 * Loading toast with history tracking
 */
export const toastLoading = (message, options = {}) => {
  const id = originalToastLoading(message, options);
  trackToast('info', message, 'Loading', id);
  return id;
};

/**
 * Copied toast with history tracking
 */
export const toastCopied = () => {
  const id = originalToastCopied();
  trackToast('success', 'Copied to clipboard!', null, id);
  return id;
};

/**
 * File uploaded toast with history tracking
 */
export const toastFileUploaded = (fileName, fileSize) => {
  const id = originalToastFileUploaded(fileName, fileSize);
  trackToast('success', `${fileName} (${fileSize})`, 'File uploaded', id);
  return id;
};

/**
 * Documentation generated toast with history tracking
 */
export const toastDocGenerated = (grade, score) => {
  const id = originalToastDocGenerated(grade, score);
  trackToast(
    'success',
    `Quality Score: ${grade} (${score}/100)`,
    'Documentation generated',
    id
  );
  return id;
};

/**
 * Welcome back toast with history tracking
 */
export const toastWelcomeBack = () => {
  const id = originalToastWelcomeBack();
  trackToast('success', 'Welcome back!', null, id);
  return id;
};

/**
 * Rate limited toast with history tracking
 */
export const toastRateLimited = (retryAfter) => {
  const id = originalToastRateLimited(retryAfter);
  const minutes = Math.ceil(retryAfter / 60);
  trackToast(
    'error',
    `Please try again in ${minutes} minute${minutes > 1 ? 's' : ''}`,
    'Rate limit exceeded',
    id
  );
  return id;
};

/**
 * Network error toast with history tracking
 */
export const toastNetworkError = () => {
  const id = originalToastNetworkError();
  trackToast('error', 'Please check your connection and try again', 'Network error', id);
  return id;
};

/**
 * Compact toast with history tracking
 */
export const toastCompact = (message, type = 'info', options = {}) => {
  const id = originalToastCompact(message, type, options);
  trackToast(type, message, null, id);
  return id;
};

// Re-export everything else
export {
  toastPromise,
  toastWithActions,
  toastProgress,
  toastUndo,
  toastConfirm,
  toastGrouped,
  toastExpandable,
  toastAvatar,
  toastPersistent,
  toastBatch,
  toastShortcut,
  toastFeature,
  toastDebug,
  toastCustom,
  dismissToast,
  dismissAllToasts,
  clearToastGroup,
  toastQueue,
  toast,
};
