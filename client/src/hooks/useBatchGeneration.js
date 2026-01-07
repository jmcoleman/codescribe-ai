/**
 * useBatchGeneration Hook
 *
 * Manages batch/bulk documentation generation state and logic.
 * Extracted from App.jsx to improve code organization.
 *
 * Responsibilities:
 * - Batch generation progress tracking
 * - Throttle countdown between API calls
 * - Batch summary state
 * - Error tracking for failed files
 * - Batch ID for database persistence
 *
 * @module hooks/useBatchGeneration
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { toastCompact } from '../utils/toastWithHistory';
import * as batchesApi from '../services/batchesApi';
import { analyzeProject } from '../services/graphApi';
import { formatDateTime } from '../utils/formatters';
import { hasFeature } from '../utils/tierFeatures';
import { trackInteraction } from '../utils/analytics';

// Rate limit delay between API calls (15 seconds to respect Claude API limits)
const RATE_LIMIT_DELAY = 15000;

// sessionStorage key for batch summary state (persists across refresh)
const BATCH_SUMMARY_STATE_KEY = 'codescribe_batch_summary_state';

/**
 * Clear batch state from sessionStorage
 * Called on logout to prevent stale batch content from showing
 */
export function clearBatchSessionStorage() {
  try {
    sessionStorage.removeItem(BATCH_SUMMARY_STATE_KEY);
    sessionStorage.removeItem('bulk_generation_summary');
    sessionStorage.removeItem('batch_summary_markdown');
    sessionStorage.removeItem('current_batch_id');
    console.log('[useBatchGeneration] Cleared batch state from sessionStorage (logout)');
  } catch (error) {
    console.error('[useBatchGeneration] Error clearing batch state:', error);
  }
}

/**
 * Build tier-based attribution footer (matches server-side docGenerator.buildAttribution)
 * @param {string} tier - User tier (free, starter, pro, premium, team, enterprise)
 * @param {Object} trialInfo - Optional trial info { isOnTrial, trialEndsAt }
 * @returns {string} Attribution markdown
 */
