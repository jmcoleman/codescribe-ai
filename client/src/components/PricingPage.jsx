import { useState, useEffect, lazy, Suspense } from 'react';
import { Check, Sparkles, Zap, Building2, Code2, Loader2, ArrowLeft, Star, DollarSign, Gift } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTrial } from '../contexts/TrialContext';
import { API_URL } from '../config/api';
import { toastError } from '../utils/toast';
import VerificationRequiredModal from './VerificationRequiredModal';
import { ContactSalesModal } from './ContactSalesModal';
import { STORAGE_KEYS, setSessionItem, getSessionItem, removeSessionItem } from '../constants/storage';
import { PageLayout } from './PageLayout';

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
  const { isOnTrial, trialTier } = useTrial();
  const [loading, setLoading] = useState(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showContactSalesModal, setShowContactSalesModal] = useState(false);
  const [contactSalesTier, setContactSalesTier] = useState('enterprise');
  const [pendingSubscription, setPendingSubscription] = useState(null);

  // Check if we can go back (has history)
  const [canGoBack, setCanGoBack] = useState(true);

  useEffect(() => {
    // Check if opened in new tab (no opener and no history)
    const isNewTab = !window.opener && window.history.length <= 1;
    setCanGoBack(!isNewTab);
  }, []);

  // Initialize billing period from sessionStorage or default to 'monthly'
  const [billingPeriod, setBillingPeriod] = useState(() => {
    const saved = getSessionItem(STORAGE_KEYS.BILLING_PERIOD);
    return saved === 'annual' ? 'annual' : 'monthly';
  });

  // Mobile tab state (not persisted)
  const [mobileActiveTab, setMobileActiveTab] = useState('prices'); // 'prices' or 'languages'

  // Persist billing period to sessionStorage whenever it changes
  useEffect(() => {
    setSessionItem(STORAGE_KEYS.BILLING_PERIOD, billingPeriod);
  }, [billingPeriod]);

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

  // ESC key to navigate back (same as Back button)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        navigate(-1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

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

    // Enterprise and Team tiers - contact sales
    if (tier === 'enterprise' || tier === 'team') {
      if (!isAuthenticated) {
        // Must be authenticated to contact sales (so we know who to contact)
        // Store contact sales intent for post-auth flow
        const contactSalesIntent = {
          tier: tier.toLowerCase(),
          billingPeriod: 'monthly', // Not used for contact sales, but kept for consistency
          tierName: tiers.find(t => t.id === tier)?.name || tier,
        };

        // Store in sessionStorage for post-auth redirect
        setSessionItem(STORAGE_KEYS.PENDING_SUBSCRIPTION, JSON.stringify(contactSalesIntent));

        // Store in component state for modal context
        setPendingSubscription(contactSalesIntent);

        // Show signup modal
        setShowSignupModal(true);
        return;
      }
      // Show contact sales modal
      setContactSalesTier(tier);
      setShowContactSalesModal(true);
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
        'All 16 languages',
        '4 doc types',
        'Quality scoring',
        'GitHub import',
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
        'All 16 languages',
        '4 doc types',
        'GitHub import',
        'Generation history',
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
        { text: 'Batch generation', badge: 'NEW' },
        { text: 'Multi-file GitHub import', badge: 'NEW' },
        'Generation history'
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
    { name: 'PHP', extensions: '.php', emoji: '🐘' },
    { name: 'Kotlin', extensions: '.kt, .kts', emoji: '🟣' },
    { name: 'Swift', extensions: '.swift', emoji: '🍎' },
    { name: 'Dart', extensions: '.dart', emoji: '🎯' },
    { name: 'Shell', extensions: '.sh, .bash, .zsh', emoji: '💻' },
    { name: 'Apps Script', extensions: '.gs', emoji: '📊' }
  ];

  return (
    <PageLayout showGradient={false} className="bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 sm:pt-4 pb-2 sm:pb-4">
        {/* Back Button - Only show if we can actually go back, but preserve space */}
        <div className="mb-3 h-6">
          {canGoBack && (
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors group"
              aria-label="Go back"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" aria-hidden="true" />
              <span className="font-medium">Back</span>
            </button>
          )}
        </div>

        <div className="text-center mb-1">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-0.5">
            Simple, Transparent Pricing
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Choose the plan that fits your needs. All plans include full language support.
          </p>

          {/* Billing Period Toggle - compact inline layout */}
          <div className="inline-flex items-center gap-0.5 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg mt-2 mb-2">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`relative px-4 py-1.5 rounded-md text-sm font-medium transition-[background-color,box-shadow,color] duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 dark:focus-visible:ring-purple-400 focus-visible:ring-offset-2 focus-visible:z-10 ${
                billingPeriod === 'monthly'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700/50'
              }`}
              aria-pressed={billingPeriod === 'monthly'}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('annual')}
              className={`relative px-4 py-1.5 rounded-md text-sm font-medium transition-[background-color,box-shadow,color] duration-200 ease-out flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 dark:focus-visible:ring-purple-400 focus-visible:ring-offset-2 focus-visible:z-10 ${
                billingPeriod === 'annual'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700/50'
              }`}
              aria-pressed={billingPeriod === 'annual'}
            >
              Yearly
              <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded-full font-semibold border border-transparent dark:border-green-500/50">
                -17%
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Tabs - Only visible on mobile (<1024px) */}
        <div className="lg:hidden mb-4">
          <div className="flex border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-t-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setMobileActiveTab('prices')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                mobileActiveTab === 'prices'
                  ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400 bg-purple-50/50 dark:bg-purple-950/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              <span>Pricing</span>
            </button>
            <button
              type="button"
              onClick={() => setMobileActiveTab('languages')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                mobileActiveTab === 'languages'
                  ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400 bg-purple-50/50 dark:bg-purple-950/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Code2 className="w-4 h-4" />
              <span>Languages</span>
            </button>
          </div>
        </div>

        {/* Pricing Tiers - Hidden on mobile when Languages tab is active */}
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-2 sm:mb-3 max-w-7xl mx-auto ${
          mobileActiveTab === 'languages' ? 'hidden lg:grid' : ''
        }`}>
          {tiers.map((tier) => {
            const Icon = tier.icon;
            const isLoading = loading === tier.id;
            const isCurrentTier = user?.tier === tier.id;
            const isTrialTier = isOnTrial && trialTier === tier.id;
            const displayPrice = billingPeriod === 'annual' ? tier.yearlyPrice : tier.monthlyPrice;
            const showYearlySavings = billingPeriod === 'annual' && tier.yearlyTotal;

            return (
              <div
                key={tier.name}
                className={`relative rounded-2xl border-2 p-4 sm:p-5 bg-white dark:bg-slate-800 transition-all duration-200 hover:shadow-xl dark:hover:shadow-purple-500/10 flex flex-col max-w-sm mx-auto w-full ${
                  isTrialTier
                    ? 'border-amber-500 dark:border-amber-600 shadow-lg shadow-amber-500/10 dark:shadow-amber-900/30 lg:scale-[1.02]'
                    : tier.popular && !isCurrentTier
                    ? 'border-purple-600 dark:border-purple-500 shadow-lg shadow-purple-600/10 dark:shadow-purple-900/30 lg:scale-[1.02]'
                    : 'border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-600'
                }`}
              >
                {/* Trial Badge - Highest priority */}
                {isTrialTier && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500 dark:bg-amber-600 text-white">
                      <Gift className="w-3 h-3" />
                      On Trial
                    </span>
                  </div>
                )}

                {/* Most Popular Badge - Show if not on trial and not current tier */}
                {tier.popular && !isCurrentTier && !isTrialTier && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-600 dark:bg-purple-700 text-white">
                      <Sparkles className="w-3 h-3" />
                      Most Popular
                    </span>
                  </div>
                )}

                {/* Current Plan Badge - Green if active, neutral gray if on trial (since trial gives higher tier features) */}
                {isCurrentTier && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                      isOnTrial
                        ? 'bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-white'
                        : 'bg-green-600 dark:bg-green-700 text-white'
                    }`}>
                      {isOnTrial ? 'Base Plan' : 'Current Plan'}
                    </span>
                  </div>
                )}

                <div className="text-center mb-2 sm:mb-3">
                  <div className="inline-flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border border-transparent dark:border-purple-500/50 mb-1.5 sm:mb-2">
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 mb-1">{tier.name}</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-1.5 sm:mb-2 min-h-[2rem] flex items-center justify-center">{tier.description}</p>
                  <div className="mb-0.5">
                    <span key={`${tier.id}-${billingPeriod}-price`} className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 inline-block animate-fade-in-slow">{displayPrice}</span>
                    <span className="text-sm text-slate-600 dark:text-slate-400 ml-1">/ {tier.period}</span>
                  </div>
                  <div className="h-5">
                    {showYearlySavings && (
                      <p key={`${tier.id}-${billingPeriod}-savings`} className="text-xs text-green-700 dark:text-green-400 font-medium animate-fade-in-slow">
                        {tier.yearlyTotal}/year (save {tier.savingsPercent})
                      </p>
                    )}
                  </div>
                </div>

                <ul className="space-y-1.5 sm:space-y-2 mb-2 sm:mb-3 flex-grow">
                  {tier.features.map((feature, idx) => {
                    const isObject = typeof feature === 'object';
                    const featureText = isObject ? feature.text : feature;
                    const hasBadge = isObject && feature.badge;

                    return (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 flex-shrink-0 mt-0.5 text-green-600 dark:text-green-400" />
                        <span className="text-slate-700 dark:text-slate-300 flex items-center gap-2 flex-wrap">
                          {featureText}
                          {hasBadge && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                              {feature.badge}
                              <Sparkles className="w-3 h-3 -translate-y-1" />
                            </span>
                          )}
                        </span>
                      </li>
                    );
                  })}
                </ul>

                <button
                  onClick={() => handleSubscribe(tier.id, billingPeriod)}
                  disabled={isLoading || (isCurrentTier && !isTrialTier)}
                  className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-auto ${
                    isTrialTier
                      ? 'bg-amber-500 hover:bg-amber-600 active:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-700 dark:active:bg-amber-800 text-white shadow-lg shadow-amber-500/20 dark:shadow-amber-900/30'
                      : tier.ctaVariant === 'primary'
                      ? 'bg-purple-600 hover:bg-purple-700 active:bg-purple-800 dark:bg-purple-700 dark:hover:bg-purple-800 dark:active:bg-purple-900 text-white shadow-lg shadow-purple-600/20 dark:shadow-purple-900/30'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading...
                    </>
                  ) : isCurrentTier && !isTrialTier ? (
                    'Current Plan'
                  ) : isTrialTier ? (
                    'Subscribe Now'
                  ) : (
                    tier.cta
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Feature highlights & coming soon note - Hidden on mobile when Languages tab is active */}
        <div className={`text-center mb-2 sm:mb-3 space-y-0.5 sm:space-y-1 ${
          mobileActiveTab === 'languages' ? 'hidden lg:block' : ''
        }`}>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            All tiers include: <span className="font-semibold">All 16 languages</span> • <span className="font-semibold">4 doc types</span> • <span className="font-semibold">Real-time streaming</span> • <span className="font-semibold">Quality scoring</span>
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-500">
            * Features marked with an asterisk are coming soon
          </p>
        </div>

        {/* Legal disclaimer - Hidden on mobile when Languages tab is active */}
        <div className={`text-center mb-4 sm:mb-6 ${
          mobileActiveTab === 'languages' ? 'hidden lg:block' : ''
        }`}>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            By subscribing, you agree to our{' '}
            <a href="/terms" className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 underline">
              Terms of Service
            </a>
            {' '}and{' '}
            <a href="/privacy" className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 underline">
              Privacy Policy
            </a>
            .
          </p>
        </div>

        {/* Supported Languages Section - Hidden on mobile when Pricing tab is active */}
        <div className={`bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/10 rounded-3xl p-8 sm:p-12 border border-purple-100 dark:border-purple-900/50 ${
          mobileActiveTab === 'prices' ? 'hidden lg:block' : ''
        }`}>
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-600 dark:bg-purple-700 text-white mb-4">
              <Code2 className="w-8 h-8" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-3">
              Full Language Support
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Generate professional documentation for <strong>15+ programming languages</strong> with a single click.
              All tiers include complete language support.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
            {languages.map((lang) => (
              <div
                key={lang.name}
                className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-md dark:hover:shadow-purple-500/10 transition-all duration-200"
              >
                <div className="text-center">
                  <div className="text-3xl mb-2">{lang.emoji}</div>
                  <div className="font-semibold text-slate-900 dark:text-slate-100 mb-1">{lang.name}</div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">{lang.extensions}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid sm:grid-cols-3 gap-6 pt-8 border-t border-purple-200 dark:border-purple-800">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">16</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Programming Languages</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">24</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">File Extensions</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">4</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Documentation Types</div>
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

      {/* Contact Sales Modal */}
      <ContactSalesModal
        isOpen={showContactSalesModal}
        onClose={() => {
          setShowContactSalesModal(false);
          // Clear pending subscription intent when modal is closed
          removeSessionItem(STORAGE_KEYS.PENDING_SUBSCRIPTION);
          setPendingSubscription(null);
        }}
        tier={contactSalesTier}
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
    </PageLayout>
  );
}
