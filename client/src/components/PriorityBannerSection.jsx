import { ErrorBanner } from './ErrorBanner';
import { UsageWarningBanner } from './UsageWarningBanner';

/**
 * PriorityBannerSection Component
 *
 * Displays the highest priority notification banner.
 * Priority Order:
 * 1. Claude API / generation errors (blocking)
 * 2. Upload errors
 * 3. Usage warning (80%+ usage, non-blocking)
 *
 * @param {Object} props
 * @param {string|null} props.error - API/generation error message
 * @param {number|null} props.retryAfter - Retry delay for rate limits
 * @param {string|null} props.uploadError - File upload error message
 * @param {boolean} props.showUsageWarning - Whether to show usage warning
 * @param {Object|null} props.usage - Usage data for warning banner
 * @param {string} props.currentTier - User's current tier
 * @param {Function} props.onDismissError - Handler to dismiss API error
 * @param {Function} props.onDismissUploadError - Handler to dismiss upload error
 * @param {Function} props.onDismissUsageWarning - Handler to dismiss usage warning
 * @param {Function} props.onUpgrade - Handler for upgrade CTA
 */
export function PriorityBannerSection({
  error,
  retryAfter,
  uploadError,
  showUsageWarning,
  usage,
  currentTier,
  onDismissError,
  onDismissUploadError,
  onDismissUsageWarning,
  onUpgrade
}) {
  if (error) {
    // Priority 1: Claude API rate limit or generation errors (blocking)
    return (
      <div role="region" aria-label="Error notification">
        <ErrorBanner
          error={error}
          retryAfter={retryAfter}
          onDismiss={onDismissError}
        />
      </div>
    );
  }

  if (uploadError) {
    // Priority 2: Upload errors
    return (
      <div role="region" aria-label="Upload error notification">
        <ErrorBanner
          error={uploadError}
          onDismiss={onDismissUploadError}
        />
      </div>
    );
  }

  if (showUsageWarning && usage) {
    // Priority 3: Usage warning (80%+ usage, non-blocking)
    return (
      <div className="mb-6" role="region" aria-label="Usage warning">
        <UsageWarningBanner
          usage={usage}
          currentTier={currentTier}
          onDismiss={onDismissUsageWarning}
          onUpgrade={onUpgrade}
        />
      </div>
    );
  }

  return null;
}
