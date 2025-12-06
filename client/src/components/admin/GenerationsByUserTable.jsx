/**
 * GenerationsByUserTable Component
 *
 * Displays generation counts aggregated by user and doc type.
 * Features sorting, pagination, and loading states.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  FileText
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { formatDateTime } from '../../utils/formatters';

const API_URL = import.meta.env.VITE_API_URL || '';

export function GenerationsByUserTable() {
  const { getToken } = useAuth();

  // Data state
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Pagination and sorting state
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [sortBy, setSortBy] = useState('total');
  const [sortOrder, setSortOrder] = useState('desc');

  const isInitialMount = useRef(true);

  // Fetch data
  const fetchData = useCallback(async (page = pagination.page, isInitialLoad = false) => {
    if (isInitialLoad) {
      setLoading(true);
    } else {
      setIsRefreshing(true);
    }
    setError(null);

    try {
      const token = getToken();
      if (!token) return;

      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        sortBy,
        sortOrder
      });

      const response = await fetch(`${API_URL}/api/admin/generations/by-user?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch generation data');
      }

      const data = await response.json();
      if (data.success) {
        setUsers(data.data.users || []);
        setPagination(prev => ({
          ...prev,
          page: data.data.pagination.page,
          total: data.data.pagination.total,
          totalPages: data.data.pagination.totalPages
        }));
      }
    } catch (err) {
      console.error('Error fetching generations by user:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [getToken, pagination.limit, sortBy, sortOrder]);

  // Initial load and refetch on sort change
  useEffect(() => {
    if (isInitialMount.current) {
      fetchData(1, true);
      isInitialMount.current = false;
    } else {
      fetchData(1, false);
    }
  }, [sortBy, sortOrder]);

  // Handle sort
  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchData(newPage, false);
    }
  };

  // Sortable header component
  const SortableHeader = ({ label, sortKey, className = '' }) => {
    const isActive = sortBy === sortKey;
    return (
      <th
        onClick={() => handleSort(sortKey)}
        className={`px-3 py-3 text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 select-none ${className}`}
      >
        <span className="flex items-center justify-center gap-1">
          {label}
          {isActive ? (
            sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
          ) : (
            <ArrowUpDown className="w-3 h-3 opacity-50" />
          )}
        </span>
      </th>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Generations by User</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Document generations by type per user
          </p>
        </div>
        <div className="flex items-center justify-center py-16">
          <RefreshCw className="w-8 h-8 text-purple-600 dark:text-purple-400 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Generations by User</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Document generations by type per user ({pagination.total} users)
          </p>
        </div>
        {isRefreshing && (
          <RefreshCw className="w-5 h-5 text-purple-600 dark:text-purple-400 animate-spin" />
        )}
      </div>

      {error ? (
        <div className="p-8 text-center text-red-600 dark:text-red-400">
          {error}
        </div>
      ) : users.length === 0 ? (
        <div className="p-8 text-center">
          <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
            No generations yet
          </h3>
          <p className="text-slate-600 dark:text-slate-400">
            Document generations will appear here once users start generating.
          </p>
        </div>
      ) : (
        <>
          <div className={`overflow-x-auto transition-opacity duration-200 ${isRefreshing ? 'opacity-50' : ''}`}>
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    User
                  </th>
                  <SortableHeader label="README" sortKey="readme" />
                  <SortableHeader label="JSDoc" sortKey="jsdoc" />
                  <SortableHeader label="API" sortKey="api" />
                  <SortableHeader label="OpenAPI" sortKey="openapi" />
                  <SortableHeader label="Arch" sortKey="architecture" />
                  <SortableHeader label="Total" sortKey="total" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {users.map((user) => (
                  <tr
                    key={user.userId}
                    className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div>
                        <div className="text-sm text-slate-900 dark:text-slate-100">{user.email}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 capitalize">{user.tier}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          Last: {formatDateTime(user.lastGeneration)}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={`text-sm ${user.readme > 0 ? 'font-medium text-slate-900 dark:text-slate-100' : 'text-slate-400 dark:text-slate-500'}`}>
                        {user.readme || '—'}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={`text-sm ${user.jsdoc > 0 ? 'font-medium text-slate-900 dark:text-slate-100' : 'text-slate-400 dark:text-slate-500'}`}>
                        {user.jsdoc || '—'}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={`text-sm ${user.api > 0 ? 'font-medium text-slate-900 dark:text-slate-100' : 'text-slate-400 dark:text-slate-500'}`}>
                        {user.api || '—'}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={`text-sm ${user.openapi > 0 ? 'font-medium text-slate-900 dark:text-slate-100' : 'text-slate-400 dark:text-slate-500'}`}>
                        {user.openapi || '—'}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={`text-sm ${user.architecture > 0 ? 'font-medium text-slate-900 dark:text-slate-100' : 'text-slate-400 dark:text-slate-500'}`}>
                        {user.architecture || '—'}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                        {user.total}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNum;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.page <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.page >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = pagination.page - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                          pagination.page === pageNum
                            ? 'bg-purple-600 dark:bg-purple-700 text-white'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label="Next page"
                >
                  <ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default GenerationsByUserTable;
