/**
 * Document Service
 * Handles CRUD operations for generated documentation
 *
 * Privacy-First Design:
 * - Stores ONLY generated documentation (our output), never user's code
 * - Requires user consent (save_docs_preference)
 * - Supports soft delete with 30-day recovery window
 * - GDPR compliant (ON DELETE CASCADE)
 */

import { sql } from '@vercel/postgres';

class DocumentService {
  /**
   * Save a generated document to the database
   * @param {number} userId - User ID (required)
   * @param {Object} docData - Document data
   * @returns {Promise<Object>} { documentId, savedAt }
   */
  async saveDocument(userId, docData) {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const {
      filename,
      language,
      fileSize,
      documentation,
      qualityScore,
      docType,
      origin = 'upload',
      githubRepo = null,
      githubPath = null,
      githubSha = null,
      githubBranch = null,
      provider,
      model,
      inputTokens = null,
      outputTokens = null,
      wasCached = false,
      latencyMs = null,
      isEphemeral = false,
      graphId = null  // Reference to project_graphs.project_id for cross-file context
    } = docData;

    // Validation
    if (!filename || !language || !documentation || !qualityScore || !docType) {
      throw new Error('Missing required fields: filename, language, documentation, qualityScore, docType');
    }

    if (!provider || !model) {
      throw new Error('Missing required fields: provider, model');
    }

    try {
      const result = await sql`
        INSERT INTO generated_documents (
          user_id, filename, language, file_size_bytes,
          documentation, quality_score, doc_type,
          origin, github_repo, github_path, github_sha, github_branch,
          provider, model, input_tokens, output_tokens,
          was_cached, latency_ms, is_ephemeral, graph_id
        ) VALUES (
          ${userId}, ${filename}, ${language}, ${fileSize},
          ${documentation}, ${JSON.stringify(qualityScore)}, ${docType},
          ${origin}, ${githubRepo}, ${githubPath}, ${githubSha}, ${githubBranch},
          ${provider}, ${model}, ${inputTokens}, ${outputTokens},
          ${wasCached}, ${latencyMs}, ${isEphemeral}, ${graphId}
        )
        RETURNING id, generated_at
      `;

      return {
        documentId: result.rows[0].id,
        savedAt: result.rows[0].generated_at
      };
    } catch (error) {
      console.error('[DocumentService] Error saving document:', error);
      throw new Error(`Failed to save document: ${error.message}`);
    }
  }

  /**
   * Get user's documents with pagination and sorting
   * @param {number} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} { documents, total, hasMore }
   */
  async getUserDocuments(userId, options = {}) {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const {
      limit = 50,
      offset = 0,
      sort = 'generated_at:desc',
      includeDeleted = false
    } = options;

    // Parse sort parameter (e.g., "generated_at:desc")
    const [sortField, sortOrder] = sort.split(':');
    const allowedSortFields = ['generated_at', 'filename', 'doc_type', 'quality_score'];
    const allowedSortOrders = ['asc', 'desc'];

    const validSortField = allowedSortFields.includes(sortField) ? sortField : 'generated_at';
    const validSortOrder = allowedSortOrders.includes(sortOrder?.toLowerCase()) ? sortOrder.toUpperCase() : 'DESC';

    try {
      // Build WHERE clause condition
      const deletedCondition = includeDeleted ? '' : 'AND deleted_at IS NULL';

      // Get documents - use query() for dynamic ORDER BY since sql`` doesn't support dynamic identifiers
      // Both validSortField and validSortOrder are validated against allowlists above, so safe to interpolate
      const result = await sql.query(
        `SELECT
          id, filename, language, file_size_bytes,
          documentation, quality_score, doc_type,
          generated_at, origin,
          github_repo, github_path, github_sha, github_branch,
          provider, model, input_tokens, output_tokens,
          was_cached, latency_ms, is_ephemeral,
          deleted_at
        FROM generated_documents
        WHERE user_id = $1 ${deletedCondition}
        ORDER BY ${validSortField} ${validSortOrder}
        LIMIT $2
        OFFSET $3`,
        [userId, limit, offset]
      );

      // Get total count
      const countResult = await sql.query(
        `SELECT COUNT(*) as total
        FROM generated_documents
        WHERE user_id = $1 ${deletedCondition}`,
        [userId]
      );

      const total = parseInt(countResult.rows[0].total);
      const hasMore = offset + limit < total;

      return {
        documents: result.rows,
        total,
        hasMore
      };
    } catch (error) {
      console.error('[DocumentService] Error fetching user documents:', error);
      throw new Error(`Failed to fetch documents: ${error.message}`);
    }
  }

  /**
   * Get a single document by ID
   * @param {number} userId - User ID
   * @param {string} documentId - Document UUID
   * @returns {Promise<Object|null>} Document or null if not found
   */
  async getDocument(userId, documentId) {
    if (!userId || !documentId) {
      throw new Error('User ID and Document ID are required');
    }

    try {
      const result = await sql`
        SELECT * FROM generated_documents
        WHERE id = ${documentId}
          AND user_id = ${userId}
          AND deleted_at IS NULL
      `;

      return result.rows[0] || null;
    } catch (error) {
      console.error('[DocumentService] Error fetching document:', error);
      throw new Error(`Failed to fetch document: ${error.message}`);
    }
  }

