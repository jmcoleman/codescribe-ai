/**
 * Generated Documents Routes
 *
 * Handles CRUD operations for user's generated documentation
 * Privacy-First: Stores only generated docs (our output), never user's code
 */

import express from 'express';
import { requireAuth, validateBody } from '../middleware/auth.js';
import documentService from '../services/documentService.js';
import { getSupportedDocTypes } from '../prompts/docTypeConfig.js';

const router = express.Router();

// ============================================================================
// POST /api/documents - Save Generated Document
// ============================================================================
router.post(
  '/',
  requireAuth,
  validateBody({
    filename: { required: true, type: 'string', maxLength: 255 },
    language: { required: true, type: 'string', maxLength: 50 },
    fileSize: { required: true, type: 'number', min: 0 },
    documentation: { required: true, type: 'string' },
    qualityScore: { required: true, type: 'object' },
    docType: { required: true, type: 'string', enum: getSupportedDocTypes() },
    provider: { required: true, type: 'string' },
    model: { required: true, type: 'string' }
  }),
  async (req, res, next) => {
    try {
      const userId = req.user.id;

      // Extract data from request
      const {
        filename,
        language,
        fileSize,
        documentation,
        qualityScore,
        docType,
        origin,
        githubRepo,
        githubPath,
        githubSha,
        githubBranch,
        provider,
        model,
        inputTokens,
        outputTokens,
        wasCached,
        latencyMs,
        isEphemeral,
        sessionId,
        graphId  // Reference to project graph used for cross-file context
      } = req.body;

      // Save document
      const result = await documentService.saveDocument(userId, {
        filename,
        language,
        fileSize,
        documentation,
        qualityScore,
        docType,
        origin,
        githubRepo,
        githubPath,
        githubSha,
        githubBranch,
        provider,
        model,
        inputTokens,
        outputTokens,
        wasCached,
        latencyMs,
        isEphemeral,
        sessionId,
        graphId
      });

      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      console.error('[Documents API] Error saving document:', error);
      next(error);
    }
  }
);

// ============================================================================
// GET /api/documents - Get User's Documents
// ============================================================================
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      limit,
      offset,
      sort,
      includeDeleted
    } = req.query;

    const result = await documentService.getUserDocuments(userId, {
      limit: limit ? parseInt(limit) : 50,
      offset: offset ? parseInt(offset) : 0,
      sort: sort || 'generated_at:desc',
      includeDeleted: includeDeleted === 'true'
    });

    res.json(result);
  } catch (error) {
    console.error('[Documents API] Error fetching documents:', error);
    next(error);
  }
});

// ============================================================================
// GET /api/documents/stats - Get User's Document Statistics
// ============================================================================
router.get('/stats', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const stats = await documentService.getUserStats(userId);

    res.json(stats);
  } catch (error) {
    console.error('[Documents API] Error fetching stats:', error);
    next(error);
  }
});

// ============================================================================
// GET /api/documents/:id - Get Single Document
// ============================================================================
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const doc = await documentService.getDocument(userId, id);

    if (!doc) {
      return res.status(404).json({
        error: 'Document not found'
      });
    }

    res.json(doc);
  } catch (error) {
    console.error('[Documents API] Error fetching document:', error);
    next(error);
  }
});

// ============================================================================
// DELETE /api/documents/ephemeral - Delete Ephemeral Documents (on logout)
// NOTE: Must come BEFORE /:id route to avoid matching "ephemeral" as an ID
// ============================================================================
router.delete('/ephemeral', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Delete all ephemeral documents for the authenticated user
    const deletedCount = await documentService.deleteEphemeralDocuments(userId);

    res.json({
      success: true,
      deletedCount
    });
  } catch (error) {
    console.error('[Documents API] Error deleting ephemeral documents:', error);
    next(error);
  }
});

// ============================================================================
// DELETE /api/documents/:id - Soft Delete Single Document
// ============================================================================
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await documentService.deleteDocument(userId, id);

    if (!result) {
      return res.status(404).json({
        error: 'Document not found or already deleted'
      });
    }

    res.json({
      success: true,
      deletedAt: result.deleted_at
    });
  } catch (error) {
    console.error('[Documents API] Error deleting document:', error);
    next(error);
  }
});

// ============================================================================
// DELETE /api/documents - Bulk Delete Documents
// ============================================================================
router.delete('/', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { documentIds } = req.body;

    if (!Array.isArray(documentIds) || documentIds.length === 0) {
      return res.status(400).json({
        error: 'documentIds must be a non-empty array'
      });
    }

    const deletedCount = await documentService.bulkDeleteDocuments(userId, documentIds);

    res.json({
      success: true,
      deletedCount
    });
  } catch (error) {
    console.error('[Documents API] Error bulk deleting documents:', error);
    next(error);
  }
});

// ============================================================================
// POST /api/documents/:id/restore - Restore Soft-Deleted Document
// ============================================================================
router.post('/:id/restore', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await documentService.restoreDocument(userId, id);

    if (!result) {
      return res.status(404).json({
        error: 'Document not found or restoration window expired (30 days)'
      });
    }

    res.json({
      success: true,
      restoredAt: result.restored_at
    });
  } catch (error) {
    console.error('[Documents API] Error restoring document:', error);
    next(error);
  }
});

export default router;
