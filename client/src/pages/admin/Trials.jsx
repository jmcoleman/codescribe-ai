/**
 * Admin Trials Management Page
 *
 * Allows admins to view and manage user trials.
 * Features:
 * - View all trials with status and user info
 * - Filter by status (active, expired, converted, cancelled)
 * - Extend trials (add days)
 * - Cancel trials
 * - View trial analytics
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  RefreshCw,
  Users,
  Clock,
  AlertCircle,
  Filter,
  Sparkles,
  TrendingUp,
  XCircle,
  CheckCircle,
  PlusCircle,
  Search,
  X
} from 'lucide-react';
import { PageLayout } from '../../components/PageLayout';
import { Select } from '../../components/Select';
import { ConfirmationModal } from '../../components/ConfirmationModal';
import { BaseTable } from '../../components/BaseTable';
import { useAuth } from '../../contexts/AuthContext';
import { formatDate, formatDateTime } from '../../utils/formatters';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || '';

/**
 * Extend Trial Modal
 */
function ExtendTrialModal({ isOpen, onClose, trial, onExtend }) {
  const [additionalDays, setAdditionalDays] = useState(7);
  const [reason, setReason] = useState('');
  const [sendEmail, setSendEmail] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim() || reason.trim().length < 5) {
      toast.error('Please provide a reason (minimum 5 characters)');
      return;
    }

    setLoading(true);
    try {
      await onExtend(trial.user_id, additionalDays, reason.trim(), sendEmail);
      onClose();
      setAdditionalDays(7);
      setReason('');
    } catch (error) {
      // Error handled by parent
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !trial) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-slate-900/50 dark:bg-slate-900/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Extend Trial
          </h2>

          <div className="mb-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">User</p>
                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{trial.user_email}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Current End Date</p>
                <p className="text-sm font-medium text-slate-900 dark:text-white">{formatDate(trial.ends_at)}</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Additional Days
              </label>
              <input
                type="number"
                min="1"
                max="90"
                value={additionalDays}
                onChange={(e) => setAdditionalDays(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why is this trial being extended?"
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={sendEmail}
                onChange={(e) => setSendEmail(e.target.checked)}
                className="w-4 h-4 text-purple-600 border-slate-300 dark:border-slate-600 rounded"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">
                Send notification email to user
              </span>
            </label>

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
                    Extending...
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4" />
                    Extend Trial
                  </>
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
 */
function StatusBadge({ status }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-400/15 dark:text-green-400';
      case 'expired':
        return 'bg-slate-100 text-slate-800 dark:bg-slate-700/50 dark:text-slate-400';
      case 'converted':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-400/15 dark:text-purple-400';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-400/15 dark:text-red-400';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-700/50 dark:text-slate-400';
    }
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(status)}`}>
      {status}
    </span>
  );
}

/**
 * Days remaining badge
 */
function DaysRemainingBadge({ endsAt, status }) {
  if (status !== 'active') return null;

  const now = new Date();
  const end = new Date(endsAt);
  const diffMs = end - now;
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (daysRemaining < 0) return null;

  const getUrgencyColor = () => {
    if (daysRemaining <= 1) return 'text-red-600 dark:text-red-400';
    if (daysRemaining <= 3) return 'text-amber-600 dark:text-amber-400';
    return 'text-slate-600 dark:text-slate-400';
  };

  return (
    <span className={`text-xs font-medium ${getUrgencyColor()}`}>
      {daysRemaining === 0 ? 'Expires today' : daysRemaining === 1 ? '1 day left' : `${daysRemaining} days left`}
    </span>
  );
}

export default function TrialsAdmin() {
  const navigate = useNavigate();
  const { getToken } = useAuth();

  // Data state
  const [trials, setTrials] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters and sorting
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sorting, setSorting] = useState([{ id: 'started_at', desc: true }]);

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  // Modal state
  const [extendModal, setExtendModal] = useState({ isOpen: false, trial: null });
  const [cancelModal, setCancelModal] = useState({ isOpen: false, trial: null });

  // Fetch trials
  const fetchTrials = useCallback(async (page = pagination.page, showRefreshing = false) => {
    try {
      if (showRefreshing) setIsRefreshing(true);
      else setLoading(true);

      const token = getToken();
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString()
      });

      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      // Add sorting
      if (sorting.length > 0) {
        params.append('sortBy', sorting[0].id);
        params.append('sortOrder', sorting[0].desc ? 'desc' : 'asc');
      }

      const response = await fetch(`${API_URL}/api/admin/trials?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch trials');
      }

      const data = await response.json();
      setTrials(data.data || []);
      setPagination(prev => ({
        ...prev,
        page: data.pagination?.page || page,
        total: data.pagination?.total || 0,
        totalPages: data.pagination?.totalPages || 0
      }));
      setError(null);
    } catch (err) {
      console.error('Error fetching trials:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [getToken, pagination.limit, statusFilter, sorting]);

  // Fetch analytics
  const fetchAnalytics = useCallback(async () => {
    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/api/admin/trials/analytics`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const data = await response.json();
      setAnalytics(data.data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    }
  }, [getToken]);

  // Initial load
  useEffect(() => {
    fetchTrials(1);
    fetchAnalytics();
  }, []);

  // Refetch on filter/sort change
  useEffect(() => {
    if (!loading) {
      fetchTrials(1, true);
    }
  }, [statusFilter, sorting]);

  // Handle page change
  const handlePageChange = (newPage) => {
    fetchTrials(newPage, true);
  };

  // Handle sorting change
  const handleSortingChange = (updater) => {
    const newSorting = typeof updater === 'function' ? updater(sorting) : updater;
    setSorting(newSorting);
  };

  // Extend trial
  const handleExtendTrial = async (userId, additionalDays, reason, sendEmail) => {
    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/api/admin/trials/${userId}/extend`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ additionalDays, reason, sendEmail })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to extend trial');
      }

      toast.success(`Trial extended by ${additionalDays} days`);
      fetchTrials(pagination.page, true);
      fetchAnalytics();
    } catch (err) {
      toast.error(err.message);
      throw err;
    }
  };

  // Cancel trial
  const handleCancelTrial = async () => {
    if (!cancelModal.trial) return;

    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/api/admin/trials/${cancelModal.trial.user_id}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to cancel trial');
      }

      toast.success('Trial cancelled');
      setCancelModal({ isOpen: false, trial: null });
      fetchTrials(pagination.page, true);
      fetchAnalytics();
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Filter trials by search query (client-side)
  const filteredTrials = useMemo(() => {
    if (!searchQuery) return trials;
    const query = searchQuery.toLowerCase();
    return trials.filter(trial => {
      const fullName = [trial.first_name, trial.last_name].filter(Boolean).join(' ').toLowerCase();
      return (
        trial.user_email?.toLowerCase().includes(query) ||
        fullName.includes(query) ||
        trial.invite_code?.toLowerCase().includes(query)
      );
    });
  }, [trials, searchQuery]);

  // Define table columns
  const columns = useMemo(() => [
    {
      accessorKey: 'user_email',
      header: 'User',
      enableSorting: true,
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-slate-900 dark:text-white text-sm">
            {row.original.user_email}
          </p>
          {(row.original.first_name || row.original.last_name) && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {[row.original.first_name, row.original.last_name].filter(Boolean).join(' ')}
            </p>
          )}
        </div>
      )
    },
    {
      accessorKey: 'trial_tier',
      header: 'Tier',
      enableSorting: true,
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-1 text-sm font-medium text-slate-900 dark:text-white capitalize">
          <Sparkles className="w-3.5 h-3.5 text-purple-500" />
          {row.original.trial_tier}
        </span>
      )
    },
    {
      accessorKey: 'status',
      header: 'Status',
      enableSorting: true,
      cell: ({ row }) => (
        <div className="flex flex-col gap-1">
          <StatusBadge status={row.original.status} />
          <DaysRemainingBadge endsAt={row.original.ends_at} status={row.original.status} />
        </div>
      )
    },
    {
      accessorKey: 'started_at',
      header: 'Started',
      enableSorting: true,
      cell: ({ row }) => (
        <span className="text-sm text-slate-600 dark:text-slate-400">
          {formatDate(row.original.started_at)}
        </span>
      )
    },
    {
      accessorKey: 'ends_at',
      header: 'Ends',
      enableSorting: true,
      cell: ({ row }) => (
        <div className="text-sm text-slate-600 dark:text-slate-400">
          {formatDate(row.original.ends_at)}
          {row.original.extended_by_days > 0 && (
            <span className="ml-1 text-xs text-purple-600 dark:text-purple-400">
              (+{row.original.extended_by_days}d)
            </span>
          )}
        </div>
      )
    },
    {
      accessorKey: 'source',
      header: 'Source',
      enableSorting: false,
      cell: ({ row }) => (
        <div>
          <span className="text-xs text-slate-500 dark:text-slate-400 capitalize">
            {row.original.source}
          </span>
          {row.original.invite_code && (
            <p className="text-xs text-slate-400 dark:text-slate-500 font-mono">
              {row.original.invite_code}
            </p>
          )}
        </div>
      )
    },
    {
      id: 'actions',
      header: 'Actions',
      enableSorting: false,
      cell: ({ row }) => {
        const trial = row.original;
        return (
          <div className="text-right">
            {trial.status === 'active' && (
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setExtendModal({ isOpen: true, trial })}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Extend
                </button>
                <button
                  onClick={() => setCancelModal({ isOpen: true, trial })}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Cancel
                </button>
              </div>
            )}
            {trial.status === 'converted' && (
              <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                <CheckCircle className="w-3.5 h-3.5" />
                Converted
              </span>
            )}
          </div>
        );
      }
    }
  ], []);

  // Render expanded row content
  const renderExpandedRow = (row) => {
    const trial = row.original;
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide mb-1">Duration</p>
          <p className="text-slate-700 dark:text-slate-300">{trial.duration_days} days</p>
        </div>
        {trial.extended_by_days > 0 && (
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide mb-1">Extended By</p>
            <p className="text-slate-700 dark:text-slate-300">+{trial.extended_by_days} days</p>
          </div>
        )}
        {trial.invite_code && (
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide mb-1">Invite Code</p>
            <p className="text-slate-700 dark:text-slate-300 font-mono">{trial.invite_code}</p>
          </div>
        )}
        <div>
          <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide mb-1">Created</p>
          <p className="text-slate-700 dark:text-slate-300">{formatDateTime(trial.created_at)}</p>
        </div>
      </div>
    );
  };

  // Status filter options
  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'active', label: 'Active' },
    { value: 'expired', label: 'Expired' },
    { value: 'converted', label: 'Converted' },
    { value: 'cancelled', label: 'Cancelled' }
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
              Trial Management
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              View and manage user trials
            </p>
          </div>

          <button
            onClick={() => fetchTrials(pagination.page, true)}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Analytics Cards */}
        {analytics && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
                  <Sparkles className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {analytics.trials?.active_count || 0}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Active Trials</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {analytics.trials?.conversion_rate ? `${Math.round(analytics.trials.conversion_rate)}%` : '0%'}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Conversion Rate</p>
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
                    {analytics.trials?.expired_count || 0}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Expired Trials</p>
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
                    {analytics.trials?.total_count || 0}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Total Trials</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by email, name, or invite code..."
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

            {/* Status Filter */}
            <div className="w-full sm:w-48">
              <Select
                value={statusFilter}
                onChange={setStatusFilter}
                options={statusOptions}
                icon={<Filter className="w-4 h-4" />}
              />
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 dark:bg-red-400/15 border border-red-200 dark:border-red-400/30 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <p className="text-red-700 dark:text-red-200">{error}</p>
            </div>
          </div>
        )}

        {/* Trials Table */}
        <BaseTable
          data={filteredTrials}
          columns={columns}
          sorting={sorting}
          onSortingChange={handleSortingChange}
          pagination={pagination}
          onPageChange={handlePageChange}
          isLoading={loading}
          isRefreshing={isRefreshing}
          renderExpandedRow={renderExpandedRow}
          emptyState={{
            icon: Users,
            title: searchQuery || statusFilter !== 'all' ? 'No matching trials' : 'No trials found',
            description: searchQuery || statusFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'No trials have been created yet'
          }}
        />

        {/* Extend Trial Modal */}
        <ExtendTrialModal
          isOpen={extendModal.isOpen}
          onClose={() => setExtendModal({ isOpen: false, trial: null })}
          trial={extendModal.trial}
          onExtend={handleExtendTrial}
        />

        {/* Cancel Trial Confirmation Modal */}
        <ConfirmationModal
          isOpen={cancelModal.isOpen}
          onClose={() => setCancelModal({ isOpen: false, trial: null })}
          onConfirm={handleCancelTrial}
          title="Cancel Trial"
          message={`Are you sure you want to cancel the trial for ${cancelModal.trial?.user_email}? This action cannot be undone.`}
          confirmText="Cancel Trial"
          confirmVariant="danger"
        />
      </div>
    </PageLayout>
  );
}