  /**
   * Soft delete a document (30-day recovery window)
   * @param {number} userId - User ID
   * @param {string} documentId - Document UUID
   * @returns {Promise<Object|null>} { deletedAt } or null if not found
   */
  async deleteDocument(userId, documentId) {
    if (!userId || !documentId) {
      throw new Error('User ID and Document ID are required');
    }

    try {
      const result = await sql`
        UPDATE generated_documents
        SET deleted_at = NOW()
        WHERE id = ${documentId}
          AND user_id = ${userId}
          AND deleted_at IS NULL
        RETURNING deleted_at
      `;

      return result.rows[0] || null;
    } catch (error) {
      console.error('[DocumentService] Error deleting document:', error);
      throw new Error(`Failed to delete document: ${error.message}`);
    }
  }

  /**
   * Bulk delete documents
   * @param {number} userId - User ID
   * @param {string[]} documentIds - Array of document UUIDs
   * @returns {Promise<number>} Number of documents deleted
   */
  async bulkDeleteDocuments(userId, documentIds) {
    if (!userId) {
      throw new Error('User ID is required');
    }

    if (!Array.isArray(documentIds) || documentIds.length === 0) {
      throw new Error('documentIds must be a non-empty array');
    }

    try {
      const result = await sql`
        UPDATE generated_documents
        SET deleted_at = NOW()
        WHERE user_id = ${userId}
          AND id = ANY(${documentIds})
          AND deleted_at IS NULL
        RETURNING id
      `;

      return result.rowCount;
    } catch (error) {
      console.error('[DocumentService] Error bulk deleting documents:', error);
      throw new Error(`Failed to bulk delete documents: ${error.message}`);
    }
  }

  /**
   * Restore a soft-deleted document (within 30-day window)
   * @param {number} userId - User ID
   * @param {string} documentId - Document UUID
   * @returns {Promise<Object|null>} { restoredAt } or null if not found
   */
  async restoreDocument(userId, documentId) {
    if (!userId || !documentId) {
      throw new Error('User ID and Document ID are required');
    }

    try {
      const result = await sql`
        UPDATE generated_documents
        SET deleted_at = NULL
        WHERE id = ${documentId}
          AND user_id = ${userId}
          AND deleted_at IS NOT NULL
          AND deleted_at > NOW() - INTERVAL '30 days'
        RETURNING updated_at as restored_at
      `;

      return result.rows[0] || null;
    } catch (error) {
      console.error('[DocumentService] Error restoring document:', error);
      throw new Error(`Failed to restore document: ${error.message}`);
    }
  }

  /**
   * Delete ephemeral documents for a user (on logout)
   * @param {number} userId - User ID
   * @returns {Promise<number>} Number of documents deleted
   */
  async deleteEphemeralDocuments(userId) {
    if (!userId) {
      throw new Error('User ID is required');
    }

    try {
      const result = await sql`
        DELETE FROM generated_documents
        WHERE user_id = ${userId}
          AND is_ephemeral = TRUE
      `;

      return result.rowCount;
    } catch (error) {
      console.error('[DocumentService] Error deleting ephemeral documents:', error);
      throw new Error(`Failed to delete ephemeral documents: ${error.message}`);
    }
  }

  /**
   * Permanently delete documents older than 30 days (cleanup job)
   * @returns {Promise<number>} Number of documents permanently deleted
   */
  async permanentlyDeleteOldDocuments() {
    try {
      const result = await sql`
        DELETE FROM generated_documents
        WHERE deleted_at IS NOT NULL
          AND deleted_at < NOW() - INTERVAL '30 days'
      `;

      if (result.rowCount > 0) {
        console.log(`[DocumentService] Permanently deleted ${result.rowCount} documents older than 30 days`);
      }

      return result.rowCount;
    } catch (error) {
      console.error('[DocumentService] Error permanently deleting old documents:', error);
      throw new Error(`Failed to permanently delete old documents: ${error.message}`);
    }
  }

  /**
   * Get document statistics for a user
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Statistics object
   */
  async getUserStats(userId) {
    if (!userId) {
      throw new Error('User ID is required');
    }

    try {
      const result = await sql`
        SELECT
          COUNT(*) as total_documents,
          COUNT(CASE WHEN deleted_at IS NULL THEN 1 END) as active_documents,
          COUNT(CASE WHEN deleted_at IS NOT NULL THEN 1 END) as deleted_documents,
          COUNT(CASE WHEN is_ephemeral = TRUE THEN 1 END) as ephemeral_documents,
          AVG((quality_score->>'score')::int) as avg_quality_score,
          MIN(generated_at) as first_generation,
          MAX(generated_at) as last_generation
        FROM generated_documents
        WHERE user_id = ${userId}
      `;

      return result.rows[0];
    } catch (error) {
      console.error('[DocumentService] Error fetching user stats:', error);
      throw new Error(`Failed to fetch user stats: ${error.message}`);
    }
  }
}

// Export singleton instance
export default new DocumentService();
