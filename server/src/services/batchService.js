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
   * Get user's batches with pagination, sorting, and filtering
   * @param {number} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} { batches, total, hasMore, page, limit, totalPages }
   */
  async getUserBatches(userId, options = {}) {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const {
      limit = 20,
      offset = 0,
      batchType = null,    // Filter by 'batch' or 'single'
      sortBy = 'created_at', // 'created_at', 'avg_grade', 'total_files', 'first_doc_filename'
      sortOrder = 'desc',  // 'asc' or 'desc'
      gradeFilter = null,  // 'A', 'B', 'C', 'D', 'F'
      docTypeFilter = null, // 'README', 'JSDOC', 'API', 'ARCHITECTURE', etc.
      filenameSearch = null // Search by filename (partial match)
    } = options;

    // Validate sortBy to prevent SQL injection
    const validSortColumns = ['created_at', 'avg_grade', 'total_files', 'first_doc_filename', 'avg_quality_score'];
    const safeSortBy = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
    const safeSortOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';

    try {
      // Build WHERE conditions dynamically
      // Note: Using parameterized queries for all user inputs
      const conditions = ['gb.user_id = $1'];
      const params = [userId];
      let paramIndex = 2;

      if (batchType) {
        conditions.push(`gb.batch_type = $${paramIndex}`);
        params.push(batchType);
        paramIndex++;
      }

      if (gradeFilter) {
        // Filter by individual document grades, not batch average
        // This ensures consistency with the document-level filtering when expanding
        // quality_score is JSONB with structure: { score: number, grade: string, breakdown: {...} }
        const gradeRanges = {
          'A': [90, 100],
          'B': [80, 89],
          'C': [70, 79],
          'D': [60, 69],
          'F': [0, 59]
        };
        const range = gradeRanges[gradeFilter];
        if (range) {
          conditions.push(`EXISTS (
            SELECT 1 FROM generated_documents gd
            WHERE gd.batch_id = gb.id
            AND gd.deleted_at IS NULL
            AND gd.quality_score IS NOT NULL
            AND (gd.quality_score->>'score')::int BETWEEN $${paramIndex} AND $${paramIndex + 1}
          )`);
          params.push(range[0], range[1]);
          paramIndex += 2;
        }
      }

      if (docTypeFilter) {
        // Filter by individual document doc_type, not batch-level doc_types
        conditions.push(`EXISTS (
          SELECT 1 FROM generated_documents gd
          WHERE gd.batch_id = gb.id
          AND gd.deleted_at IS NULL
          AND gd.doc_type = $${paramIndex}
        )`);
        params.push(docTypeFilter);
        paramIndex++;
      }

      if (filenameSearch) {
        // Search for batches that have at least one document with matching filename
        conditions.push(`EXISTS (
          SELECT 1 FROM generated_documents gd
          WHERE gd.batch_id = gb.id
          AND gd.deleted_at IS NULL
          AND gd.filename ILIKE $${paramIndex}
        )`);
        params.push(`%${filenameSearch}%`);
        paramIndex++;
      }

      const whereClause = conditions.join(' AND ');

      // Build ORDER BY - for first_doc_filename, we need to handle it specially
      let orderByClause;
      if (safeSortBy === 'first_doc_filename') {
        orderByClause = `ORDER BY first_doc.filename ${safeSortOrder} NULLS LAST`;
      } else if (safeSortBy === 'avg_grade') {
        // Grade sorting: A < B < C < D < F (ascending = best first)
        orderByClause = `ORDER BY
          CASE gb.avg_grade
            WHEN 'A' THEN 1
            WHEN 'B' THEN 2
            WHEN 'C' THEN 3
            WHEN 'D' THEN 4
            WHEN 'F' THEN 5
            ELSE 6
          END ${safeSortOrder}`;
      } else {
        orderByClause = `ORDER BY gb.${safeSortBy} ${safeSortOrder}`;
      }

      // Build LATERAL join conditions to match the same filters
      // This ensures we show the document that matches the filter, not just the first doc
      const lateralConditions = ['batch_id = gb.id', 'deleted_at IS NULL'];
      const lateralParams = [];
      let lateralParamOffset = paramIndex; // Start after main query params

      if (gradeFilter) {
        const gradeRanges = {
          'A': [90, 100],
          'B': [80, 89],
          'C': [70, 79],
          'D': [60, 69],
          'F': [0, 59]
        };
        const range = gradeRanges[gradeFilter];
        if (range) {
          lateralConditions.push(`quality_score IS NOT NULL AND (quality_score->>'score')::int BETWEEN $${lateralParamOffset} AND $${lateralParamOffset + 1}`);
          lateralParams.push(range[0], range[1]);
          lateralParamOffset += 2;
        }
      }

      if (docTypeFilter) {
        lateralConditions.push(`doc_type = $${lateralParamOffset}`);
        lateralParams.push(docTypeFilter);
        lateralParamOffset++;
      }

      if (filenameSearch) {
        lateralConditions.push(`filename ILIKE $${lateralParamOffset}`);
        lateralParams.push(`%${filenameSearch}%`);
        lateralParamOffset++;
      }

      const lateralWhereClause = lateralConditions.join(' AND ');

      // Add lateral params then limit/offset params
      params.push(...lateralParams);
      params.push(limit, offset);

      // Main query with dynamic conditions
      const query = `
        SELECT
          gb.*,
          (SELECT COUNT(*) FROM generated_documents gd
           WHERE gd.batch_id = gb.id AND gd.deleted_at IS NULL) as file_count,
          first_doc.filename as first_doc_filename,
          first_doc.language as first_doc_language,
          first_doc.quality_score as first_doc_quality_score,
          first_doc.doc_type as first_doc_doc_type,
          first_doc.generated_at as first_doc_generated_at
        FROM generation_batches gb
        LEFT JOIN LATERAL (
          SELECT filename, language, quality_score, doc_type, generated_at
          FROM generated_documents
          WHERE ${lateralWhereClause}
          ORDER BY generated_at ASC
          LIMIT 1
        ) first_doc ON gb.batch_type = 'single'
        WHERE ${whereClause}
        ${orderByClause}
        LIMIT $${lateralParamOffset} OFFSET $${lateralParamOffset + 1}
      `;

      // Count query with same conditions (no sorting/pagination)
      // Also get total document count across all matching batches
      const countQuery = `
        SELECT
          COUNT(*) as total,
          COALESCE(SUM(gb.total_files), 0) as total_documents
        FROM generation_batches gb
        WHERE ${whereClause}
      `;

      // Execute queries using raw sql template
      const batches = await sql.query(query, params);
      const countResult = await sql.query(countQuery, params.slice(0, paramIndex - 1));

      const total = parseInt(countResult.rows[0].total);
      const totalDocuments = parseInt(countResult.rows[0].total_documents);
      const totalPages = Math.ceil(total / limit);
      const page = Math.floor(offset / limit) + 1;
      const hasMore = offset + limit < total;

      return {
        batches: batches.rows,
        total,
        totalDocuments,
        hasMore,
        page,
        limit,
        totalPages
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
   * Get a batch with its documents (optionally filtered)
   * @param {number} userId - User ID
   * @param {string} batchId - Batch UUID
   * @param {Object} filters - Optional filters for documents
   * @param {string} filters.filenameSearch - Filter by filename (partial match)
   * @param {string} filters.gradeFilter - Filter by grade: 'A', 'B', 'C', 'D', 'F'
   * @param {string} filters.docTypeFilter - Filter by doc type
   * @returns {Promise<Object|null>} { batch, documents } or null
   */
  async getBatchWithDocuments(userId, batchId, filters = {}) {
    if (!userId || !batchId) {
      throw new Error('User ID and Batch ID are required');
    }

    const {
      filenameSearch = null,
      gradeFilter = null,
      docTypeFilter = null
    } = filters;

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

      // Build document query with optional filters
      const conditions = ['batch_id = $1', 'user_id = $2', 'deleted_at IS NULL'];
      const params = [batchId, userId];
      let paramIndex = 3;

      if (filenameSearch) {
        conditions.push(`filename ILIKE $${paramIndex}`);
        params.push(`%${filenameSearch}%`);
        paramIndex++;
      }

      if (gradeFilter) {
        // Grade is derived from quality_score, need to filter by score ranges
        // quality_score is JSONB with structure: { score: number, grade: string, breakdown: {...} }
        const gradeRanges = {
          'A': [90, 100],
          'B': [80, 89],
          'C': [70, 79],
          'D': [60, 69],
          'F': [0, 59]
        };
        const range = gradeRanges[gradeFilter];
        if (range) {
          conditions.push(`(quality_score IS NOT NULL AND (quality_score->>'score')::int BETWEEN $${paramIndex} AND $${paramIndex + 1})`);
          params.push(range[0], range[1]);
          paramIndex += 2;
        }
      }

      if (docTypeFilter) {
        conditions.push(`doc_type = $${paramIndex}`);
        params.push(docTypeFilter);
        paramIndex++;
      }

      const whereClause = conditions.join(' AND ');

      const docsQuery = `
        SELECT
          id, filename, language, file_size_bytes,
          documentation, quality_score, doc_type,
          generated_at, created_at, origin,
          github_repo, github_path, github_sha, github_branch,
          provider, model
        FROM generated_documents
        WHERE ${whereClause}
        ORDER BY filename ASC
      `;

      const docsResult = await sql.query(docsQuery, params);

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
