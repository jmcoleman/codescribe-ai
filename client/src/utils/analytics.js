/**
 * Analytics Utility - Privacy-First Tracking
 *
 * Integrates with Plausible Analytics for custom event tracking
 * with automatic device/browser context enrichment.
 */

// Lazy load Plausible to avoid blocking main bundle
let plausible = null;

const initPlausible = async () => {
  if (plausible) return plausible;

  // Only initialize in production
  if (import.meta.env.PROD) {
    try {
      const { default: Plausible } = await import('plausible-tracker');
      plausible = Plausible({
        domain: 'codescribeai.com',
        trackLocalhost: false, // Don't track dev environment
        apiHost: 'https://plausible.io', // Or your self-hosted instance
      });
      return plausible;
    } catch (error) {
      console.warn('Plausible analytics failed to load:', error);
      return null;
    }
  }
  return null;
};

/**
 * Get device context for enriched tracking
 */
const getDeviceContext = () => {
  const ua = navigator.userAgent;
  const width = window.innerWidth;

  // Detect device type
  let deviceType = 'desktop';
  if (width < 768) {
    deviceType = 'mobile';
  } else if (width < 1024) {
    deviceType = 'tablet';
  }

  // Detect browser (simple detection)
  let browser = 'unknown';
  if (ua.includes('Chrome') && !ua.includes('Edg')) {
    browser = 'chrome';
  } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
    browser = 'safari';
  } else if (ua.includes('Firefox')) {
    browser = 'firefox';
  } else if (ua.includes('Edg')) {
    browser = 'edge';
  }

  // Detect OS
  let os = 'unknown';
  if (ua.includes('Win')) {
    os = 'windows';
  } else if (ua.includes('Mac')) {
    os = 'macos';
  } else if (ua.includes('Linux')) {
    os = 'linux';
  } else if (ua.includes('Android')) {
    os = 'android';
  } else if (ua.includes('iPhone') || ua.includes('iPad')) {
    os = 'ios';
  }

  // Screen size bucket
  let screenSize = 'xl'; // >1280px
  if (width < 640) {
    screenSize = 'xs'; // mobile
  } else if (width < 768) {
    screenSize = 'sm'; // large mobile
  } else if (width < 1024) {
    screenSize = 'md'; // tablet
  } else if (width < 1280) {
    screenSize = 'lg'; // small desktop
  }

  return {
    deviceType,
    browser,
    os,
    screenSize,
    viewportWidth: width,
  };
};

/**
 * Track a custom event with automatic device context
 */
export const trackEvent = async (eventName, props = {}) => {
  // Only track in production
  if (!import.meta.env.PROD) {
    console.log('[Analytics - Dev]', eventName, props);
    return;
  }

  try {
    const tracker = await initPlausible();
    if (!tracker) return;

    // Enrich with device context (optional - Plausible already tracks this globally)
    // Uncomment if you want device context on EVERY event
    // const deviceContext = getDeviceContext();

    tracker.trackEvent(eventName, {
      props: {
        ...props,
        // ...deviceContext, // Uncomment to add to every event
      },
    });
  } catch (error) {
    console.warn('Failed to track event:', error);
  }
};

/**
 * Track page view (called automatically by Plausible script)
 * This is a manual override if needed
 */
export const trackPageView = async (pathname) => {
  if (!import.meta.env.PROD) return;

  try {
    const tracker = await initPlausible();
    if (!tracker) return;

    tracker.trackPageview({
      url: pathname || window.location.pathname,
    });
  } catch (error) {
    console.warn('Failed to track page view:', error);
  }
};

/**
 * Analytics event tracking for key user actions
 */
export const analytics = {
  /**
   * Track documentation generation
   */
  trackGeneration: async (docType, language, linesOfCode, success) => {
    const deviceContext = getDeviceContext();

    await trackEvent('doc_generated', {
      docType, // README, JSDoc, API, ARCHITECTURE
      language, // javascript, typescript, python, etc.
      linesOfCode: Math.floor(linesOfCode / 100) * 100, // Round to nearest 100 for privacy
      success: success ? 'true' : 'false',
      // Device context for this specific event
      device: deviceContext.deviceType,
      browser: deviceContext.browser,
      screenSize: deviceContext.screenSize,
    });
  },

  /**
   * Track quality score
   */
  trackQualityScore: async (score, grade, docType) => {
    await trackEvent('quality_scored', {
      scoreRange: `${Math.floor(score / 10) * 10}-${Math.floor(score / 10) * 10 + 9}`, // e.g., "80-89"
      grade, // A, B, C, D, F
      docType,
    });
  },

  /**
   * Track file upload
   */
  trackFileUpload: async (extension, sizeKB, success) => {
    const deviceContext = getDeviceContext();

    await trackEvent('file_uploaded', {
      extension, // js, ts, py, etc.
      sizeRange: sizeKB < 50 ? '<50KB' : sizeKB < 200 ? '50-200KB' : '>200KB',
      success: success ? 'true' : 'false',
      // Track device for upload behavior analysis
      device: deviceContext.deviceType,
    });
  },

  /**
   * Track modal interactions
   */
  trackModal: async (modalType, action) => {
    await trackEvent('modal_interaction', {
      modalType, // 'examples', 'help', 'quality_breakdown', 'confirmation'
      action, // 'opened', 'closed', 'example_loaded', 'confirmed', 'cancelled'
    });
  },

  /**
   * Track error occurrences
   */
  trackError: async (errorType, endpoint) => {
    const deviceContext = getDeviceContext();

    await trackEvent('error_occurred', {
      errorType, // 'rate_limit', 'api_error', 'upload_error', 'network_error', etc.
      endpoint, // '/api/generate-stream', '/api/upload', etc.
      device: deviceContext.deviceType,
      browser: deviceContext.browser,
    });
  },

  /**
   * Track feature usage
   */
  trackFeature: async (feature, detail) => {
    await trackEvent('feature_used', {
      feature, // 'copy_button', 'code_paste', 'example_loaded', etc.
      detail,
    });
  },

  /**
   * Track streaming performance (optional - for debugging)
   */
  trackStreamingPerformance: async (timeToFirstToken, totalDuration, success) => {
    await trackEvent('streaming_performance', {
      timeToFirstToken: Math.floor(timeToFirstToken / 1000), // Round to seconds
      totalDuration: Math.floor(totalDuration / 1000), // Round to seconds
      success: success ? 'true' : 'false',
    });
  },

  /**
   * Track user engagement patterns
   */
  trackEngagement: async (action, value) => {
    const deviceContext = getDeviceContext();

    await trackEvent('user_engagement', {
      action, // 'session_duration', 'scroll_depth', 'code_edit', etc.
      value,
      device: deviceContext.deviceType,
    });
  },
};

export default analytics;
