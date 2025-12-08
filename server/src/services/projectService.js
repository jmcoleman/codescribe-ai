/**
 * Project Service - Project Management for Multi-File Documentation
 *
 * Manages user projects for organizing documentation sets.
 * Projects can be linked to dependency graphs (future phase) for efficient
 * graph reuse across multiple batch generations.
 *
 * Part of: Graph Engine API (Epic 5.4) - Phase 1: Projects Entity
 */

import { sql } from '@vercel/postgres';
import { getGraphByPersistentProjectId, analyzeProject as analyzeProjectGraph } from './graphService.js';
import batchService from './batchService.js';

/**
 * @typedef {Object} Project
 * @property {number} id - Unique project ID
 * @property {number} userId - Owner's user ID
 * @property {string} name - Project name
 * @property {string|null} description - Optional description
 * @property {string|null} githubRepoUrl - Optional GitHub URL
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 */

/**
 * @typedef {Object} CreateProjectInput
 * @property {string} name - Project name (required)
 * @property {string} [description] - Optional description
 * @property {string} [githubRepoUrl] - Optional GitHub URL
 */

/**
 * @typedef {Object} UpdateProjectInput
 * @property {string} [name] - New project name
 * @property {string} [description] - New description
 * @property {string} [githubRepoUrl] - New GitHub URL
 */

/**
 * @typedef {Object} ListProjectsOptions
 * @property {number} [limit=20] - Maximum projects to return
 * @property {number} [offset=0] - Number of projects to skip
 */

/**
 * Create a new project
 *
 * @param {number} userId - User ID
 * @param {CreateProjectInput} input - Project data
 * @returns {Promise<Project>} Created project
 * @throws {Error} If validation fails or database error
 */
export async function createProject(userId, input) {
  // Validate required fields
  if (!userId) {
    throw new Error('User ID is required');
  }

  if (!input?.name?.trim()) {
    throw new Error('Project name is required');
  }

  const name = input.name.trim();
  const description = input.description?.trim() || null;
  const githubRepoUrl = input.githubRepoUrl?.trim() || null;

  // Validate name length
  if (name.length > 255) {
    throw new Error('Project name must be 255 characters or less');
  }

  // Validate GitHub URL if provided
  if (githubRepoUrl && !isValidGitHubUrl(githubRepoUrl)) {
    throw new Error('Invalid GitHub repository URL');
  }

  const result = await sql`
    INSERT INTO projects (user_id, name, description, github_repo_url)
    VALUES (${userId}, ${name}, ${description}, ${githubRepoUrl})
    RETURNING
      id,
      user_id,
      name,
      description,
      github_repo_url,
      created_at,
      updated_at
  `;

  return formatProject(result.rows[0]);
}

/**
 * Get a project by ID with ownership validation
 *
 * @param {number} projectId - Project ID
 * @param {number} userId - User ID (for ownership validation)
 * @returns {Promise<Project|null>} Project or null if not found/not owned
 */
export async function getProject(projectId, userId) {
  if (!projectId || !userId) {
    return null;
  }

  const result = await sql`
    SELECT
      id,
      user_id,
      name,
      description,
      github_repo_url,
      created_at,
      updated_at
    FROM projects
    WHERE id = ${projectId} AND user_id = ${userId}
  `;

  if (result.rows.length === 0) {
    return null;
  }

  return formatProject(result.rows[0]);
}

/**
 * List projects for a user
 *
 * @param {number} userId - User ID
 * @param {ListProjectsOptions} [options] - Pagination options
 * @returns {Promise<{projects: Project[], total: number}>} Projects with total count
 */
export async function listProjects(userId, options = {}) {
  if (!userId) {
    return { projects: [], total: 0 };
  }

  const limit = Math.min(options.limit || 20, 100); // Max 100 per page
  const offset = options.offset || 0;

  // Get total count
  const countResult = await sql`
    SELECT COUNT(*) as total
    FROM projects
    WHERE user_id = ${userId}
  `;
  const total = parseInt(countResult.rows[0].total, 10);

  // Get projects with pagination
  const result = await sql`
    SELECT
      id,
      user_id,
      name,
      description,
      github_repo_url,
      created_at,
      updated_at
    FROM projects
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT ${limit}
    OFFSET ${offset}
  `;

  return {
    projects: result.rows.map(formatProject),
    total
  };
}

/**
 * Update a project
 *
 * @param {number} projectId - Project ID
 * @param {number} userId - User ID (for ownership validation)
 * @param {UpdateProjectInput} updates - Fields to update
 * @returns {Promise<Project|null>} Updated project or null if not found/not owned
 * @throws {Error} If validation fails
 */
