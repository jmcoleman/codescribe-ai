import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';

/**
 * Payment Success Page
 *
 * Shown after successful Stripe Checkout completion.
 * Epic: 2.4 - Payment Integration
 */
export function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // Auto-redirect to home after 5 seconds
    const timer = setTimeout(() => {
      navigate('/');
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 text-green-600 mb-6">
          <CheckCircle2 className="w-12 h-12" />
        </div>

        <h1 className="text-3xl font-bold text-slate-900 mb-4">
          Welcome to CodeScribe AI!
        </h1>

        <p className="text-lg text-slate-600 mb-6">
          Your subscription has been activated successfully.
        </p>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-green-800">
            You now have access to all your plan features. Start generating documentation right away!
          </p>
        </div>

        {sessionId && (
          <p className="text-xs text-slate-500 mb-6">
            Session ID: {sessionId}
          </p>
        )}

        <div className="space-y-3">
          <button
            onClick={() => navigate('/')}
            className="w-full py-3 px-6 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-all duration-200"
          >
            Start Generating Docs
          </button>

          <p className="text-sm text-slate-600">
            Redirecting to app in 5 seconds...
          </p>
        </div>
      </div>
    </div>
  );
}
