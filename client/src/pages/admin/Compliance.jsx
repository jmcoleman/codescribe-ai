/**
 * Compliance Dashboard Page
 * Admin-only dashboard for HIPAA compliance monitoring and audit logs
 */

import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Shield,
  FileText,
  Download,
  Filter,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  Eye,
  Users,
  Activity,
  Calendar,
  Search,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { API_URL } from '../../config/api';
import { PageLayout } from '../../components/PageLayout';
import DateRangePicker from '../../components/admin/DateRangePicker';
import { STORAGE_KEYS } from '../../constants/storage';
import { useDateRange } from '../../hooks/useDateRange';
import { formatNumber, formatPercent } from '../../components/admin/charts';
import { Select } from '../../components/Select';
import { Tooltip } from '../../components/Tooltip';

// Risk level colors
const RISK_COLORS = {
  high: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-300',
    border: 'border-red-300 dark:border-red-700',
    badge: 'bg-red-600 text-white',
  },
  medium: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-300 dark:border-amber-700',
    badge: 'bg-amber-600 text-white',
  },
  low: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    text: 'text-yellow-700 dark:text-yellow-300',
    border: 'border-yellow-300 dark:border-yellow-700',
    badge: 'bg-yellow-600 text-white',
  },
  none: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-300',
    border: 'border-green-300 dark:border-green-700',
    badge: 'bg-green-600 text-white',
  },
};

const ACTION_OPTIONS = [
  { value: '', label: 'All Actions' },
  { value: 'code_generation', label: 'Code Generation' },
  { value: 'file_upload', label: 'File Upload' },
  { value: 'login', label: 'Login' },
  { value: 'logout', label: 'Logout' },
];

const PHI_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'true', label: 'Yes' },
  { value: 'false', label: 'No' },
];

