/**
 * Projects API Service
 *
 * Handles all API calls to the /api/projects endpoints for creating,
 * retrieving, updating, and deleting projects.
 *
 * All endpoints require authentication and Pro+ tier.
 * Part of: Graph Engine API (Epic 5.4) - Phase 4: Frontend Integration
 */

import { API_URL } from '../config/api.js';
import { STORAGE_KEYS, getStorageItem } from '../constants/storage.js';

/**
 * Create a new project
 * @param {Object} projectData - Project data
 * @param {string} projectData.name - Project name (required)
 * @param {string} [projectData.description] - Optional description
 * @param {string} [projectData.githubRepoUrl] - Optional GitHub repository URL
 * @returns {Promise<Object>} - { success, project }
 */
export async function createProject(projectData) {
  const token = getStorageItem(STORAGE_KEYS.AUTH_TOKEN);

  const response = await fetch(`${API_URL}/api/projects`, {
    method: 'POST',
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: projectData.name,
      description: projectData.description || null,
      githubRepoUrl: projectData.githubRepoUrl || null
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create project');
  }

  return response.json();
}

/**
 * Get user's projects with pagination
 * @param {Object} [options] - Query options
 * @param {number} [options.limit=20] - Number of projects to return
 * @param {number} [options.offset=0] - Offset for pagination
 * @returns {Promise<Object>} - { success, projects, pagination }
 */
export async function getProjects(options = {}) {
  const token = getStorageItem(STORAGE_KEYS.AUTH_TOKEN);
  const params = new URLSearchParams();

  if (options.limit) params.append('limit', options.limit);
  if (options.offset) params.append('offset', options.offset);

  const response = await fetch(`${API_URL}/api/projects?${params.toString()}`, {
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch projects');
  }

  return response.json();
}

/**
 * Get a single project by ID
 * @param {number} projectId - Project ID
 * @returns {Promise<Object>} - { success, project }
 */
export async function getProject(projectId) {
  const token = getStorageItem(STORAGE_KEYS.AUTH_TOKEN);

  const response = await fetch(`${API_URL}/api/projects/${projectId}`, {
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch project');
  }

  return response.json();
}

/**
 * Get project summary with graph and batch stats
 * @param {number} projectId - Project ID
 * @returns {Promise<Object>} - { success, project: { ...project, graph, batchStats } }
 */
export async function getProjectSummary(projectId) {
  const token = getStorageItem(STORAGE_KEYS.AUTH_TOKEN);

  const response = await fetch(`${API_URL}/api/projects/${projectId}/summary`, {
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch project summary');
  }

  return response.json();
}

/**
 * Get batches for a project
 * @param {number} projectId - Project ID
 * @param {Object} [options] - Query options
 * @param {number} [options.limit=20] - Number of batches to return
 * @param {number} [options.offset=0] - Offset for pagination
 * @returns {Promise<Object>} - { success, batches, pagination }
 */
export async function getProjectBatches(projectId, options = {}) {
  const token = getStorageItem(STORAGE_KEYS.AUTH_TOKEN);
  const params = new URLSearchParams();

  if (options.limit) params.append('limit', options.limit);
  if (options.offset) params.append('offset', options.offset);

  const response = await fetch(`${API_URL}/api/projects/${projectId}/batches?${params.toString()}`, {
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch project batches');
  }

  return response.json();
}

/**
 * Update a project
 * @param {number} projectId - Project ID
 * @param {Object} updates - Fields to update
 * @param {string} [updates.name] - New project name
 * @param {string} [updates.description] - New description
 * @param {string} [updates.githubRepoUrl] - New GitHub URL
 * @returns {Promise<Object>} - { success, project }
 */
export async function updateProject(projectId, updates) {
  const token = getStorageItem(STORAGE_KEYS.AUTH_TOKEN);

  const response = await fetch(`${API_URL}/api/projects/${projectId}`, {
    method: 'PUT',
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updates)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update project');
  }

  return response.json();
}

/**
 * Delete a project
 * @param {number} projectId - Project ID
 * @returns {Promise<Object>} - { success, message }
 */
export async function deleteProject(projectId) {
  const token = getStorageItem(STORAGE_KEYS.AUTH_TOKEN);

  const response = await fetch(`${API_URL}/api/projects/${projectId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete project');
  }

  return response.json();
}

export default {
  createProject,
  getProjects,
  getProject,
  getProjectSummary,
  getProjectBatches,
  updateProject,
  deleteProject
};
