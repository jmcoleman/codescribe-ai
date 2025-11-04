import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { useAuth } from '../contexts/AuthContext';

/**
 * Wrapper component that conditionally renders Vercel Analytics and Speed Insights
 * based on user's privacy preferences from the database.
 *
 * Only loads analytics in production environments (codescribeai.com or vercel.app).
 * Respects the user's analytics preference from Settings > Privacy tab.
 *
 * For unauthenticated users, analytics is enabled by default.
 */
export function AnalyticsWrapper() {
  const { user } = useAuth();

  // Check if we're in production
  const isProduction =
    window.location.hostname === 'codescribeai.com' ||
    window.location.hostname.includes('vercel.app');

  // Determine if analytics should be enabled
  // - For unauthenticated users: default to true
  // - For authenticated users: respect their database preference
  const analyticsEnabled = user ? user.analytics_enabled !== false : true;

  // Only render analytics in production when enabled
  if (!isProduction || !analyticsEnabled) {
    return null;
  }

  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  );
}
