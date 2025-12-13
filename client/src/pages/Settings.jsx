import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { User, Shield, CreditCard, AlertTriangle, ArrowLeft, Palette } from 'lucide-react';
import { AccountTab } from '../components/settings/AccountTab';
import { AppearanceTab } from '../components/settings/AppearanceTab';
import { PrivacyTab } from '../components/settings/PrivacyTab';
import { SubscriptionTab } from '../components/settings/SubscriptionTab';
import { DangerZoneTab } from '../components/settings/DangerZoneTab';
import { PageLayout } from '../components/PageLayout';
import { AppToaster } from '../components/AppToaster';

const TABS = [
  { id: 'account', label: 'Account', icon: User },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'privacy', label: 'Privacy', icon: Shield },
  { id: 'subscription', label: 'Subscription', icon: CreditCard },
  { id: 'danger', label: 'Danger Zone', icon: AlertTriangle },
];

export default function Settings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Get active tab from URL search params, default to 'account'
  const activeTab = searchParams.get('tab') || 'account';

  // Update URL when tab changes
  const handleTabChange = (tabId) => {
    setSearchParams({ tab: tabId });
  };

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);

  // ESC key to navigate home (power user feature)
  // Only if no modals are open (modals handle their own ESC)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        // Check if any modal is open (has backdrop)
        const hasOpenModal = document.querySelector('.fixed.inset-0.z-50');
        if (!hasOpenModal) {
          navigate('/');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  // Don't render if not authenticated
  if (!user) {
    return null;
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'account':
        return <AccountTab />;
      case 'appearance':
        return <AppearanceTab />;
      case 'privacy':
        return <PrivacyTab />;
      case 'subscription':
        return <SubscriptionTab />;
      case 'danger':
        return <DangerZoneTab />;
      default:
        return null;
    }
  };

  return (
    <PageLayout showGradient={false} className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
      <AppToaster />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors group mb-3"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" aria-hidden="true" />
          <span className="font-medium">Back</span>
        </button>

        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Settings</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Manage your account settings and preferences
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          {/* Tab Navigation */}
          <div className="border-b border-slate-200 dark:border-slate-700">
            <nav className="flex -mb-px overflow-x-auto" aria-label="Settings tabs">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`
                      flex items-center gap-2 px-6 py-4 border-b-2 font-medium text-sm whitespace-nowrap transition-colors
                      ${isActive
                        ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                        : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'
                      }
                    `}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Icon className="w-5 h-5" aria-hidden="true" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6 sm:p-8">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
