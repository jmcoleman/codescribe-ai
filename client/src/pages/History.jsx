import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  ArrowLeft,
  FileText,
  FolderOpen,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Loader2,
  ExternalLink,
  Filter,
  X,
  Search
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useWorkspace } from '../contexts/WorkspaceContext.jsx';
import { PageLayout } from '../components/PageLayout.jsx';
import { BaseTable } from '../components/BaseTable.jsx';
import { Select } from '../components/Select.jsx';
import { fetchBatches, fetchBatchWithDocuments } from '../api/batchesApi.js';
import { getEffectiveTier, hasFeature } from '../utils/tierFeatures.js';
import { toastCompact } from '../utils/toastWithHistory.js';
import { useTableColumnSizing } from '../hooks/useTableColumnSizing.js';
import { STORAGE_KEYS, removeStorageItem } from '../constants/storage.js';

/**
 * Generation History Page
 *
 * Displays user's past documentation generations using TanStack Table.
 * Pro+ tier feature - shows upgrade prompt for Free/Starter users.
 *
 * Features:
 * - Server-side sorting, filtering, and pagination
 * - Row expansion for multi-file batches
 * - Filter by grade and doc type
 * - Open documents in workspace
 */

// Doc type options for filtering (Select component format)
const DOC_TYPE_OPTIONS = [
  { value: 'all', label: 'All Types' },
  { value: 'README', label: 'README' },
  { value: 'JSDOC', label: 'JSDoc' },
  { value: 'API', label: 'API Docs' },
  { value: 'ARCHITECTURE', label: 'Architecture' },
  { value: 'OPENAPI', label: 'OpenAPI' }
];

// Grade options for filtering (Select component format)
const GRADE_OPTIONS = [
  { value: 'all', label: 'All Grades' },
  { value: 'A', label: 'A (90+)' },
  { value: 'B', label: 'B (80-89)' },
  { value: 'C', label: 'C (70-79)' },
  { value: 'D', label: 'D (60-69)' },
  { value: 'F', label: 'F (<60)' }
];

