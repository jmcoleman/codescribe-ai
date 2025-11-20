/**
 * GitHub Integration Constants
 *
 * Configuration for GitHub repository integration and multi-file import.
 */

/**
 * Maximum number of files that can be imported in a single batch operation.
 * Tier-based limits to control API usage and system load.
 *
 * Usage:
 *   const maxFiles = GITHUB_BATCH_LIMITS[userTier] || GITHUB_BATCH_LIMITS.pro;
 */
export const GITHUB_BATCH_LIMITS = {
  free: 1,        // Single file only (no batch processing)
  starter: 1,     // Single file only (no batch processing)
  pro: 20,        // Small to medium batches
  team: 50,       // Large batches for team workflows
  enterprise: 100 // Maximum batch size for enterprise
};

/**
 * Batch size for parallel processing within each batch.
 * Process this many files concurrently, then move to next batch.
 *
 * Rationale:
 * - 5 files provides good balance between speed and control
 * - Allows progress updates every 5 files
 * - Enables rate limit checking between batches
 * - Prevents memory spikes from loading too many files at once
 */
export const GITHUB_PARALLEL_BATCH_SIZE = 5;

/**
 * Default file size limit for GitHub file previews (100KB)
 * This is overridden by tier-specific limits during import.
 */
export const GITHUB_PREVIEW_SIZE_LIMIT = 100 * 1024; // 100KB
