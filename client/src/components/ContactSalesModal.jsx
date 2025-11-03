import { useState } from 'react';
import { X, Mail, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../config/api';

/**
 * Contact Sales Modal
 *
 * Server-side contact form for Enterprise/Team tier inquiries
 * Sends email via Resend API for reliable delivery
 * Epic: 2.4 - Payment Integration
 */
export function ContactSalesModal({ isOpen, onClose, tier = 'enterprise' }) {
  const { user, getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [message, setMessage] = useState('');

  const MAX_MESSAGE_LENGTH = 750;

  if (!isOpen) return null;

  const handleContactSales = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Get name from form if user doesn't have one yet
    const formData = new FormData(e.target);
    const providedFirstName = formData.get('firstName');
    const providedLastName = formData.get('lastName');

    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/api/contact/sales`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          tier,
          message: message.trim() || '',
          // Include name if provided via form
          firstName: providedFirstName || undefined,
          lastName: providedLastName || undefined
        })
      });

      if (!response.ok) {
        // Try to parse error as JSON, fallback to status text
        let errorMessage = 'Failed to send inquiry';
        try {
          const data = await response.json();
          errorMessage = data.error || data.message || errorMessage;
        } catch (parseError) {
          // Response wasn't JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      // Parse success response
      await response.json();

      // Show success state
      setSuccess(true);
      setLoading(false);

    } catch (err) {
      console.error('Contact sales error:', err);
      setError(err.message || 'Failed to send inquiry. Please try again.');
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
      // Reset state after close animation
      setTimeout(() => {
        setSuccess(false);
        setError('');
        setFirstName('');
        setLastName('');
        setMessage('');
      }, 300);
    }
  };

  // Success view
  if (success) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 relative text-center">
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-slate-100 rounded-lg active:scale-95 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Success icon with refined styling */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-50 text-green-600 mb-6 ring-2 ring-green-100 shadow-lg shadow-green-600/10">
            <CheckCircle2 className="w-12 h-12" />
          </div>

          {/* Success message */}
          <h2 className="text-2xl font-bold text-slate-900 mb-3">
            Message Sent!
          </h2>
          <p className="text-slate-600 leading-relaxed mb-8">
            Thank you for your interest in the {tier.charAt(0).toUpperCase() + tier.slice(1)} plan. Our sales team will be in touch soon!
          </p>

          {/* Close button with refined styling */}
          <button
            onClick={handleClose}
            className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white rounded-lg font-semibold shadow-lg shadow-purple-600/20 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // Form view
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 relative">
        {/* Close button */}
        <button
          onClick={handleClose}
          disabled={loading}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-slate-100 rounded-lg active:scale-95 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with Icon */}
        <div className="flex items-center gap-3 mb-2">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-purple-100 text-purple-600">
            <Mail className="w-5 h-5" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">
            Contact Sales
          </h2>
        </div>
        <p className="text-slate-500 mb-6">
          Interested in the {tier.charAt(0).toUpperCase() + tier.slice(1)} plan? Let's chat about your needs.
        </p>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleContactSales} className="space-y-4">
          {/* User info (read-only display if name exists, or input fields if not) */}
          {user?.first_name && user?.last_name ? (
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-sm text-slate-600">
                <span className="font-medium">From:</span>{' '}
                {`${user.first_name} ${user.last_name}`.trim()}
              </p>
            </div>
          ) : (
            <>
              {/* Name input fields (shown if user doesn't have name) */}
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-slate-700 mb-2">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-slate-700 mb-2">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                />
              </div>
            </>
          )}

          {/* Optional message */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="message" className="block text-sm font-medium text-slate-700">
                Additional Information (Optional)
              </label>
              <span className={`text-xs ${message.length > MAX_MESSAGE_LENGTH ? 'text-red-600 font-medium' : 'text-slate-500'}`}>
                {message.length}/{MAX_MESSAGE_LENGTH}
              </span>
            </div>
            <textarea
              id="message"
              name="message"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={MAX_MESSAGE_LENGTH}
              placeholder="Tell us about your team size, specific needs, or any questions..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 py-2.5 px-4 bg-slate-100 text-slate-900 rounded-lg font-medium hover:bg-slate-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 px-4 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white rounded-lg font-semibold shadow-lg shadow-purple-600/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Message'
              )}
            </button>
          </div>
        </form>

        {/* Footer note */}
        <p className="text-xs text-slate-500 text-center mt-4">
          Your inquiry will be sent to our sales team via email.
        </p>
      </div>
    </div>
  );
}
