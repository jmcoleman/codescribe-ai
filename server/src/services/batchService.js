/**
 * Batch Service
 * Handles CRUD operations for generation batches (grouping of generated documents)
 *
 * Purpose:
 * - Groups generated documents for history and export features
 * - Stores batch summary markdown and quality metrics
 * - Enables ZIP export of entire batches
 * - Pro+ tier feature (Free/Starter users can save docs but not view history)
 */

import { sql } from '@vercel/postgres';

class BatchService {
  /**
   * Create a new generation batch
   * @param {number} userId - User ID (required)
   * @param {Object} batchData - Batch data
   * @returns {Promise<Object>} { batchId, createdAt }
   */
  async createBatch(userId, batchData) {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const {
      batchType,
      totalFiles,
      successCount,
      failCount,
      avgQualityScore = null,
      avgGrade = null,
      summaryMarkdown = null,
      errorDetails = null,
      docTypes = null
    } = batchData;

    // Validation
    if (!batchType || !['batch', 'single'].includes(batchType)) {
      throw new Error('batchType must be "batch" or "single"');
    }

    if (typeof totalFiles !== 'number' || totalFiles < 1) {
      throw new Error('totalFiles must be a positive number');
    }

    if (typeof successCount !== 'number' || typeof failCount !== 'number') {
      throw new Error('successCount and failCount are required');
    }

    if (totalFiles !== successCount + failCount) {
      throw new Error('totalFiles must equal successCount + failCount');
    }

    try {
      const result = await sql`
        INSERT INTO generation_batches (
          user_id, batch_type, total_files, success_count, fail_count,
          avg_quality_score, avg_grade, summary_markdown, error_details, doc_types
        ) VALUES (
          ${userId}, ${batchType}, ${totalFiles}, ${successCount}, ${failCount},
          ${avgQualityScore}, ${avgGrade}, ${summaryMarkdown},
          ${errorDetails ? JSON.stringify(errorDetails) : null},
          ${docTypes ? JSON.stringify(docTypes) : null}
        )
        RETURNING id, created_at
      `;

      return {
        batchId: result.rows[0].id,
        createdAt: result.rows[0].created_at
      };
    } catch (error) {
      console.error('[BatchService] Error creating batch:', error);
      throw new Error(`Failed to create batch: ${error.message}`);
    }
  }

  /**
   * Link documents to a batch (update their batch_id)
   * @param {number} userId - User ID
   * @param {string} batchId - Batch UUID
   * @param {string[]} documentIds - Array of document UUIDs
   * @returns {Promise<number>} Number of documents linked
   */
  async linkDocumentsToBatch(userId, batchId, documentIds) {
    if (!userId || !batchId) {
      throw new Error('User ID and Batch ID are required');
    }

    if (!Array.isArray(documentIds) || documentIds.length === 0) {
      throw new Error('documentIds must be a non-empty array');
    }

    try {
      // First verify the batch belongs to this user
      const batchCheck = await sql`
        SELECT id FROM generation_batches
        WHERE id = ${batchId} AND user_id = ${userId}
      `;

      if (batchCheck.rows.length === 0) {
        throw new Error('Batch not found or does not belong to user');
      }

      // Update documents to link to this batch
      const result = await sql`
        UPDATE generated_documents
        SET batch_id = ${batchId}
        WHERE user_id = ${userId}
          AND id = ANY(${documentIds})
          AND deleted_at IS NULL
        RETURNING id
      `;

      return result.rowCount;
    } catch (error) {
      console.error('[BatchService] Error linking documents to batch:', error);
      throw new Error(`Failed to link documents: ${error.message}`);
    }
  }

  /**
   * Get user's batches with pagination
   * @param {number} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} { batches, total, hasMore }
   */
  async getUserBatches(userId, options = {}) {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const {
      limit = 50,
      offset = 0,
      batchType = null // Filter by 'batch' or 'single'
    } = options;

    try {
      // Build query with optional type filter
      let batches;
      let countResult;

      if (batchType) {
        batches = await sql`
          SELECT
            gb.*,
            (SELECT COUNT(*) FROM generated_documents gd
             WHERE gd.batch_id = gb.id AND gd.deleted_at IS NULL) as file_count
          FROM generation_batches gb
          WHERE gb.user_id = ${userId}
            AND gb.batch_type = ${batchType}
          ORDER BY gb.created_at DESC
          LIMIT ${limit}
          OFFSET ${offset}
        `;

        countResult = await sql`
          SELECT COUNT(*) as total
          FROM generation_batches
          WHERE user_id = ${userId}
            AND batch_type = ${batchType}
        `;
      } else {
        batches = await sql`
          SELECT
            gb.*,
            (SELECT COUNT(*) FROM generated_documents gd
             WHERE gd.batch_id = gb.id AND gd.deleted_at IS NULL) as file_count
          FROM generation_batches gb
          WHERE gb.user_id = ${userId}
          ORDER BY gb.created_at DESC
          LIMIT ${limit}
          OFFSET ${offset}
        `;

        countResult = await sql`
          SELECT COUNT(*) as total
          FROM generation_batches
          WHERE user_id = ${userId}
        `;
      }

      const total = parseInt(countResult.rows[0].total);
      const hasMore = offset + limit < total;

      return {
        batches: batches.rows,
        total,
        hasMore
      };
    } catch (error) {
      console.error('[BatchService] Error fetching user batches:', error);
      throw new Error(`Failed to fetch batches: ${error.message}`);
    }
  }

