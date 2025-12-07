/**
 * Workspace API Routes
 *
 * Manages user's current workspace (active file list for multi-file feature).
 * Tier-gated: Only available to users with multi-file access (Pro/Enterprise).
 *
 * Endpoints:
 * - GET    /api/workspace          - Get user's current workspace files
 * - POST   /api/workspace          - Add file to workspace
 * - PUT    /api/workspace/:id      - Update workspace file (e.g., link to generated doc)
 * - DELETE /api/workspace/:id      - Remove file from workspace
 * - DELETE /api/workspace          - Clear entire workspace
 */

import express from 'express';
import { sql } from '@vercel/postgres';
import { requireAuth } from '../middleware/auth.js';
import { requireFeature } from '../middleware/tierGate.js';

const router = express.Router();

/**
 * GET /api/workspace
 * Get user's current workspace files
 */
router.get('/', requireAuth, requireFeature('batchProcessing'), async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await sql`
      SELECT
        wf.id,
        wf.filename,
        wf.language,
        wf.file_size_bytes,
        wf.doc_type,
        wf.origin,
        wf.github_repo,
        wf.github_path,
        wf.github_sha,
        wf.github_branch,
        wf.document_id,
        wf.created_at,
        wf.updated_at,
        gd.documentation,
        gd.quality_score,
        gd.created_at as generated_at,
        gd.batch_id
      FROM workspace_files wf
      LEFT JOIN generated_documents gd ON wf.document_id = gd.id AND gd.deleted_at IS NULL
      WHERE wf.user_id = ${userId}
      ORDER BY wf.created_at ASC
    `;

    res.json({
      success: true,
      files: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('[workspace] Error fetching workspace:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch workspace'
    });
  }
});

/**
 * POST /api/workspace
 * Add file to workspace
 *
 * Body: {
 *   filename: string,
 *   language: string,
 *   fileSizeBytes: number,
 *   docType?: 'README' | 'JSDOC' | 'API' | 'ARCHITECTURE',
 *   origin?: 'upload' | 'github' | 'paste' | 'sample',
 *   github?: { repo, path, sha, branch },
 *   documentId?: string (UUID) - link to existing generated_documents record
 * }
 */
router.post('/', requireAuth, requireFeature('batchProcessing'), async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      filename,
      language,
      fileSizeBytes,
      docType = 'README',
      origin = 'upload',
      github,
      documentId = null
    } = req.body;

    // Validation
    if (!filename || !language || typeof fileSizeBytes !== 'number') {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: filename, language, fileSizeBytes'
      });
    }

    const result = await sql`
      INSERT INTO workspace_files (
        user_id, filename, language, file_size_bytes, doc_type, origin,
        github_repo, github_path, github_sha, github_branch, document_id
      ) VALUES (
        ${userId}, ${filename}, ${language}, ${fileSizeBytes}, ${docType}, ${origin},
        ${github?.repo || null}, ${github?.path || null}, ${github?.sha || null}, ${github?.branch || null},
        ${documentId}
      ) RETURNING *
    `;

    res.status(201).json({
      success: true,
      file: result.rows[0]
    });
  } catch (error) {
    console.error('[workspace] Error adding file:', error);

    // Handle duplicate filename
    if (error.code === '23505') { // Unique violation
      return res.status(409).json({
        success: false,
        error: 'File with this name already exists in workspace'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to add file to workspace'
    });
  }
});

/**
 * PUT /api/workspace/:id
 * Update workspace file (typically to link generated document)
 *
 * Body: {
 *   documentId?: string (UUID),
 *   docType?: string,
 *   ...other updatable fields
 * }
 */
router.put('/:id', requireAuth, requireFeature('batchProcessing'), async (req, res) => {
  try {
    const userId = req.user.id;
    const fileId = req.params.id;
    const { documentId, docType } = req.body;

    // Verify ownership
    const checkResult = await sql`
      SELECT id FROM workspace_files
      WHERE id = ${fileId} AND user_id = ${userId}
    `;

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Workspace file not found'
      });
    }

    // Build dynamic UPDATE query
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (documentId !== undefined) {
      updates.push(`document_id = $${paramIndex++}`);
      values.push(documentId);
    }
    if (docType !== undefined) {
      updates.push(`doc_type = $${paramIndex++}`);
      values.push(docType);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No updates provided'
      });
    }

    // Build UPDATE query dynamically with sql template
    let query;
    if (documentId !== undefined && docType !== undefined) {
      query = sql`
        UPDATE workspace_files
        SET document_id = ${documentId}, doc_type = ${docType}
        WHERE id = ${fileId} AND user_id = ${userId}
        RETURNING *
      `;
    } else if (documentId !== undefined) {
      query = sql`
        UPDATE workspace_files
        SET document_id = ${documentId}
        WHERE id = ${fileId} AND user_id = ${userId}
        RETURNING *
      `;
    } else if (docType !== undefined) {
      query = sql`
        UPDATE workspace_files
        SET doc_type = ${docType}
        WHERE id = ${fileId} AND user_id = ${userId}
        RETURNING *
      `;
    }

    const result = await query;

    res.json({
      success: true,
      file: result.rows[0]
    });
  } catch (error) {
    console.error('[workspace] Error updating file:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update workspace file'
    });
  }
});

/**
 * DELETE /api/workspace/:id
 * Remove file from workspace (hard delete)
 */
router.delete('/:id', requireAuth, requireFeature('batchProcessing'), async (req, res) => {
  try {
    const userId = req.user.id;
    const fileId = req.params.id;

    const result = await sql`
      DELETE FROM workspace_files
      WHERE id = ${fileId} AND user_id = ${userId}
      RETURNING id
    `;

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Workspace file not found'
      });
    }

    res.json({
      success: true,
      deleted: result.rows[0].id
    });
  } catch (error) {
    console.error('[workspace] Error deleting file:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete workspace file'
    });
  }
});

/**
 * DELETE /api/workspace
 * Clear entire workspace (delete all files)
 */
router.delete('/', requireAuth, requireFeature('batchProcessing'), async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await sql`
      DELETE FROM workspace_files
      WHERE user_id = ${userId}
      RETURNING id
    `;

    res.json({
      success: true,
      deletedCount: result.rows.length
    });
  } catch (error) {
    console.error('[workspace] Error clearing workspace:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear workspace'
    });
  }
});

export default router;
