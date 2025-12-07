/**
 * Generation Batches Routes
 *
 * Handles batch operations for generation history and ZIP export
 * Pro+ tier feature (data capture enabled for all tiers, UI/export gated)
 */

import express from 'express';
import { requireAuth, validateBody } from '../middleware/auth.js';
import batchService from '../services/batchService.js';
import exportService from '../services/exportService.js';
import { getSupportedDocTypes } from '../prompts/docTypeConfig.js';

const router = express.Router();

// ============================================================================
// POST /api/batches - Create a Generation Batch
// ============================================================================
router.post(
  '/',
  requireAuth,
  validateBody({
    batchType: { required: true, type: 'string', enum: ['batch', 'single'] },
    totalFiles: { required: true, type: 'number', min: 1 },
    successCount: { required: true, type: 'number', min: 0 },
    failCount: { required: true, type: 'number', min: 0 }
  }),
  async (req, res, next) => {
    try {
      const userId = req.user.id;

      const {
        batchType,
        totalFiles,
        successCount,
        failCount,
        avgQualityScore,
        avgGrade,
        summaryMarkdown,
        errorDetails,
        docTypes
      } = req.body;

      const result = await batchService.createBatch(userId, {
        batchType,
        totalFiles,
        successCount,
        failCount,
        avgQualityScore,
        avgGrade,
        summaryMarkdown,
        errorDetails,
        docTypes
      });

      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      console.error('[Batches API] Error creating batch:', error);
      next(error);
    }
  }
);

// ============================================================================
// POST /api/batches/:id/link - Link Documents to a Batch
// ============================================================================
router.post(
  '/:id/link',
  requireAuth,
  validateBody({
    documentIds: { required: true, type: 'array' }
  }),
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { id: batchId } = req.params;
      const { documentIds } = req.body;

      const linkedCount = await batchService.linkDocumentsToBatch(
        userId,
        batchId,
        documentIds
      );

      res.json({
        success: true,
        linkedCount
      });
    } catch (error) {
      console.error('[Batches API] Error linking documents:', error);
      next(error);
    }
  }
);

// ============================================================================
// GET /api/batches - Get User's Batches
// Supports server-side sorting and filtering for TanStack Table
// ============================================================================
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      limit,
      offset,
      batchType,
      sortBy,       // Column to sort by: 'created_at', 'avg_grade', 'total_files'
      sortOrder,    // 'asc' or 'desc'
      gradeFilter,  // Filter by grade: 'A', 'B', 'C', 'D', 'F'
      docTypeFilter, // Filter by doc type: 'README', 'JSDOC', 'API', etc.
      filenameSearch // Search by filename (partial match)
    } = req.query;

    const result = await batchService.getUserBatches(userId, {
      limit: limit ? parseInt(limit) : 20,
      offset: offset ? parseInt(offset) : 0,
      batchType: batchType || null,
      sortBy: sortBy || 'created_at',
      sortOrder: sortOrder === 'asc' ? 'asc' : 'desc',
      gradeFilter: gradeFilter || null,
      docTypeFilter: docTypeFilter || null,
      filenameSearch: filenameSearch || null
    });

    res.json(result);
  } catch (error) {
    console.error('[Batches API] Error fetching batches:', error);
    next(error);
  }
});

// ============================================================================
// GET /api/batches/stats - Get User's Batch Statistics
// ============================================================================
router.get('/stats', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const stats = await batchService.getUserBatchStats(userId);

    res.json(stats);
  } catch (error) {
    console.error('[Batches API] Error fetching stats:', error);
    next(error);
  }
});

// ============================================================================
// GET /api/batches/:id - Get Single Batch
// ============================================================================
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const batch = await batchService.getBatch(userId, id);

    if (!batch) {
      return res.status(404).json({
        error: 'Batch not found'
      });
    }

    res.json(batch);
  } catch (error) {
    console.error('[Batches API] Error fetching batch:', error);
    next(error);
  }
});

// ============================================================================
// GET /api/batches/:id/documents - Get Batch with Documents (optionally filtered)
// ============================================================================
router.get('/:id/documents', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { filenameSearch, gradeFilter, docTypeFilter } = req.query;

    const result = await batchService.getBatchWithDocuments(userId, id, {
      filenameSearch: filenameSearch || null,
      gradeFilter: gradeFilter || null,
      docTypeFilter: docTypeFilter || null
    });

    if (!result) {
      return res.status(404).json({
        error: 'Batch not found'
      });
    }

    res.json(result);
  } catch (error) {
    console.error('[Batches API] Error fetching batch with documents:', error);
    next(error);
  }
});

// ============================================================================
// GET /api/batches/:id/export - Export Batch as ZIP
// ============================================================================
router.get('/:id/export', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Get batch with documents
    const batchData = await batchService.getBatchWithDocuments(userId, id);

    if (!batchData) {
      return res.status(404).json({
        error: 'Batch not found'
      });
    }

    if (batchData.documents.length === 0) {
      return res.status(400).json({
        error: 'Batch has no documents to export'
      });
    }

    // Create ZIP
    const { stream, filename, fileCount } = await exportService.createBatchZip(batchData);

    // Set response headers for ZIP download
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('X-File-Count', fileCount);

    // Pipe the ZIP stream to response
    stream.pipe(res);

    // Handle stream errors
    stream.on('error', (err) => {
      console.error('[Batches API] Stream error during export:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Export failed' });
      }
    });
  } catch (error) {
    console.error('[Batches API] Error exporting batch:', error);
    next(error);
  }
});

// ============================================================================
// POST /api/batches/export - Export Selected Documents as ZIP
// ============================================================================
router.post(
  '/export',
  requireAuth,
  validateBody({
    documentIds: { required: true, type: 'array' }
  }),
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { documentIds } = req.body;

      if (documentIds.length === 0) {
        return res.status(400).json({
          error: 'documentIds must be a non-empty array'
        });
      }

      // Get documents by IDs
      const documents = await batchService.getDocumentsByIds(userId, documentIds);

      if (documents.length === 0) {
        return res.status(404).json({
          error: 'No documents found for the given IDs'
        });
      }

      // Create ZIP
      const { stream, filename, fileCount } = await exportService.createDocumentsZip(documents);

      // Set response headers for ZIP download
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('X-File-Count', fileCount);

      // Pipe the ZIP stream to response
      stream.pipe(res);

      // Handle stream errors
      stream.on('error', (err) => {
        console.error('[Batches API] Stream error during export:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Export failed' });
        }
      });
    } catch (error) {
      console.error('[Batches API] Error exporting documents:', error);
      next(error);
    }
  }
);

// ============================================================================
// DELETE /api/batches/:id - Delete Batch
// ============================================================================
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const deleted = await batchService.deleteBatch(userId, id);

    if (!deleted) {
      return res.status(404).json({
        error: 'Batch not found'
      });
    }

    res.json({
      success: true
    });
  } catch (error) {
    console.error('[Batches API] Error deleting batch:', error);
    next(error);
  }
});

export default router;
