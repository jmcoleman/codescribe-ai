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

import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Play,
  Pause,
  Users,
  Calendar,
  Clock,
  TrendingUp,
  RefreshCw,
  Trash2,
  Edit2,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { PageLayout } from '../../components/PageLayout';
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
    status = 'Inactive';
    color = 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400';
    icon = <XCircle className="w-3.5 h-3.5" />;
  } else if (now < startsAt) {
    status = 'Scheduled';
    color = 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    icon = <Clock className="w-3.5 h-3.5" />;
  } else if (endsAt && now > endsAt) {
    status = 'Ended';
    color = 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
    icon = <XCircle className="w-3.5 h-3.5" />;
  } else {
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
 * Create/Edit Campaign Modal
 */
function CampaignModal({ isOpen, onClose, campaign, onSave }) {
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
  }, [campaign, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
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
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              placeholder="e.g., January Pro Trial"
              required
            />
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
              disabled={saving || !formData.name.trim()}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:opacity-50"
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

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/api/admin/campaigns`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch campaigns');

      const data = await response.json();
      setCampaigns(data.data || []);
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

  const handleCreate = () => {
    setEditingCampaign(null);
    setShowModal(true);
  };

  const handleEdit = (campaign) => {
    setEditingCampaign(campaign);
    setShowModal(true);
  };

  const handleSave = async (formData) => {
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
      throw new Error(data.error || 'Failed to save campaign');
    }

    toast.success(editingCampaign ? 'Campaign updated' : 'Campaign created');
    fetchCampaigns();
  };

  const handleToggle = async (campaign) => {
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

      toast.success(campaign.is_active ? 'Campaign deactivated' : 'Campaign activated');
      fetchCampaigns();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (campaign) => {
    if (!confirm(`Delete campaign "${campaign.name}"? This cannot be undone.`)) return;

    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/api/admin/campaigns/${campaign.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete campaign');
      }

      toast.success('Campaign deleted');
      fetchCampaigns();
    } catch (err) {
      toast.error(err.message);
    }
  };

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
                onClick={fetchCampaigns}
                className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                title="Refresh"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
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
        {campaigns.some(c => c.is_active) && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="font-medium text-green-800 dark:text-green-200">
                  Campaign Active
                </p>
                <p className="text-sm text-green-600 dark:text-green-400">
                  {campaigns.find(c => c.is_active)?.name} - All new signups receive a{' '}
                  {campaigns.find(c => c.is_active)?.trial_tier} trial
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Campaigns Table */}
        {loading && campaigns.length === 0 ? (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400">
            Loading campaigns...
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-500">{error}</div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              No campaigns yet. Create one to auto-grant trials to new users.
            </p>
            <button
              onClick={handleCreate}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
            >
              <Plus className="w-4 h-4" />
              Create First Campaign
            </button>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Campaign
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Trial
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Dates
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Signups
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {campaigns.map((campaign) => (
                  <tr key={campaign.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="px-4 py-4">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">
                          {campaign.name}
                        </p>
                        {campaign.description && (
                          <p className="text-sm text-slate-500 dark:text-slate-400 truncate max-w-xs">
                            {campaign.description}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge campaign={campaign} />
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
                        <span className="capitalize font-medium">{campaign.trial_tier}</span>
                        <span className="text-slate-400 dark:text-slate-500">
                          ({campaign.trial_days} days)
                        </span>
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-400">
                      <div>{formatDate(campaign.starts_at)}</div>
                      {campaign.ends_at && (
                        <div className="text-slate-400 dark:text-slate-500">
                          to {formatDate(campaign.ends_at)}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-900 dark:text-white font-medium">
                          {campaign.signups_count}
                        </span>
                        {campaign.conversions_count > 0 && (
                          <span className="text-green-600 dark:text-green-400 text-sm">
                            ({campaign.conversions_count} converted)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggle(campaign)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            campaign.is_active
                              ? 'text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900/30'
                              : 'text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30'
                          }`}
                          title={campaign.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {campaign.is_active ? (
                            <Pause className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleEdit(campaign)}
                          className="p-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {campaign.signups_count === 0 && (
                          <button
                            onClick={() => handleDelete(campaign)}
                            className="p-1.5 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <CampaignModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        campaign={editingCampaign}
        onSave={handleSave}
      />
    </PageLayout>
  );
}