  /**
   * Get a single batch by ID with its summary
   * @param {number} userId - User ID
   * @param {string} batchId - Batch UUID
   * @returns {Promise<Object|null>} Batch or null if not found
   */
  async getBatch(userId, batchId) {
    if (!userId || !batchId) {
      throw new Error('User ID and Batch ID are required');
    }

    try {
      const result = await sql`
        SELECT * FROM generation_batches
        WHERE id = ${batchId}
          AND user_id = ${userId}
      `;

      return result.rows[0] || null;
    } catch (error) {
      console.error('[BatchService] Error fetching batch:', error);
      throw new Error(`Failed to fetch batch: ${error.message}`);
    }
  }

  /**
   * Get a batch with all its documents (for reload/export)
   * @param {number} userId - User ID
   * @param {string} batchId - Batch UUID
   * @returns {Promise<Object|null>} { batch, documents } or null
   */
  async getBatchWithDocuments(userId, batchId) {
    if (!userId || !batchId) {
      throw new Error('User ID and Batch ID are required');
    }

    try {
      // Get batch
      const batchResult = await sql`
        SELECT * FROM generation_batches
        WHERE id = ${batchId}
          AND user_id = ${userId}
      `;

      if (batchResult.rows.length === 0) {
        return null;
      }

      // Get documents in this batch
      const docsResult = await sql`
        SELECT
          id, filename, language, file_size_bytes,
          documentation, quality_score, doc_type,
          generated_at, origin,
          github_repo, github_path, github_sha, github_branch,
          provider, model
        FROM generated_documents
        WHERE batch_id = ${batchId}
          AND user_id = ${userId}
          AND deleted_at IS NULL
        ORDER BY filename ASC
      `;

      return {
        batch: batchResult.rows[0],
        documents: docsResult.rows
      };
    } catch (error) {
      console.error('[BatchService] Error fetching batch with documents:', error);
      throw new Error(`Failed to fetch batch with documents: ${error.message}`);
    }
  }

  /**
   * Delete a batch (documents remain, just unlinked)
   * @param {number} userId - User ID
   * @param {string} batchId - Batch UUID
   * @returns {Promise<boolean>} true if deleted, false if not found
   */
  async deleteBatch(userId, batchId) {
    if (!userId || !batchId) {
      throw new Error('User ID and Batch ID are required');
    }

    try {
      const result = await sql`
        DELETE FROM generation_batches
        WHERE id = ${batchId}
          AND user_id = ${userId}
        RETURNING id
      `;

      return result.rowCount > 0;
    } catch (error) {
      console.error('[BatchService] Error deleting batch:', error);
      throw new Error(`Failed to delete batch: ${error.message}`);
    }
  }

  /**
   * Get batch statistics for analytics
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Statistics object
   */
  async getUserBatchStats(userId) {
    if (!userId) {
      throw new Error('User ID is required');
    }

    try {
      const result = await sql`
        SELECT
          COUNT(*) as total_batches,
          COUNT(CASE WHEN batch_type = 'batch' THEN 1 END) as multi_file_batches,
          COUNT(CASE WHEN batch_type = 'single' THEN 1 END) as single_file_batches,
          SUM(total_files) as total_files_generated,
          SUM(success_count) as total_successful,
          SUM(fail_count) as total_failed,
          AVG(avg_quality_score) as overall_avg_quality,
          MIN(created_at) as first_batch,
          MAX(created_at) as last_batch
        FROM generation_batches
        WHERE user_id = ${userId}
      `;

      return result.rows[0];
    } catch (error) {
      console.error('[BatchService] Error fetching batch stats:', error);
      throw new Error(`Failed to fetch batch stats: ${error.message}`);
    }
  }

  /**
   * Get documents by their IDs (for export)
   * @param {number} userId - User ID
   * @param {string[]} documentIds - Array of document UUIDs
   * @returns {Promise<Object[]>} Array of documents
   */
  async getDocumentsByIds(userId, documentIds) {
    if (!userId) {
      throw new Error('User ID is required');
    }

    if (!Array.isArray(documentIds) || documentIds.length === 0) {
      throw new Error('documentIds must be a non-empty array');
    }

    try {
      const result = await sql`
        SELECT
          id, filename, language, file_size_bytes,
          documentation, quality_score, doc_type,
          generated_at, origin,
          github_repo, github_path
        FROM generated_documents
        WHERE user_id = ${userId}
          AND id = ANY(${documentIds})
          AND deleted_at IS NULL
        ORDER BY filename ASC
      `;

      return result.rows;
    } catch (error) {
      console.error('[BatchService] Error fetching documents by IDs:', error);
      throw new Error(`Failed to fetch documents: ${error.message}`);
    }
  }
}

// Export singleton instance
export default new BatchService();
