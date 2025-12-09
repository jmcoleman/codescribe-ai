/**
 * Graph API Service
 *
 * Handles all API calls to the /api/graph endpoints for project
 * dependency graph analysis.
 *
 * All endpoints require authentication and Pro+ tier.
 * Part of: Graph Engine API (Epic 5.4)
 */

import { API_URL } from '../config/api.js';
import { STORAGE_KEYS, getStorageItem } from '../constants/storage.js';

/**
 * Analyze a project and build its dependency graph
 * @param {Object} params - Analysis parameters
 * @param {string} params.projectName - Project name
 * @param {Array<{path: string, content: string}>} params.files - Files to analyze
 * @param {number} [params.projectId] - Link to persistent project ID (FK to projects table)
 * @param {string} [params.branch] - Git branch (default: 'main')
 * @param {string} [params.projectPath] - Project root path
 * @returns {Promise<Object>} - { success, graph: { graphId, projectId, projectName, ... } }
 */
export async function analyzeProject(params) {
  const token = getStorageItem(STORAGE_KEYS.AUTH_TOKEN);

  const response = await fetch(`${API_URL}/api/graph/analyze`, {
    method: 'POST',
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      projectName: params.projectName,
      files: params.files,
      projectId: params.projectId || null,
      branch: params.branch || 'main',
      projectPath: params.projectPath || ''
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to analyze project');
  }

  return response.json();
}

/**
 * Get all graphs for the current user
 * @returns {Promise<Object>} - { success, graphs, count }
 */
export async function listGraphs() {
  const token = getStorageItem(STORAGE_KEYS.AUTH_TOKEN);

  const response = await fetch(`${API_URL}/api/graph`, {
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to list graphs');
  }

  return response.json();
}

/**
 * Get a graph by its ID
 * @param {string} graphId - Graph ID
 * @returns {Promise<Object>} - { success, graph }
 */
export async function getGraph(graphId) {
  const token = getStorageItem(STORAGE_KEYS.AUTH_TOKEN);

  const response = await fetch(`${API_URL}/api/graph/${graphId}`, {
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get graph');
  }

  return response.json();
}

/**
 * Get a graph by project ID (FK to projects table)
 * @param {number} projectId - Project ID from projects table
 * @returns {Promise<Object>} - { success, graph } or { success: false, graph: null } if not found
 */
export async function getGraphByProjectId(projectId) {
  const token = getStorageItem(STORAGE_KEYS.AUTH_TOKEN);

  const response = await fetch(`${API_URL}/api/graph/project/${projectId}`, {
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    }
  });

  if (response.status === 404) {
    return { success: false, graph: null };
  }

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get graph');
  }

  return response.json();
}

/**
 * Get file context from a graph for doc generation
 * @param {string} graphId - Graph ID
 * @param {string} filePath - File path within the project
 * @returns {Promise<Object>} - { success, context }
 */
export async function getFileContext(graphId, filePath) {
  const token = getStorageItem(STORAGE_KEYS.AUTH_TOKEN);

  const response = await fetch(`${API_URL}/api/graph/${graphId}/context/${encodeURIComponent(filePath)}`, {
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get file context');
  }

  return response.json();
}

/**
 * Generate a Mermaid diagram from a graph
 * @param {string} graphId - Graph ID
 * @param {Object} [options] - Diagram options
 * @param {string} [options.type='architecture'] - Diagram type (architecture, dependencies, dataflow)
 * @param {string} [options.focusFile] - Focus on a specific file
 * @param {number} [options.maxNodes=30] - Maximum nodes to show
 * @returns {Promise<Object>} - { success, diagram, type }
 */
export async function generateDiagram(graphId, options = {}) {
  const token = getStorageItem(STORAGE_KEYS.AUTH_TOKEN);
  const params = new URLSearchParams();

  if (options.type) params.append('type', options.type);
  if (options.focusFile) params.append('focusFile', options.focusFile);
  if (options.maxNodes) params.append('maxNodes', options.maxNodes);

  const response = await fetch(`${API_URL}/api/graph/${graphId}/diagram?${params.toString()}`, {
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to generate diagram');
  }

  return response.json();
}

/**
 * Refresh a graph with updated files
 * @param {string} graphId - Graph ID
 * @param {Array<{path: string, content: string}>} files - Updated files
 * @returns {Promise<Object>} - { success, graph }
 */
export async function refreshGraph(graphId, files) {
  const token = getStorageItem(STORAGE_KEYS.AUTH_TOKEN);

  const response = await fetch(`${API_URL}/api/graph/${graphId}/refresh`, {
    method: 'POST',
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ files })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to refresh graph');
  }

  return response.json();
}

/**
 * Delete a graph
 * @param {string} graphId - Graph ID
 * @returns {Promise<Object>} - { success, message }
 */
export async function deleteGraph(graphId) {
  const token = getStorageItem(STORAGE_KEYS.AUTH_TOKEN);

  const response = await fetch(`${API_URL}/api/graph/${graphId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete graph');
  }

  return response.json();
}

export default {
  analyzeProject,
  listGraphs,
  getGraph,
  getGraphByProjectId,
  getFileContext,
  generateDiagram,
  refreshGraph,
  deleteGraph
};
