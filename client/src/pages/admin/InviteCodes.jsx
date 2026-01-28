/**
 * Admin Invite Codes Management Page
 *
 * Allows admins to create, manage, and track invite codes for trials.
 * Features:
 * - Create new invite codes with configurable duration/uses
 * - View all codes with status and usage stats
 * - Copy invite links
 * - Pause/resume codes
 * - View code redemption details
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  CheckCircle,
  RefreshCw,
  Gift,
  Users,
  Clock,
  AlertCircle,
  MoreVertical,
  Filter
} from 'lucide-react';
import { PageLayout } from '../../components/PageLayout';
import { Select } from '../../components/Select';
import { FilterBar } from '../../components/FilterBar';
import { ConfirmationModal } from '../../components/ConfirmationModal';
import { CopyButton } from '../../components/CopyButton';
import { BaseTable } from '../../components/BaseTable';
import { useAuth } from '../../contexts/AuthContext';
import { formatDate, formatDateTime } from '../../utils/formatters';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || '';

/**
 * ActionMenu component with fixed positioning to escape table overflow
 */
function ActionMenu({ invite, isOpen, onToggle, onClose, onCopyLink, onToggleStatus, onDelete }) {
  const buttonRef = useRef(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 4,
        right: window.innerWidth - rect.right
      });
    }
  }, [isOpen]);

  return (
    <div className="relative inline-block">
      <button
        ref={buttonRef}
        onClick={onToggle}
        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
        aria-label="Actions"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <MoreVertical className="w-5 h-5 text-slate-500 dark:text-slate-400" />
      </button>

      {/* Dropdown Menu - Fixed position to escape table overflow */}
      {isOpen && (
        <>
          {/* Backdrop to close menu */}
          <div
            className="fixed inset-0 z-40"
            onClick={onClose}
          />
          <div
            className="fixed w-40 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-50"
            style={{
              top: menuPosition.top,
              right: menuPosition.right
            }}
          >
            <button
              onClick={() => {
                onCopyLink(invite.code);
                onClose();
              }}
              className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              Copy Invite Link
            </button>
            {(invite.status === 'active' || invite.status === 'paused') && (
              <button
                onClick={() => {
                  onToggleStatus(invite.code, invite.status);
                  onClose();
                }}
                className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                {invite.status === 'active' ? 'Disable Code' : 'Enable Code'}
              </button>
            )}
            {/* Delete option - only for unused codes */}
            {invite.current_uses === 0 && (
              <button
                onClick={() => {
                  onDelete(invite.code);
                  onClose();
                }}
                className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                Delete Code
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function InviteCodes() {
  const navigate = useNavigate();
  const { getToken } = useAuth();

  // State
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true); // Initial page load
  const [isRefreshing, setIsRefreshing] = useState(false); // For filter/sort/pagination changes
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createdCode, setCreatedCode] = useState(null); // Newly created code to display
  const [openMenuId, setOpenMenuId] = useState(null); // For action dropdown menu
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, code: null }); // Delete confirmation modal

  // Pagination, sorting, and filtering state
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 0 });
  const [sorting, setSorting] = useState([{ id: 'created_at', desc: true }]);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterTier, setFilterTier] = useState('');

  // Derive sortBy and sortOrder from TanStack sorting state
  const sortBy = sorting.length > 0 ? sorting[0].id : 'created_at';
  const sortOrder = sorting.length > 0 ? (sorting[0].desc ? 'desc' : 'asc') : 'desc';

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-400/15 dark:text-green-400';
      case 'paused':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-400';
      case 'exhausted':
        return 'bg-slate-100 text-slate-800 dark:bg-slate-700/50 dark:text-slate-400';
      case 'expired':
        return 'bg-red-100 text-red-800 dark:bg-red-400/15 dark:text-red-400';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-700/50 dark:text-slate-400';
    }
  };

  // Define columns for AdminTable
  const columns = useMemo(() => [
    {
      accessorKey: 'code',
      header: 'Code',
      enableSorting: false,
      cell: ({ row }) => (
        <div>
          <div className="flex items-center gap-2">
            <code className="text-sm font-mono text-slate-900 dark:text-white">
              {row.original.code}
            </code>
            <CopyButton
              text={`${window.location.origin}/trial?code=${row.original.code}`}
              size="sm"
              variant="ghost"
              ariaLabel="Copy invite link"
            />
          </div>
          {row.original.campaign && (
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {row.original.campaign}
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      enableSorting: true,
      cell: ({ row }) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(row.original.status)}`}>
          {row.original.status}
        </span>
      ),
    },
    {
      accessorKey: 'trial_tier',
      header: 'Tier',
      enableSorting: true,
      cell: ({ row }) => (
        <span className="capitalize text-sm text-slate-700 dark:text-slate-300">
          {row.original.trial_tier}
        </span>
      ),
    },
    {
      accessorKey: 'current_uses',
      header: 'Uses',
      enableSorting: true,
      cell: ({ row }) => (
        <span className="text-sm text-slate-700 dark:text-slate-300">
          {row.original.current_uses} / {row.original.max_uses}
        </span>
      ),
    },
    {
      accessorKey: 'duration_days',
      header: 'Duration',
      enableSorting: true,
      cell: ({ row }) => (
        <span className="text-sm text-slate-700 dark:text-slate-300">
          {row.original.duration_days} days
        </span>
      ),
    },
    {
      accessorKey: 'created_at',
      header: 'Created',
      enableSorting: true,
      cell: ({ row }) => (
        <span className="text-sm text-slate-500 dark:text-slate-400">
          {formatDateTime(row.original.created_at)}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      enableSorting: false,
      cell: ({ row }) => (
        <div className="text-right">
          <ActionMenu
            invite={row.original}
            isOpen={openMenuId === row.original.id}
            onToggle={() => setOpenMenuId(openMenuId === row.original.id ? null : row.original.id)}
            onClose={() => setOpenMenuId(null)}
            onCopyLink={handleCopyLink}
            onToggleStatus={handleToggleStatus}
            onDelete={handleDeleteClick}
          />
        </div>
      ),
    },
  ], [openMenuId]);

  // Create form state
  const [formData, setFormData] = useState({
    trialTier: 'pro',
    durationDays: 14,
    maxUses: 1,
    validUntil: '',
    campaign: '',
    notes: ''
  });

  // Fetch invite codes with sorting, filtering, and pagination
  const fetchCodes = useCallback(async (page = pagination.page, isInitialLoad = false) => {
    // Use loading for initial load, isRefreshing for subsequent fetches
    if (isInitialLoad) {
      setLoading(true);
    } else {
      setIsRefreshing(true);
    }
    setError(null);

    try {
      const token = getToken();
      if (!token) {
        toast.error('Not authenticated');
        navigate('/');
        return;
      }

      // Build query params
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        sortBy,
        sortOrder
      });
      if (filterStatus) params.append('status', filterStatus);
      if (filterTier) params.append('tier', filterTier);

      const response = await fetch(`${API_URL}/api/admin/invite-codes?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 403) {
          toast.error('Admin access required');
          navigate('/');
          return;
        }
        throw new Error('Failed to fetch invite codes');
      }

      const data = await response.json();
      if (data.success) {
        setCodes(data.data.codes || []);
        setPagination(prev => ({
          ...prev,
          page: data.data.pagination.page,
          total: data.data.pagination.total,
          totalPages: data.data.pagination.totalPages
        }));
      } else {
        throw new Error(data.error || 'Failed to load codes');
      }
    } catch (err) {
      console.error('Error fetching codes:', err);
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [getToken, navigate, pagination.limit, sortBy, sortOrder, filterStatus, filterTier]);

  // Track if this is the initial mount
  const isInitialMount = useRef(true);

  // Fetch on mount and when sort/filter changes
  useEffect(() => {
    if (isInitialMount.current) {
      // Initial load - show full loading state
      fetchCodes(1, true);
      isInitialMount.current = false;
    } else {
      // Subsequent changes - show subtle refresh indicator
      fetchCodes(1, false);
    }
  }, [sortBy, sortOrder, filterStatus, filterTier]);

  // Handle sorting change from AdminTable
  const handleSortingChange = (updaterOrValue) => {
    const newSorting = typeof updaterOrValue === 'function'
      ? updaterOrValue(sorting)
      : updaterOrValue;
    setSorting(newSorting);
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchCodes(newPage);
    }
  };

  // ESC key to navigate back
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !showCreateForm) {
        navigate(-1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, showCreateForm]);

  // Create new invite code
  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);

    try {
      const token = getToken();
      if (!token) {
        throw new Error('Not authenticated. Please log in again.');
      }

      const response = await fetch(`${API_URL}/api/admin/invite-codes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          trialTier: formData.trialTier,
          durationDays: parseInt(formData.durationDays),
          maxUses: parseInt(formData.maxUses),
          validUntil: formData.validUntil || null,
          campaign: formData.campaign || null,
          notes: formData.notes || null
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create invite code');
      }

      const data = await response.json();

      // Store the created code to display in success modal
      const inviteLink = `${window.location.origin}/trial?code=${data.data.code}`;
      setCreatedCode({
        code: data.data.code,
        inviteLink,
        tier: data.data.tier,
        durationDays: data.data.durationDays,
        maxUses: data.data.maxUses
      });

      // Reset form
      setFormData({
        trialTier: 'pro',
        durationDays: 14,
        maxUses: 1,
        validUntil: '',
        campaign: '',
        notes: ''
      });

      // Close create form, show success
      setShowCreateForm(false);
      fetchCodes();
    } catch (err) {
      console.error('Error creating code:', err);
      toast.error(err.message);
    } finally {
      setCreating(false);
    }
  };

  // Toggle code status (pause/resume)
  const handleToggleStatus = async (code, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';

    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/api/admin/invite-codes/${code}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update code status');
      }

      toast.success(`Code ${newStatus === 'paused' ? 'paused' : 'activated'}`);
      fetchCodes();
    } catch (err) {
      console.error('Error updating code:', err);
      toast.error(err.message);
    }
  };

  // Copy invite link
  const handleCopyLink = async (code) => {
    const inviteLink = `${window.location.origin}/trial?code=${code}`;
    try {
      await navigator.clipboard.writeText(inviteLink);
      toast.success('Invite link copied!');
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  // Render expanded row content
  const renderExpandedRow = (row) => {
    const invite = row.original;
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide mb-1">Invite Link</p>
          <div className="flex items-center gap-2">
            <code className="text-xs text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-600 px-2 py-1 rounded truncate max-w-[200px]">
              {`${window.location.origin}/trial?code=${invite.code}`}
            </code>
            <CopyButton
              text={`${window.location.origin}/trial?code=${invite.code}`}
              size="sm"
              variant="ghost"
              ariaLabel="Copy invite link"
            />
          </div>
        </div>
        <div>
          <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide mb-1">Valid From</p>
          <p className="text-slate-700 dark:text-slate-300">{formatDate(invite.valid_from)}</p>
        </div>
        <div>
          <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide mb-1">Valid Until</p>
          <p className="text-slate-700 dark:text-slate-300">{invite.valid_until ? formatDate(invite.valid_until) : 'No expiry'}</p>
        </div>
        <div>
          <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide mb-1">Created By</p>
          <p className="text-slate-700 dark:text-slate-300">{invite.created_by_name || invite.created_by_email || 'Unknown'}</p>
        </div>
        {invite.campaign && (
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide mb-1">Trial Program</p>
            <p className="text-slate-700 dark:text-slate-300">{invite.campaign}</p>
          </div>
        )}
        {invite.notes && (
          <div className="col-span-2">
            <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide mb-1">Notes</p>
            <p className="text-slate-700 dark:text-slate-300">{invite.notes}</p>
          </div>
        )}
      </div>
    );
  };

  // Delete unused invite code - opens confirmation modal
  const handleDeleteClick = (code) => {
    setDeleteConfirm({ isOpen: true, code });
  };

  // Confirm delete action
  const handleDeleteConfirm = async () => {
    const code = deleteConfirm.code;
    if (!code) return;

    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/api/admin/invite-codes/${code}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete invite code');
      }

      toast.success('Invite code deleted');
      fetchCodes();
    } catch (err) {
      console.error('Error deleting code:', err);
      toast.error(err.message);
    }
  };

  return (
    <PageLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/admin')}
            className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors group mb-3"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" aria-hidden="true" />
            <span className="font-medium">Back to Admin</span>
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                Invite Codes
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                Manage trial access invite codes
              </p>
            </div>

            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 dark:bg-purple-700 dark:hover:bg-purple-800 dark:active:bg-purple-900 text-white rounded-lg font-medium transition-colors shadow-lg shadow-purple-600/20 dark:shadow-purple-900/30"
            >
              <Plus className="w-4 h-4" />
              New Invite Code
            </button>
          </div>
        </div>

        {/* Create Form Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full p-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                Create Invite Code
              </h2>
              <form onSubmit={handleCreate} className="space-y-4">
                <Select
                  label="Trial Tier"
                  value={formData.trialTier}
                  onChange={(value) => setFormData({ ...formData, trialTier: value })}
                  options={[
                    { value: 'pro', label: 'Pro' },
                    { value: 'team', label: 'Team' },
                    { value: 'enterprise', label: 'Enterprise' }
                  ]}
                />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Duration (days)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="90"
                      value={formData.durationDays}
                      onChange={(e) => setFormData({ ...formData, durationDays: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Max Uses
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      value={formData.maxUses}
                      onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Valid Until (optional)
                  </label>
                  <input
                    type="date"
                    value={formData.validUntil}
                    onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Trial Program (optional)
                  </label>
                  <input
                    type="text"
                    value={formData.campaign}
                    onChange={(e) => setFormData({ ...formData, campaign: e.target.value })}
                    placeholder="e.g., beta-launch, twitter-promo"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Notes (optional)
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Internal notes about this code..."
                    rows={2}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 dark:bg-purple-700 dark:hover:bg-purple-800 dark:active:bg-purple-900 disabled:bg-slate-400 dark:disabled:bg-slate-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20 dark:shadow-purple-900/30 disabled:shadow-none"
                  >
                    {creating ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Create
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Success Modal - Shows newly created code */}
        {createdCode && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Invite Code Created!
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Share this link with your beta tester
                </p>
              </div>

              {/* Code Display */}
              <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-4 mb-4">
                <div className="text-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
                    Invite Code
                  </p>
                  <p className="text-2xl font-mono font-bold text-slate-900 dark:text-white tracking-wider">
                    {createdCode.code}
                  </p>
                </div>
              </div>

              {/* Invite Link */}
              <div className="mb-4">
                <label className="block text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
                  Invite Link
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={createdCode.inviteLink}
                    className="flex-1 px-3 py-2 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 font-mono"
                  />
                  <CopyButton
                    text={createdCode.inviteLink}
                    showLabel
                    variant="primary"
                    ariaLabel="Copy invite link"
                  />
                </div>
              </div>

              {/* Details */}
              <div className="grid grid-cols-3 gap-3 mb-6 text-center">
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Tier</p>
                  <p className="font-medium text-slate-900 dark:text-white capitalize">{createdCode.tier}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Duration</p>
                  <p className="font-medium text-slate-900 dark:text-white">{createdCode.durationDays} days</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Max Uses</p>
                  <p className="font-medium text-slate-900 dark:text-white">{createdCode.maxUses}</p>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setCreatedCode(null)}
                className="w-full px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-medium transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <RefreshCw className="w-8 h-8 text-purple-600 dark:text-purple-400 animate-spin" />
          </div>
        )}

        {/* Summary Stats - at top for quick overview */}
        {!loading && !error && (
          <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
                  <Gift className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {codes.length}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Total Codes</p>
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
                    {codes.filter(c => c.status === 'active').length}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Active</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
                  <Users className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {codes.reduce((sum, c) => sum + (c.current_uses || 0), 0)}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Total Redeemed</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
                  <Clock className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {codes
                      .filter(c => c.status === 'active')
                      .reduce((sum, c) => sum + (c.max_uses - c.current_uses), 0)}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Available Slots</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        {!loading && !error && (
          <FilterBar
            hasActiveFilters={filterStatus || filterTier}
            onClearFilters={() => {
              setFilterStatus('');
              setFilterTier('');
            }}
          >
            <Select
              value={filterStatus}
              onChange={setFilterStatus}
              placeholder="All Statuses"
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'active', label: 'Active' },
                { value: 'paused', label: 'Paused' },
                { value: 'exhausted', label: 'Exhausted' },
                { value: 'expired', label: 'Expired' }
              ]}
              ariaLabel="Filter by status"
            />
            <Select
              value={filterTier}
              onChange={setFilterTier}
              placeholder="All Tiers"
              options={[
                { value: '', label: 'All Tiers' },
                { value: 'pro', label: 'Pro' },
                { value: 'team', label: 'Team' },
                { value: 'enterprise', label: 'Enterprise' }
              ]}
              ariaLabel="Filter by tier"
            />
          </FilterBar>
        )}

        {/* Codes Table */}
        {!loading && !error && (
          <>
            {/* Custom empty states for when no codes exist at all */}
            {codes.length === 0 && !filterStatus && !filterTier && pagination.total === 0 ? (
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="p-8 text-center">
                  <Gift className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                    No invite codes yet
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-4">
                    Create your first invite code to start inviting users.
                  </p>
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 dark:bg-purple-700 dark:hover:bg-purple-800 dark:active:bg-purple-900 text-white rounded-lg font-medium transition-colors shadow-lg shadow-purple-600/20 dark:shadow-purple-900/30"
                  >
                    <Plus className="w-4 h-4" />
                    Create First Invite Code
                  </button>
                </div>
              </div>
            ) : (
              <BaseTable
                title="Invite Codes"
                description={`${pagination.total} total codes`}
                onRefresh={() => fetchCodes(pagination.page, false)}
                data={codes}
                columns={columns}
                sorting={sorting}
                onSortingChange={handleSortingChange}
                pagination={pagination}
                onPageChange={handlePageChange}
                manualSorting={true}
                manualPagination={true}
                isLoading={loading}
                isRefreshing={isRefreshing}
                renderExpandedRow={renderExpandedRow}
                emptyState={{
                  icon: Filter,
                  title: 'No matching codes',
                  description: 'No invite codes match your current filters.',
                  action: (
                    <button
                      onClick={() => {
                        setFilterStatus('');
                        setFilterTier('');
                      }}
                      className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-medium"
                    >
                      Clear filters
                    </button>
                  ),
                }}
              />
            )}
          </>
        )}

      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, code: null })}
        onConfirm={handleDeleteConfirm}
        title="Delete Invite Code"
        message={
          <>
            <p>Are you sure you want to delete this invite code?</p>
            {deleteConfirm.code && (
              <p className="mt-2 font-mono text-sm bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded">
                {deleteConfirm.code}
              </p>
            )}
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              This action cannot be undone.
            </p>
          </>
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
      />
    </PageLayout>
  );
}
