import { useState, useEffect, lazy, Suspense } from 'react';
import { Check, Sparkles, Zap, Building2, Code2, Loader2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../config/api';
import { toastError } from '../utils/toast';
import VerificationRequiredModal from './VerificationRequiredModal';
import { STORAGE_KEYS, setSessionItem, getSessionItem, removeSessionItem } from '../constants/storage';

// Lazy load auth modals
const SignupModal = lazy(() => import('./SignupModal').then(m => ({ default: m.SignupModal })));
const LoginModal = lazy(() => import('./LoginModal').then(m => ({ default: m.LoginModal })));

// Loading fallback for modals
function ModalLoadingFallback() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
    </div>
  );
}

/**
 * Pricing Page Component with Stripe Integration
 *
 * Epic: 2.4 - Payment Integration
 * @component
 */
export function PricingPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, getToken } = useAuth();
  const [loading, setLoading] = useState(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingSubscription, setPendingSubscription] = useState(null);
  const [billingPeriod, setBillingPeriod] = useState('monthly'); // 'monthly' or 'yearly'

  // Auto-trigger checkout if user just logged in with pending subscription
  useEffect(() => {
    // Only run if user is authenticated
    if (!isAuthenticated || !user) return;

    // Check for pending subscription
    const pendingSubscriptionStr = getSessionItem(STORAGE_KEYS.PENDING_SUBSCRIPTION);
    if (!pendingSubscriptionStr) return;

    // Parse pending subscription
    let pendingSubscription;
    try {
      pendingSubscription = JSON.parse(pendingSubscriptionStr);
    } catch (e) {
      console.error('Failed to parse pending subscription:', e);
      removeSessionItem(STORAGE_KEYS.PENDING_SUBSCRIPTION);
      return;
    }

    // Trigger checkout attempt (handleSubscribe will handle verification modal if needed)
    handleSubscribe(pendingSubscription.tier, pendingSubscription.billingPeriod);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user]); // Only trigger when auth state changes

  const handleSubscribe = async (tier, billingPeriod = 'monthly') => {
    // Free tier - just needs authentication, no payment
    if (tier === 'free') {
      if (!isAuthenticated) {
        // Show signup modal without storing subscription intent
        setShowSignupModal(true);
        return;
      }
      // Already authenticated, just go to app
      navigate('/');
      return;
    }

    // If not authenticated, store subscription intent and show signup modal
    // (only for paid tiers that need checkout after verification)
    if (!isAuthenticated) {
      const subscriptionIntent = {
        tier: tier.toLowerCase(),
        billingPeriod,
        tierName: tiers.find(t => t.id === tier)?.name || tier,
      };

      // Store in sessionStorage for post-verification redirect
      setSessionItem(STORAGE_KEYS.PENDING_SUBSCRIPTION, JSON.stringify(subscriptionIntent));

      // Store in component state for modal context
      setPendingSubscription(subscriptionIntent);

      // Show signup modal
      setShowSignupModal(true);
      return;
    }

    // Team tier - contact sales (for now)
    if (tier === 'team') {
      window.location.href = 'mailto:sales@codescribeai.com?subject=Team Plan Inquiry';
      return;
    }

    setLoading(tier);

    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/api/payments/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          tier: tier.toLowerCase(),
          billingPeriod,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();

        // Check for email verification error (403)
        if (response.status === 403 && errorData.emailVerified === false) {
          setLoading(null);
          setShowVerificationModal(true);
          return;
        }

        // Backend returns both 'message' and 'error' fields
        // Prioritize the more descriptive 'message' field
        const errorMessage = errorData.message || errorData.error || 'Failed to create checkout session';

        // Log for debugging
        console.error('Subscription failed:', { status: response.status, errorData });

        throw new Error(errorMessage);
      }

      const { url } = await response.json();

      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (error) {
      console.error('Subscription error:', error);
      toastError(error.message || 'Failed to start subscription');
      setLoading(null);
    }
  };

  const tiers = [
    {
      id: 'free',
      name: 'Free',
      monthlyPrice: '$0',
      yearlyPrice: '$0',
      period: 'forever',
      description: 'Perfect for trying out CodeScribe AI',
      icon: Code2,
      features: [
        '10 docs/month',
        '3 docs/day',
        'All 10 languages',
        '4 doc types',
        'Quality scoring',
        'Community support'
      ],
      cta: 'Get Started',
      ctaVariant: 'secondary',
      popular: false
    },
    {
      id: 'starter',
      name: 'Starter',
      monthlyPrice: '$12',
      yearlyPrice: '$10',
      yearlyTotal: '$120',
      savingsPercent: '17%',
      period: 'per month',
      description: 'For individual developers',
      icon: Sparkles,
      features: [
        '50 docs/month',
        '10 docs/day',
        'All 10 languages',
        '4 doc types',
        'Priority support',
        'Email support'
      ],
      cta: 'Subscribe',
      ctaVariant: 'primary',
      popular: false
    },
    {
      id: 'pro',
      name: 'Pro',
      monthlyPrice: '$29',
      yearlyPrice: '$24',
      yearlyTotal: '$288',
      savingsPercent: '17%',
      period: 'per month',
      description: 'For power users and small teams',
      icon: Zap,
      features: [
        '200 docs/month',
        '40 docs/day',
        'Priority processing',
        'Email (24h response)',
        'Batch processing*',
        'Custom templates*'
      ],
      cta: 'Subscribe',
      ctaVariant: 'primary',
      popular: true
    },
    {
      id: 'team',
      name: 'Team',
      monthlyPrice: '$99',
      yearlyPrice: '$82',
      yearlyTotal: '$984',
      savingsPercent: '17%',
      period: 'per month',
      description: 'For teams and organizations',
      icon: Building2,
      features: [
        '1,000 docs/month',
        '200 docs/day',
        'Highest priority',
        'Dedicated support',
        'Team collaboration*',
        'API access*'
      ],
      cta: 'Contact Sales',
      ctaVariant: 'secondary',
      popular: false
    }
  ];

  const languages = [
    { name: 'JavaScript', extensions: '.js, .jsx', emoji: '🟨' },
    { name: 'TypeScript', extensions: '.ts, .tsx', emoji: '🔵' },
    { name: 'Python', extensions: '.py', emoji: '🐍' },
    { name: 'Java', extensions: '.java', emoji: '☕' },
    { name: 'C/C++', extensions: '.c, .cpp, .h, .hpp', emoji: '🔧' },
    { name: 'C#', extensions: '.cs', emoji: '💜' },
    { name: 'Go', extensions: '.go', emoji: '🐹' },
    { name: 'Rust', extensions: '.rs', emoji: '🦀' },
    { name: 'Ruby', extensions: '.rb', emoji: '💎' },
    { name: 'PHP', extensions: '.php', emoji: '🐘' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Back Button - top left, outside centered container */}
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4 transition-colors group"
          aria-label="Go back to home page"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span className="font-medium">Back</span>
        </button>

        <div className="text-center mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">
            Simple, Transparent Pricing
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-6">
            Choose the plan that fits your needs. All plans include full language support.
          </p>

          {/* Billing Period Toggle */}
          <div className="inline-flex items-center gap-3 p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-6 py-2 rounded-md font-medium transition-all ${
                billingPeriod === 'monthly'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`px-6 py-2 rounded-md font-medium transition-all flex items-center gap-2 ${
                billingPeriod === 'yearly'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Yearly
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
                Save 17%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Tiers */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {tiers.map((tier) => {
            const Icon = tier.icon;
            const isLoading = loading === tier.id;
            const isCurrentTier = user?.tier === tier.id;
            const displayPrice = billingPeriod === 'yearly' ? tier.yearlyPrice : tier.monthlyPrice;
            const showYearlySavings = billingPeriod === 'yearly' && tier.yearlyTotal;

            return (
              <div
                key={tier.name}
                className={`relative rounded-2xl border-2 p-5 bg-white transition-all duration-200 hover:shadow-xl flex flex-col ${
                  tier.popular
                    ? 'border-purple-600 shadow-lg scale-105'
                    : 'border-slate-200 hover:border-purple-300'
                }`}
              >
                {tier.popular && !isCurrentTier && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-600 text-white">
                      <Sparkles className="w-3 h-3" />
                      Most Popular
                    </span>
                  </div>
                )}

                {isCurrentTier && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-green-600 text-white">
                      Current Plan
                    </span>
                  </div>
                )}

                <div className="text-center mb-4">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-purple-100 text-purple-600 mb-3">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-1.5">{tier.name}</h3>
                  <p className="text-xs text-slate-600 mb-3 min-h-[2rem] flex items-center justify-center">{tier.description}</p>
                  <div className="mb-1">
                    <span className="text-3xl font-bold text-slate-900">{displayPrice}</span>
                    <span className="text-sm text-slate-600 ml-1">/ {tier.period}</span>
                  </div>
                  {showYearlySavings && (
                    <p className="text-xs text-green-700 font-medium">
                      {tier.yearlyTotal}/year (save {tier.savingsPercent})
                    </p>
                  )}
                </div>

                <ul className="space-y-2.5 mb-4 flex-grow">
                  {tier.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSubscribe(tier.id, billingPeriod)}
                  disabled={isLoading || isCurrentTier}
                  className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-auto ${
                    tier.ctaVariant === 'primary'
                      ? 'bg-purple-600 text-white hover:bg-purple-700 hover:shadow-lg'
                      : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading...
                    </>
                  ) : isCurrentTier ? (
                    'Current Plan'
                  ) : (
                    tier.cta
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Coming Soon Note */}
        <div className="text-center mb-12 space-y-1">
          <p className="text-sm text-slate-600">
            All tiers include: <span className="font-semibold">All 10 languages</span> • <span className="font-semibold">4 doc types</span> • <span className="font-semibold">Real-time streaming</span> • <span className="font-semibold">Quality scoring</span>
          </p>
          <p className="text-xs text-slate-500">
            * Features marked with an asterisk are coming soon
          </p>
        </div>

        {/* Supported Languages Section - keeping it the same */}
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-3xl p-8 sm:p-12 border border-purple-100">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-600 text-white mb-4">
              <Code2 className="w-8 h-8" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-3">
              Full Language Support
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Generate professional documentation for <strong>10 programming languages</strong> with a single click.
              All tiers include complete language support.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
            {languages.map((lang) => (
              <div
                key={lang.name}
                className="bg-white rounded-xl p-4 border border-slate-200 hover:border-purple-300 hover:shadow-md transition-all duration-200"
              >
                <div className="text-center">
                  <div className="text-3xl mb-2">{lang.emoji}</div>
                  <div className="font-semibold text-slate-900 mb-1">{lang.name}</div>
                  <div className="text-xs text-slate-600">{lang.extensions}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid sm:grid-cols-3 gap-6 pt-8 border-t border-purple-200">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">10</div>
              <div className="text-sm text-slate-600">Programming Languages</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">16</div>
              <div className="text-sm text-slate-600">File Extensions</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">4</div>
              <div className="text-sm text-slate-600">Documentation Types</div>
            </div>
          </div>
        </div>
      </div>

      {/* Verification Required Modal */}
      <VerificationRequiredModal
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        userEmail={user?.email}
      />

      {/* Auth Modals */}
      <Suspense fallback={<ModalLoadingFallback />}>
        {showSignupModal && (
          <SignupModal
            isOpen={showSignupModal}
            onClose={() => {
              setShowSignupModal(false);
              setPendingSubscription(null);
            }}
            onSwitchToLogin={() => {
              setShowSignupModal(false);
              setShowLoginModal(true);
            }}
            subscriptionContext={pendingSubscription}
          />
        )}

        {showLoginModal && (
          <LoginModal
            isOpen={showLoginModal}
            onClose={() => {
              setShowLoginModal(false);
              setPendingSubscription(null);
            }}
            onSwitchToSignup={() => {
              setShowLoginModal(false);
              setShowSignupModal(true);
            }}
            onSwitchToForgot={() => {
              setShowLoginModal(false);
              // Note: ForgotPasswordModal not needed for subscription flow
            }}
          />
        )}
      </Suspense>
    </div>
  );
}