const RISK_OPTIONS = [
  { value: '', label: 'All Levels' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
  { value: 'none', label: 'None' },
];

/**
 * Stats Card Component
 */
function StatsCard({ icon: Icon, label, value, subValue, color = 'purple', description }) {
  const colorClasses = {
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    red: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
    amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">{label}</h3>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
          {subValue && (
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subValue}</p>
          )}
          {description && (
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Audit Log Table Component
 */
function AuditLogTable({ logs, loading }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
        <p className="text-slate-600 dark:text-slate-400">No audit logs found for selected filters</p>
      </div>
    );
  }

  const getRiskBadge = (containsPhi, phiScore) => {
    let risk = 'none';
    if (containsPhi) {
      if (phiScore >= 16) risk = 'high';
      else if (phiScore >= 6) risk = 'medium';
      else risk = 'low';
    }

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${RISK_COLORS[risk].badge}`}>
        {risk.toUpperCase()}
      </span>
    );
  };

  const getSuccessBadge = (success) => {
    return success ? (
      <span className="inline-flex items-center text-green-600 dark:text-green-400">
        <CheckCircle className="h-4 w-4" />
      </span>
    ) : (
      <span className="inline-flex items-center text-red-600 dark:text-red-400">
        <AlertCircle className="h-4 w-4" />
      </span>
    );
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
        <thead className="bg-slate-50 dark:bg-slate-900">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Timestamp
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              User
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Action
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              PHI Risk
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              IP Address
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
          {logs.map((log) => (
            <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
              <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-900 dark:text-white">
                {new Date(log.created_at).toLocaleString()}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">
                {log.user_email || 'Anonymous'}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">
                {log.action}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm">
                {getRiskBadge(log.contains_potential_phi, log.phi_score)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm">
                {getSuccessBadge(log.success)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">
                {log.ip_address || 'N/A'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Compliance Dashboard Page
 */
export default function Compliance() {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState(null);

  // Filters
  const { dateRange, setDateRange } = useDateRange(STORAGE_KEYS.COMPLIANCE_DATE_RANGE);

  const [filters, setFilters] = useState({
    action: '',
    containsPhi: '',
    riskLevel: '',
    userEmail: '',
  });

  const [pagination, setPagination] = useState({
    limit: 50,
    offset: 0,
  });

  // Fetch audit logs and stats
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      // Build query params
      const params = new URLSearchParams({
        limit: pagination.limit.toString(),
        offset: pagination.offset.toString(),
      });

      params.append('startDate', dateRange.startDate.toISOString());
      params.append('endDate', dateRange.endDate.toISOString());
      if (filters.action) {
        params.append('action', filters.action);
      }
      if (filters.containsPhi) {
        params.append('containsPhi', filters.containsPhi);
      }
      if (filters.riskLevel) {
        params.append('riskLevel', filters.riskLevel);
      }
      if (filters.userEmail) {
        params.append('userEmail', filters.userEmail);
      }

      const response = await fetch(`${API_URL}/api/admin/audit-logs?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Admin access required');
        }
        throw new Error('Failed to fetch audit logs');
      }

      const data = await response.json();
      setLogs(data.data.logs || []);
      setTotal(data.data.total || 0);
      setStats(data.data.stats || null);
    } catch (err) {
      console.error('Error fetching compliance data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [getToken, dateRange, filters, pagination]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Export to CSV
  const handleExport = async () => {
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      // Build query params (same as fetch but no pagination)
      const params = new URLSearchParams();
      params.append('startDate', dateRange.startDate.toISOString());
      params.append('endDate', dateRange.endDate.toISOString());
      if (filters.action) {
        params.append('action', filters.action);
      }
      if (filters.containsPhi) {
        params.append('containsPhi', filters.containsPhi);
      }
      if (filters.riskLevel) {
        params.append('riskLevel', filters.riskLevel);
      }
      if (filters.userEmail) {
        params.append('userEmail', filters.userEmail);
      }

      const response = await fetch(`${API_URL}/api/admin/audit-logs/export?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to export audit logs');
      }

      // Download CSV
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CodeScribe_Audit_Report_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error exporting audit logs:', err);
      setError(err.message);
    }
  };

  const handleDateRangeChange = (newDateRange) => {
    setDateRange(newDateRange);
    setPagination({ ...pagination, offset: 0 }); // Reset pagination
  };

  const handleFilterChange = (filterName, value) => {
    setFilters({ ...filters, [filterName]: value });
    setPagination({ ...pagination, offset: 0 }); // Reset pagination
  };

  const clearFilters = () => {
    setFilters({
      action: '',
      containsPhi: '',
      riskLevel: '',
      userEmail: '',
    });
    setPagination({ ...pagination, offset: 0 });
  };

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/admin"
            className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Admin
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                <Shield className="h-8 w-8 text-purple-600" />
                HIPAA Compliance Dashboard
              </h1>
              <p className="mt-2 text-slate-600 dark:text-slate-400">
                Audit logs, PHI detection monitoring, and compliance reporting
              </p>
            </div>
            <div className="flex items-center gap-4">
              <DateRangePicker startDate={dateRange.startDate} endDate={dateRange.endDate} onChange={handleDateRangeChange} />
              <button
                onClick={handleExport}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-red-900 dark:text-red-100">Error</h3>
                <p className="mt-1 text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              icon={Activity}
              label="Total Audit Logs"
              value={formatNumber(stats.total_logs || 0)}
              color="purple"
              description="All logged actions in selected period"
            />
            <StatsCard
              icon={AlertTriangle}
              label="PHI Detections"
              value={formatNumber(stats.phi_detections || 0)}
              subValue={`${formatPercent((stats.phi_detections || 0) / (stats.total_logs || 1))} of total`}
              color="amber"
              description="Actions with potential PHI detected"
            />
            <StatsCard
              icon={CheckCircle}
              label="Success Rate"
              value={formatPercent((stats.success_count || 0) / (stats.total_logs || 1))}
              subValue={`${formatNumber(stats.success_count || 0)} / ${formatNumber(stats.total_logs || 0)}`}
              color="green"
              description="Successful vs failed actions"
            />
            <StatsCard
              icon={Users}
              label="Unique Users"
              value={formatNumber(stats.unique_users || 0)}
              color="purple"
              description="Users with logged actions"
            />
          </div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Filters</h2>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <Select
              value={filters.action}
              onChange={(val) => handleFilterChange('action', val)}
              placeholder="All Actions"
              options={ACTION_OPTIONS}
              ariaLabel="Filter by action"
            />
            <Select
              value={filters.containsPhi}
              onChange={(val) => handleFilterChange('containsPhi', val)}
              placeholder="All"
              options={PHI_OPTIONS}
              ariaLabel="Filter by PHI presence"
            />
            <Select
              value={filters.riskLevel}
              onChange={(val) => handleFilterChange('riskLevel', val)}
              placeholder="All Levels"
              options={RISK_OPTIONS}
              ariaLabel="Filter by risk level"
            />
            <input
              type="text"
              value={filters.userEmail}
              onChange={(e) => handleFilterChange('userEmail', e.target.value)}
              placeholder="Filter by user email..."
              autoComplete="off"
              className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder:text-slate-400 dark:placeholder:text-slate-500"
              style={{ width: '200px' }}
              aria-label="Filter by user email"
            />
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Audit Logs Table */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Audit Logs</h2>
              <button
                onClick={fetchData}
                disabled={loading}
                className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-50"
              >
                <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Showing {(logs || []).length} of {formatNumber(total)} total logs
            </p>
          </div>
          <AuditLogTable logs={logs} loading={loading} />
        </div>
      </div>
    </PageLayout>
  );
}
