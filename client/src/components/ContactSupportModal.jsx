import { useState } from 'react';
import { X, HelpCircle, CheckCircle2, Loader2, Paperclip, XCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../config/api';
import { useFocusTrap } from '../hooks/useFocusTrap';

/**
 * Contact Support Modal
 *
 * Server-side contact form for support requests (authenticated users only)
 * Sends email via Resend API for reliable delivery
 * Supports file attachments (up to 5 files, 10MB each)
 */
export function ContactSupportModal({ isOpen, onClose, onShowLogin }) {
  const { user, getToken } = useAuth();
  const modalRef = useFocusTrap(isOpen, onClose);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [contactType, setContactType] = useState('general');
  const [subjectDetails, setSubjectDetails] = useState('');
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  const MAX_MESSAGE_LENGTH = 1000;
  const MAX_FILES = 5;
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  if (!isOpen) return null;

  // If user is not authenticated, show login prompt
  if (!user) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div ref={modalRef} className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative text-center">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-slate-100 rounded-lg active:scale-95 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 text-purple-600 mb-4">
            <HelpCircle className="w-8 h-8" />
          </div>

          {/* Message */}
          <h2 className="text-2xl font-bold text-slate-900 mb-3">
            Sign In Required
          </h2>
          <p className="text-slate-600 mb-6 leading-relaxed">
            Please sign in to contact support. This helps us provide better assistance and track your requests.
          </p>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 px-4 bg-slate-100 text-slate-900 rounded-lg font-medium hover:bg-slate-200 transition-all duration-200"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                // Open login modal first, then close support modal
                onShowLogin?.();
                onClose();
              }}
              className="flex-1 py-2.5 px-4 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white rounded-lg font-semibold shadow-lg shadow-purple-600/20 transition-all duration-200"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  const processFiles = (files) => {
    // Check if adding these files would exceed the limit
    if (attachments.length + files.length > MAX_FILES) {
      setError(`Maximum ${MAX_FILES} files allowed. You currently have ${attachments.length} file${attachments.length !== 1 ? 's' : ''}.`);
      return false;
    }

    // Validate each file
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        setError(`File "${file.name}" is too large. Maximum size is 10MB per file.`);
        return false;
      }
    }

    // Add files to attachments
    setAttachments(prev => [...prev, ...files]);
    setError(''); // Clear any previous errors
    return true;
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    processFiles(files);
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (loading || attachments.length >= MAX_FILES) return;
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set dragging to false if we're leaving the drop zone itself
    if (e.currentTarget === e.target) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (loading || attachments.length >= MAX_FILES) return;

    const files = Array.from(e.dataTransfer.files || []);
    processFiles(files);
  };

  // Prevent default drag and drop behavior on the modal backdrop
  const handleBackdropDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleBackdropDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    console.log('[ContactSupport] Starting submission...');
    console.log('[ContactSupport] Contact Type:', contactType);
    console.log('[ContactSupport] Subject:', subjectDetails);
    console.log('[ContactSupport] Message:', message);
    console.log('[ContactSupport] Attachments:', attachments.length);

    try {
      // Create FormData for file upload
      const formData = new FormData();

      // Add text fields manually
      formData.append('contactType', contactType);
      formData.append('subjectText', subjectDetails.trim());
      formData.append('message', message.trim());

      // Add attachments
      attachments.forEach((file) => {
        formData.append('attachments', file);
      });

      // Add auth token (required for support requests)
      const token = await getToken();
      console.log('[ContactSupport] Got auth token:', token ? 'Yes' : 'No');

      const headers = {
        'Authorization': `Bearer ${token}`
      };

      console.log('[ContactSupport] Sending to:', `${API_URL}/api/contact/support`);

      // Note: Don't set Content-Type header - browser will set it automatically with boundary
      const response = await fetch(`${API_URL}/api/contact/support`, {
        method: 'POST',
        headers,
        body: formData
      });

      console.log('[ContactSupport] Response status:', response.status);

      if (!response.ok) {
        let errorMessage = 'Failed to send support request';
        try {
          const data = await response.json();
          console.log('[ContactSupport] Error response:', data);
          errorMessage = data.error || data.message || errorMessage;
        } catch (parseError) {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('[ContactSupport] Success response:', result);

      // Show success state
      setSuccess(true);
      setLoading(false);

    } catch (err) {
      console.error('[ContactSupport] Error:', err);
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
        setContactType('general');
        setSubjectDetails('');
        setMessage('');
        setAttachments([]);
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

  // Get response time based on tier
  const getResponseTimeInfo = () => {
    const tier = user?.tier || 'free';

    switch (tier.toLowerCase()) {
      case 'enterprise':
      case 'team':
        return {
          time: '24-48 hours',
          badge: 'Priority Support',
          bgColor: 'bg-purple-50',
          textColor: 'text-purple-700',
          borderColor: 'border-purple-200'
        };
      case 'pro':
        return {
          time: '2-3 business days',
          badge: 'Pro Support',
          bgColor: 'bg-indigo-50',
          textColor: 'text-indigo-700',
          borderColor: 'border-indigo-200'
        };
      case 'starter':
        return {
          time: '3-5 business days',
          badge: 'Standard Support',
          bgColor: 'bg-blue-50',
          textColor: 'text-blue-700',
          borderColor: 'border-blue-200'
        };
      case 'free':
      default:
        return {
          time: '5-7 business days',
          badge: 'Community Support',
          bgColor: 'bg-slate-50',
          textColor: 'text-slate-700',
          borderColor: 'border-slate-200'
        };
    }
  };

  const responseTimeInfo = getResponseTimeInfo();

  // Form view
  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onDragOver={handleBackdropDragOver}
      onDrop={handleBackdropDrop}
    >
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
        <p className="text-slate-500 mb-5">
          Have a question or need help? We're here to assist you.
        </p>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Contact Type dropdown */}
          <div>
            <label htmlFor="contactType" className="block text-sm font-medium text-slate-700 mb-1.5">
              Contact Type <span className="text-red-500">*</span>
            </label>
            <select
              id="contactType"
              name="contactType"
              value={contactType}
              onChange={(e) => setContactType(e.target.value)}
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

          {/* Subject input */}
          <div>
            <label htmlFor="subjectDetails" className="block text-sm font-medium text-slate-700 mb-1.5">
              Subject
            </label>
            <input
              type="text"
              id="subjectDetails"
              name="subjectDetails"
              value={subjectDetails}
              onChange={(e) => setSubjectDetails(e.target.value)}
              placeholder="e.g., Cannot upload files larger than 5MB"
              maxLength={100}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            />
          </div>

          {/* Message */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
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
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={MAX_MESSAGE_LENGTH}
              required
              placeholder="Please describe your question or issue in detail..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            />
          </div>

          {/* File Attachments */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Attachments
            </label>

            {/* File input with drag and drop */}
            <div
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <label className="cursor-pointer">
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf,.txt,.csv,.zip,.json,.js,.html,.css"
                  onChange={handleFileChange}
                  disabled={loading || attachments.length >= MAX_FILES}
                  className="hidden"
                />
                <div className={`flex flex-col items-center justify-center gap-1 px-4 py-3 border-2 border-dashed rounded-lg transition-all ${
                  isDragging
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : loading || attachments.length >= MAX_FILES
                    ? 'border-slate-200 bg-slate-50 cursor-not-allowed text-slate-400'
                    : 'border-slate-300 hover:border-purple-400 hover:bg-purple-50 text-slate-700'
                }`}>
                  <Paperclip className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {isDragging
                      ? 'Drop files here...'
                      : attachments.length >= MAX_FILES
                      ? `Maximum ${MAX_FILES} files reached`
                      : 'Click or drag files'}
                  </span>
                  <span className="text-xs text-slate-500">
                    Up to {MAX_FILES} files, 10MB each
                  </span>
                </div>
              </label>
            </div>

            {/* File list */}
            {attachments.length > 0 && (
              <div className="mt-2 space-y-1.5">
                {attachments.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between gap-2 px-2.5 py-1.5 bg-slate-50 rounded border border-slate-200"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <Paperclip className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-slate-700 truncate">{file.name}</p>
                        <p className="text-[10px] text-slate-500">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      disabled={loading}
                      className="text-slate-400 hover:text-red-600 transition-colors p-0.5 hover:bg-red-50 rounded disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                      aria-label={`Remove ${file.name}`}
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Response Time Info - Right before submit */}
          <div className="bg-cyan-50 border border-cyan-200 rounded-lg px-3 py-2.5 flex items-start gap-2">
            <svg className="w-4 h-4 text-cyan-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1 text-xs">
              <span className="font-semibold text-cyan-900">{responseTimeInfo.badge}</span>
              <span className="text-cyan-700"> • Response within {responseTimeInfo.time}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-3">
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
      </div>
    </div>
  );
}
