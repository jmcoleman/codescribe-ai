import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  ArrowLeft,
  FileText,
  FolderOpen,
  Calendar,
  Star,
  ChevronRight,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { PageLayout } from '../components/PageLayout.jsx';
import { fetchBatches, fetchBatchWithDocuments } from '../api/batchesApi.js';
import { getEffectiveTier } from '../utils/tierFeatures.js';

/**
 * Generation History Page
 *
 * Displays user's past documentation generations in a compact list view.
 * Pro+ tier feature - shows upgrade prompt for Free/Starter users.
 *
 * Features:
 * - Minimal display: doc type, filename, date
 * - Click to view full generated documentation
 * - Pagination for large histories
 * - ESC key to navigate back
 */
export function History() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const [batches, setBatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [expandedBatchId, setExpandedBatchId] = useState(null);
  const [expandedDocuments, setExpandedDocuments] = useState([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);

  const LIMIT = 20;

  // Get effective tier (considering tier override for admins)
  const effectiveTier = getEffectiveTier(user);

  // Check if user has Pro+ tier (pro, team, or enterprise)
  const hasProPlusTier = ['pro', 'team', 'enterprise'].includes(effectiveTier);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  // ESC key to navigate back
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        navigate(-1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  // Fetch batches
  const loadBatches = useCallback(async (newOffset = 0, append = false) => {
    if (!hasProPlusTier) return;

    try {
      setIsLoading(!append);
      setError(null);

      const result = await fetchBatches({
        limit: LIMIT,
        offset: newOffset
      });

      if (append) {
        setBatches(prev => [...prev, ...result.batches]);
      } else {
        setBatches(result.batches);
      }

      setTotal(result.total);
      setHasMore(result.hasMore);
      setOffset(newOffset);
    } catch (err) {
      console.error('[History] Error loading batches:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [hasProPlusTier]);

  // Initial load
  useEffect(() => {
    if (hasProPlusTier && !authLoading) {
      loadBatches(0);
    } else if (!authLoading) {
      setIsLoading(false);
    }
  }, [hasProPlusTier, authLoading, loadBatches]);

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadBatches(0);
  };

  // Load more
  const handleLoadMore = () => {
    loadBatches(offset + LIMIT, true);
  };

  // Expand batch to show documents
  const handleBatchClick = async (batchId) => {
    if (expandedBatchId === batchId) {
      setExpandedBatchId(null);
      setExpandedDocuments([]);
      return;
    }

    try {
      setLoadingDocuments(true);
      setExpandedBatchId(batchId);

      const result = await fetchBatchWithDocuments(batchId);
      setExpandedDocuments(result.documents || []);
    } catch (err) {
      console.error('[History] Error loading documents:', err);
      setError('Failed to load documents');
    } finally {
      setLoadingDocuments(false);
    }
  };

  // Format date relative
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMins = Math.floor(diffMs / (1000 * 60));
        return diffMins <= 1 ? 'Just now' : `${diffMins}m ago`;
      }
      return `${diffHours}h ago`;
    }

    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  // Format doc type for display
  const formatDocType = (docType) => {
    // Handle object with docType key (quality score breakdown object)
    if (docType && typeof docType === 'object') {
      docType = docType.docType || 'Documentation';
    }

    const types = {
      README: 'README',
      JSDOC: 'JSDoc',
      API: 'API Docs',
      ARCHITECTURE: 'Architecture',
      OPENAPI: 'OpenAPI'
    };
    return types[docType] || docType || 'Documentation';
  };

  // Get grade color
  const getGradeColor = (grade) => {
    const colors = {
      A: 'text-green-600 dark:text-green-400',
      B: 'text-blue-600 dark:text-blue-400',
      C: 'text-yellow-600 dark:text-yellow-400',
      D: 'text-orange-600 dark:text-orange-400',
      F: 'text-red-600 dark:text-red-400'
    };
    return colors[grade] || 'text-slate-600 dark:text-slate-400';
  };

  // Loading skeleton
  if (isLoading && batches.length === 0) {
    return (
      <PageLayout showGradient={false} className="bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950">
        <div className="container mx-auto px-4 max-w-4xl pt-6 pb-12">
          <div className="mb-8 animate-pulse">
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-lg w-48 mb-3"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-lg w-96"></div>
          </div>

          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-48 mb-2"></div>
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-32"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </PageLayout>
    );
  }

  // Upgrade prompt for non-Pro users
  if (!hasProPlusTier) {
    return (
      <PageLayout showGradient={false} className="bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950">
        <div className="container mx-auto px-4 max-w-4xl pt-6 pb-12">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors mb-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 dark:focus-visible:ring-purple-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 rounded-lg px-2 py-1"
            aria-label="Go back to previous page"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" aria-hidden="true" />
            <span className="font-medium">Back</span>
          </button>

          <div className="text-center py-16">
            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Clock className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-3">
              Generation History
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
              View and access your past documentation generations. This feature is available on Pro plans and above.
            </p>
            <button
              onClick={() => navigate('/pricing')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 focus-visible:ring-offset-2"
            >
              <Sparkles className="w-5 h-5" />
              Upgrade to Pro
            </button>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout showGradient={false} className="bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950">
      <div className="container mx-auto px-4 max-w-4xl pt-6 pb-12">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors mb-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 dark:focus-visible:ring-purple-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 rounded-lg px-2 py-1"
          aria-label="Go back to previous page"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" aria-hidden="true" />
          <span className="font-medium">Back</span>
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              Generation History
            </h1>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className={`
                inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg
                hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-200
                focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 dark:focus-visible:ring-purple-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900
                disabled:opacity-50 disabled:cursor-not-allowed
                ${refreshing ? 'animate-pulse' : ''}
              `}
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
          <p className="text-slate-600 dark:text-slate-400">
            View your past documentation generations
            {total > 0 && (
              <span className="ml-2 text-slate-500 dark:text-slate-500">
                ({total} total)
              </span>
            )}
          </p>
        </div>

        {/* Error state */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        )}

        {/* Empty state */}
        {batches.length === 0 && !isLoading && !error && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <FileText className="w-8 h-8 text-slate-400 dark:text-slate-500" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
              No generations yet
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Start generating documentation to see your history here.
            </p>
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
            >
              Generate Documentation
            </button>
          </div>
        )}

        {/* Batches list */}
        {batches.length > 0 && (
          <div className="space-y-3">
            {batches.map((batch) => (
              <div key={batch.id}>
                {/* Batch row */}
                <button
                  onClick={() => handleBatchClick(batch.id)}
                  className={`
                    w-full text-left bg-white dark:bg-slate-800 rounded-lg border transition-all duration-200
                    hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-md dark:hover:shadow-slate-900/50
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 dark:focus-visible:ring-purple-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900
                    ${expandedBatchId === batch.id
                      ? 'border-purple-300 dark:border-purple-600 shadow-md'
                      : 'border-slate-200 dark:border-slate-700'
                    }
                  `}
                >
                  <div className="p-4">
                    <div className="flex items-center gap-3">
                      {/* Icon */}
                      <div className={`
                        w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
                        ${batch.batch_type === 'batch'
                          ? 'bg-indigo-100 dark:bg-indigo-900/30'
                          : 'bg-purple-100 dark:bg-purple-900/30'
                        }
                      `}>
                        {batch.batch_type === 'batch' ? (
                          <FolderOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        ) : (
                          <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                            {batch.batch_type === 'batch'
                              ? `${batch.total_files} files`
                              : 'Single file'
                            }
                          </span>
                          {batch.doc_types && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded">
                              {(() => {
                                // doc_types can be: string, array of strings, or object with docType key
                                if (typeof batch.doc_types === 'string') {
                                  return formatDocType(batch.doc_types);
                                }
                                if (Array.isArray(batch.doc_types)) {
                                  return batch.doc_types.map(dt =>
                                    typeof dt === 'object' ? formatDocType(dt.docType || 'Unknown') : formatDocType(dt)
                                  ).join(', ');
                                }
                                if (typeof batch.doc_types === 'object' && batch.doc_types.docType) {
                                  return formatDocType(batch.doc_types.docType);
                                }
                                return 'Documentation';
                              })()}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(batch.created_at)}
                          </span>
                          {batch.avg_grade && (
                            <span className={`flex items-center gap-1 font-semibold ${getGradeColor(batch.avg_grade)}`}>
                              <Star className="w-3 h-3" />
                              {batch.avg_grade}
                            </span>
                          )}
                          {batch.success_count > 0 && batch.fail_count > 0 && (
                            <span className="text-amber-600 dark:text-amber-400">
                              {batch.fail_count} failed
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Chevron */}
                      <ChevronRight className={`
                        w-5 h-5 text-slate-400 dark:text-slate-500 transition-transform flex-shrink-0
                        ${expandedBatchId === batch.id ? 'rotate-90' : ''}
                      `} />
                    </div>
                  </div>
                </button>

                {/* Expanded documents */}
                {expandedBatchId === batch.id && (
                  <div className="mt-1 ml-6 border-l-2 border-slate-200 dark:border-slate-700 pl-4 space-y-2">
                    {loadingDocuments ? (
                      <div className="flex items-center gap-2 py-4 text-slate-500 dark:text-slate-400">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Loading documents...</span>
                      </div>
                    ) : expandedDocuments.length === 0 ? (
                      <p className="text-sm text-slate-500 dark:text-slate-400 py-2">
                        No documents found
                      </p>
                    ) : (
                      expandedDocuments.map((doc) => (
                        <div
                          key={doc.id}
                          className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 border border-slate-200 dark:border-slate-700"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                            <span className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                              {doc.filename || 'Untitled'}
                            </span>
                            <span className="px-1.5 py-0.5 text-xs bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded">
                              {formatDocType(doc.doc_type)}
                            </span>
                            {doc.quality_score && (
                              (() => {
                                // quality_score can be a number or an object with score key
                                const score = typeof doc.quality_score === 'object'
                                  ? doc.quality_score.score
                                  : doc.quality_score;
                                const grade = typeof doc.quality_score === 'object' && doc.quality_score.grade
                                  ? doc.quality_score.grade
                                  : (score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F');
                                return score ? (
                                  <span className={`text-xs font-semibold ${getGradeColor(grade)}`}>
                                    {score}%
                                  </span>
                                ) : null;
                              })()
                            )}
                          </div>
                          {doc.language && typeof doc.language === 'string' && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 ml-6">
                              {doc.language}
                            </p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Load more */}
            {hasMore && (
              <div className="text-center pt-4">
                <button
                  onClick={handleLoadMore}
                  disabled={isLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 dark:focus-visible:ring-purple-400 rounded-lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Load more'
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </PageLayout>
  );
}

export default History;
