/**
 * Admin User Management Page
 *
 * Allows admins to view and manage platform users.
 * Features:
 * - View all users with pagination and filtering
 * - Search by email/name with debouncing
 * - Filter by tier, role, and account status
 * - Edit user roles
 * - Suspend/unsuspend accounts
 * - Grant trials to users
 * - View user statistics
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  RefreshCw,
  Users,
  CheckCircle,
  Shield,
  Sparkles,
  Search,
  X,
  Edit,
  Gift,
  Ban,
  CheckSquare,
  MoreVertical,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { PageLayout } from '../../components/PageLayout';
import { Select } from '../../components/Select';
import { ConfirmationModal } from '../../components/ConfirmationModal';
import { BaseTable } from '../../components/BaseTable';
import { useAuth } from '../../contexts/AuthContext';
import { formatDate } from '../../utils/formatters';
import { useTableColumnSizing } from '../../hooks/useTableColumnSizing';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || '';

/**
 * Edit Role Modal
 */
function EditRoleModal({ isOpen, onClose, user, onSave }) {
  const [role, setRole] = useState('user');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ role: '', reason: '' });
  const modalRef = useRef(null);
  const roleSelectRef = useRef(null);
  const reasonInputRef = useRef(null);

  useEffect(() => {
    if (user) {
      setRole(user.role || 'user');
      setReason('');
      setErrors({ role: '', reason: '' });
    }
  }, [user]);

  // Auto-focus on first input (role select) when modal opens
  useEffect(() => {
    if (isOpen && roleSelectRef.current) {
      const button = roleSelectRef.current.querySelector('button');
      if (button) {
        button.focus();
      }
    }
  }, [isOpen]);

  // Escape key to close
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Focus trap
  useEffect(() => {
    if (!isOpen || !modalRef.current) return;

    const modal = modalRef.current;
    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    modal.addEventListener('keydown', handleTabKey);
    return () => modal.removeEventListener('keydown', handleTabKey);
  }, [isOpen]);

  // Validation
  const validateRole = (selectedRole) => {
    if (!user) return '';
    if (selectedRole === user.role) {
      return 'New role must be different from current role';
    }
    return '';
  };

  const validateReason = (reasonText) => {
    const trimmed = reasonText.trim();
    if (!trimmed) {
      return 'Reason is required';
    }
    if (trimmed.length < 5) {
      return 'Reason must be at least 5 characters';
    }
    return '';
  };

  const handleRoleChange = (newRole) => {
    setRole(newRole);
  };

  const handleReasonChange = (e) => {
    setReason(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate all fields
    const roleError = validateRole(role);
    const reasonError = validateReason(reason);

    setErrors({ role: roleError, reason: reasonError });

    // If there are errors, focus on first field with error and don't submit
    if (roleError || reasonError) {
      if (roleError && roleSelectRef.current) {
        const button = roleSelectRef.current.querySelector('button');
        if (button) {
          button.focus();
        }
      } else if (reasonError && reasonInputRef.current) {
        reasonInputRef.current.focus();
      }
      return;
    }

    setLoading(true);
    try {
      await onSave(user.id, role, reason.trim());
      onClose();
      setReason('');
      setErrors({ role: '', reason: '' });
    } catch (error) {
      // Error handled by parent
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !user) return null;

  const roleOptions = [
    { value: 'user', label: 'User' },
    { value: 'support', label: 'Support' },
    { value: 'admin', label: 'Admin' },
    { value: 'super_admin', label: 'Super Admin' }
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-slate-900/50 dark:bg-slate-900/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div ref={modalRef} className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Edit User Role
            </h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mb-4">
            <div className="mb-3">
              <p className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">User</p>
              <p className="text-sm text-slate-600 dark:text-slate-400 truncate">{user.email}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Current Role</p>
                <p className="text-sm text-slate-600 dark:text-slate-400 capitalize">{user.role}</p>
              </div>
              <div>
                <p className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">New Role</p>
                <p className="text-sm text-slate-600 dark:text-slate-400 capitalize">{role}</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Role <span className="text-red-500">*</span>
              </label>
              <div ref={roleSelectRef}>
                <Select
                  value={role}
                  onChange={handleRoleChange}
                  options={roleOptions}
                  size="normal"
                />
              </div>
              {errors.role && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.role}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                ref={reasonInputRef}
                value={reason}
                onChange={handleReasonChange}
                placeholder="Why is this role change being made?"
                rows={3}
                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  errors.reason
                    ? 'border-red-500 dark:border-red-400'
                    : 'border-slate-300 dark:border-slate-600'
                }`}
              />
              {errors.reason && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.reason}</p>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 dark:bg-purple-700 dark:hover:bg-purple-800 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Update Role'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

/**
 * Suspend Account Modal (indefinite, no deletion)
 */
function SuspendModal({ isOpen, onClose, user, onSuspend }) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ reason: '' });
  const modalRef = useRef(null);
  const reasonInputRef = useRef(null);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setReason('');
      setErrors({ reason: '' });
    }
  }, [isOpen]);

  // Auto-focus on first input when modal opens
  useEffect(() => {
    if (isOpen && reasonInputRef.current) {
      reasonInputRef.current.focus();
    }
  }, [isOpen]);

  // Escape key to close
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Focus trap
  useEffect(() => {
    if (!isOpen || !modalRef.current) return;

    const modal = modalRef.current;
    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    modal.addEventListener('keydown', handleTabKey);
    return () => modal.removeEventListener('keydown', handleTabKey);
  }, [isOpen]);

  // Validation
  const validateReason = (reasonText) => {
    const trimmed = reasonText.trim();
    if (!trimmed) {
      return 'Reason is required';
    }
    if (trimmed.length < 5) {
      return 'Reason must be at least 5 characters';
    }
    return '';
  };

  const handleReasonChange = (e) => {
    setReason(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate
    const reasonError = validateReason(reason);
    setErrors({ reason: reasonError });

    // If there are errors, focus on field and don't submit
    if (reasonError) {
      if (reasonInputRef.current) {
        reasonInputRef.current.focus();
      }
      return;
    }

    setLoading(true);
    try {
      await onSuspend(user.id, reason.trim());
      onClose();
      setReason('');
      setErrors({ reason: '' });
    } catch (error) {
      // Error handled by parent
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-slate-900/50 dark:bg-slate-900/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div ref={modalRef} className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Suspend Account
            </h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mb-4">
            <p className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">User</p>
            <p className="text-sm text-slate-600 dark:text-slate-400 truncate">{user.email}</p>
          </div>

          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-400/10 rounded-lg border border-blue-200 dark:border-blue-400/20">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              This will lock the account indefinitely. Data is preserved and can be restored by unsuspending.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                ref={reasonInputRef}
                value={reason}
                onChange={handleReasonChange}
                placeholder="Why is this account being suspended?"
                rows={3}
                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  errors.reason
                    ? 'border-red-500 dark:border-red-400'
                    : 'border-slate-300 dark:border-slate-600'
                }`}
              />
              {errors.reason && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.reason}</p>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 dark:bg-purple-500 dark:hover:bg-purple-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Suspending...
                  </>
                ) : (
                  'Suspend Account'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

/**
 * Grant Trial Modal
 */
function GrantTrialModal({ isOpen, onClose, user, onGrant }) {
  const [trialTier, setTrialTier] = useState('pro');
  const [durationDays, setDurationDays] = useState(14);
  const [reason, setReason] = useState('');
  const [force, setForce] = useState(false);
  const [loading, setLoading] = useState(false);
  const [trialHistory, setTrialHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [eligibilityWarning, setEligibilityWarning] = useState(null);
  const [showForceOption, setShowForceOption] = useState(false);
  const [errors, setErrors] = useState({ reason: '' });
  const modalRef = useRef(null);
  const trialTierSelectRef = useRef(null);
  const reasonInputRef = useRef(null);

  // Fetch trial history when modal opens
  useEffect(() => {
    if (isOpen && user) {
      fetchTrialHistory();
    }
  }, [isOpen, user]);

  const fetchTrialHistory = async () => {
    if (!user) return;

    setLoadingHistory(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/api/admin/users/${user.id}/trial-history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setTrialHistory(data.trials || []);
      }
    } catch (error) {
      console.error('Failed to fetch trial history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Validation functions
  const validateReason = (value) => {
    const minLength = force ? 20 : 5;
    if (!value.trim()) return 'Reason is required';
    if (value.trim().length < minLength) {
      return `Reason must be at least ${minLength} characters${force ? ' for forced grants' : ''}`;
    }
    return '';
  };

  // Auto-focus on first input when modal opens
  useEffect(() => {
    if (isOpen && trialTierSelectRef.current) {
      const button = trialTierSelectRef.current.querySelector('button');
      if (button) {
        button.focus();
      }
    }
  }, [isOpen]);

  // Escape key to close
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Focus trap
  useEffect(() => {
    if (!isOpen || !modalRef.current) return;

    const modal = modalRef.current;
    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    modal.addEventListener('keydown', handleTabKey);
    return () => modal.removeEventListener('keydown', handleTabKey);
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate all fields
    const reasonError = validateReason(reason);
    setErrors({ reason: reasonError });

    // If there are errors, focus on field with error and don't submit
    if (reasonError) {
      if (reasonInputRef.current) {
        reasonInputRef.current.focus();
      }
      return;
    }

    setLoading(true);
    try {
      // Call onGrant with force flag
      const result = await onGrant(user.id, trialTier, durationDays, reason.trim(), force);

      // If result indicates ineligibility (not forced), show warning and force option
      if (result && result.hasUsedTrial && result.canForce && !force) {
        setEligibilityWarning(result.error);
        setTrialHistory(result.trialHistory || []);
        setShowForceOption(true);
        setLoading(false);
        return;
      }

      // Success - close modal and reset
      onClose();
      setReason('');
      setTrialTier('pro');
      setDurationDays(14);
      setForce(false);
      setShowForceOption(false);
      setEligibilityWarning(null);
      setErrors({ reason: '' });
    } catch (error) {
      // Error handled by parent
      setLoading(false);
    } finally {
      if (!eligibilityWarning) {
        setLoading(false);
      }
    }
  };

  if (!isOpen || !user) return null;

  const tierOptions = [
    { value: 'pro', label: 'Pro' },
    { value: 'team', label: 'Team' }
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-slate-900/50 dark:bg-slate-900/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div ref={modalRef} className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Grant Trial
            </h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mb-4">
            <p className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">User</p>
            <p className="text-sm text-slate-600 dark:text-slate-400 truncate">{user.email}</p>
          </div>

          {/* Trial History Section */}
          {!loadingHistory && trialHistory.length > 0 && (
            <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Trial History ({trialHistory.length})
                </p>
              </div>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {trialHistory.slice(0, 3).map((trial, idx) => (
                  <div key={trial.id || idx} className="text-xs text-slate-600 dark:text-slate-400">
                    • <span className="font-medium capitalize">{trial.trial_tier}</span> ({trial.source}) -{' '}
                    {formatDate(trial.started_at)} to {formatDate(trial.ends_at)}
                    {trial.source.includes('forced') && (
                      <span className="ml-1 text-amber-600 dark:text-amber-400">⚠️ Forced</span>
                    )}
                  </div>
                ))}
                {trialHistory.length > 3 && (
                  <p className="text-xs text-slate-500 dark:text-slate-500 italic">
                    +{trialHistory.length - 3} more
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Eligibility Warning */}
          {eligibilityWarning && showForceOption && (
            <div className="mb-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">
                    {eligibilityWarning}
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    This user has already used a trial. You can force grant if needed (requires detailed justification).
                  </p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div ref={trialTierSelectRef}>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Trial Tier <span className="text-red-500">*</span>
              </label>
              <Select
                value={trialTier}
                onChange={setTrialTier}
                options={tierOptions}
                size="normal"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Duration (days)
              </label>
              <input
                type="number"
                min="1"
                max="90"
                value={durationDays}
                onChange={(e) => setDurationDays(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                ref={reasonInputRef}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why is this trial being granted?"
                rows={3}
                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  errors.reason
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-slate-300 dark:border-slate-600'
                }`}
              />
              {errors.reason && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.reason}</p>
              )}
            </div>

            {/* Force Grant Checkbox - Only show when eligibility check fails */}
            {showForceOption && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <input
                  type="checkbox"
                  id="force-grant"
                  checked={force}
                  onChange={(e) => setForce(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-purple-600 bg-white border-amber-300 rounded focus:ring-2 focus:ring-purple-500"
                />
                <label htmlFor="force-grant" className="flex-1 text-sm text-amber-800 dark:text-amber-200">
                  <span className="font-medium">Force grant trial (override eligibility check)</span>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                    ⚠️ Only use this for exceptional cases with strong justification (minimum 20 characters).
                  </p>
                </label>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 dark:bg-purple-700 dark:hover:bg-purple-800 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Granting...
                  </>
                ) : force ? (
                  'Force Grant Trial'
                ) : (
                  'Grant Trial'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

/**
 * Schedule Deletion Modal
 */
function ScheduleDeletionModal({ isOpen, onClose, user, onSchedule }) {
  const [reason, setReason] = useState('');
  const [durationDays, setDurationDays] = useState(30);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ reason: '' });
  const modalRef = useRef(null);
  const durationInputRef = useRef(null);
  const reasonInputRef = useRef(null);

  // Validation functions
  const validateReason = (value) => {
    if (!value.trim()) return 'Reason is required';
    if (value.trim().length < 5) return 'Reason must be at least 5 characters';
    return '';
  };

  // Check if form is dirty
  const isDirty = reason.trim().length > 0 || durationDays !== 30;

  // Handle close with confirmation if dirty
  const handleClose = () => {
    if (isDirty) {
      if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  // Auto-focus on first input when modal opens
  useEffect(() => {
    if (isOpen && durationInputRef.current) {
      durationInputRef.current.focus();
    }
  }, [isOpen]);

  // Escape key to close
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isDirty, reason, durationDays]);

  // Focus trap
  useEffect(() => {
    if (!isOpen || !modalRef.current) return;

    const modal = modalRef.current;
    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    modal.addEventListener('keydown', handleTabKey);
    return () => modal.removeEventListener('keydown', handleTabKey);
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate all fields
    const reasonError = validateReason(reason);
    setErrors({ reason: reasonError });

    // If there are errors, focus on field with error and don't submit
    if (reasonError) {
      if (reasonInputRef.current) {
        reasonInputRef.current.focus();
      }
      return;
    }

    setLoading(true);
    try {
      await onSchedule(user.id, reason.trim(), durationDays);
      onClose();
      setReason('');
      setDurationDays(30);
      setErrors({ reason: '' });
    } catch (error) {
      // Error handled by parent
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-slate-900/50 dark:bg-slate-900/70 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div ref={modalRef} className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Schedule Deletion
            </h2>
            <button
              onClick={handleClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mb-4">
            <p className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">User</p>
            <p className="text-sm text-slate-600 dark:text-slate-400 truncate">{user.email}</p>
          </div>

          <div className="mb-4 p-3 bg-red-50 dark:bg-red-400/10 rounded-lg border border-red-200 dark:border-red-400/20">
            <p className="text-xs text-red-700 dark:text-red-300">
              This will schedule the account and all data for permanent deletion after the grace period.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Grace Period (days)
              </label>
              <input
                ref={durationInputRef}
                type="number"
                min="1"
                max="90"
                value={durationDays}
                onChange={(e) => setDurationDays(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Data will be permanently deleted after {durationDays} days
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                ref={reasonInputRef}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why is this account being deleted?"
                rows={3}
                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  errors.reason
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-slate-300 dark:border-slate-600'
                }`}
              />
              {errors.reason && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.reason}</p>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 dark:bg-purple-500 dark:hover:bg-purple-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Scheduling...
                  </>
                ) : (
                  'Schedule Deletion'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

/**
 * Status badge component
 * Shows both suspended and deletion scheduled states (can coexist)
 */
function StatusBadge({ user }) {
  // Deleted (tombstone)
  if (user.deleted_at) {
    return (
      <span className="inline-flex items-center justify-center px-3 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-400/15 dark:text-red-400 whitespace-nowrap w-[70px]">
        Deleted
      </span>
    );
  }

  // Suspended and/or scheduled for deletion
  const isSuspended = user.suspended;
  const isScheduledForDeletion = user.deletion_scheduled_at;

  if (isSuspended || isScheduledForDeletion) {
    return (
      <div className="flex flex-col gap-1">
        {isSuspended && (
          <span className="inline-flex items-center justify-center px-3 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-400 whitespace-nowrap w-[90px]">
            Suspended
          </span>
        )}
        {isScheduledForDeletion && (
          <div className="flex flex-col">
            <span className="inline-flex items-center justify-center px-3 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-400/15 dark:text-red-400 whitespace-nowrap w-[145px]">
              Deletion Scheduled
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {formatDate(user.deletion_scheduled_at)}
            </span>
          </div>
        )}
      </div>
    );
  }

  // Active (default)
  return (
    <span className="inline-flex items-center justify-center px-3 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-400/15 dark:text-green-400 whitespace-nowrap w-[60px]">
      Active
    </span>
  );
}

/**
 * Role badge component
 */
function RoleBadge({ role }) {
  const isAdmin = ['admin', 'support', 'super_admin'].includes(role);

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
      isAdmin
        ? 'bg-purple-100 text-purple-800 dark:bg-purple-400/15 dark:text-purple-400'
        : 'bg-slate-100 text-slate-800 dark:bg-slate-700/50 dark:text-slate-400'
    }`}>
      {isAdmin && <Shield className="w-3 h-3" />}
      {role.replace('_', ' ')}
    </span>
  );
}

/**
 * Trial badge component
 */
function TrialBadge({ trialStatus }) {
  if (!trialStatus) {
    return <span className="text-xs text-slate-500 dark:text-slate-400">None</span>;
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-400/15 dark:text-purple-400 capitalize">
      <Sparkles className="w-3 h-3" />
      {trialStatus}
    </span>
  );
}

export default function UsersAdmin() {
  const navigate = useNavigate();
  const { getToken } = useAuth();

  // Column sizing with persistence
  const { columnSizing, onColumnSizingChange } = useTableColumnSizing('admin-users-table');

  // Data state
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters and sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sorting, setSorting] = useState([{ id: 'created_at', desc: true }]);

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  });

  // Modal state
  const [editRoleModal, setEditRoleModal] = useState({ isOpen: false, user: null });
  const [suspendModal, setSuspendModal] = useState({ isOpen: false, user: null });
  const [unsuspendModal, setUnsuspendModal] = useState({ isOpen: false, user: null });
  const [grantTrialModal, setGrantTrialModal] = useState({ isOpen: false, user: null });
  const [scheduleDeletionModal, setScheduleDeletionModal] = useState({ isOpen: false, user: null });
  const [cancelDeletionModal, setCancelDeletionModal] = useState({ isOpen: false, user: null });

  // Dropdown menu state
  const [openMenuUserId, setOpenMenuUserId] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  // Debounce search query
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close dropdown when clicking outside or pressing ESC
  useEffect(() => {
    if (!openMenuUserId) return;

    const handleClickOutside = (event) => {
      // Check if click is on a menu button or inside the portal menu
      const isMenuButton = event.target.closest('[data-menu-button]');
      const isMenuContent = event.target.closest('[data-menu-content]');

      if (!isMenuButton && !isMenuContent) {
        setOpenMenuUserId(null);
      }
    };

    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        setOpenMenuUserId(null);
      }
    };

    // Small delay to prevent immediate closing when opening
    setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscKey);
    }, 0);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [openMenuUserId]);

  // Fetch users
  const fetchUsers = useCallback(async (page = pagination.page, showRefreshing = false) => {
    try {
      if (showRefreshing) setIsRefreshing(true);
      else setLoading(true);

      const token = getToken();
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString()
      });

      if (debouncedSearch) params.append('search', debouncedSearch);
      if (tierFilter !== 'all') params.append('tier', tierFilter);
      if (roleFilter !== 'all') params.append('role', roleFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      // Add sorting
      if (sorting.length > 0) {
        params.append('sortBy', sorting[0].id);
        params.append('sortOrder', sorting[0].desc ? 'desc' : 'asc');
      }

      const response = await fetch(`${API_URL}/api/admin/users?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.data || []);
      setPagination(prev => ({
        ...prev,
        page: data.pagination?.page || page,
        total: data.pagination?.total || 0,
        totalPages: data.pagination?.totalPages || 0
      }));
      setError(null);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [getToken, pagination.limit, debouncedSearch, tierFilter, roleFilter, statusFilter, sorting]);

  // Fetch statistics
  const fetchStats = useCallback(async () => {
    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/api/admin/users/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch statistics');
      }

      const data = await response.json();
      setStats(data.data);
    } catch (err) {
      console.error('Error fetching statistics:', err);
    }
  }, [getToken]);

  // Initial load
  useEffect(() => {
    fetchUsers(1);
    fetchStats();
  }, []);

  // Refetch on filter/sort change
  useEffect(() => {
    if (!loading) {
      fetchUsers(1, true);
    }
  }, [debouncedSearch, tierFilter, roleFilter, statusFilter, sorting]);

  // Handle page change
  const handlePageChange = (newPage) => {
    fetchUsers(newPage, true);
  };

  // Handle sorting change
  const handleSortingChange = (updater) => {
    const newSorting = typeof updater === 'function' ? updater(sorting) : updater;
    setSorting(newSorting);
  };

  // Handle role change
  const handleRoleChange = async (userId, newRole, reason) => {
    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: newRole, reason })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update role');
      }

      toast.success('User role updated successfully');
      fetchUsers(pagination.page, true);
      fetchStats();
    } catch (err) {
      toast.error(err.message);
      throw err;
    }
  };

  // Handle suspend
  // Handle suspend (indefinite, data preserved)
  const handleSuspend = async (userId, reason) => {
    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/api/admin/users/${userId}/suspend`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to suspend account');
      }

      toast.success('Account suspended successfully');
      fetchUsers(pagination.page, true);
      fetchStats();
    } catch (err) {
      toast.error(err.message);
      throw err;
    }
  };

  // Handle unsuspend
  const handleUnsuspend = async () => {
    if (!unsuspendModal.user) return;

    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/api/admin/users/${unsuspendModal.user.id}/unsuspend`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: 'Account restored by admin' })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to unsuspend account');
      }

      toast.success('Account restored successfully');
      setUnsuspendModal({ isOpen: false, user: null });
      fetchUsers(pagination.page, true);
      fetchStats();
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Handle grant trial
  const handleGrantTrial = async (userId, trialTier, durationDays, reason, force = false) => {
    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/api/admin/users/${userId}/grant-trial`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ trial_tier: trialTier, duration_days: durationDays, reason, force })
      });

      const data = await response.json();

      if (!response.ok) {
        // Check if this is an eligibility issue that can be forced
        if (data.hasUsedTrial && data.canForce && !force) {
          // Return the eligibility data to the modal
          return data;
        }

        throw new Error(data.error || 'Failed to grant trial');
      }

      toast.success(`Trial granted successfully${force ? ' (forced)' : ''}`);
      fetchUsers(pagination.page, true);
      fetchStats();
      return data;
    } catch (err) {
      toast.error(err.message);
      throw err;
    }
  };

  // Handle schedule deletion
  const handleScheduleDeletion = async (userId, reason, durationDays) => {
    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/api/admin/users/${userId}/schedule-deletion`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason, duration_days: durationDays })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to schedule deletion');
      }

      toast.success(`Account scheduled for deletion in ${durationDays} days`);
      fetchUsers(pagination.page, true);
      fetchStats();
    } catch (err) {
      toast.error(err.message);
      throw err;
    }
  };

  // Handle cancel deletion
  const handleCancelDeletion = async () => {
    if (!cancelDeletionModal.user) return;

    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/api/admin/users/${cancelDeletionModal.user.id}/cancel-deletion`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: 'Deletion cancelled by admin' })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to cancel deletion');
      }

      toast.success('Deletion cancelled successfully');
      setCancelDeletionModal({ isOpen: false, user: null });
      fetchUsers(pagination.page, true);
      fetchStats();
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Define table columns
  const columns = useMemo(() => [
    {
      accessorKey: 'email',
      header: 'User',
      enableSorting: true,
      cell: ({ row }) => (
        <div className="min-w-[200px]">
          <p className="font-medium text-slate-900 dark:text-white text-sm truncate">
            {row.original.email}
          </p>
          {(row.original.first_name || row.original.last_name) && (
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {[row.original.first_name, row.original.last_name].filter(Boolean).join(' ')}
            </p>
          )}
          {row.original.email_verified && (
            <span className="inline-flex items-center gap-0.5 text-xs text-green-600 dark:text-green-400 mt-0.5">
              <CheckSquare className="w-3 h-3" />
              Verified
            </span>
          )}
        </div>
      )
    },
    {
      accessorKey: 'role',
      header: 'Role',
      enableSorting: true,
      cell: ({ row }) => <RoleBadge role={row.original.role} />
    },
    {
      accessorKey: 'tier',
      header: 'Tier',
      enableSorting: true,
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-1 text-sm font-medium text-slate-900 dark:text-white capitalize">
          {row.original.tier !== 'free' && <Sparkles className="w-3.5 h-3.5 text-purple-500" />}
          {row.original.tier}
        </span>
      )
    },
    {
      accessorKey: 'status',
      header: 'Status',
      enableSorting: true,
      size: 180,
      cell: ({ row }) => (
        <StatusBadge user={row.original} />
      )
    },
    {
      accessorKey: 'total_generations',
      header: 'Generations',
      enableSorting: true,
      cell: ({ row }) => (
        <span className="text-sm text-slate-600 dark:text-slate-400">
          {row.original.total_generations || 0}
        </span>
      )
    },
    {
      accessorKey: 'trial',
      header: 'Trial',
      enableSorting: false,
      cell: ({ row }) => <TrialBadge trialStatus={row.original.trial_status} />
    },
    {
      accessorKey: 'created_at',
      header: 'Created',
      enableSorting: true,
      cell: ({ row }) => (
        <span className="text-sm text-slate-600 dark:text-slate-400">
          {formatDate(row.original.created_at)}
        </span>
      )
    },
    {
      id: 'actions',
      header: 'Actions',
      enableSorting: false,
      cell: ({ row }) => {
        const user = row.original;
        const isSuspended = user.suspended;
        const isScheduledForDeletion = !!user.deletion_scheduled_at;
        const isDeleted = !!user.deleted_at;
        const isMenuOpen = openMenuUserId === user.id;

        if (isDeleted) {
          return (
            <span className="text-xs text-slate-400 dark:text-slate-500">
              No actions
            </span>
          );
        }

        const handleMenuToggle = (e) => {
          e.stopPropagation();

          if (isMenuOpen) {
            setOpenMenuUserId(null);
          } else {
            // Calculate menu position
            const rect = e.currentTarget.getBoundingClientRect();
            const menuWidth = 192; // w-48 = 12rem = 192px

            // Calculate approximate menu height based on number of items
            let itemCount = 1; // Edit Role (always)
            itemCount += 1; // Suspend/Unsuspend
            itemCount += 1; // Schedule/Cancel Deletion
            if (!isSuspended && !isScheduledForDeletion) itemCount += 1; // Grant Trial
            const menuHeight = itemCount * 40; // ~40px per item

            // Position menu to the left of the button, aligned to top
            let left = rect.right - menuWidth;
            let top = rect.bottom + window.scrollY;

            // Ensure menu stays within viewport
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            // Adjust horizontal position if needed
            if (left < 8) {
              left = 8; // 8px padding from left edge
            } else if (left + menuWidth > viewportWidth - 8) {
              left = viewportWidth - menuWidth - 8; // 8px padding from right edge
            }

            // Adjust vertical position if menu would go below viewport
            if (rect.bottom + menuHeight > viewportHeight) {
              top = rect.top + window.scrollY - menuHeight;
            }

            setMenuPosition({ top, left });
            setOpenMenuUserId(user.id);
          }
        };

        return (
          <>
            <div>
              <button
                data-menu-button
                onClick={handleMenuToggle}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                aria-label="Open actions menu"
              >
                <MoreVertical className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              </button>
            </div>

            {isMenuOpen && createPortal(
              <div
                data-menu-content
                style={{
                  position: 'absolute',
                  top: `${menuPosition.top}px`,
                  left: `${menuPosition.left}px`,
                }}
                className="z-[9999] w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg overflow-hidden"
              >
                {/* Edit Role - Always available */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditRoleModal({ isOpen: true, user });
                    setOpenMenuUserId(null);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Edit Role
                </button>

                {/* Suspend/Unsuspend */}
                {isSuspended ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setUnsuspendModal({ isOpen: true, user });
                      setOpenMenuUserId(null);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Unsuspend Account
                  </button>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSuspendModal({ isOpen: true, user });
                      setOpenMenuUserId(null);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 transition-colors"
                  >
                    <Ban className="w-4 h-4" />
                    Suspend Account
                  </button>
                )}

                {/* Schedule/Cancel Deletion */}
                {isScheduledForDeletion ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCancelDeletionModal({ isOpen: true, user });
                      setOpenMenuUserId(null);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Cancel Deletion
                  </button>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setScheduleDeletionModal({ isOpen: true, user });
                      setOpenMenuUserId(null);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 transition-colors"
                  >
                    <Ban className="w-4 h-4" />
                    Schedule Deletion
                  </button>
                )}

                {/* Grant Trial - Only show if not suspended and not scheduled for deletion */}
                {!isSuspended && !isScheduledForDeletion && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setGrantTrialModal({ isOpen: true, user });
                      setOpenMenuUserId(null);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 transition-colors"
                  >
                    <Gift className="w-4 h-4" />
                    Grant Trial
                  </button>
                )}
              </div>,
              document.body
            )}
          </>
        );
      }
    }
  ], [openMenuUserId, menuPosition]);

  // Filter options
  const tierOptions = [
    { value: 'all', label: 'All Tiers' },
    { value: 'free', label: 'Free' },
    { value: 'starter', label: 'Starter' },
    { value: 'pro', label: 'Pro' },
    { value: 'team', label: 'Team' },
    { value: 'enterprise', label: 'Enterprise' }
  ];

  const roleOptions = [
    { value: 'all', label: 'All Roles' },
    { value: 'user', label: 'User' },
    { value: 'support', label: 'Support' },
    { value: 'admin', label: 'Admin' },
    { value: 'super_admin', label: 'Super Admin' }
  ];

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'suspended', label: 'Suspended' },
    { value: 'scheduled_for_deletion', label: 'Scheduled for Deletion' },
    { value: 'deleted', label: 'Deleted' },
    { value: 'all', label: 'All Statuses' }
  ];

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/admin')}
            className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span className="font-medium">Back to Admin</span>
          </button>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              User Management
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              Manage users, roles, and accounts
            </p>
          </div>

          <button
            onClick={() => {
              fetchUsers(pagination.page, true);
              fetchStats();
            }}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
                  <Users className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {stats.total_users || 0}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Total Users</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {stats.active_users || 0}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Active Users</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
                  <Shield className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {stats.admin_users || 0}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Admin Users</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
                  <Sparkles className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {stats.trial_users || 0}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Trial Users</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 mb-6">
          <div className="flex flex-col gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by email or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filter Dropdowns */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Select
                value={tierFilter}
                onChange={setTierFilter}
                options={tierOptions}
                size="normal"
              />
              <Select
                value={roleFilter}
                onChange={setRoleFilter}
                options={roleOptions}
                size="normal"
              />
              <Select
                value={statusFilter}
                onChange={setStatusFilter}
                options={statusOptions}
                size="normal"
              />
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 dark:bg-red-400/15 border border-red-200 dark:border-red-400/30 rounded-lg p-4 mb-6">
            <p className="text-red-700 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Users Table */}
        <BaseTable
          data={users}
          columns={columns}
          sorting={sorting}
          onSortingChange={handleSortingChange}
          manualSorting={true}
          pagination={pagination}
          onPageChange={handlePageChange}
          manualPagination={true}
          isLoading={loading}
          isRefreshing={isRefreshing}
          columnSizing={columnSizing}
          onColumnSizingChange={onColumnSizingChange}
          enableColumnResizing={true}
          emptyState={{
            icon: Users,
            title: searchQuery || tierFilter !== 'all' || roleFilter !== 'all' || statusFilter !== 'all'
              ? 'No matching users'
              : 'No users found',
            description: searchQuery || tierFilter !== 'all' || roleFilter !== 'all' || statusFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'No users have been created yet'
          }}
        />

        {/* Modals */}
        <EditRoleModal
          isOpen={editRoleModal.isOpen}
          onClose={() => setEditRoleModal({ isOpen: false, user: null })}
          user={editRoleModal.user}
          onSave={handleRoleChange}
        />

        <SuspendModal
          isOpen={suspendModal.isOpen}
          onClose={() => setSuspendModal({ isOpen: false, user: null })}
          user={suspendModal.user}
          onSuspend={handleSuspend}
        />

        <ConfirmationModal
          isOpen={unsuspendModal.isOpen}
          onClose={() => setUnsuspendModal({ isOpen: false, user: null })}
          onConfirm={handleUnsuspend}
          title="Restore Account"
          message={`Are you sure you want to restore the account for ${unsuspendModal.user?.email}? The user will regain access immediately.`}
          confirmText="Restore Account"
          confirmVariant="warning"
        />

        <GrantTrialModal
          isOpen={grantTrialModal.isOpen}
          onClose={() => setGrantTrialModal({ isOpen: false, user: null })}
          user={grantTrialModal.user}
          onGrant={handleGrantTrial}
        />

        <ScheduleDeletionModal
          isOpen={scheduleDeletionModal.isOpen}
          onClose={() => setScheduleDeletionModal({ isOpen: false, user: null })}
          user={scheduleDeletionModal.user}
          onSchedule={handleScheduleDeletion}
        />

        <ConfirmationModal
          isOpen={cancelDeletionModal.isOpen}
          onClose={() => setCancelDeletionModal({ isOpen: false, user: null })}
          onConfirm={handleCancelDeletion}
          title="Cancel Deletion"
          message={`Are you sure you want to cancel the scheduled deletion for ${cancelDeletionModal.user?.email}? The account will no longer be deleted.`}
          confirmText="Cancel Deletion"
          confirmVariant="primary"
        />
      </div>
    </PageLayout>
  );
}
