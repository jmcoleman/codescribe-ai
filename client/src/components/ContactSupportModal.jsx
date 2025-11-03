import { useState } from 'react';
import { X, HelpCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../config/api';
import { useFocusTrap } from '../hooks/useFocusTrap';

/**
 * Contact Support Modal
 *
 * Server-side contact form for support requests
 * Sends email via Resend API for reliable delivery
 * Similar to ContactSalesModal but for support inquiries
 */
export function ContactSupportModal({ isOpen, onClose }) {
  const { user, getToken, isAuthenticated } = useAuth();
  const modalRef = useFocusTrap(isOpen, onClose);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('general');
  const [message, setMessage] = useState('');

  const MAX_MESSAGE_LENGTH = 1000;

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Get form data
    const formData = new FormData(e.target);
    const providedFirstName = formData.get('firstName');
    const providedLastName = formData.get('lastName');
    const providedEmail = formData.get('email');

    try {
      const headers = {
        'Content-Type': 'application/json'
      };

      // Add auth token if user is authenticated
      if (isAuthenticated) {
        const token = await getToken();
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL}/api/contact/support`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          subject,
          message: message.trim(),
          // Include name/email for unauthenticated users
          firstName: providedFirstName || undefined,
          lastName: providedLastName || undefined,
          email: providedEmail || undefined
        })
      });

      if (!response.ok) {
        let errorMessage = 'Failed to send support request';
        try {
          const data = await response.json();
          errorMessage = data.error || data.message || errorMessage;
        } catch (parseError) {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      await response.json();

      // Show success state
      setSuccess(true);
      setLoading(false);

    } catch (err) {
      console.error('Contact support error:', err);
      setError(err.message || 'Failed to send support request. Please try again.');
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
        setEmail('');
        setSubject('general');
        setMessage('');
      }, 300);
    }
  };

  // Success view
  if (success) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div ref={modalRef} className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 relative text-center">
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-slate-100 rounded-lg active:scale-95 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Success icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-50 text-green-600 mb-6 ring-2 ring-green-100 shadow-lg shadow-green-600/10">
            <CheckCircle2 className="w-12 h-12" />
          </div>

          {/* Success message */}
          <h2 className="text-2xl font-bold text-slate-900 mb-3">
            Support Request Sent!
          </h2>
          <p className="text-slate-600 leading-relaxed mb-8">
            Thank you for contacting us. Our support team will review your request and get back to you as soon as possible.
          </p>

          {/* Close button */}
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
      <div ref={modalRef} className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 relative max-h-[90vh] overflow-y-auto">
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
            <HelpCircle className="w-5 h-5" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">
            Contact Support
          </h2>
        </div>
        <p className="text-slate-500 mb-6">
          Have a question or need help? We're here to assist you.
        </p>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Authenticated user info OR name/email fields */}
          {isAuthenticated && user?.first_name && user?.last_name ? (
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-sm text-slate-600">
                <span className="font-medium">From:</span>{' '}
                {`${user.first_name} ${user.last_name}`.trim()} ({user.email})
              </p>
            </div>
          ) : (
            <>
              {/* Name fields for unauthenticated users or users without names */}
              {!isAuthenticated && (
                <>
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

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={loading}
                    />
                  </div>
                </>
              )}

              {/* Name fields for authenticated users without names */}
              {isAuthenticated && (!user?.first_name || !user?.last_name) && (
                <>
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
            </>
          )}

          {/* Subject dropdown */}
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-slate-700 mb-2">
              Subject <span className="text-red-500">*</span>
            </label>
            <select
              id="subject"
              name="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              <option value="general">General Question</option>
              <option value="bug">Bug Report</option>
              <option value="feature">Feature Request</option>
              <option value="account">Account Issue</option>
              <option value="billing">Billing Question</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Message */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="message" className="block text-sm font-medium text-slate-700">
                Message <span className="text-red-500">*</span>
              </label>
              <span className={`text-xs ${message.length > MAX_MESSAGE_LENGTH ? 'text-red-600 font-medium' : 'text-slate-500'}`}>
                {message.length}/{MAX_MESSAGE_LENGTH}
              </span>
            </div>
            <textarea
              id="message"
              name="message"
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={MAX_MESSAGE_LENGTH}
              required
              placeholder="Please describe your question or issue in detail..."
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
          Your support request will be sent to our team via email.
        </p>
      </div>
    </div>
  );
}