export async function updateProject(projectId, userId, updates) {
  if (!projectId || !userId) {
    return null;
  }

  // Check ownership first
  const existing = await getProject(projectId, userId);
  if (!existing) {
    return null;
  }

  // Build update fields
  const name = updates.name?.trim() || existing.name;
  const description = updates.description !== undefined
    ? (updates.description?.trim() || null)
    : existing.description;
  const githubRepoUrl = updates.githubRepoUrl !== undefined
    ? (updates.githubRepoUrl?.trim() || null)
    : existing.githubRepoUrl;

  // Validate name length
  if (name.length > 255) {
    throw new Error('Project name must be 255 characters or less');
  }

  // Validate GitHub URL if provided
  if (githubRepoUrl && !isValidGitHubUrl(githubRepoUrl)) {
    throw new Error('Invalid GitHub repository URL');
  }

  const result = await sql`
    UPDATE projects
    SET
      name = ${name},
      description = ${description},
      github_repo_url = ${githubRepoUrl},
      updated_at = NOW()
    WHERE id = ${projectId} AND user_id = ${userId}
    RETURNING
      id,
      user_id,
      name,
      description,
      github_repo_url,
      created_at,
      updated_at
  `;

  if (result.rows.length === 0) {
    return null;
  }

  return formatProject(result.rows[0]);
}

/**
 * Delete a project
 *
 * @param {number} projectId - Project ID
 * @param {number} userId - User ID (for ownership validation)
 * @returns {Promise<boolean>} True if deleted, false if not found/not owned
 */
export async function deleteProject(projectId, userId) {
  if (!projectId || !userId) {
    return false;
  }

  const result = await sql`
    DELETE FROM projects
    WHERE id = ${projectId} AND user_id = ${userId}
    RETURNING id
  `;

  return result.rowCount > 0;
}

/**
 * Check if a project exists and is owned by user
 *
 * @param {number} projectId - Project ID
 * @param {number} userId - User ID
 * @returns {Promise<boolean>} True if exists and owned
 */
export async function projectExists(projectId, userId) {
  if (!projectId || !userId) {
    return false;
  }

  const result = await sql`
    SELECT 1
    FROM projects
    WHERE id = ${projectId} AND user_id = ${userId}
    LIMIT 1
  `;

  return result.rows.length > 0;
}

/**
 * Get project count for a user
 *
 * @param {number} userId - User ID
 * @returns {Promise<number>} Number of projects
 */
export async function getProjectCount(userId) {
  if (!userId) {
    return 0;
  }

  const result = await sql`
    SELECT COUNT(*) as count
    FROM projects
    WHERE user_id = ${userId}
  `;

  return parseInt(result.rows[0].count, 10);
}

// ============================================================================
// Graph-Related Functions
// ============================================================================

/**
 * Get the linked graph for a project
 * Returns the most recent non-expired graph linked to this project
 *
 * @param {number} projectId - Project ID
 * @param {number} userId - User ID (for authorization)
 * @returns {Promise<Object|null>} Graph or null if not found
 */
export async function getProjectGraph(projectId, userId) {
  if (!projectId || !userId) {
    return null;
  }

  // Verify project ownership
  const project = await getProject(projectId, userId);
  if (!project) {
    return null;
  }

  // Get linked graph
  return getGraphByPersistentProjectId(projectId, userId);
}

/**
 * Analyze files and link the resulting graph to a project
 * This creates or updates the graph associated with the project
 *
 * @param {number} projectId - Project ID
 * @param {number} userId - User ID (for authorization)
 * @param {Array<{path: string, content: string}>} files - Files to analyze
 * @param {Object} [options] - Analysis options
 * @param {string} [options.branch='main'] - Git branch
 * @returns {Promise<Object|null>} Graph or null if project not found
 */
export async function analyzeProjectFiles(projectId, userId, files, options = {}) {
  if (!projectId || !userId || !files?.length) {
    return null;
  }

  // Verify project ownership
  const project = await getProject(projectId, userId);
  if (!project) {
    return null;
  }

  // Analyze files with persistent project ID
  const graph = await analyzeProjectGraph(userId, project.name, files, {
    branch: options.branch || 'main',
    projectPath: project.githubRepoUrl || '',
    persistentProjectId: projectId
  });

  return graph;
}

/**
 * Check if a project has an active (non-expired) graph
 *
 * @param {number} projectId - Project ID
 * @param {number} userId - User ID (for authorization)
 * @returns {Promise<boolean>} True if project has an active graph
 */
export async function hasActiveGraph(projectId, userId) {
  const graph = await getProjectGraph(projectId, userId);
  return graph !== null;
}

/**
 * Get project with its linked graph (if any)
 * Combines project data with graph summary for efficient loading
 *
 * @param {number} projectId - Project ID
 * @param {number} userId - User ID (for authorization)
 * @returns {Promise<Object|null>} Project with graph summary or null
 */