export const buildAttribution = (tier, trialInfo = null) => {
  // Trial attribution takes precedence - shows trial status with expiry date
  if (trialInfo?.isOnTrial && trialInfo?.trialEndsAt) {
    const formattedDate = new Date(trialInfo.trialEndsAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    return `\n\n---\n*🔶 Trial Access - Generated with [CodeScribe AI](https://codescribeai.com)*  \n*Trial expires: ${formattedDate} | [Upgrade to Pro](https://codescribeai.com/pricing) to remove this watermark*`;
  }

  const attributions = {
    free: `\n\n---\n*🟣 Generated with [CodeScribe AI](https://codescribeai.com) • Free Tier*  \n*Upgrade to [Pro](https://codescribeai.com/pricing) to remove this watermark and unlock advanced features*`,
    starter: `\n\n---\n*🟣 Generated with [CodeScribe AI](https://codescribeai.com) • Starter*  \n*Upgrade to [Pro](https://codescribeai.com/pricing) to unlock batch processing and custom templates*`,
    pro: `\n\n---\n*Generated with [CodeScribe AI](https://codescribeai.com) - AI-powered code documentation*`,
    premium: `\n\n---\n*Generated with [CodeScribe AI](https://codescribeai.com) - AI-powered code documentation*`,
    team: `\n\n---\n*Generated with [CodeScribe AI](https://codescribeai.com)*`,
    enterprise: '' // No attribution for enterprise
  };
  return tier in attributions ? attributions[tier] : attributions.free;
};

/**
 * Generate markdown document summarizing batch generation results
 * @param {Object} summary - Batch summary data
 * @param {Array} failedFiles - Array of failed file objects
 * @param {string} tier - User tier for attribution
 * @param {Object} trialInfo - Optional trial info { isOnTrial, trialEndsAt }
 * @returns {string} Markdown document
 */
export const generateBatchSummaryDocument = (summary, failedFiles = [], tier = 'free', trialInfo = null) => {
  const { totalFiles, successCount, failCount, skippedCount = 0, avgQuality, avgGrade, successfulFiles = [], skippedFiles = [], wasCancelled = false } = summary;

  // Format timestamp: "Dec 3, 2025 at 10:30 PM"
  const timestamp = formatDateTime(new Date());

  let markdown = `# Batch Documentation Summary

`;

  // Determine status message
  let statusMessage;
  if (wasCancelled) {
    statusMessage = `⚠️ Cancelled - ${successCount} of ${totalFiles} files completed`;
  } else if (failCount === 0) {
    statusMessage = '✅ All files completed successfully';
  } else {
    statusMessage = `⚠️ ${failCount} file${failCount > 1 ? 's' : ''} failed`;
  }

  // Generated timestamp and status as a clean 2-column table
  markdown += `| | |\n`;
  markdown += `|---|---|\n`;
  markdown += `| **Generated** | ${timestamp} |\n`;
  markdown += `| **Status** | ${statusMessage} |\n\n`;

  // Overall Statistics as a compact single-row table
  // Include skipped column only if there are skipped files
  if (skippedCount > 0) {
    markdown += `## Overall Statistics

| Total Files | Successful | Failed | Skipped | Avg Quality |
|-------------|------------|--------|---------|-------------|
| ${totalFiles} | ${successCount} | ${failCount} | ${skippedCount} | ${avgQuality}/100 (${avgGrade || 'N/A'}) |

`;
  } else {
    markdown += `## Overall Statistics

| Total Files | Successful | Failed | Avg Quality |
|-------------|------------|--------|-------------|
| ${totalFiles} | ${successCount} | ${failCount} | ${avgQuality}/100 (${avgGrade || 'N/A'}) |

`;
  }

  // Generated Files table
  if (successfulFiles.length > 0) {
    markdown += `## Generated Files

| File | Doc Type | Quality | Grade | Actions |
|------|----------|---------|-------|---------|
`;

    successfulFiles.forEach(file => {
      const encodedFilename = encodeURIComponent(file.name);
      const exportAction = `[Export](#export:${encodedFilename})`;
      // Use documentId for links (enables viewing specific document version)
      // documentId is required - files without it won't have clickable links
      const fileLink = file.documentId
        ? `[${file.name}](#doc:${file.documentId})`
        : file.name; // Plain text if no documentId (shouldn't happen for saved docs)
      markdown += `| ${fileLink} | ${file.docType} | ${file.score}/100 | ${file.grade} | ${exportAction} |\n`;
    });

    markdown += '\n';
  }

  // Failed Files section
  if (failedFiles.length > 0) {
    markdown += `## Failed Files

| File | Error |
|------|-------|
`;

    failedFiles.forEach(file => {
      const escapedError = file.error.replace(/\|/g, '\\|').replace(/\n/g, ' ');
      markdown += `| ${file.filename} | ${escapedError} |\n`;
    });

    markdown += '\n';
  }

  // Skipped Files section (cancelled before processing)
  if (skippedFiles.length > 0) {
    markdown += `## Skipped Files

*These files were not processed due to batch cancellation.*

| File | Doc Type |
|------|----------|
`;

    skippedFiles.forEach(file => {
      markdown += `| ${file.filename} | ${file.docType} |\n`;
    });

    markdown += '\n';
  }

  // Quality Assessment - grouped by doc type with appropriate criteria columns
  if (successfulFiles.length > 0 && successfulFiles.some(f => f.qualityScore?.breakdown)) {
    markdown += `## Quality Assessment\n\n`;

    // Group files by doc type
    const filesByDocType = {};
    successfulFiles.forEach(file => {
      if (file.qualityScore?.breakdown) {
        const docType = file.docType || 'README';
        if (!filesByDocType[docType]) {
          filesByDocType[docType] = [];
        }
        filesByDocType[docType].push(file);
      }
    });

    // Define columns for each doc type
    const docTypeColumns = {
      README: {
        headers: ['File', 'Overview', 'Install', 'Examples', 'API Docs', 'Structure'],
        getRow: (file, b) => {
          const overview = b.overview?.status === 'complete' ? '✓' : b.overview?.status === 'partial' ? '◐' : '✗';
          const install = b.installation?.status === 'complete' ? '✓' : b.installation?.status === 'partial' ? '◐' : '✗';
          const examples = b.examples?.status === 'complete' ? '✓' : b.examples?.status === 'partial' ? '◐' : '✗';
          const apiDocs = b.apiDocs?.status === 'complete' ? '✓' : b.apiDocs?.status === 'partial' ? '◐' : '✗';
          const structure = b.structure?.status === 'complete' ? '✓' : b.structure?.status === 'partial' ? '◐' : '✗';
          return `| ${file.name} | ${overview} | ${install} | ${examples} | ${apiDocs} | ${structure} |`;
        }
      },
      JSDOC: {
        headers: ['File', 'Functions', 'Params', 'Returns', 'Examples', 'Types'],
        getRow: (file, b) => {
          const funcs = b.functionCoverage?.status === 'complete' ? '✓' : b.functionCoverage?.status === 'partial' ? '◐' : '✗';
          const params = b.parameters?.status === 'complete' ? '✓' : b.parameters?.status === 'partial' ? '◐' : '✗';
          const returns = b.returns?.status === 'complete' ? '✓' : b.returns?.status === 'partial' ? '◐' : '✗';
          const examples = b.examples?.status === 'complete' ? '✓' : b.examples?.status === 'partial' ? '◐' : '✗';
          const types = b.types?.status === 'complete' ? '✓' : b.types?.status === 'partial' ? '◐' : '✗';
          return `| ${file.name} | ${funcs} | ${params} | ${returns} | ${examples} | ${types} |`;
        }
      },
      API: {
        headers: ['File', 'Endpoints', 'Requests', 'Responses', 'Examples', 'Errors'],
        getRow: (file, b) => {
          const endpoints = b.endpoints?.status === 'complete' ? '✓' : b.endpoints?.status === 'partial' ? '◐' : '✗';
          const requests = b.requests?.status === 'complete' ? '✓' : b.requests?.status === 'partial' ? '◐' : '✗';
          const responses = b.responses?.status === 'complete' ? '✓' : b.responses?.status === 'partial' ? '◐' : '✗';
          const examples = b.examples?.status === 'complete' ? '✓' : b.examples?.status === 'partial' ? '◐' : '✗';
          const errors = b.errors?.status === 'complete' ? '✓' : b.errors?.status === 'partial' ? '◐' : '✗';
          return `| ${file.name} | ${endpoints} | ${requests} | ${responses} | ${examples} | ${errors} |`;
        }
      },
      OPENAPI: {
        headers: ['File', 'Structure', 'Endpoints', 'Schemas', 'Params', 'Descriptions'],
        getRow: (file, b) => {
          const structure = b.structure?.status === 'complete' ? '✓' : b.structure?.status === 'partial' ? '◐' : '✗';
          const endpoints = b.endpoints?.status === 'complete' ? '✓' : b.endpoints?.status === 'partial' ? '◐' : '✗';
          const schemas = b.schemas?.status === 'complete' ? '✓' : b.schemas?.status === 'partial' ? '◐' : '✗';
          const params = b.parameters?.status === 'complete' ? '✓' : b.parameters?.status === 'partial' ? '◐' : '✗';
          const descriptions = b.descriptions?.status === 'complete' ? '✓' : b.descriptions?.status === 'partial' ? '◐' : '✗';
          return `| ${file.name} | ${structure} | ${endpoints} | ${schemas} | ${params} | ${descriptions} |`;
        }
      },
      ARCHITECTURE: {
        headers: ['File', 'Overview', 'Components', 'Data Flow', 'Diagrams', 'Decisions'],
        getRow: (file, b) => {
          const overview = b.overview?.status === 'complete' ? '✓' : b.overview?.status === 'partial' ? '◐' : '✗';
          const components = b.components?.status === 'complete' ? '✓' : b.components?.status === 'partial' ? '◐' : '✗';
          const dataFlow = b.dataFlow?.status === 'complete' ? '✓' : b.dataFlow?.status === 'partial' ? '◐' : '✗';
          const diagrams = b.diagrams?.status === 'complete' ? '✓' : b.diagrams?.status === 'partial' ? '◐' : '✗';
          const decisions = b.decisions?.status === 'complete' ? '✓' : b.decisions?.status === 'partial' ? '◐' : '✗';
          return `| ${file.name} | ${overview} | ${components} | ${dataFlow} | ${diagrams} | ${decisions} |`;
        }
      }
    };

    // Format doc type for readable section headings
    const formatDocTypeHeading = (type) => {
      const headingMap = {
        'README': 'README',
        'JSDOC': 'JSDoc',
        'API': 'API',
        'OPENAPI': 'OpenAPI',
        'ARCHITECTURE': 'Architecture'
      };
      return headingMap[type] || type;
    };

    // Generate tables for each doc type
    Object.entries(filesByDocType).forEach(([docType, files]) => {
      const config = docTypeColumns[docType] || docTypeColumns.README;

      // Add doc type subheading if multiple doc types
      if (Object.keys(filesByDocType).length > 1) {
        markdown += `### ${formatDocTypeHeading(docType)}\n\n`;
      }

      // Table header
      markdown += `| ${config.headers.join(' | ')} |\n`;
      markdown += `|${config.headers.map(() => '------').join('|')}|\n`;

      // Table rows
      files.forEach(file => {
        markdown += config.getRow(file, file.qualityScore.breakdown) + '\n';
      });

      markdown += '\n';
    });

    // Legend
    markdown += `*Legend: ✓ Complete | ◐ Partial | ✗ Missing*\n\n`;
  }

  // Add tier-based attribution footer (use effectiveTier for tier overrides, trialInfo for trials)
  markdown += buildAttribution(tier, trialInfo);

  return markdown;
};

/**
 * Custom hook for managing batch generation state and operations
 *
 * @param {Object} options - Hook options
 * @param {Function} options.generate - Generate function from useDocGeneration
 * @param {Function} options.cancelGeneration - Cancel function from useDocGeneration (aborts in-flight request)
 * @param {Function} options.setDocumentation - Set documentation state
 * @param {Function} options.setQualityScore - Set quality score state
 * @param {Function} options.setDocType - Set doc type state (for panel title)
 * @param {Function} options.setFilename - Set filename state (for panel title)
 * @param {Object} options.multiFileState - Multi-file state from useWorkspacePersistence
 * @param {Object} options.documentPersistence - Document persistence from useDocumentPersistence
 * @param {boolean} options.isAuthenticated - Whether user is authenticated
 * @param {Function} options.canGenerate - Usage check function
 * @param {Function} options.setShowUsageLimitModal - Show usage limit modal
 * @param {Function} options.refetchUsage - Refetch usage stats
 * @param {string} options.userTier - User's effective tier for attribution
 * @param {Object} options.trialInfo - Optional trial info { isOnTrial, trialEndsAt }
 * @param {number|null} options.projectId - Optional project ID for batch association
 * @param {string|null} options.projectName - Optional project name for file metadata
 * @returns {Object} Batch generation state and handlers
 */
export function useBatchGeneration({
  generate,
  cancelGeneration,
  setDocumentation,
  setQualityScore,
  setDocType,
  setFilename,
  multiFileState,
  documentPersistence,
  isAuthenticated,
  canGenerate,
  setShowUsageLimitModal,
  refetchUsage,
  userTier = 'free',
  trialInfo = null,
  projectId = null,
  projectName = null,
  user = null
}) {
  // Load initial batch state from sessionStorage (persists across refresh)
  const loadInitialBatchState = () => {
    try {
      const saved = sessionStorage.getItem(BATCH_SUMMARY_STATE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed;
      }
    } catch (error) {
      console.error('[useBatchGeneration] Error loading batch state from sessionStorage:', error);
    }
    return null;
  };

  const initialBatchState = loadInitialBatchState();

  // Batch generation progress state
  const [bulkGenerationProgress, setBulkGenerationProgress] = useState(null);
  const [currentlyGeneratingFile, setCurrentlyGeneratingFile] = useState(null);
  const [throttleCountdown, setThrottleCountdown] = useState(null);

  // Ref to track batch mode synchronously (avoids React batching race conditions)
  // This ref is set BEFORE any state updates, so the sync effect in App.jsx
  // can check it immediately without waiting for React to process state updates
  const isBatchModeRef = useRef(false);

  // Ref to track cancellation request - checked during batch loop
  const cancelRequestedRef = useRef(false);

  // State to track if cancellation is pending (for UI feedback)
  const [isCancelling, setIsCancelling] = useState(false);

  // State to track graph analysis progress
  const [isAnalyzingGraph, setIsAnalyzingGraph] = useState(false);

  // Batch results state (initialized from sessionStorage if available)
  const [bulkGenerationSummary, setBulkGenerationSummary] = useState(initialBatchState?.summary || null);
  const [batchSummaryMarkdown, setBatchSummaryMarkdown] = useState(initialBatchState?.markdown || null);
  const [bulkGenerationErrors, setBulkGenerationErrors] = useState(initialBatchState?.errors || []);
  const [currentBatchId, setCurrentBatchId] = useState(initialBatchState?.batchId || null);

  // Track if banner has been dismissed (persists across refresh)
  const [bannerDismissed, setBannerDismissed] = useState(initialBatchState?.bannerDismissed || false);

  // Regeneration confirmation modal state
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);
  const [regenerateModalData, setRegenerateModalData] = useState(null);

  // Save batch state to sessionStorage whenever it changes
  // IMPORTANT: This syncs both saves AND clears. When batch state is cleared via flushSync
  // at the start of a new generation, we must also clear sessionStorage to prevent
  // the old batch banner from persisting.
  useEffect(() => {
    try {
      // If any batch state exists, save it
      if (batchSummaryMarkdown || bulkGenerationSummary || currentBatchId) {
        const state = {
          summary: bulkGenerationSummary,
          markdown: batchSummaryMarkdown,
          errors: bulkGenerationErrors,
          batchId: currentBatchId,
          bannerDismissed: bannerDismissed
        };
        sessionStorage.setItem(BATCH_SUMMARY_STATE_KEY, JSON.stringify(state));
      } else {
        // All batch state is cleared - remove from sessionStorage
        // This ensures the banner doesn't persist when starting a new generation
        sessionStorage.removeItem(BATCH_SUMMARY_STATE_KEY);
      }
    } catch (error) {
      console.error('[useBatchGeneration] Error syncing batch state to sessionStorage:', error);
    }
  }, [bulkGenerationSummary, batchSummaryMarkdown, bulkGenerationErrors, currentBatchId, bannerDismissed]);

  /**
   * Execute batch generation with the given files
   * Called directly or after modal confirmation
   */
  const executeBatchGeneration = useCallback(async (filesToGenerate) => {
    // Prevent starting a new batch while one is still in progress (including cleanup)
    // This prevents race conditions when cancelling and immediately regenerating
    if (isBatchModeRef.current) {
      console.log('[useBatchGeneration] Batch already in progress, ignoring new request');
      toastCompact('Please wait for the current batch to finish', 'warning', { id: 'batch-in-progress' });
      return;
    }

    // Check usage quota for bulk generation
    if (!canGenerate()) {
      setShowUsageLimitModal(true);
      return;
    }

    // Clear ALL files' generating state first to prevent stale spinners
    // This handles cases where a previous batch was interrupted or cancelled
    multiFileState.files.forEach(file => {
      if (file.isGenerating) {
        multiFileState.updateFile(file.id, { isGenerating: false });
      }
    });

    // Clear previous batch state before starting new generation
    // Note: The banner is hidden during generation via the bulkGenerationProgress check in App.jsx,
    // so we don't need flushSync here - normal state updates are sufficient
    setDocumentation('');
    setQualityScore(null);
    setBulkGenerationSummary(null);
    setBatchSummaryMarkdown(null);
    setCurrentBatchId(null);
    setBulkGenerationErrors([]);
    setBannerDismissed(false);
    setCurrentlyGeneratingFile(null);

    // Track batch start time for duration analytics
    const batchStartTime = Date.now();

    // Run graph analysis BEFORE batch generation (Pro+ only)
    // This ensures the graph is ready for cross-file awareness during doc generation
    let graphId = null;
    let resolvedProjectName = projectName; // Use passed projectName, may be updated from graph result
    console.log('[useBatchGeneration] Starting batch with projectId:', projectId, 'projectName:', projectName);
    if (projectId && hasFeature(user, 'batchProcessing')) {
      try {
        // Collect ALL workspace files (not just files to generate) for complete graph
        const allWorkspaceFiles = multiFileState.files
          .filter(f => f.content && f.content.length > 0)
          .map(f => ({
            path: f.github?.path || f.filename, // Use GitHub path if available, else filename
            content: f.content
          }));

        if (allWorkspaceFiles.length > 0) {
          console.log('[useBatchGeneration] Starting graph analysis for', allWorkspaceFiles.length, 'workspace files');
          setIsAnalyzingGraph(true);

          try {
            const result = await analyzeProject({
              projectName: projectName || 'Workspace', // Use actual project name if available
              files: allWorkspaceFiles,
              projectId: projectId,  // FK to projects table
              branch: 'main',
              projectPath: ''
            });

            if (result.success && result.graph?.graphId) {
              graphId = result.graph.graphId;
              // Use project name from graph result if available (may differ from input)
              resolvedProjectName = result.graph.projectName || projectName;
              console.log('[useBatchGeneration] Graph analysis complete:', graphId, 'project:', resolvedProjectName);
            }
          } catch (err) {
            // Log but don't block generation - graph is an enhancement, not required
            console.warn('[useBatchGeneration] Graph analysis failed (non-blocking):', err.message);
          } finally {
            setIsAnalyzingGraph(false);
          }
        }
      } catch (err) {
        console.warn('[useBatchGeneration] Graph analysis setup failed:', err.message);
        setIsAnalyzingGraph(false);
      }
    }

    const totalFiles = filesToGenerate.length;
    let successCount = 0;
    let failureCount = 0;
    const failedFiles = [];
    const successfulFiles = [];
    const skippedFiles = []; // Track files skipped due to cancellation

    // Set batch mode ref SYNCHRONOUSLY before any async state updates
    // This prevents the App.jsx sync effect from resetting filename to 'code.js'
    // because ref updates happen immediately, not in React's batched state updates
    isBatchModeRef.current = true;

    // Reset cancellation flags at the start of a new batch
    cancelRequestedRef.current = false;
    setIsCancelling(false);

    // Initialize progress state
    setBulkGenerationProgress({
      total: totalFiles,
      completed: 0,
      currentBatch: 1,
      totalBatches: 1
    });

    // Clear active file to prevent sync effect from interfering
    multiFileState.setActiveFile(null);

    // Process files sequentially with rate limiting
    for (let i = 0; i < filesToGenerate.length; i++) {
      // Check for cancellation before starting each file
      if (cancelRequestedRef.current) {
        console.log('[useBatchGeneration] Batch cancelled by user');
        // Track remaining files as skipped
        for (let j = i; j < filesToGenerate.length; j++) {
          skippedFiles.push({
            filename: filesToGenerate[j].filename,
            fileId: filesToGenerate[j].id,
            docType: filesToGenerate[j].docType || 'README'
          });
        }
        break;
      }

      const file = filesToGenerate[i];

      // Capture previous state for regeneration tracking
      const isRegeneration = !!file.documentation;
      const previousScore = file.qualityScore?.score ?? null;

      // Update progress state
      setBulkGenerationProgress({
        total: totalFiles,
        completed: i,
        currentBatch: 1,
        totalBatches: 1
      });

      // Mark file as generating
      multiFileState.updateFile(file.id, {
        isGenerating: true,
        error: null
      });

      // Show which file is currently being generated
      setCurrentlyGeneratingFile({
        filename: file.filename,
        index: i + 1,
        total: totalFiles,
        docType: file.docType
      });

      // Update panel title to show current file being generated
      if (setFilename) {
        setFilename(file.filename);
      }
      if (setDocType) {
        setDocType(file.docType);
      }

      // Clear previous documentation to show fresh streaming
      setDocumentation('');
      setQualityScore(null);

      try {
        console.log(`[useBatchGeneration] Starting generation for file ${i + 1}/${totalFiles}: ${file.filename}${graphId ? ` (with graph ${graphId})` : ''}`);
        const startTime = Date.now();
        // Pass graphId, projectId, and filePath via options object for graph context
        const result = await generate(file.content, file.docType, file.language, false, file.filename, {
          graphId,      // Direct graph ID from analysis (32-char hash)
          projectId,    // FK to projects table (for fallback lookup)
          filePath: file.github?.path || file.filename  // File path within project
        });
        console.log(`[useBatchGeneration] Generation completed for ${file.filename} in ${(Date.now() - startTime) / 1000}s`);

        const generatedAt = new Date();

        // Save document to database (if authenticated)
        let documentId = null;
        if (isAuthenticated) {
          try {
            console.log('[useBatchGeneration] Saving document with metadata:', result.metadata, 'graphId:', graphId);
            const saveResult = await documentPersistence.saveDocument({
              filename: file.filename,
              language: file.language,
              fileSize: file.fileSize,
              documentation: result.documentation,
              qualityScore: result.qualityScore,
              docType: file.docType,
              origin: file.origin || 'upload',
              provider: result.metadata?.provider || 'claude',
              model: result.metadata?.model || 'claude-sonnet-4-5-20250929',
              github: file.github || null,
              llm: result.metadata || null,
              graphId: graphId || null  // Store graph reference for cross-file context
            }, 'save');

            if (saveResult) {
              documentId = saveResult.documentId;
              console.log(`[useBatchGeneration] Saved document to database: ${documentId}`);
            }
          } catch (saveError) {
            console.error('[useBatchGeneration] Failed to save document to database:', saveError);
          }
        }

        // Update file with generated documentation
        // Store generatedDocType to track what was actually generated (separate from selected docType)
        // Include graphId and projectName for file details panel
        multiFileState.updateFile(file.id, {
          documentation: result.documentation,
          qualityScore: result.qualityScore,
          isGenerating: false,
          error: null,
          documentId: documentId,
          generatedAt,
          generatedDocType: file.docType || 'README',
          graphId: graphId || null,              // Graph ID for cross-file context
          projectName: resolvedProjectName || null  // Project name for file details
        });

        // Update usage tracking
        refetchUsage();

        // Track successful file
        successCount++;
        const newScore = result.qualityScore?.score || 0;
        successfulFiles.push({
          name: file.filename,
          score: newScore,
          grade: result.qualityScore?.grade || 'N/A',
          qualityScore: result.qualityScore,
          docType: file.docType || 'README',
          generatedAt: generatedAt,
          fileId: file.id,
          documentId: documentId, // Store documentId directly to avoid race condition with React state
          provider: result.metadata?.provider || 'claude',
          model: result.metadata?.model || 'unknown'
        });

        // Track regeneration success rate (before/after score comparison)
        if (isRegeneration && previousScore !== null) {
          const improvement = newScore - previousScore;
          trackInteraction('regeneration_complete', {
            previous_score: previousScore,
            new_score: newScore,
            improvement: improvement,
            improved: improvement > 0 ? 'true' : 'false',
            doc_type: file.docType || 'README',
            filename: file.filename,
          });
        }

      } catch (error) {
        console.error(`[useBatchGeneration] Failed to generate docs for ${file.filename}:`, error);

        // Update file with error state
        multiFileState.updateFile(file.id, {
          isGenerating: false,
          error: error.message
        });

        // Track failed file
        failureCount++;
        failedFiles.push({
          filename: file.filename,
          fileId: file.id,
          error: error.message
        });

        // Check if this is a rate limit, usage limit, or credit error - skip remaining files
        // These errors will affect all subsequent files, so no point retrying
        const errorLower = error.message?.toLowerCase() || '';
        const errorName = error.name || '';
        const isLimitError = errorName === 'RateLimitError' ||
                            errorName === 'UsageLimitError' ||
                            errorName === 'RATE_LIMIT' ||
                            errorLower.includes('rate limit') ||
                            errorLower.includes('usage limit') ||
                            errorLower.includes('limit exceeded') ||
                            errorLower.includes('quota exceeded') ||
                            errorLower.includes('credit balance') ||
                            errorLower.includes('insufficient credits') ||
                            errorLower.includes('billing');

        console.log('[useBatchGeneration] Error details:', { errorName, errorMessage: error.message, isLimitError });

        if (isLimitError && i < filesToGenerate.length - 1) {
          console.log('[useBatchGeneration] Rate/usage limit hit, skipping remaining files');

          // Track remaining files as skipped (starting from next file)
          for (let j = i + 1; j < filesToGenerate.length; j++) {
            skippedFiles.push({
              filename: filesToGenerate[j].filename,
              fileId: filesToGenerate[j].id,
              docType: filesToGenerate[j].docType || 'README'
            });
          }

          // Update final progress and clear indicators before breaking
          setBulkGenerationProgress({
            total: totalFiles,
            completed: totalFiles, // Mark as complete since we're done
            currentBatch: 1,
            totalBatches: 1
          });
          setCurrentlyGeneratingFile(null);
          break;
        }
      }

      // Update progress after each file
      setBulkGenerationProgress({
        total: totalFiles,
        completed: i + 1,
        currentBatch: 1,
        totalBatches: 1
      });

      // Clear currently generating file indicator
      setCurrentlyGeneratingFile(null);

      // Throttle between requests (except after last file)
      if (i < filesToGenerate.length - 1) {
        console.log(`[useBatchGeneration] Throttling for ${RATE_LIMIT_DELAY / 1000}s to respect API rate limits...`);

        const delaySeconds = RATE_LIMIT_DELAY / 1000;
        for (let remaining = delaySeconds; remaining > 0; remaining--) {
          // Check for cancellation during throttle countdown
          if (cancelRequestedRef.current) {
            console.log('[useBatchGeneration] Batch cancelled during throttle countdown');
            setThrottleCountdown(null);
            break;
          }
          setThrottleCountdown(remaining);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        setThrottleCountdown(null);

        // Check cancellation again after throttle loop exits
        if (cancelRequestedRef.current) {
          // Track remaining files as skipped (starting from next file)
          for (let j = i + 1; j < filesToGenerate.length; j++) {
            skippedFiles.push({
              filename: filesToGenerate[j].filename,
              fileId: filesToGenerate[j].id,
              docType: filesToGenerate[j].docType || 'README'
            });
          }
          break;
        }
      }
    }

    // Check if batch was cancelled
    const wasCancelled = cancelRequestedRef.current;

    // Clear selection after generation
    multiFileState.deselectAllFiles();

    // Clear progress state (but NOT batch mode ref yet - wait for async operations)
    setBulkGenerationProgress(null);
    setCurrentlyGeneratingFile(null);
    setThrottleCountdown(null);
    // NOTE: isBatchModeRef and cancelRequestedRef are reset AFTER async DB operations complete
    // to prevent race conditions when cancelling and immediately regenerating

    // Calculate average quality score
    let avgQuality = 0;
    let avgGrade = null;
    if (successfulFiles.length > 0) {
      const totalQuality = successfulFiles.reduce((sum, file) => sum + file.score, 0);
      avgQuality = Math.round(totalQuality / successfulFiles.length);

      if (avgQuality >= 90) avgGrade = 'A';
      else if (avgQuality >= 80) avgGrade = 'B';
      else if (avgQuality >= 70) avgGrade = 'C';
      else if (avgQuality >= 60) avgGrade = 'D';
      else avgGrade = 'F';
    }

    // Set summary state
    const batchGeneratedAt = new Date().toISOString();
    const summaryData = {
      totalFiles,
      successCount,
      failCount: failureCount,
      skippedCount: skippedFiles.length,
      avgQuality,
      avgGrade,
      successfulFiles,
      skippedFiles,
      wasCancelled,
      generatedAt: batchGeneratedAt
    };
    setBulkGenerationSummary(summaryData);

    // Track batch generation completion (analytics event)
    const batchEndTime = Date.now();
    const batchDuration = batchStartTime ? batchEndTime - batchStartTime : 0;
    trackInteraction('batch_generation_complete', {
      total_files: totalFiles,
      success_count: successCount,
      failed_count: failureCount,
      skipped_count: skippedFiles.length,
      avg_quality_score: avgQuality,
      avg_grade: avgGrade || 'N/A',
      doc_types: [...new Set(successfulFiles.map(f => f.docType))].join(','),
      was_cancelled: wasCancelled ? 'true' : 'false',
      duration_ms: batchDuration,
      source: projectId ? 'github' : 'upload',
    });

    if (failedFiles.length > 0) {
      setBulkGenerationErrors(failedFiles);
    }

    // Clear active file so sync effect doesn't overwrite batch summary
    multiFileState.setActiveFile(null);

    // Generate and display batch summary document (include trialInfo for trial attribution)
    const summaryMarkdown = generateBatchSummaryDocument(summaryData, failedFiles, userTier, trialInfo);
    setDocumentation(summaryMarkdown);
    setBatchSummaryMarkdown(summaryMarkdown);

    // Create batch record in database (if authenticated and at least some files were processed)
    // When cancelled, only count files that were actually processed (not skipped)
    const processedFiles = successCount + failureCount;
    if (isAuthenticated && processedFiles > 0) {
      try {
        const uniqueDocTypes = [...new Set(successfulFiles.map(f => f.docType))];
        // Use documentId directly from successfulFiles (not from React state) to avoid race condition
        const documentIds = successfulFiles
          .map(f => f.documentId)
          .filter(id => id);

        const batchResult = await batchesApi.createBatch({
          batchType: processedFiles === 1 ? 'single' : 'batch',
          totalFiles: processedFiles, // Only count files that were actually processed
          successCount,
          failCount: failureCount,
          avgQualityScore: avgQuality,
          avgGrade,
          summaryMarkdown,
          errorDetails: failedFiles.length > 0 ? failedFiles : null,
          docTypes: uniqueDocTypes,
          projectId: projectId,
          projectName: projectName // Denormalized for persistence if project deleted
        });

        if (batchResult.batchId) {
          setCurrentBatchId(batchResult.batchId);
          console.log(`[useBatchGeneration] Created batch: ${batchResult.batchId}`);

          // Update each successful file with the batchId so they can link back to summary
          successfulFiles.forEach(sf => {
            if (sf.fileId) {
              multiFileState.updateFile(sf.fileId, { batchId: batchResult.batchId });
            }
          });

          if (documentIds.length > 0) {
            try {
              const linkResult = await batchesApi.linkDocumentsToBatch(
                batchResult.batchId,
                documentIds
              );
              console.log(`[useBatchGeneration] Linked ${linkResult.linkedCount} documents to batch`);
            } catch (linkError) {
              console.error('[useBatchGeneration] Failed to link documents to batch:', linkError);
            }
          }
        }
      } catch (batchError) {
        console.error('[useBatchGeneration] Failed to create batch record:', batchError);
      }
    }

    // Set batch summary quality score
    setQualityScore({
      score: avgQuality,
      grade: avgGrade,
      breakdown: null,
      isBatchSummary: true,
      generatedAt: batchGeneratedAt
    });

    // NOW reset refs after all async operations are complete
    // This prevents race conditions when cancelling and immediately regenerating
    isBatchModeRef.current = false;
    cancelRequestedRef.current = false;
    setIsCancelling(false);

    // Show final result toast
    if (wasCancelled) {
      if (successCount > 0) {
        toastCompact(
          `Batch cancelled. Generated ${successCount} of ${totalFiles} file${totalFiles > 1 ? 's' : ''} before stopping.`,
          'warning',
          { id: 'bulk-generation' }
        );
      } else {
        toastCompact(
          'Batch generation cancelled.',
          'info',
          { id: 'bulk-generation' }
        );
      }
    } else if (failureCount === 0) {
      toastCompact(
        `Successfully generated documentation for ${successCount} file${successCount > 1 ? 's' : ''}`,
        'success',
        { id: 'bulk-generation' }
      );
    } else if (successCount > 0) {
      toastCompact(
        `Generated ${successCount} of ${totalFiles} files. ${failureCount} failed - see banner above.`,
        'warning',
        { id: 'bulk-generation' }
      );
    } else {
      toastCompact(
        `Failed to generate documentation for all ${totalFiles} files - see banner above.`,
        'error',
        { id: 'bulk-generation' }
      );
    }
  }, [
    multiFileState,
    canGenerate,
    setShowUsageLimitModal,
    generate,
    isAuthenticated,
    documentPersistence,
    refetchUsage,
    setDocumentation,
    setQualityScore,
    userTier,
    trialInfo,
    projectId,
    projectName,
    user
  ]);

  /**
   * Handle bulk generation for selected files
   * Shows confirmation modal if some files already have documentation
   */
  const handleGenerateSelected = useCallback(async (skipPreviouslyGenerated = false) => {
    const filesWithContent = multiFileState.files.filter(f => f.content && f.content.length > 0);
    const selectedFilesWithContent = filesWithContent.filter(f => multiFileState.selectedFileIds.includes(f.id));

    if (selectedFilesWithContent.length === 0) {
      toastCompact.error('No files with content selected');
      return;
    }

    // Check if any selected files already have documentation (only if not explicitly choosing to skip)
    if (!skipPreviouslyGenerated) {
      const filesWithDocs = selectedFilesWithContent.filter(f => f.documentation);
      const filesWithoutDocs = selectedFilesWithContent.filter(f => !f.documentation);

      // If there are files with existing documentation, show modal to ask user what to do
      if (filesWithDocs.length > 0) {
        setRegenerateModalData({
          filesWithDocs: filesWithDocs.length,
          totalFiles: selectedFilesWithContent.length,
          allFiles: selectedFilesWithContent,
          filesWithoutDocs,
          allHaveDocs: filesWithoutDocs.length === 0 // Track if ALL files have docs
        });
        setShowRegenerateModal(true);
        return;
      }
    }

    // No confirmation needed - proceed with generation
    await executeBatchGeneration(selectedFilesWithContent);
  }, [multiFileState.files, multiFileState.selectedFileIds, executeBatchGeneration]);

  /**
   * Handle user confirming to regenerate all files (from modal)
   */
  const handleRegenerateAll = useCallback(async () => {
    // Capture the files BEFORE clearing the modal data
    // This prevents handleGenerateNewOnly from running (which is called by ConfirmationModal after onConfirm)
    const filesToRegenerate = regenerateModalData?.allFiles;

    // Clear modal state immediately to prevent double-execution
    setShowRegenerateModal(false);
    setRegenerateModalData(null);

    if (filesToRegenerate) {
      await executeBatchGeneration(filesToRegenerate);
    }
  }, [regenerateModalData, executeBatchGeneration]);

  /**
   * Handle user choosing to only generate new files (from modal)
   */
  const handleGenerateNewOnly = useCallback(async () => {
    setShowRegenerateModal(false);
    if (regenerateModalData?.filesWithoutDocs) {
      await executeBatchGeneration(regenerateModalData.filesWithoutDocs);
    }
    setRegenerateModalData(null);
  }, [regenerateModalData, executeBatchGeneration]);

  /**
   * Handle user canceling the regeneration modal
   */
  const handleCancelRegenerate = useCallback(() => {
    setShowRegenerateModal(false);
    setRegenerateModalData(null);
  }, []);

  /**
   * Handle generation for a single file by ID (used by file action menu)
   * This bypasses the selection state to avoid React batching issues
   */
  const handleGenerateSingleFile = useCallback(async (fileId) => {
    const file = multiFileState.files.find(f => f.id === fileId);

    if (!file) {
      toastCompact.error('File not found');
      return;
    }

    if (!file.content || file.content.length === 0) {
      // Provide context-aware guidance based on file origin
      if (file.origin === 'github' && file.github) {
        toastCompact.info('No code content available. Use "Reload from GitHub" in the file menu.');
      } else {
        toastCompact.info('No code content available. Re-upload this file to generate documentation.');
      }
      return;
    }

    // If file already has documentation, show confirmation modal
    if (file.documentation) {
      setRegenerateModalData({
        filesWithDocs: 1,
        totalFiles: 1,
        allFiles: [file],
        filesWithoutDocs: [],
        allHaveDocs: true
      });
      setShowRegenerateModal(true);
      return;
    }

    // No confirmation needed - proceed with generation
    await executeBatchGeneration([file]);
  }, [multiFileState.files, executeBatchGeneration]);

  /**
   * Handle clicking on a document link (#doc:documentId) in the batch summary
   * Fetches the specific document by ID, ensuring the correct version is displayed
   * @param {string} documentId - The document ID to load
   */
  const handleDocumentClick = useCallback(async (documentId) => {
    // First check if this document is already in the workspace (by documentId)
    const workspaceFile = multiFileState.files.find(f => f.documentId === documentId);

    if (workspaceFile) {
      // Document is current version in workspace - show it normally
      if (workspaceFile.documentation) {
        setDocumentation(workspaceFile.documentation);
        setQualityScore(workspaceFile.qualityScore);
        if (setDocType && workspaceFile.docType) {
          setDocType(workspaceFile.docType);
        }
        if (setFilename && workspaceFile.filename) {
          setFilename(workspaceFile.filename);
        }
        multiFileState.setActiveFile(workspaceFile.id);
      } else {
        console.warn('[useBatchGeneration] File has no documentation:', workspaceFile.filename);
        toastCompact('Documentation not available for this file', 'error');
      }
      return;
    }

    // Document not in workspace - fetch from database
    try {
      // Import documentsApi dynamically to avoid circular dependencies
      const documentsApi = await import('../services/documentsApi');
      const doc = await documentsApi.getDocument(documentId);

      if (!doc) {
        console.warn('[useBatchGeneration] Document not found:', documentId);
        toastCompact('Document not found', 'error');
        return;
      }

      // Check if a newer version exists in workspace (same filename, different documentId)
      const newerVersionInWorkspace = multiFileState.files.find(f =>
        f.filename === doc.filename &&
        f.documentId !== documentId &&
        f.documentId // Must have a documentId (generated doc)
      );

      // Add to workspace as a new file entry
      const newFile = {
        id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        filename: doc.filename,
        content: '', // No source code available from history
        language: doc.language || 'javascript',
        docType: doc.doc_type || 'README',
        documentation: doc.documentation,
        qualityScore: doc.quality_score ? (
          typeof doc.quality_score === 'object' ? {
            score: doc.quality_score.score,
            grade: doc.quality_score.grade || 'N/A',
            breakdown: doc.quality_score.breakdown || null
          } : {
            score: doc.quality_score,
            grade: doc.quality_grade || 'N/A',
            breakdown: null
          }
        ) : null,
        isGenerating: false,
        error: null,
        documentId: doc.id,
        batchId: doc.batch_id,
        fileSize: doc.file_size || 0,
        origin: doc.origin || 'unknown',
        github: doc.github_repo ? {
          repo: doc.github_repo,
          path: doc.github_path,
          sha: doc.github_sha,
          branch: doc.github_branch
        } : null,
        dateAdded: new Date().toISOString(),
        generatedAt: doc.generated_at
      };

      multiFileState.addFile(newFile);

      // Show the file
      setDocumentation(doc.documentation);
      setQualityScore(newFile.qualityScore);
      if (setDocType && newFile.docType) {
        setDocType(newFile.docType);
      }
      if (setFilename && newFile.filename) {
        setFilename(newFile.filename);
      }

      // Set as active after a brief delay to ensure state is updated
      setTimeout(() => {
        multiFileState.setActiveFile(newFile.id);
      }, 50);

      // Show appropriate toast based on whether a newer version exists
      if (newerVersionInWorkspace) {
        toastCompact('Loaded historical version', 'info');
      } else {
        toastCompact('File loaded', 'success');
      }
    } catch (error) {
      console.error('[useBatchGeneration] Failed to load document:', error);
      toastCompact('Failed to load document', 'error');
    }
  }, [multiFileState.files, multiFileState.setActiveFile, multiFileState.addFile, setDocumentation, setQualityScore, setDocType, setFilename]);

  /**
   * Handle returning to the batch summary from an individual file
   * @param {Function|string} scrollToTopOrBatchId - Either a scroll callback or a batchId to fetch
   * @param {Function} scrollToTop - Optional callback to scroll DocPanel to top (when first param is batchId)
   */
  const handleBackToSummary = useCallback(async (scrollToTopOrBatchId, scrollToTop) => {
    // Determine if first param is a batchId (string) or scroll callback (function)
    const isSpecificBatch = typeof scrollToTopOrBatchId === 'string';
    const targetBatchId = isSpecificBatch ? scrollToTopOrBatchId : null;
    const scrollCallback = isSpecificBatch ? scrollToTop : scrollToTopOrBatchId;

    // If a specific batchId is provided and it's different from current, fetch from database
    if (targetBatchId && targetBatchId !== currentBatchId) {
      try {
        const batchData = await batchesApi.getBatch(targetBatchId);
        if (batchData && batchData.summary_markdown) {
          // Update all batch-related state so subsequent "Back to Summary" clicks work
          setBatchSummaryMarkdown(batchData.summary_markdown);
          setCurrentBatchId(targetBatchId);
          setBulkGenerationSummary({
            avgQuality: batchData.avg_quality_score || 0,
            avgGrade: batchData.avg_grade || 'N/A',
            generatedAt: batchData.created_at || null,
            successfulFiles: [], // Not available from batch fetch, but needed for DocPanel
            failedFiles: []
          });

          setDocumentation(batchData.summary_markdown);
          setQualityScore({
            score: batchData.avg_quality_score || 0,
            grade: batchData.avg_grade || 'N/A',
            breakdown: null,
            isBatchSummary: true,
            generatedAt: batchData.created_at || null
          });
          multiFileState.setActiveFile(null);

          // Scroll to top after state updates
          if (scrollCallback) {
            setTimeout(scrollCallback, 100);
          }
          return;
        }
      } catch (error) {
        console.error('[useBatchGeneration] Failed to fetch batch summary:', error);
        // Fall through to use current batch summary if fetch fails
      }
    }

    // Default behavior: use current batch summary
    if (batchSummaryMarkdown) {
      setDocumentation(batchSummaryMarkdown);
      // Always set qualityScore with isBatchSummary: true when returning to summary
      // Use summary data if available, otherwise use defaults
      setQualityScore({
        score: bulkGenerationSummary?.avgQuality || 0,
        grade: bulkGenerationSummary?.avgGrade || 'N/A',
        breakdown: null,
        isBatchSummary: true,
        generatedAt: bulkGenerationSummary?.generatedAt || null
      });
      multiFileState.setActiveFile(null);

      // Scroll to top after state updates
      if (scrollCallback) {
        setTimeout(scrollCallback, 100);
      }
    }
  }, [batchSummaryMarkdown, bulkGenerationSummary, currentBatchId, setDocumentation, setQualityScore, multiFileState.setActiveFile]);

  /**
   * Dismiss the batch complete banner (persists across refresh)
   */
  const dismissBanner = useCallback(() => {
    setBannerDismissed(true);
  }, []);

  /**
   * Clear all batch state (e.g., on logout, tier downgrade, or reset)
   */
  const clearBatchState = useCallback(() => {
    setBulkGenerationProgress(null);
    setCurrentlyGeneratingFile(null);
    setThrottleCountdown(null);
    setBulkGenerationSummary(null);
    setBatchSummaryMarkdown(null);
    setBulkGenerationErrors([]);
    setCurrentBatchId(null);
    setBannerDismissed(false);

    // Clear from sessionStorage to prevent restoration on refresh
    // Clear ALL batch-related keys (hook key + App.jsx keys)
    try {
      sessionStorage.removeItem(BATCH_SUMMARY_STATE_KEY);
      sessionStorage.removeItem('bulk_generation_summary');
      sessionStorage.removeItem('batch_summary_markdown');
      sessionStorage.removeItem('current_batch_id');
      console.log('[useBatchGeneration] Cleared batch state from sessionStorage');
    } catch (error) {
      console.error('[useBatchGeneration] Error clearing batch state from sessionStorage:', error);
    }
  }, []);

  /**
   * Restore batch state from persisted data (e.g., from sessionStorage)
   */
  const restoreBatchState = useCallback((persistedState) => {
    if (persistedState) {
      if (persistedState.bulkGenerationSummary) {
        setBulkGenerationSummary(persistedState.bulkGenerationSummary);
      }
      if (persistedState.batchSummaryMarkdown) {
        setBatchSummaryMarkdown(persistedState.batchSummaryMarkdown);
      }
      if (persistedState.currentBatchId) {
        setCurrentBatchId(persistedState.currentBatchId);
      }
    }
  }, []);

  /**
   * Cancel an in-progress batch generation
   * Sets a flag that will be checked at the next opportunity in the batch loop
   * (before starting each file or during the throttle countdown)
   * Also aborts any in-flight API request to stop streaming immediately
   */
  const cancelBatchGeneration = useCallback(() => {
    if (bulkGenerationProgress && !isCancelling) {
      console.log('[useBatchGeneration] Cancellation requested');
      cancelRequestedRef.current = true;
      setIsCancelling(true);

      // Abort any in-flight generation request to stop streaming immediately
      if (cancelGeneration) {
        cancelGeneration();
      }

      toastCompact('Cancelling batch...', 'info', { id: 'bulk-generation-cancel' });
    }
  }, [bulkGenerationProgress, isCancelling, cancelGeneration]);

  return {
    // Progress state
    bulkGenerationProgress,
    currentlyGeneratingFile,
    throttleCountdown,
    isCancelling,
    isAnalyzingGraph,

    // Ref for synchronous batch mode checking (avoids React batching race conditions)
    isBatchModeRef,

    // Results state
    bulkGenerationSummary,
    batchSummaryMarkdown,
    bulkGenerationErrors,
    currentBatchId,
    bannerDismissed,

    // Regeneration confirmation modal state
    showRegenerateModal,
    regenerateModalData,

    // State setters (for persistence/restoration)
    setBulkGenerationSummary,
    setBatchSummaryMarkdown,
    setCurrentBatchId,
    setBulkGenerationErrors,

    // Handlers
    handleGenerateSelected,
    handleGenerateSingleFile,
    handleDocumentClick,
    handleBackToSummary,
    clearBatchState,
    restoreBatchState,
    dismissBanner,
    handleRegenerateAll,
    handleGenerateNewOnly,
    handleCancelRegenerate,
    cancelBatchGeneration
  };
}

export default useBatchGeneration;
