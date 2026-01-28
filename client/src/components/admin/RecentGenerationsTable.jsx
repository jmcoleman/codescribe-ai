/**
 * RecentGenerationsTable Component
 *
 * Displays recent document generations with filtering, sorting, and pagination.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  FileText,
  Filter,
  Layers,
  File
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Select } from '../Select';
import { formatDateTime } from '../../utils/formatters';

const API_URL = import.meta.env.VITE_API_URL || '';

export function RecentGenerationsTable() {
  const { getToken } = useAuth();

  // Data state
  const [generations, setGenerations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Pagination, sorting, and filtering state
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [sortBy, setSortBy] = useState('generated_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterDocType, setFilterDocType] = useState('');

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
      if (filterDocType) params.append('docType', filterDocType);

      const response = await fetch(`${API_URL}/api/admin/generations?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch generations');
      }

      const data = await response.json();
      if (data.success) {
        setGenerations(data.data.generations || []);
        setPagination(prev => ({
          ...prev,
          page: data.data.pagination.page,
          total: data.data.pagination.total,
          totalPages: data.data.pagination.totalPages
        }));
      }
    } catch (err) {
      console.error('Error fetching recent generations:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [getToken, pagination.limit, sortBy, sortOrder, filterDocType]);

  // Initial load and refetch on sort/filter change
  useEffect(() => {
    if (isInitialMount.current) {
      fetchData(1, true);
      isInitialMount.current = false;
    } else {
      fetchData(1, false);
    }
  }, [sortBy, sortOrder, filterDocType]);

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
        className={`px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 select-none ${className}`}
      >
        <span className="flex items-center gap-1">
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
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Recent Generations</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Recent document generations
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
      <div className="p-6 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Recent Generations</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Recent document generations ({pagination.total} total)
            </p>
          </div>
          <button
            onClick={() => fetchData(pagination.page, false)}
            disabled={isRefreshing}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Refresh data"
          >
            <RefreshCw className={`w-5 h-5 text-slate-600 dark:text-slate-400 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-600 dark:text-slate-400">Filter:</span>
          </div>
          <Select
            value={filterDocType}
            onChange={setFilterDocType}
            placeholder="All Doc Types"
            options={[
              { value: '', label: 'All Doc Types' },
              { value: 'README', label: 'README' },
              { value: 'JSDOC', label: 'JSDoc' },
              { value: 'API', label: 'API' },
              { value: 'OPENAPI', label: 'OpenAPI' },
              { value: 'ARCHITECTURE', label: 'Architecture' }
            ]}
            ariaLabel="Filter by doc type"
          />
          {filterDocType && (
            <button
              onClick={() => setFilterDocType('')}
              className="px-3 py-1.5 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              Clear filter
            </button>
          )}
        </div>
      </div>

      {error ? (
        <div className="p-8 text-center text-red-600 dark:text-red-400">
          {error}
        </div>
      ) : generations.length === 0 ? (
        <div className="p-8 text-center">
          <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
            {filterDocType ? 'No matching generations' : 'No generations yet'}
          </h3>
          <p className="text-slate-600 dark:text-slate-400">
            {filterDocType
              ? 'No generations match your filter.'
              : 'Document generations will appear here.'}
          </p>
          {filterDocType && (
            <button
              onClick={() => setFilterDocType('')}
              className="mt-4 text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-medium"
            >
              Clear filter
            </button>
          )}
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
                  <SortableHeader label="File" sortKey="filename" />
                  <SortableHeader label="Type" sortKey="doc_type" className="text-center" />
                  <th className="px-3 py-3 text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Mode
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Score
                  </th>
                  <SortableHeader label="Generated" sortKey="generated_at" className="text-right" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {generations.map((gen) => (
                  <tr
                    key={gen.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="text-sm text-slate-900 dark:text-slate-100">{gen.email}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 capitalize">{gen.tier}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-slate-900 dark:text-slate-100 font-mono truncate max-w-[250px]" title={gen.filename}>
                        {gen.filename}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {gen.language} • {gen.origin}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                        {gen.docType}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      {gen.batchType === 'batch' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" title={`Batch of ${gen.batchTotalFiles} files`}>
                          <Layers className="w-3 h-3" />
                          {gen.batchTotalFiles}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300" title="Single file">
                          <File className="w-3 h-3" />
                          1
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={`text-sm font-medium ${
                        gen.qualityScore?.score >= 90 ? 'text-green-600 dark:text-green-400' :
                        gen.qualityScore?.score >= 70 ? 'text-amber-600 dark:text-amber-400' :
                        'text-slate-600 dark:text-slate-400'
                      }`}>
                        {gen.qualityScore?.score ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-slate-600 dark:text-slate-400">
                      {formatDateTime(gen.generatedAt)}
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

export default RecentGenerationsTable;