export async function getProjectWithGraph(projectId, userId) {
  if (!projectId || !userId) {
    return null;
  }

  const project = await getProject(projectId, userId);
  if (!project) {
    return null;
  }

  const graph = await getGraphByPersistentProjectId(projectId, userId);

  return {
    ...project,
    graph: graph ? {
      projectId: graph.projectId,
      fileCount: graph.stats?.totalFiles || 0,
      analyzedAt: graph.analyzedAt,
      expiresAt: graph.expiresAt
    } : null
  };
}

// ============================================================================
// Batch-Related Functions
// ============================================================================

/**
 * Get batches for a project
 *
 * @param {number} projectId - Project ID
 * @param {number} userId - User ID (for authorization)
 * @param {Object} [options] - Pagination options
 * @returns {Promise<Object>} { batches, total }
 */
export async function getProjectBatches(projectId, userId, options = {}) {
  if (!projectId || !userId) {
    return { batches: [], total: 0 };
  }

  // Verify project ownership
  const project = await getProject(projectId, userId);
  if (!project) {
    return { batches: [], total: 0 };
  }

  return batchService.getProjectBatches(userId, projectId, options);
}

/**
 * Get project with batch summary
 * Combines project data with batch statistics
 *
 * @param {number} projectId - Project ID
 * @param {number} userId - User ID (for authorization)
 * @returns {Promise<Object|null>} Project with batch stats or null
 */
export async function getProjectWithBatches(projectId, userId) {
  if (!projectId || !userId) {
    return null;
  }

  const project = await getProject(projectId, userId);
  if (!project) {
    return null;
  }

  // Get batch count and stats
  const batchStats = await sql`
    SELECT
      COUNT(*) as batch_count,
      COALESCE(SUM(total_files), 0) as total_files,
      COALESCE(SUM(success_count), 0) as success_count,
      MAX(created_at) as last_batch_at
    FROM generation_batches
    WHERE project_id = ${projectId} AND user_id = ${userId}
  `;

  const stats = batchStats.rows[0];

  return {
    ...project,
    batchStats: {
      batchCount: parseInt(stats.batch_count, 10),
      totalFiles: parseInt(stats.total_files, 10),
      successCount: parseInt(stats.success_count, 10),
      lastBatchAt: stats.last_batch_at
    }
  };
}

/**
 * Get full project summary with graph and batches
 *
 * @param {number} projectId - Project ID
 * @param {number} userId - User ID (for authorization)
 * @returns {Promise<Object|null>} Full project summary or null
 */
export async function getProjectSummary(projectId, userId) {
  if (!projectId || !userId) {
    return null;
  }

  const project = await getProject(projectId, userId);
  if (!project) {
    return null;
  }

  // Get graph info
  const graph = await getGraphByPersistentProjectId(projectId, userId);

  // Get batch stats
  const batchStats = await sql`
    SELECT
      COUNT(*) as batch_count,
      COALESCE(SUM(total_files), 0) as total_files,
      COALESCE(SUM(success_count), 0) as success_count,
      COALESCE(AVG(avg_quality_score), 0) as avg_quality,
      MAX(created_at) as last_batch_at
    FROM generation_batches
    WHERE project_id = ${projectId} AND user_id = ${userId}
  `;

  const stats = batchStats.rows[0];

  return {
    ...project,
    graph: graph ? {
      projectId: graph.projectId,
      fileCount: graph.stats?.totalFiles || 0,
      analyzedAt: graph.analyzedAt,
      expiresAt: graph.expiresAt
    } : null,
    batchStats: {
      batchCount: parseInt(stats.batch_count, 10),
      totalFiles: parseInt(stats.total_files, 10),
      successCount: parseInt(stats.success_count, 10),
      avgQuality: parseFloat(stats.avg_quality) || 0,
      lastBatchAt: stats.last_batch_at
    }
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format database row to Project object
 * @param {Object} row - Database row
 * @returns {Project}
 */
function formatProject(row) {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description,
    githubRepoUrl: row.github_repo_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

/**
 * Validate GitHub repository URL
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid
 */
function isValidGitHubUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.hostname === 'github.com' || parsed.hostname === 'www.github.com';
  } catch {
    return false;
  }
}

export default {
  createProject,
  getProject,
  listProjects,
  updateProject,
  deleteProject,
  projectExists,
  getProjectCount,
  // Graph-related functions
  getProjectGraph,
  analyzeProjectFiles,
  hasActiveGraph,
  getProjectWithGraph,
  // Batch-related functions
  getProjectBatches,
  getProjectWithBatches,
  getProjectSummary
};
