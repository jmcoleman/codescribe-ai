/**
 * Usage simulation utilities for development and testing
 * Provides direct banner/modal display for UI evaluation
 *
 * Usage:
 * - simulateUsage.show(80) or show(90) → Shows UsageWarningBanner (yellow, soft limit)
 * - simulateUsage.show(100) → Shows UsageLimitModal (blocking, hard limit)
 * - simulateUsage.hide() → Hides banner/modal
 */

/**
 * Helper to get first day of next month
 */
const getNextMonthStart = () => {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return nextMonth.toISOString();
};

/**
 * Helper to get tomorrow at midnight
 */
const getTomorrow = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow.toISOString();
};

/**
 * Mock usage data scenarios
 */
export const USAGE_SCENARIOS = {
  // 80% usage - should trigger warning banner
  // Free tier: 3 daily, 10 monthly (so 80% = 8/10)
  WARNING_80: {
    tier: 'free',
    daily: { used: 2, limit: 3, remaining: 1 },
    monthly: { used: 8, limit: 10, remaining: 2 },
    resetTimes: {
      daily: getTomorrow(),
      monthly: getNextMonthStart()
    }
  },

  // 90% usage - should trigger warning banner
  // Free tier: 3 daily, 10 monthly (so 90% = 9/10)
  WARNING_90: {
    tier: 'free',
    daily: { used: 3, limit: 3, remaining: 0 },
    monthly: { used: 9, limit: 10, remaining: 1 },
    resetTimes: {
      daily: getTomorrow(),
      monthly: getNextMonthStart()
    }
  },

  // 100% usage - should trigger limit modal and block generation
  // Free tier: 3 daily, 10 monthly (so 100% = 10/10)
  LIMIT_100: {
    tier: 'free',
    daily: { used: 3, limit: 3, remaining: 0 },
    monthly: { used: 10, limit: 10, remaining: 0 },
    resetTimes: {
      daily: getTomorrow(),
      monthly: getNextMonthStart()
    }
  },

  // 50% usage - no warnings
  // Free tier: 3 daily, 10 monthly (so 50% = 5/10)
  NORMAL_50: {
    tier: 'free',
    daily: { used: 2, limit: 3, remaining: 1 },
    monthly: { used: 5, limit: 10, remaining: 5 },
    resetTimes: {
      daily: getTomorrow(),
      monthly: getNextMonthStart()
    }
  },

  // 10% usage - fresh account
  // Free tier: 3 daily, 10 monthly (so 10% = 1/10)
  FRESH_10: {
    tier: 'free',
    daily: { used: 0, limit: 3, remaining: 3 },
    monthly: { used: 1, limit: 10, remaining: 9 },
    resetTimes: {
      daily: getTomorrow(),
      monthly: getNextMonthStart()
    }
  }
};

/**
 * Creates a usage simulator for direct banner display
 * @returns {Object} Object with show/hide methods
 */
export const createUsageSimulator = () => {
  /**
   * Show banner directly for UI evaluation
   * @param {number} percentage - Usage percentage (10, 50, 80, 90, 100)
   */
  const show = (percentage) => {
    const scenarioMap = {
      10: USAGE_SCENARIOS.FRESH_10,
      50: USAGE_SCENARIOS.NORMAL_50,
      80: USAGE_SCENARIOS.WARNING_80,
      90: USAGE_SCENARIOS.WARNING_90,
      100: USAGE_SCENARIOS.LIMIT_100
    };

    const scenario = scenarioMap[percentage];
    if (!scenario) {
      console.error(`❌ Invalid percentage. Use: 10, 50, 80, 90, or 100`);
      return;
    }

    // Dispatch custom event with usage data to trigger banner display
    window.dispatchEvent(new CustomEvent('show-usage-banner', {
      detail: {
        percentage,
        usage: scenario
      }
    }));

    console.log(`🎨 Showing banner with ${percentage}% usage`);
    console.log(`💡 Call simulateUsage.hide() to remove it`);
  };

  /**
   * Hide banner
   */
  const hide = () => {
    window.dispatchEvent(new CustomEvent('hide-usage-banner'));
    console.log(`✅ Banner hidden`);
  };

  return { show, hide };
};

/**
 * Exposes usage simulator to window object for console access
 * @returns {Function} Cleanup function to remove the window property
 */
export const exposeUsageSimulator = () => {
  // Only create if it doesn't already exist (prevents double initialization in StrictMode)
  if (!window.simulateUsage) {
    window.simulateUsage = createUsageSimulator();
  }

  // Return cleanup function
  return () => {
    delete window.simulateUsage;
  };
};
