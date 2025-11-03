import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Settings } from 'lucide-react';

/**
 * Payment Success Page
 *
 * Shown after successful Stripe Checkout completion.
 * Epic: 2.4 - Payment Integration
 *
 * UX Best Practice: User-controlled navigation (no auto-redirect)
 * Follows industry standards: Stripe, Shopify, GitHub Sponsors
 */
export function PaymentSuccess() {
  const navigate = useNavigate();

  const handleManageSubscription = async () => {
    try {
      // Create Stripe billing portal session
      const response = await fetch('/api/payments/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to create portal session');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Error opening billing portal:', error);
      // Fallback: navigate to home if portal fails
      navigate('/');
    }
  };

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

        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8">
          <p className="text-sm text-green-800">
            You now have access to all your plan features. Start generating documentation right away!
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => navigate('/')}
            className="w-full py-3 px-6 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white rounded-lg font-semibold shadow-lg shadow-purple-600/20 transition-all duration-200"
          >
            Start Generating Docs
          </button>

          <button
            onClick={handleManageSubscription}
            className="w-full py-3 px-6 bg-white text-slate-700 border border-slate-300 rounded-lg font-medium hover:bg-slate-50 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Manage Subscription
          </button>
        </div>
      </div>
    </div>
  );
}
