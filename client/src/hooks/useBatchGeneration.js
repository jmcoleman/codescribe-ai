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

import { useState, useCallback, useEffect } from 'react';
import { toastCompact } from '../utils/toastWithHistory';
import * as batchesApi from '../services/batchesApi';

// Rate limit delay between API calls (15 seconds to respect Claude API limits)
const RATE_LIMIT_DELAY = 15000;

// sessionStorage key for batch summary state (persists across refresh)
const BATCH_SUMMARY_STATE_KEY = 'codescribe_batch_summary_state';

/**
 * Build tier-based attribution footer (matches server-side docGenerator.buildAttribution)
 * @param {string} tier - User tier (free, starter, pro, premium, team, enterprise)
 * @returns {string} Attribution markdown
 */
export const buildAttribution = (tier) => {
  const attributions = {
    free: `\n\n---\n*🟣 Generated with [CodeScribe AI](https://codescribeai.com) • Free Tier*  \n*Upgrade to [Pro](https://codescribeai.com/pricing) to remove this watermark and unlock advanced features*`,
    starter: `\n\n---\n*🟣 Generated with [CodeScribe AI](https://codescribeai.com) • Starter*  \n*Upgrade to [Pro](https://codescribeai.com/pricing) to unlock batch processing and custom templates*`,
    pro: `\n\n---\n*Generated with [CodeScribe AI](https://codescribeai.com) - AI-powered code documentation*`,
    premium: `\n\n---\n*Generated with [CodeScribe AI](https://codescribeai.com) - AI-powered code documentation*`,
    team: `\n\n---\n*Generated with [CodeScribe AI](https://codescribeai.com)*`,
    enterprise: '' // No attribution for enterprise
  };
  return attributions[tier] || attributions.free;
};

/**
 * Generate markdown document summarizing batch generation results
 * @param {Object} summary - Batch summary data
 * @param {Array} failedFiles - Array of failed file objects
 * @param {string} tier - User tier for attribution
 * @returns {string} Markdown document
 */
