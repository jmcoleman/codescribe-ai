/**
 * Admin Campaigns Management Page
 *
 * Allows admins to create, manage, and track auto-trial campaigns.
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
  RefreshCw,
  Trash2,
  Edit2,
  CheckCircle,
  XCircle,
  X,
} from 'lucide-react';
import { PageLayout } from '../../components/PageLayout';
import { BaseTable } from '../../components/BaseTable';
import { useAuth } from '../../contexts/AuthContext';
import { formatDate, formatDateTime } from '../../utils/formatters';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || '';

/**
 * Campaign Status Badge
 */
function StatusBadge({ campaign }) {
  const now = new Date();
  const startsAt = new Date(campaign.starts_at);
  const endsAt = campaign.ends_at ? new Date(campaign.ends_at) : null;

  let status, color, icon;

  if (!campaign.is_active) {
    // Inactive campaigns - check if they ended or were manually deactivated
    if (endsAt && now > endsAt) {
      status = 'Ended';
      color = 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400';
      icon = <XCircle className="w-3.5 h-3.5" />;
    } else {
      status = 'Inactive';
      color = 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400';
      icon = <XCircle className="w-3.5 h-3.5" />;
    }
  } else if (now < startsAt) {
    status = 'Scheduled';
    color = 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400';
    icon = <Clock className="w-3.5 h-3.5" />;
  } else {
    // Active campaigns always show as Active (date checks are secondary)
    status = 'Active';
    color = 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    icon = <CheckCircle className="w-3.5 h-3.5" />;
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${color}`}>
      {icon}
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
          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
            <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
              Delete Campaign
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Are you sure you want to delete "{campaign.name}"? This action cannot be undone.
            </p>
          </div>
        </div>

        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-6">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <strong>Warning:</strong> Deleting this campaign will permanently remove all campaign data and statistics.
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
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium"
          >
            Delete Campaign
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Campaign Actions Menu
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
        aria-label="Campaign actions"
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
 * Create/Edit Campaign Modal
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
  });
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState('');

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
      });
    }
    // Clear error when modal opens/closes
    setNameError('');
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          {campaign ? 'Edit Campaign' : 'Create Campaign'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Campaign Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={handleNameChange}
              className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white ${
                nameError
                  ? 'border-red-500 dark:border-red-500'
                  : 'border-slate-300 dark:border-slate-600'
              }`}
              placeholder="e.g., January Pro Trial"
              required
            />
            {nameError && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{nameError}</p>
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
                Trial Tier
              </label>
              <select
                value={formData.trialTier}
                onChange={(e) => setFormData({ ...formData, trialTier: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              >
                <option value="pro">Pro</option>
                <option value="team">Team</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Trial Days
              </label>
              <input
                type="number"
                min="1"
                max="90"
                value={formData.trialDays}
                onChange={(e) => setFormData({ ...formData, trialDays: parseInt(e.target.value) || 14 })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={formData.startsAt}
                onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                End Date (optional)
              </label>
              <input
                type="date"
                value={formData.endsAt}
                onChange={(e) => setFormData({ ...formData, endsAt: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
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
              Activate campaign immediately
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
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
              {saving ? 'Saving...' : campaign ? 'Save Changes' : 'Create Campaign'}
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
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingCampaign, setDeletingCampaign] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sorting, setSorting] = useState([{ id: 'starts_at', desc: true }]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [dismissedBanners, setDismissedBanners] = useState(() => {
    // Load dismissed banners from localStorage on mount
    try {
      const saved = localStorage.getItem('dismissedCampaignBanners');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/api/admin/campaigns`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
      });

      if (!response.ok) throw new Error('Failed to fetch campaigns');

      const data = await response.json();
      const allCampaigns = data.data || [];
      setCampaigns(allCampaigns);

      // Update pagination
      setPagination(prev => ({
        ...prev,
        total: allCampaigns.length,
        totalPages: Math.ceil(allCampaigns.length / prev.limit),
      }));
    } catch (err) {
      setError(err.message);
      toast.error('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const handleCreate = useCallback(() => {
    setEditingCampaign(null);
    setShowModal(true);
  }, []);

  const handleEdit = useCallback((campaign) => {
    setEditingCampaign(campaign);
    setShowModal(true);
  }, []);

  const handleToggle = useCallback(async (campaign) => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/api/admin/campaigns/${campaign.id}/toggle`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !campaign.is_active }),
      });

      if (!response.ok) throw new Error('Failed to toggle campaign');

      // Immediately update local state for instant UI update
      setCampaigns(prevCampaigns =>
        prevCampaigns.map(c =>
          c.id === campaign.id ? { ...c, is_active: !c.is_active } : c
        )
      );

      toast.success(campaign.is_active ? 'Campaign deactivated' : 'Campaign activated');

      // Then refresh from server to ensure consistency
      await fetchCampaigns();
    } catch (err) {
      toast.error(err.message);
    }
  }, [getToken, fetchCampaigns]);

  const handleDeleteClick = useCallback((campaign) => {
    setDeletingCampaign(campaign);
    setShowDeleteModal(true);
  }, []);

  const handleSave = async (formData) => {
    try {
      const token = await getToken();
      const url = editingCampaign
        ? `${API_URL}/api/admin/campaigns/${editingCampaign.id}`
        : `${API_URL}/api/admin/campaigns`;
      const method = editingCampaign ? 'PUT' : 'POST';

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

      toast.success(editingCampaign ? 'Campaign updated' : 'Campaign created');
      fetchCampaigns();
    } catch (error) {
      // Error already shown via toast, re-throw for modal handler
      throw error;
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingCampaign) return;

    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/api/admin/campaigns/${deletingCampaign.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete campaign');
      }

      // Immediately remove from local state for instant UI update
      setCampaigns(prevCampaigns => prevCampaigns.filter(c => c.id !== deletingCampaign.id));
      toast.success('Campaign deleted');

      // Then refresh from server to ensure consistency
      await fetchCampaigns();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeletingCampaign(null);
    }
  };

  const handleDismissBanner = (campaignId) => {
    const updated = { ...dismissedBanners, [campaignId]: true };
    setDismissedBanners(updated);
    localStorage.setItem('dismissedCampaignBanners', JSON.stringify(updated));
  };

  // Define table columns (memoized to prevent recreation on each render)
  const columns = useMemo(() => [
    {
      accessorKey: 'name',
      header: 'Campaign',
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
          <div>{formatDate(row.original.starts_at)}</div>
          {row.original.ends_at && (
            <div>
              to {formatDate(row.original.ends_at)}{' '}
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
                Trial Campaigns
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Manage auto-trial campaigns for new signups
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={async () => {
                  setIsRefreshing(true);
                  await fetchCampaigns();
                  setTimeout(() => setIsRefreshing(false), 500);
                }}
                disabled={loading || isRefreshing}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                title="Refresh"
                aria-label="Refresh campaigns"
              >
                <RefreshCw
                  className={`w-4 h-4 text-slate-600 dark:text-slate-400 ${isRefreshing ? 'animate-spin-once' : ''}`}
                />
              </button>
              <button
                onClick={handleCreate}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium"
              >
                <Plus className="w-4 h-4" />
                New Campaign
              </button>
            </div>
          </div>
        </div>

        {/* Active Campaign Banner */}
        {(() => {
          const activeCampaign = campaigns.find(c => c.is_active);
          if (!activeCampaign || dismissedBanners[activeCampaign.id]) return null;

          return (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-green-800 dark:text-green-200">
                    Campaign Active
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

        {/* Campaigns Table */}
        {error ? (
          <div className="text-center py-12 text-red-600 dark:text-red-400">{error}</div>
        ) : (
          <BaseTable
            data={campaigns}
            columns={columns}
            sorting={sorting}
            onSortingChange={setSorting}
            pagination={pagination}
            onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
            manualSorting={false}
            manualPagination={false}
            isLoading={loading}
            isRefreshing={isRefreshing}
            emptyState={{
              icon: Calendar,
              title: 'No campaigns yet',
              description: 'Create one to auto-grant trials to new users.',
              action: (
                <button
                  onClick={handleCreate}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
                >
                  <Plus className="w-4 h-4" />
                  Create First Campaign
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
        campaign={editingCampaign}
        onSave={handleSave}
        existingCampaigns={campaigns}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeletingCampaign(null);
        }}
        campaign={deletingCampaign}
        onConfirm={handleDeleteConfirm}
      />
    </PageLayout>
  );
}
