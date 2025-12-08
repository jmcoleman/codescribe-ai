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
  getProjectCount
};
