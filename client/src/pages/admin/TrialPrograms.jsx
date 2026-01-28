/**
 * Admin Campaigns Management Page
 *
 * Allows admins to create, manage, and track auto-trial trialPrograms.
 * Features:
 * - Create new campaigns with configurable tier/duration/dates
 * - View all campaigns with status and signup stats
 * - Toggle campaigns active/inactive (only one can be active)
 * - View campaign performance metrics
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  MoreVertical,
  Users,
  Calendar,
  Clock,
  TrendingUp,
  Trash2,
  Edit2,
  CheckCircle,
  XCircle,
  X,
} from 'lucide-react';
import { PageLayout } from '../../components/PageLayout';
import { BaseTable } from '../../components/BaseTable';
import { Select } from '../../components/Select';
import { FilterBar } from '../../components/FilterBar';
import { useAuth } from '../../contexts/AuthContext';
import { formatDate, formatDateTime } from '../../utils/formatters';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || '';

/**
 * Trial Program Status Badge
 */
function StatusBadge({ campaign }) {
  const now = new Date();
  const startsAt = new Date(campaign.starts_at);
  const endsAt = campaign.ends_at ? new Date(campaign.ends_at) : null;

  let status, color;

  if (!campaign.is_active) {
    // Inactive campaigns - check if they ended or were manually deactivated
    if (endsAt && now > endsAt) {
      status = 'Ended';
      color = 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400';
    } else {
      status = 'Inactive';
      color = 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400';
    }
  } else if (now < startsAt) {
    status = 'Scheduled';
    color = 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400';
  } else {
    // Active campaigns always show as Active (date checks are secondary)
    status = 'Active';
    color = 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${color}`}>
      {status}
    </span>
  );
}

/**
 * Delete Confirmation Modal
 */
function DeleteConfirmModal({ isOpen, onClose, campaign, onConfirm }) {
  if (!isOpen || !campaign) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
            <Trash2 className="w-6 h-6 text-slate-600 dark:text-slate-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
              Delete Trial Program
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Are you sure you want to delete "{campaign.name}"? This action cannot be undone.
            </p>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-6">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Note:</strong> Deleting this trial program will permanently remove all program data and statistics.
          </p>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium"
          >
            Delete Trial Program
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Trial Program Actions Menu
 */
function CampaignActions({ campaign, onEdit, onToggle, onDelete }) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);

  // Update dropdown position when opened
  const updatePosition = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 4, // 4px gap below button
        left: rect.right - 192, // Align right edge (192px = w-48)
      });
    }
  }, []);

  // Toggle dropdown
  const toggleDropdown = (e) => {
    e.stopPropagation();
    if (!isOpen) {
      updatePosition();
    }
    setIsOpen(!isOpen);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (
        buttonRef.current &&
        !buttonRef.current.contains(e.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  // Update position on scroll/resize
  useEffect(() => {
    if (!isOpen) return;

    const handleReposition = () => updatePosition();
    window.addEventListener('scroll', handleReposition, true);
    window.addEventListener('resize', handleReposition);

    return () => {
      window.removeEventListener('scroll', handleReposition, true);
      window.removeEventListener('resize', handleReposition);
    };
  }, [isOpen, updatePosition]);

  const handleEdit = () => {
    onEdit(campaign);
    setIsOpen(false);
  };

  const handleToggle = () => {
    onToggle(campaign);
    setIsOpen(false);
  };

  const handleDelete = () => {
    onDelete(campaign);
    setIsOpen(false);
  };

  return (
    <>
      {/* Menu button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleDropdown}
        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        aria-label="Trial Program actions"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <MoreVertical className="w-4 h-4 text-slate-600 dark:text-slate-400" />
      </button>

      {/* Dropdown menu - rendered as portal to avoid overflow clipping */}
      {isOpen && createPortal(
        <div
          ref={dropdownRef}
          className="fixed w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50 py-1"
          style={{ top: `${position.top}px`, left: `${position.left}px` }}
          role="menu"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Activate/Deactivate */}
          <button
            type="button"
            onClick={handleToggle}
            className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 transition-colors duration-150"
            role="menuitem"
          >
            {campaign.is_active ? (
              <>
                <XCircle className="w-4 h-4" />
                Deactivate
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Activate
              </>
            )}
          </button>

          {/* Edit */}
          <button
            type="button"
            onClick={handleEdit}
            className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 transition-colors duration-150"
            role="menuitem"
          >
            <Edit2 className="w-4 h-4" />
            Edit
          </button>

          {/* Divider before destructive action */}
          {campaign.signups_count === 0 && (
            <>
              <div className="border-t border-slate-200 dark:border-slate-700 my-1" />

              {/* Delete - only show if no signups */}
              <button
                type="button"
                onClick={handleDelete}
                className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 transition-colors duration-150"
                role="menuitem"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </>
          )}
        </div>,
        document.body
      )}
    </>
  );
}

/**
 * Create/Edit Trial Program Modal
 */
function CampaignModal({ isOpen, onClose, campaign, onSave, existingCampaigns = [] }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    trialTier: 'pro',
    trialDays: 14,
    startsAt: new Date().toISOString().split('T')[0],
    endsAt: '',
    isActive: false,
    autoEnroll: false,
    allowPreviousTrialUsers: false,
    cooldownDays: 90,
  });
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    if (campaign) {
      setFormData({
        name: campaign.name || '',
        description: campaign.description || '',
        trialTier: campaign.trial_tier || 'pro',
        trialDays: campaign.trial_days || 14,
        startsAt: campaign.starts_at ? new Date(campaign.starts_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        endsAt: campaign.ends_at ? new Date(campaign.ends_at).toISOString().split('T')[0] : '',
        isActive: campaign.is_active || false,
        autoEnroll: campaign.auto_enroll || false,
        allowPreviousTrialUsers: campaign.allow_previous_trial_users || false,
        cooldownDays: campaign.cooldown_days ?? 90,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        trialTier: 'pro',
        trialDays: 14,
        startsAt: new Date().toISOString().split('T')[0],
        endsAt: '',
        isActive: false,
        autoEnroll: false,
        allowPreviousTrialUsers: false,
        cooldownDays: 90,
      });
    }
    // Clear errors when modal opens/closes
    setNameError('');
    setValidationErrors({});
  }, [campaign, isOpen]);

  // Check for duplicate campaign name
  const checkDuplicateName = (name) => {
    if (!name.trim()) {
      setNameError('');
      return false;
    }

    const trimmedName = name.trim();
    const isDuplicate = existingCampaigns.some(
      (c) => c.name.toLowerCase() === trimmedName.toLowerCase() && c.id !== campaign?.id
    );

    if (isDuplicate) {
      setNameError('A campaign with this name already exists');
      return true;
    }

    setNameError('');
    return false;
  };

  const handleNameChange = (e) => {
    const newName = e.target.value;
    setFormData({ ...formData, name: newName });
    checkDuplicateName(newName);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    const errors = {};

    if (!formData.name || !formData.name.trim()) {
      errors.name = 'Name is required';
    }

    if (!formData.trialTier) {
      errors.trialTier = 'Trial tier is required';
    }

    if (!formData.trialDays || formData.trialDays < 1 || formData.trialDays > 90) {
      errors.trialDays = 'Trial days must be between 1 and 90';
    }

    if (!formData.startsAt) {
      errors.startsAt = 'Start date is required';
    }

    // Validate end date is after or equal to start date
    if (formData.endsAt && formData.startsAt) {
      const startDate = new Date(formData.startsAt);
      const endDate = new Date(formData.endsAt);
      if (endDate < startDate) {
        errors.endsAt = 'End date must be on or after start date';
      }
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    // Clear validation errors
    setValidationErrors({});

    // Check for duplicate name before submitting
    if (checkDuplicateName(formData.name)) {
      return;
    }

    setSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      // Error handled by parent
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  // Check if all required fields are filled
  const isFormValid =
    formData.name?.trim() &&
    formData.trialTier &&
    formData.trialDays >= 1 &&
    formData.trialDays <= 90 &&
    formData.startsAt &&
    !nameError;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            {campaign ? 'Edit Trial Program' : 'Create Trial Program'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="px-6 py-4 overflow-y-auto flex-1 space-y-4">
            <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Trial Program Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={handleNameChange}
              className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white ${
                nameError || validationErrors.name
                  ? 'border-red-500 dark:border-red-500'
                  : 'border-slate-300 dark:border-slate-600'
              }`}
              placeholder="e.g., January Pro Trial"
              required
            />
            {(nameError || validationErrors.name) && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{nameError || validationErrors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              placeholder="Optional description..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Trial Tier <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.trialTier}
                onChange={(e) => setFormData({ ...formData, trialTier: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white ${
                  validationErrors.trialTier
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-slate-300 dark:border-slate-600'
                }`}
                required
              >
                <option value="pro">Pro</option>
                <option value="team">Team</option>
              </select>
              {validationErrors.trialTier && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.trialTier}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Trial Days <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                max="90"
                value={formData.trialDays}
                onChange={(e) => setFormData({ ...formData, trialDays: parseInt(e.target.value) || 14 })}
                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white ${
                  validationErrors.trialDays
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-slate-300 dark:border-slate-600'
                }`}
                required
              />
              {validationErrors.trialDays && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.trialDays}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.startsAt}
                onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white ${
                  validationErrors.startsAt
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-slate-300 dark:border-slate-600'
                }`}
                required
              />
              {validationErrors.startsAt && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.startsAt}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                End Date (optional)
              </label>
              <input
                type="date"
                value={formData.endsAt}
                onChange={(e) => setFormData({ ...formData, endsAt: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white ${
                  validationErrors.endsAt
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-slate-300 dark:border-slate-600'
                }`}
              />
              {validationErrors.endsAt && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.endsAt}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 rounded border-slate-300 dark:border-slate-600"
            />
            <label htmlFor="isActive" className="text-sm text-slate-700 dark:text-slate-300">
              Active immediately
            </label>
          </div>

          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              id="autoEnroll"
              checked={formData.autoEnroll}
              onChange={(e) => {
                const isChecked = e.target.checked;
                setFormData({
                  ...formData,
                  autoEnroll: isChecked,
                  // Clear allowPreviousTrialUsers when enabling auto-enroll
                  allowPreviousTrialUsers: isChecked ? false : formData.allowPreviousTrialUsers,
                });
              }}
              className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 mt-0.5"
            />
            <div>
              <label htmlFor="autoEnroll" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Auto-enroll new signups
              </label>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                New signups auto-enroll. If unchecked, trial is invite-only.
              </p>
            </div>
          </div>

          {/* Eligibility Settings Section - Only show for invite-only trials */}
          {!formData.autoEnroll && (
            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
                Trial Eligibility Rules
              </h3>

              <div className="space-y-4">
                {/* Allow Previous Trial Users */}
                <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="allowPreviousTrialUsers"
                  checked={formData.allowPreviousTrialUsers}
                  onChange={(e) => setFormData({ ...formData, allowPreviousTrialUsers: e.target.checked })}
                  className="mt-0.5 w-4 h-4 rounded border-slate-300 dark:border-slate-600"
                />
                <div className="flex-1">
                  <label htmlFor="allowPreviousTrialUsers" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Allow users with previous trials
                  </label>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Enable this for re-engagement campaigns targeting lapsed users
                  </p>
                </div>
              </div>

              {/* Conditional fields - only show if previous trials are allowed */}
              {formData.allowPreviousTrialUsers && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Cooldown period (days)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="365"
                      value={formData.cooldownDays}
                      onChange={(e) => setFormData({ ...formData, cooldownDays: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Minimum days required since user's last trial ended. 0 = no cooldown.
                    </p>
                  </div>
                </>
              )}

              {/* Who Can Redeem Summary */}
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-xs font-medium text-blue-900 dark:text-blue-100 mb-2">
                  Who Can Redeem:
                </p>
                <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                  {!formData.allowPreviousTrialUsers ? (
                    <>
                      <li>• Users who have never had a trial</li>
                      <li>• Users with previous trials are blocked</li>
                      <li>• Users with active trials are blocked</li>
                    </>
                  ) : (
                    <>
                      <li>• Users who have never had a trial</li>
                      <li>• Users with expired trials (after {formData.cooldownDays} day{formData.cooldownDays !== 1 ? 's' : ''} cooldown)</li>
                      <li>• Maximum 3 trials per user (lifetime, across all campaigns)</li>
                      <li>• Users with active trials are blocked</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
            </div>
          )}
          </div>

          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !formData.name.trim() || nameError}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Main Campaigns Page Component
 */
export default function Campaigns() {
  const { getToken } = useAuth();
  const [trialPrograms, setTrialPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingTrialProgram, setEditingCampaign] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingTrialProgram, setDeletingCampaign] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sorting, setSorting] = useState([{ id: 'starts_at', desc: true }]);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 0 });
  const [statusFilter, setStatusFilter] = useState('all');
  const [enrollmentFilter, setEnrollmentFilter] = useState('all');
  const [tierFilter, setTierFilter] = useState('all');
  const [dismissedBanners, setDismissedBanners] = useState(() => {
    // Load dismissed banners from localStorage on mount
    try {
      const saved = localStorage.getItem('dismissedCampaignBanners');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const fetchTrialPrograms = useCallback(async (page = pagination.page, showRefreshing = false) => {
    try {
      if (showRefreshing) setIsRefreshing(true);
      else setLoading(true);
      setError(null);

      const token = await getToken();

      // Don't fetch if no token (user logged out)
      if (!token) {
        setLoading(false);
        return;
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
      });

      if (sorting.length > 0) {
        params.append('sortBy', sorting[0].id);
        params.append('sortOrder', sorting[0].desc ? 'DESC' : 'ASC');
      }

      const response = await fetch(`${API_URL}/api/admin/trial-programs?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
      });

      if (!response.ok) {
        // Don't show error toast for 401 (user logged out)
        if (response.status === 401) {
          setLoading(false);
          return;
        }
        throw new Error('Failed to fetch campaigns');
      }

      const data = await response.json();
      setTrialPrograms(data.data || []);

      // Update pagination from server response
      setPagination({
        page: data.pagination.page,
        limit: data.pagination.limit,
        total: data.pagination.total,
        totalPages: data.pagination.totalPages,
      });
    } catch (err) {
      // Only show error if not a network/auth issue
      if (err.message !== 'Failed to fetch campaigns' || err.status !== 401) {
        setError(err.message);
        toast.error('Failed to load campaigns');
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [getToken, pagination.limit, sorting]);

  // Initial load
  useEffect(() => {
    fetchTrialPrograms(1);
  }, []);

  // Refetch on sorting change
  useEffect(() => {
    if (!loading) {
      fetchTrialPrograms(1, true);
    }
  }, [sorting]);

  // Handle page change
  const handlePageChange = (newPage) => {
    fetchTrialPrograms(newPage, true);
  };

  // Handle sorting change
  const handleSortingChange = (newSorting) => {
    setSorting(newSorting);
  };

  // Clear dismissed banners when the active auto-enroll trial program changes
  useEffect(() => {
    const activeAutoEnrollTrial = trialPrograms.find(c => c.is_active && c.auto_enroll);
    const activeId = activeAutoEnrollTrial?.id;

    // Check if we have dismissed banners stored
    const storedBanners = Object.keys(dismissedBanners);

    // If there's an active auto-enroll trial and it's different from any dismissed ones,
    // clear the dismissed banners so the new one shows
    if (activeId && storedBanners.length > 0 && !dismissedBanners[activeId]) {
      setDismissedBanners({});
      localStorage.removeItem('dismissedCampaignBanners');
    }
  }, [trialPrograms, dismissedBanners]);

  const handleCreate = useCallback(() => {
    setEditingCampaign(null);
    setShowModal(true);
  }, []);

  const handleEdit = useCallback((trialProgram) => {
    setEditingCampaign(trialProgram);
    setShowModal(true);
  }, []);

  const handleToggle = useCallback(async (trialProgram) => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/api/admin/trial-programs/${trialProgram.id}/toggle`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !trialProgram.is_active }),
      });

      if (!response.ok) throw new Error('Failed to toggle campaign');

      // Immediately update local state for instant UI update
      setTrialPrograms(prevTrialPrograms =>
        prevTrialPrograms.map(c =>
          c.id === trialProgram.id ? { ...c, is_active: !c.is_active } : c
        )
      );

      toast.success(trialProgram.is_active ? 'Trial Program deactivated' : 'Trial Program activated');

      // Then refresh from server to ensure consistency
      await fetchTrialPrograms();
    } catch (err) {
      toast.error(err.message);
    }
  }, [getToken, fetchTrialPrograms]);

  const handleDeleteClick = useCallback((trialProgram) => {
    setDeletingCampaign(trialProgram);
    setShowDeleteModal(true);
  }, []);

  const handleSave = async (formData) => {
    try {
      const token = await getToken();
      const url = editingTrialProgram
        ? `${API_URL}/api/admin/trial-programs/${editingTrialProgram.id}`
        : `${API_URL}/api/admin/trial-programs`;
      const method = editingTrialProgram ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          startsAt: new Date(formData.startsAt).toISOString(),
          endsAt: formData.endsAt ? new Date(formData.endsAt).toISOString() : null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        const errorMessage = data.error || 'Failed to save campaign';

        // Show user-friendly message for duplicate name constraint
        if (errorMessage.includes('unique') || errorMessage.includes('duplicate') || errorMessage.includes('already exists')) {
          toast.error('A campaign with this name already exists');
        } else {
          toast.error(errorMessage);
        }
        throw new Error(errorMessage);
      }

      toast.success(editingTrialProgram ? 'Trial Program updated' : 'Trial Program created');
      fetchTrialPrograms();
    } catch (error) {
      // Error already shown via toast, re-throw for modal handler
      throw error;
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingTrialProgram) return;

    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/api/admin/trial-programs/${deletingTrialProgram.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete campaign');
      }

      // Immediately remove from local state for instant UI update
      setTrialPrograms(prevTrialPrograms => prevTrialPrograms.filter(c => c.id !== deletingTrialProgram.id));
      toast.success('Trial Program deleted');

      // Then refresh from server to ensure consistency
      await fetchTrialPrograms();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeletingCampaign(null);
    }
  };

  const handleDismissBanner = (trialProgramId) => {
    const updated = { ...dismissedBanners, [trialProgramId]: true };
    setDismissedBanners(updated);
    localStorage.setItem('dismissedCampaignBanners', JSON.stringify(updated));
  };

  // Clear filters
  const clearFilters = () => {
    setStatusFilter('all');
    setEnrollmentFilter('all');
    setTierFilter('all');
  };

  // Filter trial programs based on selected filters
  const filteredTrialPrograms = useMemo(() => {
    return trialPrograms.filter(program => {
      const now = new Date();
      const startsAt = new Date(program.starts_at);
      const endsAt = program.ends_at ? new Date(program.ends_at) : null;

      // Determine status
      let status;
      if (!program.is_active) {
        status = endsAt && now > endsAt ? 'ended' : 'inactive';
      } else if (now < startsAt) {
        status = 'scheduled';
      } else {
        status = 'active';
      }

      // Apply status filter
      if (statusFilter !== 'all' && status !== statusFilter) {
        return false;
      }

      // Apply enrollment filter
      if (enrollmentFilter !== 'all') {
        const enrollment = program.auto_enroll ? 'auto' : 'invite';
        if (enrollment !== enrollmentFilter) {
          return false;
        }
      }

      // Apply tier filter
      if (tierFilter !== 'all' && program.trial_tier !== tierFilter) {
        return false;
      }

      return true;
    });
  }, [trialPrograms, statusFilter, enrollmentFilter, tierFilter]);

  // Define table columns (memoized to prevent recreation on each render)
  const columns = useMemo(() => [
    {
      accessorKey: 'name',
      header: 'Trial Program',
      cell: ({ row }) => (
        <div>
          <p className="text-slate-900 dark:text-white">
            {row.original.name}
          </p>
          {row.original.description && (
            <p className="text-sm text-slate-500 dark:text-slate-400 truncate max-w-xs">
              {row.original.description}
            </p>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'is_active',
      header: 'Status',
      cell: ({ row }) => <StatusBadge campaign={row.original} />,
      enableSorting: true,
    },
    {
      accessorKey: 'auto_enroll',
      header: 'Enrollment',
      cell: ({ row }) => (
        <div className="text-sm text-slate-900 dark:text-white">
          {row.original.auto_enroll ? 'Auto-enroll' : 'Invite-only'}
        </div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: 'trial_tier',
      header: 'Trial',
      cell: ({ row }) => (
        <span className="capitalize text-sm font-medium text-slate-600 dark:text-slate-400">
          {row.original.trial_tier}
        </span>
      ),
      enableSorting: true,
    },
    {
      accessorKey: 'starts_at',
      header: 'Dates',
      cell: ({ row }) => (
        <div className="text-sm text-slate-600 dark:text-slate-400">
          <div>{formatDate(row.original.starts_at, { utc: true })}</div>
          {row.original.ends_at && (
            <div>
              to {formatDate(row.original.ends_at, { utc: true })}{' '}
              <span className="text-slate-400 dark:text-slate-500">
                ({row.original.trial_days} days)
              </span>
            </div>
          )}
        </div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: 'signups_count',
      header: 'Signups',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <span className="text-slate-900 dark:text-white font-medium">
            {row.original.signups_count}
          </span>
          {row.original.conversions_count > 0 && (
            <span className="text-green-600 dark:text-green-400 text-sm">
              ({row.original.conversions_count} converted)
            </span>
          )}
        </div>
      ),
      enableSorting: true,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center justify-end">
          <CampaignActions
            campaign={row.original}
            onEdit={handleEdit}
            onToggle={handleToggle}
            onDelete={handleDeleteClick}
          />
        </div>
      ),
    },
  ], [handleEdit, handleToggle, handleDeleteClick]);

  return (
    <PageLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            to="/admin"
            className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Admin
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                Trial Programs
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Manage trial programs for new signups
              </p>
            </div>

            <button
              onClick={handleCreate}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium"
            >
              <Plus className="w-4 h-4" />
              New Trial Program
            </button>
          </div>
        </div>

        {/* Active Auto-Enroll Trial Program Banner */}
        {(() => {
          const activeCampaign = trialPrograms.find(c => c.is_active && c.auto_enroll);
          if (!activeCampaign || dismissedBanners[activeCampaign.id]) return null;

          return (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-green-800 dark:text-green-200">
                    Active auto-enroll trial program
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    {activeCampaign.name} - All new signups receive a{' '}
                    {activeCampaign.trial_tier} trial
                  </p>
                </div>
                <button
                  onClick={() => handleDismissBanner(activeCampaign.id)}
                  className="p-1.5 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors flex-shrink-0"
                  aria-label="Dismiss banner"
                >
                  <X className="w-4 h-4 text-green-600 dark:text-green-400" />
                </button>
              </div>
            </div>
          );
        })()}

        {/* Filters */}
        <FilterBar
          hasActiveFilters={statusFilter !== 'all' || enrollmentFilter !== 'all' || tierFilter !== 'all'}
          onClearFilters={clearFilters}
        >
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            placeholder="All Statuses"
            options={[
              { value: 'all', label: 'All Statuses' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
              { value: 'scheduled', label: 'Scheduled' },
              { value: 'ended', label: 'Ended' }
            ]}
            ariaLabel="Filter by status"
          />

          <Select
            value={enrollmentFilter}
            onChange={setEnrollmentFilter}
            placeholder="All Enrollment"
            options={[
              { value: 'all', label: 'All Enrollment' },
              { value: 'auto', label: 'Auto-enroll' },
              { value: 'invite', label: 'Invite-only' }
            ]}
            ariaLabel="Filter by enrollment type"
          />

          <Select
            value={tierFilter}
            onChange={setTierFilter}
            placeholder="All Tiers"
            options={[
              { value: 'all', label: 'All Tiers' },
              { value: 'pro', label: 'Pro' },
              { value: 'team', label: 'Team' },
              { value: 'enterprise', label: 'Enterprise' }
            ]}
            ariaLabel="Filter by tier"
          />
        </FilterBar>

        {/* Campaigns Table */}
        {error ? (
          <div className="text-center py-12 text-red-600 dark:text-red-400">{error}</div>
        ) : (
          <BaseTable
            title="Trial Programs"
            description={`${pagination.total} total programs`}
            onRefresh={() => fetchTrialPrograms(pagination.page, true)}
            data={filteredTrialPrograms}
            columns={columns}
            sorting={sorting}
            onSortingChange={handleSortingChange}
            pagination={pagination}
            onPageChange={handlePageChange}
            manualSorting={true}
            manualPagination={true}
            enableColumnResizing={true}
            isLoading={loading}
            isRefreshing={isRefreshing}
            emptyState={{
              icon: Calendar,
              title: statusFilter !== 'all' || enrollmentFilter !== 'all' || tierFilter !== 'all'
                ? 'No matching trial programs'
                : 'No trial programs yet',
              description: statusFilter !== 'all' || enrollmentFilter !== 'all' || tierFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Create one to auto-grant trials to new users.',
              action: (
                <button
                  onClick={handleCreate}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
                >
                  <Plus className="w-4 h-4" />
                  Create First Trial Program
                </button>
              ),
            }}
          />
        )}
      </div>

      {/* Create/Edit Modal */}
      <CampaignModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        campaign={editingTrialProgram}
        onSave={handleSave}
        existingCampaigns={trialPrograms}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeletingCampaign(null);
        }}
        campaign={deletingTrialProgram}
        onConfirm={handleDeleteConfirm}
      />
    </PageLayout>
  );
}
