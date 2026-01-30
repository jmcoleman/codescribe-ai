/**
 * TrialRedemption Page
 *
 * Handles invite code redemption for trial access.
 * Users can arrive via /trial?code=XXX or enter code manually.
 *
 * Flow:
 * 1. Check for code in URL
 * 2. Validate code (with or without auth)
 * 3. Show code details (tier, duration)
 * 4. Require login/signup to redeem
 * 5. Redeem code and show success
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Sparkles, CheckCircle, XCircle, RefreshCw, LogIn, Gift, ArrowRight, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTrial } from '../contexts/TrialContext';

export function TrialRedemption() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { validateCode, redeemCode, isRedeeming, redeemError, isOnTrial } = useTrial();

  // Form state
  const [code, setCode] = useState('');
  const [codeFromUrl, setCodeFromUrl] = useState(false);

  // Validation state
  const [validationStatus, setValidationStatus] = useState('idle'); // idle, validating, valid, invalid
  const [validationResult, setValidationResult] = useState(null);
  const [validationError, setValidationError] = useState(null);

  // Redemption state
  const [redemptionStatus, setRedemptionStatus] = useState('idle'); // idle, redeeming, success, error
  const [redemptionResult, setRedemptionResult] = useState(null);

  // Check URL for code on mount
  useEffect(() => {
    const urlCode = searchParams.get('code');
    if (urlCode) {
      setCode(urlCode.toUpperCase().trim());
      setCodeFromUrl(true);
      // Auto-validate URL code
      handleValidate(urlCode);
    }
  }, [searchParams]);

  // Auto-redeem if authenticated with valid code
  useEffect(() => {
    if (
      isAuthenticated &&
      validationStatus === 'valid' &&
      redemptionStatus === 'idle' &&
      !isOnTrial
    ) {
      // Auto-redeem when user logs in with a valid code
      handleRedeem();
    }
  }, [isAuthenticated, validationStatus, redemptionStatus, isOnTrial]);

  const handleValidate = async (codeToValidate = code) => {
    const normalizedCode = codeToValidate.toUpperCase().trim();
    if (!normalizedCode) return;

    setValidationStatus('validating');
    setValidationError(null);

    try {
      const result = await validateCode(normalizedCode);
      if (result.valid) {
        setValidationStatus('valid');
        setValidationResult(result);
      } else {
        setValidationStatus('invalid');
        setValidationError(result.reason || 'Invalid invite code');
      }
    } catch (error) {
      setValidationStatus('invalid');
      setValidationError(error.message || 'Failed to validate code');
    }
  };

  const handleRedeem = async () => {
    if (!isAuthenticated) return;

    setRedemptionStatus('redeeming');

    try {
      const result = await redeemCode(code);
      setRedemptionStatus('success');
      setRedemptionResult(result.data);

      // Redirect to main app after a delay
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (error) {
      setRedemptionStatus('error');
    }
  };

  const handleCodeChange = (e) => {
    const value = e.target.value.toUpperCase();
    setCode(value);
    // Reset validation when code changes
    if (validationStatus !== 'idle') {
      setValidationStatus('idle');
      setValidationResult(null);
      setValidationError(null);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validationStatus === 'valid' && isAuthenticated) {
      handleRedeem();
    } else if (validationStatus !== 'valid') {
      handleValidate();
    }
  };

  // Redirect if user already has trial
  if (isOnTrial && redemptionStatus !== 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-lg shadow-xl p-8 border border-slate-200 dark:border-slate-700 text-center">
          <div className="mb-6 flex justify-center">
            <Sparkles className="w-16 h-16 text-purple-600 dark:text-purple-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Trial Already Active
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            You already have an active trial. Enjoy your Pro features!
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
          >
            Go to App
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Success State */}
        {redemptionStatus === 'success' && (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-8 border border-slate-200 dark:border-slate-700 text-center">
            <div className="mb-6 flex justify-center">
              <CheckCircle className="w-16 h-16 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Trial Activated!
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Welcome to your Pro trial. Enjoy all premium features!
            </p>

            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center gap-2 text-purple-800 dark:text-purple-200">
                <Sparkles className="w-5 h-5" />
                <span className="font-semibold capitalize">
                  {redemptionResult?.tier || 'Pro'} Trial
                </span>
              </div>
              <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
                {redemptionResult?.durationDays || 14} days of premium features
              </p>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Redirecting to the app...
            </p>

            <button
              onClick={() => navigate('/')}
              className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
            >
              Start Using CodeScribe AI
            </button>
          </div>
        )}

        {/* Main Form */}
        {redemptionStatus !== 'success' && (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-8 border border-slate-200 dark:border-slate-700">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="mb-4 flex justify-center">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                  <Gift className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                Redeem Your Invite
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Enter your invite code to start your free Pro trial
              </p>
            </div>

            {/* Code Input Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="invite-code"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
                >
                  Invite Code
                </label>
                <input
                  id="invite-code"
                  type="text"
                  value={code}
                  onChange={handleCodeChange}
                  placeholder="XXXX-XXXX-XXXX"
                  className="w-full px-4 py-3 text-lg font-mono tracking-wider text-center border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={isRedeeming || redemptionStatus === 'redeeming'}
                />
              </div>

              {/* Validation Status */}
              {validationStatus === 'validating' && (
                <div className="flex items-center justify-center gap-2 text-slate-600 dark:text-slate-400">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Validating code...</span>
                </div>
              )}

              {validationStatus === 'invalid' && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
                    <XCircle className="w-5 h-5" />
                    <span className="font-medium">Invalid Code</span>
                  </div>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    {validationError}
                  </p>
                </div>
              )}

              {validationStatus === 'valid' && validationResult && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-green-800 dark:text-green-200 mb-2">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Valid Code!</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                      <Sparkles className="w-4 h-4" />
                      <span className="capitalize">{validationResult.tier || 'Pro'} Trial</span>
                    </div>
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                      <Clock className="w-4 h-4" />
                      <span>{validationResult.durationDays || 14} days</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Redemption Error */}
              {redemptionStatus === 'error' && redeemError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
                    <XCircle className="w-5 h-5" />
                    <span className="font-medium">Redemption Failed</span>
                  </div>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    {redeemError}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              {validationStatus !== 'valid' ? (
                <button
                  type="submit"
                  disabled={!code || validationStatus === 'validating'}
                  className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  {validationStatus === 'validating' ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Validating...
                    </>
                  ) : (
                    <>
                      Validate Code
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              ) : !isAuthenticated ? (
                <div className="space-y-3">
                  <p className="text-center text-sm text-slate-600 dark:text-slate-400">
                    Sign in or create an account to redeem your trial
                  </p>
                  <button
                    onClick={() => {
                      // Navigate to signup with trial code - code will be passed through signup to verification email
                      navigate(`/?signup=true&trial_code=${code}`);
                    }}
                    className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <LogIn className="w-4 h-4" />
                    Sign In to Redeem
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleRedeem}
                  disabled={isRedeeming || redemptionStatus === 'redeeming'}
                  className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  {isRedeeming || redemptionStatus === 'redeeming' ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Activating Trial...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Activate Trial
                    </>
                  )}
                </button>
              )}
            </form>

            {/* Footer Links */}
            <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700 text-center">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Don't have an invite code?{' '}
                <Link
                  to="/pricing"
                  className="text-purple-600 dark:text-purple-400 hover:underline font-medium"
                >
                  View pricing plans
                </Link>
              </p>
              <Link
                to="/"
                className="mt-4 inline-block text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              >
                Back to Home
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TrialRedemption;
