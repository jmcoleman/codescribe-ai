import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield, ChevronRight } from 'lucide-react';
import { toastCompact } from '../../utils/toast';
import { useAuth } from '../../contexts/AuthContext';
import { STORAGE_KEYS, getStorageItem } from '../../constants/storage';

export function PrivacyTab() {
  const { user, refreshUser } = useAuth();
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load analytics preference from user object (from database)
  useEffect(() => {
    if (user?.analytics_enabled !== undefined) {
      setAnalyticsEnabled(user.analytics_enabled);
    }
  }, [user]);

  const handleToggleAnalytics = async () => {
    setIsSaving(true);

    try {
      const newValue = !analyticsEnabled;

      // Get token from localStorage
      const token = getStorageItem(STORAGE_KEYS.AUTH_TOKEN);
      if (!token) {
        throw new Error('Not authenticated');
      }

      // Call API to update user preference in database
      const response = await fetch('/api/auth/preferences', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ analytics_enabled: newValue }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update analytics preference');
      }

      // Refresh user object to get updated preference
      // This will cause AnalyticsWrapper to re-render with new value
      if (refreshUser) {
        await refreshUser();
      }

      // Update local state
      setAnalyticsEnabled(newValue);

      toastCompact(
        newValue ? 'Analytics enabled' : 'Analytics disabled',
        'success'
      );
    } catch (error) {
      toastCompact(error.message || 'Failed to update analytics preference', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Usage Analytics - Primary control */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Usage Analytics
        </h2>

        {/* Analytics Toggle */}
        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
                Help us improve CodeScribe AI by collecting anonymous usage statistics including
                page views, feature usage, and performance metrics.
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                We use Vercel Analytics and Speed Insights. No personal information or code content is ever stored.
              </p>
            </div>

            {/* Toggle Switch */}
            <button
              onClick={handleToggleAnalytics}
              disabled={isSaving}
              className={`
                relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed
                ${analyticsEnabled ? 'bg-purple-600' : 'bg-slate-300 dark:bg-slate-600'}
              `}
              role="switch"
              aria-checked={analyticsEnabled}
              aria-label="Toggle usage analytics"
            >
              <span
                className={`
                  pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                  ${analyticsEnabled ? 'translate-x-5' : 'translate-x-0'}
                `}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Code Privacy - Trust signal */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-slate-700 dark:text-slate-400" aria-hidden="true" />
          Your Code is Private
        </h2>
        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-700 dark:text-slate-300">
            CodeScribe AI <strong>never stores your code</strong>. All documentation generation happens in real-time,
            and your code is processed in memory only. We respect your privacy and the confidentiality
            of your work.
          </p>
        </div>
      </div>

      {/* Legal Documents - Reference material */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Legal Documents
        </h3>
        <div className="flex flex-wrap gap-4">
          <Link
            to="/privacy"
            className="flex items-center gap-1.5 text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 transition-colors"
          >
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
            <span>Privacy Policy</span>
          </Link>
          <Link
            to="/terms"
            className="flex items-center gap-1.5 text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 transition-colors"
          >
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
            <span>Terms of Service</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
