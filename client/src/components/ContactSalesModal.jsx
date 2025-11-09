import { useState } from 'react';
import { X, Mail, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../config/api';
import { useFocusTrap } from '../hooks/useFocusTrap';

/**
 * Contact Sales Modal
 *
 * Server-side contact form for Enterprise/Team tier inquiries
 * Sends email via Resend API for reliable delivery
 * Epic: 2.4 - Payment Integration
 */
export function ContactSalesModal({ isOpen, onClose, tier = 'enterprise' }) {
  const { user, getToken } = useAuth();
  const modalRef = useFocusTrap(isOpen, onClose);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [subject, setSubject] = useState('');
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
          subject: subject.trim() || '',
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
        setSubject('');
        setMessage('');
      }, 300);
    }
  };

  // Success view
  if (success) {
    return (
      <div className="modal-backdrop">
        <div ref={modalRef} className="modal-container max-w-lg w-full p-8 text-center">
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 icon-btn interactive-scale-sm focus-ring-light"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>

          {/* Success icon with refined styling */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 mb-6 ring-2 ring-green-100 dark:ring-green-500/30 shadow-lg shadow-green-600/10 dark:shadow-green-900/20">
            <CheckCircle2 className="w-12 h-12" />
          </div>

          {/* Success message */}
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-3">
            Message Sent!
          </h2>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-8">
            Thank you for your interest in the {tier.charAt(0).toUpperCase() + tier.slice(1)} plan. Our sales team will be in touch soon!
          </p>

          {/* Close button with refined styling */}
          <button
            onClick={handleClose}
            className="btn-primary w-full py-3 px-4"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // Form view
  return (
    <div className="modal-backdrop">
      <div ref={modalRef} className="modal-container max-w-lg w-full p-6">
        {/* Close button */}
        <button
          onClick={handleClose}
          disabled={loading}
          className="absolute top-4 right-4 icon-btn interactive-scale-sm focus-ring-light disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Close modal"
        >
          <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
        </button>

        {/* Header with Icon */}
        <div className="flex items-center gap-3 mb-2">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
            <Mail className="w-5 h-5" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Contact Sales
          </h2>
        </div>
        <p className="text-slate-500 dark:text-slate-400 mb-6">
          Interested in the {tier.charAt(0).toUpperCase() + tier.slice(1)} plan? Let's chat about your needs.
        </p>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/50 rounded-lg p-3 mb-6">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleContactSales} className="space-y-4">
          {/* Name input fields (only shown if user doesn't have name) */}
          {!user?.first_name || !user?.last_name ? (
            <>
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-purple-600 dark:focus:ring-purple-400 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-purple-600 dark:focus:ring-purple-400 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                />
              </div>
            </>
          ) : null}

          {/* Subject field */}
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Subject <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="subject"
              name="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              placeholder="e.g., Enterprise pricing inquiry"
              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-purple-600 dark:focus:ring-purple-400 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            />
          </div>

          {/* Optional message */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="message" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Additional Information (Optional)
              </label>
              <span className={`text-xs ${message.length > MAX_MESSAGE_LENGTH ? 'text-red-600 dark:text-red-400 font-medium' : 'text-slate-500 dark:text-slate-400'}`}>
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
              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-purple-600 dark:focus:ring-purple-400 focus:border-transparent resize-none disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="btn-secondary flex-1 py-2.5 px-4"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1 py-2.5 px-4 flex items-center justify-center gap-2"
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
        <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-4">
          Your inquiry will be sent to our sales team via email.
        </p>
      </div>
    </div>
  );
}
