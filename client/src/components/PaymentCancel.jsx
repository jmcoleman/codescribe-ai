import { useNavigate } from 'react-router-dom';
import { XCircle } from 'lucide-react';

/**
 * Payment Cancel Page
 *
 * Shown when user cancels Stripe Checkout.
 * Epic: 2.4 - Payment Integration
 */
export function PaymentCancel() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-orange-100 text-orange-600 mb-6">
          <XCircle className="w-12 h-12" />
        </div>

        <h1 className="text-3xl font-bold text-slate-900 mb-4">
          Subscription Canceled
        </h1>

        <p className="text-lg text-slate-600 mb-6">
          No worries! You can subscribe anytime you're ready.
        </p>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-purple-800">
            You can still use the Free tier with 10 docs per month. Upgrade whenever you need more!
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => navigate('/pricing')}
            className="w-full py-3 px-6 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-all duration-200"
          >
            View Pricing Plans
          </button>

          <button
            onClick={() => navigate('/')}
            className="w-full py-3 px-6 bg-slate-100 text-slate-900 rounded-lg font-semibold hover:bg-slate-200 transition-all duration-200"
          >
            Back to App
          </button>
        </div>
      </div>
    </div>
  );
}