export function History() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { addFiles, clearFiles } = useWorkspace();

  // Data state
  const [batches, setBatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalDocuments: 0,
    totalPages: 0
  });

  // Sorting state (TanStack format)
  const [sorting, setSorting] = useState([{ id: 'created_at', desc: true }]);

  // Filter state (using 'all' as default to match Select component)
  const [gradeFilter, setGradeFilter] = useState('all');
  const [docTypeFilter, setDocTypeFilter] = useState('all');
  const [filenameSearch, setFilenameSearch] = useState('');
  const [debouncedFilenameSearch, setDebouncedFilenameSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const debounceTimerRef = useRef(null);

  // Expansion state for multi-file batches
  const [expandedBatches, setExpandedBatches] = useState({});
  const [loadingBatchId, setLoadingBatchId] = useState(null);
  const [openingBatchId, setOpeningBatchId] = useState(null);

  // Column sizing state - persisted to localStorage via reusable hook
  const { columnSizing, onColumnSizingChange } = useTableColumnSizing('history');

  // Get effective tier (considering tier override for admins)
  const effectiveTier = getEffectiveTier(user);

  // Check if user is admin
  const isAdmin = user?.role === 'admin';

  // Check if user has Starter+ tier (starter, pro, team, or enterprise) OR is admin
  const hasAccess = ['starter', 'pro', 'team', 'enterprise'].includes(effectiveTier) || isAdmin;

  // Check if user can use batch/multi-file features (for opening batches)
  const canUseBatchProcessing = hasFeature(user, 'batchProcessing');

  // Convert TanStack sorting format to API format
  const sortingToApi = useCallback((sortingState) => {
    if (!sortingState || sortingState.length === 0) {
      return { sortBy: 'created_at', sortOrder: 'desc' };
    }
    const sort = sortingState[0];
    return {
      sortBy: sort.id,
      sortOrder: sort.desc ? 'desc' : 'asc'
    };
  }, []);

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

  // Fetch batches with current state
  const loadBatches = useCallback(async (page = 1, isRefresh = false) => {
    if (!hasAccess) return;

    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const { sortBy, sortOrder } = sortingToApi(sorting);

      const result = await fetchBatches({
        limit: pagination.limit,
        offset: (page - 1) * pagination.limit,
        sortBy,
        sortOrder,
        gradeFilter: gradeFilter !== 'all' ? gradeFilter : null,
        docTypeFilter: docTypeFilter !== 'all' ? docTypeFilter : null,
        filenameSearch: debouncedFilenameSearch.trim() || null
      });

      setBatches(result.batches);
      setPagination(prev => ({
        ...prev,
        page: result.page,
        total: result.total,
        totalDocuments: result.totalDocuments || 0,
        totalPages: result.totalPages
      }));
    } catch (err) {
      console.error('[History] Error loading batches:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [hasAccess, pagination.limit, sorting, gradeFilter, docTypeFilter, debouncedFilenameSearch, sortingToApi]);

  // Initial load
  useEffect(() => {
    if (hasAccess && !authLoading) {
      loadBatches(1);
    } else if (!authLoading) {
      setIsLoading(false);
    }
  }, [hasAccess, authLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounce filename search (300ms delay)
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedFilenameSearch(filenameSearch);
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [filenameSearch]);

  // Reload when sorting or filters change
  useEffect(() => {
    if (hasAccess && !authLoading && !isLoading) {
      loadBatches(1);
      // Clear expanded batches when filters change - they need to be re-fetched with new filters
      setExpandedBatches({});
    }
  }, [sorting, gradeFilter, docTypeFilter, debouncedFilenameSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle page change
  const handlePageChange = (newPage) => {
    loadBatches(newPage);
  };

  // Handle refresh
  const handleRefresh = () => {
    loadBatches(pagination.page, true);
  };

  // Handle sorting change from table
  const handleSortingChange = (updater) => {
    const newSorting = typeof updater === 'function' ? updater(sorting) : updater;
    setSorting(newSorting);
  };

  // Clear filters
  const clearFilters = () => {
    setGradeFilter('all');
    setDocTypeFilter('all');
    setFilenameSearch('');
    setDebouncedFilenameSearch('');
  };

  // Check if any filters are active
  const hasActiveFilters = gradeFilter !== 'all' || docTypeFilter !== 'all' || filenameSearch.trim() !== '';

  // Format date as "Dec 6, 2:30 PM" (with year if not current year)
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const isCurrentYear = date.getFullYear() === now.getFullYear();

    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const day = date.getDate();
    const year = date.getFullYear();

    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 should be 12

    if (isCurrentYear) {
      return `${month} ${day}, ${hours}:${minutes} ${ampm}`;
    }
    return `${month} ${day}, ${year}, ${hours}:${minutes} ${ampm}`;
  };

  // Format doc type for display
  const formatDocType = (docType) => {
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

  // Get grade color - neutral slate tones for professional look
  const getGradeColor = (grade) => {
    // Using neutral colors - darker for better grades, lighter for worse
    const colors = {
      A: 'text-slate-900 dark:text-slate-100',
      B: 'text-slate-700 dark:text-slate-200',
      C: 'text-slate-600 dark:text-slate-300',
      D: 'text-slate-500 dark:text-slate-400',
      F: 'text-slate-400 dark:text-slate-500'
    };
    return colors[grade] || 'text-slate-600 dark:text-slate-400';
  };

  // Expand/collapse batch to show documents
  const handleBatchExpand = useCallback(async (batchId) => {
    if (expandedBatches[batchId]) {
      setExpandedBatches(prev => {
        const next = { ...prev };
        delete next[batchId];
        return next;
      });
      return;
    }

    try {
      setLoadingBatchId(batchId);
      setExpandedBatches(prev => ({ ...prev, [batchId]: [] }));

      // Pass current filters to get only matching documents
      const filters = {
        filenameSearch: debouncedFilenameSearch.trim() || null,
        gradeFilter: gradeFilter !== 'all' ? gradeFilter : null,
        docTypeFilter: docTypeFilter !== 'all' ? docTypeFilter : null
      };

      const result = await fetchBatchWithDocuments(batchId, filters);
      setExpandedBatches(prev => ({ ...prev, [batchId]: result.documents || [] }));
    } catch (err) {
      console.error('[History] Error loading documents:', err);
      setError('Failed to load documents');
      setExpandedBatches(prev => {
        const next = { ...prev };
        delete next[batchId];
        return next;
      });
    } finally {
      setLoadingBatchId(null);
    }
  }, [expandedBatches, debouncedFilenameSearch, gradeFilter, docTypeFilter]);

  // Open batch documents in workspace
  const handleOpenInWorkspace = async (batchId, e) => {
    e?.stopPropagation();

    try {
      setOpeningBatchId(batchId);

      let documents = expandedBatches[batchId];
      if (!documents) {
        const result = await fetchBatchWithDocuments(batchId);
        documents = result.documents || [];
      }

      if (documents.length === 0) {
        toastCompact('No documents found in this batch', 'error');
        return;
      }

      await clearFiles();

      const workspaceFiles = documents.map(doc => {
        // Use created_at as when code was added, generated_at as when doc was generated
        const codeAddedDate = doc.created_at ? new Date(doc.created_at) : null;
        const docGeneratedDate = doc.generated_at ? new Date(doc.generated_at) : codeAddedDate;

        return {
          id: doc.id,
          filename: doc.filename || 'untitled.js',
          language: doc.language || 'javascript',
          content: doc.source_code || '',
          fileSize: doc.file_size_bytes || 0, // Original file size from DB
          documentation: doc.documentation || null,
          qualityScore: doc.quality_score || null,
          docType: doc.doc_type || 'README',
          origin: doc.origin || 'history', // Preserve original origin for reload capability
          // Include GitHub metadata if available (for reload from source functionality)
          github: doc.github_repo ? {
            repo: doc.github_repo,
            path: doc.github_path,
            sha: doc.github_sha,
            branch: doc.github_branch
          } : null,
          documentId: doc.id,
          generatedAt: docGeneratedDate,
          // Preserve original timestamps from when code was added/modified
          dateAdded: codeAddedDate,
          dateModified: codeAddedDate, // For history items, modified = added (no edits)
          batchId: batchId
        };
      });

      // Wait for files to be added before navigating to prevent flash
      await addFiles(workspaceFiles);
      // Clear "doc panel cleared" flag so the doc will show on page load
      removeStorageItem(STORAGE_KEYS.DOC_PANEL_CLEARED);
      toastCompact(`Opened ${documents.length} file${documents.length > 1 ? 's' : ''} in workspace`, 'success');
      navigate('/');
    } catch (err) {
      console.error('[History] Error opening batch in workspace:', err);
      toastCompact('Failed to open in workspace', 'error');
    } finally {
      setOpeningBatchId(null);
    }
  };

  // Open single document in workspace
  const handleOpenDocInWorkspace = async (doc, batchId, e) => {
    e?.stopPropagation();

    console.log('[History] Opening doc:', doc.filename, doc.id);
    await clearFiles();
    console.log('[History] Files cleared');

    // Use created_at as when code was added, generated_at as when doc was generated
    const codeAddedDate = doc.created_at ? new Date(doc.created_at) : null;
    const docGeneratedDate = doc.generated_at ? new Date(doc.generated_at) : codeAddedDate;

    const workspaceFile = {
      id: doc.id,
      filename: doc.filename || 'untitled.js',
      language: doc.language || 'javascript',
      content: doc.source_code || '',
      fileSize: doc.file_size_bytes || 0, // Original file size from DB
      documentation: doc.documentation || null,
      qualityScore: doc.quality_score || null,
      docType: doc.doc_type || 'README',
      origin: doc.origin || 'history', // Preserve original origin for reload capability
      // Include GitHub metadata if available (for reload from source functionality)
      github: doc.github_repo ? {
        repo: doc.github_repo,
        path: doc.github_path,
        sha: doc.github_sha,
        branch: doc.github_branch
      } : null,
      documentId: doc.id,
      generatedAt: docGeneratedDate,
      // Preserve original timestamps from when code was added/modified
      dateAdded: codeAddedDate,
      dateModified: codeAddedDate, // For history items, modified = added (no edits)
      batchId: batchId
    };

    console.log('[History] Adding file:', workspaceFile.filename, 'with doc length:', workspaceFile.documentation?.length);
    // Wait for files to be added before navigating to prevent flash
    await addFiles([workspaceFile]);
    console.log('[History] Files added, navigating');
    // Clear "doc panel cleared" flag so the doc will show on page load
    removeStorageItem(STORAGE_KEYS.DOC_PANEL_CLEARED);
    toastCompact('Opened in workspace', 'success');
    navigate('/');
  };

  // Table columns definition
  const columns = useMemo(() => [
    {
      accessorKey: 'first_doc_filename',
      header: 'File/Batch',
      enableSorting: false,
      size: 280,
      minSize: 150,
      maxSize: 500,
      cell: ({ row }) => {
        const batch = row.original;
        const isSingleFile = batch.total_files === 1;

        return (
          <div className="flex items-center gap-2.5">
            {/* Icon */}
            <div className="flex-shrink-0">
              {isSingleFile ? (
                <FileText className="w-4 h-4 text-slate-400" />
              ) : (
                <FolderOpen className="w-4 h-4 text-slate-400" />
              )}
            </div>

            {/* Content */}
            <div className="min-w-0">
              <span className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                {isSingleFile
                  ? (batch.first_doc_filename || 'Untitled')
                  : `Batch Summary (${batch.total_files} files)`
                }
              </span>
            </div>
          </div>
        );
      }
    },
    {
      accessorKey: 'doc_types',
      header: 'Doc Type',
      enableSorting: false,
      size: 160,
      minSize: 100,
      maxSize: 300,
      cell: ({ row }) => {
        const batch = row.original;
        const isSingleFile = batch.total_files === 1;
        const docType = isSingleFile ? batch.first_doc_doc_type : batch.doc_types;

        if (!docType) return <span className="text-slate-400 dark:text-slate-500">—</span>;

        let displayType;
        if (typeof docType === 'string') {
          displayType = formatDocType(docType);
        } else if (Array.isArray(docType)) {
          displayType = docType.map(dt =>
            typeof dt === 'object' ? formatDocType(dt.docType || 'Unknown') : formatDocType(dt)
          ).join(', ');
        } else if (typeof docType === 'object' && docType.docType) {
          displayType = formatDocType(docType.docType);
        } else {
          displayType = 'Documentation';
        }

        return (
          <span className="text-sm text-slate-600 dark:text-slate-400">
            {displayType}
          </span>
        );
      }
    },
    {
      accessorKey: 'created_at',
      header: 'Generated',
      enableSorting: true,
      size: 160,
      minSize: 120,
      maxSize: 220,
      cell: ({ row }) => {
        const batch = row.original;
        // For single-file batches, use the document's generated_at if available (from filtered results)
        const displayDate = batch.first_doc_generated_at || batch.created_at;
        return (
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {formatDate(displayDate)}
          </span>
        );
      }
    },
    {
      accessorKey: 'avg_grade',
      header: 'Grade',
      enableSorting: true,
      size: 100,
      minSize: 80,
      maxSize: 150,
      cell: ({ row }) => {
        const batch = row.original;
        const isSingleFile = batch.batch_type === 'single';

        let score, grade;
        if (isSingleFile && batch.first_doc_quality_score) {
          // For single files, get score and grade from the document's quality_score
          const qualityScore = batch.first_doc_quality_score;
          score = typeof qualityScore === 'object' ? qualityScore.score : qualityScore;
          grade = typeof qualityScore === 'object' && qualityScore.grade
            ? qualityScore.grade
            : (score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F');
        } else {
          // For multi-file batches, use the batch's aggregated values
          grade = batch.avg_grade;
          score = batch.avg_quality_score;
        }

        if (!grade && !score) {
          return <span className="text-slate-400 dark:text-slate-500">—</span>;
        }

        return (
          <span className={`text-sm font-semibold ${getGradeColor(grade)}`}>
            {grade}
            {score && <span className="font-normal ml-1">({score}%)</span>}
          </span>
        );
      }
    },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      enableResizing: false,
      size: 100,
      cell: ({ row }) => {
        const batch = row.original;
        const isSingleFile = batch.total_files === 1;

        // Single file or user has batch processing - show open button
        if (isSingleFile || canUseBatchProcessing) {
          return (
            <button
              onClick={(e) => handleOpenInWorkspace(batch.id, e)}
              disabled={openingBatchId === batch.id}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 dark:focus-visible:ring-slate-400 disabled:opacity-50"
              title={isSingleFile ? 'Open in Workspace' : 'Open all files in Workspace'}
            >
              {openingBatchId === batch.id ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <ExternalLink className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">{isSingleFile ? 'Open' : 'Open All'}</span>
            </button>
          );
        }

        // Multi-file batch but no batch processing feature
        return (
          <span
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-400 dark:text-slate-500 cursor-not-allowed"
            title="Upgrade to Pro to open multi-file batches"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Pro</span>
          </span>
        );
      }
    }
  ], [canUseBatchProcessing, openingBatchId, formatDate, formatDocType, getGradeColor, handleOpenInWorkspace]);

  // Render expanded row content - uses grid layout to align with parent columns
  // Columns: [Expand button] [File/Batch] [Doc Type] [Date] [Grade] [Actions]
  const renderExpandedRow = useCallback((row, gridTemplateColumns) => {
    const batch = row.original;
    const documents = expandedBatches[batch.id];

    if (loadingBatchId === batch.id) {
      return (
        <div className="bg-slate-50/50 dark:bg-slate-800/50 px-4 py-4">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Loading documents...</span>
          </div>
        </div>
      );
    }

    if (!documents || documents.length === 0) {
      return (
        <div className="bg-slate-50/50 dark:bg-slate-800/50 px-4 py-3">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No documents found
          </p>
        </div>
      );
    }

    return (
      <div>
        {documents.map((doc) => {
          const score = doc.quality_score
            ? (typeof doc.quality_score === 'object' ? doc.quality_score.score : doc.quality_score)
            : null;
          const grade = score
            ? (typeof doc.quality_score === 'object' && doc.quality_score.grade
                ? doc.quality_score.grade
                : (score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F'))
            : null;

          return (
            <div
              key={doc.id}
              role="row"
              className="relative grid items-center bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors group"
              style={{ gridTemplateColumns }}
            >
              {/* Continuous left border line for hierarchy */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-200/60 dark:bg-slate-600/40" aria-hidden="true" />
              {/* Empty cell for expand button column alignment */}
              <div role="cell" className="px-2 py-3"></div>

              {/* File column */}
              <div role="cell" className="px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex-shrink-0">
                    <FileText className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                      {doc.filename || 'Untitled'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Doc Type column */}
              <div role="cell" className="px-4 py-3">
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  {formatDocType(doc.doc_type)}
                </span>
              </div>

              {/* Date column */}
              <div role="cell" className="px-4 py-3">
                {doc.created_at ? (
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    {formatDate(doc.created_at)}
                  </span>
                ) : (
                  <span className="text-slate-400 dark:text-slate-500">—</span>
                )}
              </div>

              {/* Grade column */}
              <div role="cell" className="px-4 py-3">
                {grade ? (
                  <span className={`text-sm font-semibold ${getGradeColor(grade)}`}>
                    {grade}
                    {score && <span className="font-normal ml-1">({score}%)</span>}
                  </span>
                ) : (
                  <span className="text-slate-400 dark:text-slate-500">—</span>
                )}
              </div>

              {/* Actions column */}
              <div role="cell" className="px-4 py-3">
                <button
                  onClick={(e) => handleOpenDocInWorkspace(doc, batch.id, e)}
                  className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-md transition-all focus:outline-none focus:opacity-100 focus-visible:ring-2 focus-visible:ring-slate-500"
                  title="Open in Workspace"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Open</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  }, [expandedBatches, loadingBatchId, formatDocType, getGradeColor, handleOpenDocInWorkspace]);

  // Determine if row can expand (only multi-file batches)
  const getRowCanExpand = useCallback((row) => {
    return row.original.total_files > 1;
  }, []);

  // Handle row expansion toggle - load documents when expanding
  const handleRowExpandToggle = useCallback((row, isExpanding) => {
    const batchId = row.original.id;

    if (isExpanding) {
      // Load documents for this batch
      handleBatchExpand(batchId);
    } else {
      // Clear documents when collapsing
      setExpandedBatches(prev => {
        const next = { ...prev };
        delete next[batchId];
        return next;
      });
    }
  }, [handleBatchExpand]);

  // Loading skeleton
  if (isLoading && batches.length === 0) {
    return (
      <PageLayout showGradient={false} className="bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950">
        <div className="container mx-auto px-4 max-w-5xl pt-6 pb-12">
          <div className="mb-8 animate-pulse">
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-lg w-48 mb-3"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-lg w-96"></div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="animate-pulse">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4 border-b border-slate-200 dark:border-slate-700 last:border-b-0">
                  <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-48 mb-2"></div>
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-32"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  // Upgrade prompt for users without access
  if (!hasAccess) {
    return (
      <PageLayout showGradient={false} className="bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950">
        <div className="container mx-auto px-4 max-w-5xl pt-6 pb-12">
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
      <div className="container mx-auto px-4 max-w-5xl pt-6 pb-12">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors mb-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 dark:focus-visible:ring-slate-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 rounded-lg px-2 py-1"
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
            <div className="flex items-center gap-2">
              {/* Filter toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`
                  inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border rounded-lg transition-all duration-200
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 dark:focus-visible:ring-slate-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900
                  ${showFilters || hasActiveFilters
                    ? 'text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600'
                    : 'text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }
                `}
              >
                <Filter className="w-4 h-4" />
                Filters
                {hasActiveFilters && (
                  <span className="w-2 h-2 bg-slate-600 dark:bg-slate-300 rounded-full" />
                )}
              </button>

              {/* Refresh */}
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className={`
                  inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg
                  hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-200
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 dark:focus-visible:ring-slate-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900
                  disabled:opacity-50 disabled:cursor-not-allowed
                  ${isRefreshing ? 'animate-pulse' : ''}
                `}
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>
          <p className="text-slate-600 dark:text-slate-400">
            View your past documentation generations
            {pagination.total > 0 && (
              <span className="ml-2 text-slate-500 dark:text-slate-500">
                ({pagination.totalDocuments} {pagination.totalDocuments === 1 ? 'doc' : 'docs'} in {pagination.total} {pagination.total === 1 ? 'batch' : 'batches'})
              </span>
            )}
          </p>
        </div>

        {/* Filters panel */}
        {showFilters && (
          <div className="mb-6 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex flex-wrap items-end gap-4">
              {/* Filename search */}
              <div className="flex-1 min-w-[200px] max-w-[300px]">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Search Files
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={filenameSearch}
                    onChange={(e) => setFilenameSearch(e.target.value)}
                    placeholder="Search by filename..."
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500 dark:focus:ring-slate-400 focus:border-transparent transition-colors"
                    aria-label="Search by filename"
                  />
                </div>
              </div>

              {/* Grade filter */}
              <div className="flex-1 min-w-[160px] max-w-[200px]">
                <Select
                  label="Grade"
                  options={GRADE_OPTIONS}
                  value={gradeFilter}
                  onChange={setGradeFilter}
                  ariaLabel="Filter by grade"
                />
              </div>

              {/* Doc type filter */}
              <div className="flex-1 min-w-[160px] max-w-[200px]">
                <Select
                  label="Doc Type"
                  options={DOC_TYPE_OPTIONS}
                  value={docTypeFilter}
                  onChange={setDocTypeFilter}
                  ariaLabel="Filter by documentation type"
                />
              </div>

              {/* Clear filters */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Clear
                </button>
              )}
            </div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        )}

        {/* Table */}
        <BaseTable
          data={batches}
          columns={columns}
          sorting={sorting}
          onSortingChange={handleSortingChange}
          manualSorting={true}
          pagination={pagination}
          onPageChange={handlePageChange}
          manualPagination={true}
          renderExpandedRow={renderExpandedRow}
          getRowCanExpand={getRowCanExpand}
          onRowExpandToggle={handleRowExpandToggle}
          enableColumnResizing={true}
          columnSizing={columnSizing}
          onColumnSizingChange={onColumnSizingChange}
          isLoading={isLoading}
          isRefreshing={isRefreshing}
          emptyState={{
            icon: FileText,
            title: 'No generations yet',
            description: hasActiveFilters
              ? 'No results match your filters. Try adjusting or clearing filters.'
              : 'Start generating documentation to see your history here.',
            action: hasActiveFilters ? (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-2 px-4 py-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 font-medium transition-colors"
              >
                <X className="w-4 h-4" />
                Clear Filters
              </button>
            ) : (
              <button
                onClick={() => navigate('/')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 font-medium rounded-lg transition-colors"
              >
                Generate Documentation
              </button>
            )
          }}
        />
      </div>
    </PageLayout>
  );
}

export default History;