export const generateBatchSummaryDocument = (summary, failedFiles = [], tier = 'free') => {
  const { totalFiles, successCount, failCount, avgQuality, avgGrade, successfulFiles = [] } = summary;

  // Format timestamp without comma after year: "Dec 3, 2025 10:30 PM"
  const timestamp = new Date().toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).replace(',', ''); // Remove comma after year

  let markdown = `# Batch Documentation Summary

`;

  // Generated timestamp and status as a clean 2-column table
  markdown += `| | |\n`;
  markdown += `|---|---|\n`;
  markdown += `| **Generated** | ${timestamp} |\n`;
  markdown += `| **Status** | ${failCount === 0 ? '✅ All files completed successfully' : `⚠️ ${failCount} file${failCount > 1 ? 's' : ''} failed`} |\n\n`;

  // Overall Statistics as a compact single-row table
  markdown += `## Overall Statistics

| Total Files | Successful | Failed | Avg Quality |
|-------------|------------|--------|-------------|
| ${totalFiles} | ${successCount} | ${failCount} | ${avgQuality}/100 (${avgGrade}) |

`;

  // Generated Files table
  if (successfulFiles.length > 0) {
    markdown += `## Generated Files

| File | Doc Type | Quality | Grade | Actions |
|------|----------|---------|-------|---------|
`;

    successfulFiles.forEach(file => {
      const encodedFilename = encodeURIComponent(file.name);
      const exportAction = `[Export](#export:${encodedFilename})`;
      markdown += `| [${file.name}](#file:${encodedFilename}) | ${file.docType} | ${file.score}/100 | ${file.grade} | ${exportAction} |\n`;
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

    // Generate tables for each doc type
    Object.entries(filesByDocType).forEach(([docType, files]) => {
      const config = docTypeColumns[docType] || docTypeColumns.README;

      // Add doc type subheading if multiple doc types
      if (Object.keys(filesByDocType).length > 1) {
        markdown += `### ${docType}\n\n`;
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

  // Add tier-based attribution footer (use effectiveTier for tier overrides)
  markdown += buildAttribution(tier);

  return markdown;
};

/**
 * Custom hook for managing batch generation state and operations
 *
 * @param {Object} options - Hook options
 * @param {Function} options.generate - Generate function from useDocGeneration
 * @param {Function} options.setDocumentation - Set documentation state
 * @param {Function} options.setQualityScore - Set quality score state
 * @param {Object} options.multiFileState - Multi-file state from useWorkspacePersistence
 * @param {Object} options.documentPersistence - Document persistence from useDocumentPersistence
 * @param {boolean} options.isAuthenticated - Whether user is authenticated
 * @param {Function} options.canGenerate - Usage check function
 * @param {Function} options.setShowUsageLimitModal - Show usage limit modal
 * @param {Function} options.refetchUsage - Refetch usage stats
 * @param {string} options.userTier - User's effective tier for attribution
 * @returns {Object} Batch generation state and handlers
 */
export function useBatchGeneration({
  generate,
  setDocumentation,
  setQualityScore,
  multiFileState,
  documentPersistence,
  isAuthenticated,
  canGenerate,
  setShowUsageLimitModal,
  refetchUsage,
  userTier = 'free'
}) {
  // Load initial batch state from sessionStorage (persists across refresh)
  const loadInitialBatchState = () => {
    try {
      const saved = sessionStorage.getItem(BATCH_SUMMARY_STATE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        console.log('[useBatchGeneration] Loading batch state from sessionStorage');
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

  // Batch results state (initialized from sessionStorage if available)
  const [bulkGenerationSummary, setBulkGenerationSummary] = useState(initialBatchState?.summary || null);
  const [batchSummaryMarkdown, setBatchSummaryMarkdown] = useState(initialBatchState?.markdown || null);
  const [bulkGenerationErrors, setBulkGenerationErrors] = useState(initialBatchState?.errors || []);
  const [currentBatchId, setCurrentBatchId] = useState(initialBatchState?.batchId || null);

  // Save batch state to sessionStorage whenever it changes
  useEffect(() => {
    if (batchSummaryMarkdown || bulkGenerationSummary || currentBatchId) {
      try {
        const state = {
          summary: bulkGenerationSummary,
          markdown: batchSummaryMarkdown,
          errors: bulkGenerationErrors,
          batchId: currentBatchId
        };
        sessionStorage.setItem(BATCH_SUMMARY_STATE_KEY, JSON.stringify(state));
        console.log('[useBatchGeneration] Saved batch state to sessionStorage');
      } catch (error) {
        console.error('[useBatchGeneration] Error saving batch state to sessionStorage:', error);
      }
    }
  }, [bulkGenerationSummary, batchSummaryMarkdown, bulkGenerationErrors, currentBatchId]);

  /**
   * Handle bulk generation for selected files
   * Processes files sequentially with rate limiting
   */
  const handleGenerateSelected = useCallback(async (skipPreviouslyGenerated = false) => {
    const filesWithContent = multiFileState.files.filter(f => f.content && f.content.length > 0);
    let selectedFilesWithContent = filesWithContent.filter(f => multiFileState.selectedFileIds.includes(f.id));

    if (selectedFilesWithContent.length === 0) {
      toastCompact.error('No files with content selected');
      return;
    }

    // Check if any selected files already have documentation (only if not explicitly choosing to skip)
    if (!skipPreviouslyGenerated) {
      const filesWithDocs = selectedFilesWithContent.filter(f => f.documentation);
      const filesWithoutDocs = selectedFilesWithContent.filter(f => !f.documentation);

      // If there are files with existing documentation, ask user what to do
      if (filesWithDocs.length > 0 && filesWithoutDocs.length > 0) {
        const regenerateAll = window.confirm(
          `${filesWithDocs.length} of ${selectedFilesWithContent.length} selected files already have documentation.\n\n` +
          `Click OK to regenerate all files.\n` +
          `Click Cancel to only generate new documentation for files without it.`
        );

        if (!regenerateAll) {
          selectedFilesWithContent = filesWithoutDocs;
        }
      }
    }

    // Check usage quota for bulk generation
    if (!canGenerate()) {
      setShowUsageLimitModal(true);
      return;
    }

    const totalFiles = selectedFilesWithContent.length;
    let successCount = 0;
    let failureCount = 0;
    const failedFiles = [];
    const successfulFiles = [];

    // Clear previous doc panel content and summaries
    setDocumentation('');
    setQualityScore(null);
    setBulkGenerationSummary(null);
    setBatchSummaryMarkdown(null);
    setCurrentBatchId(null);
    setBulkGenerationErrors([]);

    // Initialize progress
    setBulkGenerationProgress({
      total: totalFiles,
      completed: 0,
      currentBatch: 1,
      totalBatches: 1
    });

    // Process files sequentially with rate limiting
    for (let i = 0; i < selectedFilesWithContent.length; i++) {
      const file = selectedFilesWithContent[i];

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

      // Clear previous documentation to show fresh streaming
      setDocumentation('');
      setQualityScore(null);

      try {
        console.log(`[useBatchGeneration] Starting generation for file ${i + 1}/${totalFiles}: ${file.filename}`);
        const startTime = Date.now();
        const result = await generate(file.content, file.docType, file.language, false);
        console.log(`[useBatchGeneration] Generation completed for ${file.filename} in ${(Date.now() - startTime) / 1000}s`);

        const generatedAt = new Date();

        // Save document to database (if authenticated)
        let documentId = null;
        if (isAuthenticated) {
          try {
            console.log('[useBatchGeneration] Saving document with metadata:', result.metadata);
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
              llm: result.metadata || null
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
        multiFileState.updateFile(file.id, {
          documentation: result.documentation,
          qualityScore: result.qualityScore,
          isGenerating: false,
          error: null,
          documentId: documentId,
          generatedAt
        });

        // Update usage tracking
        refetchUsage();

        // Track successful file
        successCount++;
        successfulFiles.push({
          name: file.filename,
          score: result.qualityScore?.score || 0,
          grade: result.qualityScore?.grade || 'N/A',
          qualityScore: result.qualityScore,
          docType: file.docType || 'README',
          generatedAt: generatedAt,
          fileId: file.id,
          provider: result.metadata?.provider || 'claude',
          model: result.metadata?.model || 'unknown'
        });

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
      if (i < selectedFilesWithContent.length - 1) {
        console.log(`[useBatchGeneration] Throttling for ${RATE_LIMIT_DELAY / 1000}s to respect API rate limits...`);

        const delaySeconds = RATE_LIMIT_DELAY / 1000;
        for (let remaining = delaySeconds; remaining > 0; remaining--) {
          setThrottleCountdown(remaining);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        setThrottleCountdown(null);
      }
    }

    // Clear selection after generation
    multiFileState.deselectAllFiles();

    // Clear progress state
    setBulkGenerationProgress(null);

    // Calculate average quality score
    let avgQuality = 0;
    let avgGrade = 'N/A';
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
    const summaryData = {
      totalFiles,
      successCount,
      failCount: failureCount,
      avgQuality,
      avgGrade,
      successfulFiles
    };
    setBulkGenerationSummary(summaryData);

    if (failedFiles.length > 0) {
      setBulkGenerationErrors(failedFiles);
    }

    // Clear active file so sync effect doesn't overwrite batch summary
    multiFileState.setActiveFile(null);

    // Generate and display batch summary document
    const summaryMarkdown = generateBatchSummaryDocument(summaryData, failedFiles, userTier);
    setDocumentation(summaryMarkdown);
    setBatchSummaryMarkdown(summaryMarkdown);

    // Create batch record in database (if authenticated)
    if (isAuthenticated) {
      try {
        const uniqueDocTypes = [...new Set(successfulFiles.map(f => f.docType))];
        const documentIds = successfulFiles
          .map(f => {
            const file = multiFileState.files.find(mf => mf.id === f.fileId);
            return file?.documentId;
          })
          .filter(id => id);

        const batchResult = await batchesApi.createBatch({
          batchType: totalFiles === 1 ? 'single' : 'batch',
          totalFiles,
          successCount,
          failCount: failureCount,
          avgQualityScore: avgQuality,
          avgGrade,
          summaryMarkdown,
          errorDetails: failedFiles.length > 0 ? failedFiles : null,
          docTypes: uniqueDocTypes
        });

        if (batchResult.batchId) {
          setCurrentBatchId(batchResult.batchId);
          console.log(`[useBatchGeneration] Created batch: ${batchResult.batchId}`);

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
      isBatchSummary: true
    });

    // Show final result toast
    if (failureCount === 0) {
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
    userTier
  ]);

  /**
   * Handle clicking on a file link in the batch summary
   */
  const handleSummaryFileClick = useCallback((filename) => {
    const file = multiFileState.files.find(f => f.filename === filename);

    if (!file) {
      console.warn('[useBatchGeneration] File not found in sidebar:', filename);
      toastCompact('File not found', 'error');
      return;
    }

    if (file.documentation) {
      setDocumentation(file.documentation);
      setQualityScore(file.qualityScore);
      multiFileState.setActiveFile(file.id);
    } else {
      console.warn('[useBatchGeneration] File has no documentation:', filename);
      toastCompact('Documentation not available for this file', 'error');
    }
  }, [multiFileState.files, multiFileState.setActiveFile, setDocumentation, setQualityScore]);

  /**
   * Handle returning to the batch summary from an individual file
   */
  const handleBackToSummary = useCallback(() => {
    if (batchSummaryMarkdown) {
      setDocumentation(batchSummaryMarkdown);
      if (bulkGenerationSummary) {
        setQualityScore({
          score: bulkGenerationSummary.avgQuality,
          grade: bulkGenerationSummary.avgGrade,
          breakdown: null,
          isBatchSummary: true
        });
      }
      multiFileState.setActiveFile(null);
    }
  }, [batchSummaryMarkdown, bulkGenerationSummary, setDocumentation, setQualityScore, multiFileState.setActiveFile]);

  /**
   * Clear all batch state (e.g., on logout or tier downgrade)
   */
  const clearBatchState = useCallback(() => {
    setBulkGenerationProgress(null);
    setCurrentlyGeneratingFile(null);
    setThrottleCountdown(null);
    setBulkGenerationSummary(null);
    setBatchSummaryMarkdown(null);
    setBulkGenerationErrors([]);
    setCurrentBatchId(null);
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

  return {
    // Progress state
    bulkGenerationProgress,
    currentlyGeneratingFile,
    throttleCountdown,

    // Results state
    bulkGenerationSummary,
    batchSummaryMarkdown,
    bulkGenerationErrors,
    currentBatchId,

    // State setters (for persistence/restoration)
    setBulkGenerationSummary,
    setBatchSummaryMarkdown,
    setCurrentBatchId,
    setBulkGenerationErrors,

    // Handlers
    handleGenerateSelected,
    handleSummaryFileClick,
    handleBackToSummary,
    clearBatchState,
    restoreBatchState
  };
}

export default useBatchGeneration;
