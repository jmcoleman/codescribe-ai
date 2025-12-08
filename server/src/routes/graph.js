/**
 * Graph Engine API Routes
 *
 * Provides endpoints for project dependency graph analysis.
 * Part of: Graph Engine API (Epic 5.4)
 *
 * Endpoints:
 * - POST /api/graph/analyze    - Build dependency graph from files
 * - GET  /api/graph            - List user's graphs
 * - GET  /api/graph/:id        - Get a specific graph
 * - GET  /api/graph/project/:projectId - Get graph by persistent project ID
 * - GET  /api/graph/:id/context/:filePath - Get file context
 * - GET  /api/graph/:id/diagram - Generate Mermaid diagram
 * - POST /api/graph/:id/refresh - Refresh graph with changed files
 * - DELETE /api/graph/:id      - Delete a graph
 */

import express from 'express';
import { requireAuth, validateBody } from '../middleware/auth.js';
import { apiLimiter } from '../middleware/rateLimiter.js';
import graphService from '../services/graphService.js';

const router = express.Router();

// ============================================================================
// POST /api/graph/analyze - Build dependency graph from files
// ============================================================================
router.post(
  '/analyze',
  requireAuth,
  apiLimiter,
  validateBody({
    projectName: { required: true, type: 'string', maxLength: 255 },
    files: { required: true, type: 'array' }
  }),
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { projectName, files, branch, projectPath } = req.body;

      // Validate files array
      if (!Array.isArray(files) || files.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'FILES_REQUIRED',
          message: 'At least one file is required for analysis'
        });
      }

      // Validate each file has path and content
      for (const file of files) {
        if (!file.path || typeof file.path !== 'string') {
          return res.status(400).json({
            success: false,
            error: 'INVALID_FILE',
            message: 'Each file must have a path property'
          });
        }
        if (!file.content || typeof file.content !== 'string') {
          return res.status(400).json({
            success: false,
            error: 'INVALID_FILE',
            message: 'Each file must have a content property'
          });
        }
      }

      // Limit file count (prevent abuse)
      const MAX_FILES = 500;
      if (files.length > MAX_FILES) {
        return res.status(400).json({
          success: false,
          error: 'TOO_MANY_FILES',
          message: `Maximum ${MAX_FILES} files allowed per analysis`
        });
      }

      // Get optional persistent project ID for linking
      const persistentProjectId = req.body.persistentProjectId || null;

      // Analyze the project
      const graph = await graphService.analyzeProject(userId, projectName, files, {
        branch: branch || 'main',
        projectPath: projectPath || '',
        persistentProjectId: persistentProjectId ? parseInt(persistentProjectId, 10) : null
      });

      res.status(201).json({
        success: true,
        graph: {
          projectId: graph.projectId,
          persistentProjectId: graph.persistentProjectId,
          projectName: graph.projectName,
          branch: graph.branch,
          stats: graph.stats,
          nodeCount: graph.nodes.length,
          edgeCount: graph.edges.length,
          analyzedAt: graph.analyzedAt,
          expiresAt: graph.expiresAt
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================================
// GET /api/graph - List user's graphs
// ============================================================================
router.get(
  '/',
  requireAuth,
  apiLimiter,
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const graphs = await graphService.listGraphs(userId);

      res.json({
        success: true,
        graphs,
        count: graphs.length
      });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================================
// GET /api/graph/project/:projectId - Get graph by persistent project ID
// ============================================================================
router.get(
  '/project/:projectId',
  requireAuth,
  apiLimiter,
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const persistentProjectId = parseInt(req.params.projectId, 10);

      if (isNaN(persistentProjectId)) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_PROJECT_ID',
          message: 'Project ID must be a number'
        });
      }

      const graph = await graphService.getGraphByPersistentProjectId(persistentProjectId, userId);

      if (!graph) {
        return res.status(404).json({
          success: false,
          error: 'GRAPH_NOT_FOUND',
          message: 'No graph found for this project or graph has expired'
        });
      }

      res.json({
        success: true,
        graph
      });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================================
// GET /api/graph/:id - Get a specific graph
// ============================================================================
router.get(
  '/:id',
  requireAuth,
  apiLimiter,
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const projectId = req.params.id;

      const graph = await graphService.getGraph(projectId, userId);

      if (!graph) {
        return res.status(404).json({
          success: false,
          error: 'GRAPH_NOT_FOUND',
          message: 'Graph not found or has expired'
        });
      }

      res.json({
        success: true,
        graph
      });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================================
// GET /api/graph/:id/context/* - Get file context (supports deep paths)
// ============================================================================
router.get(
  '/:id/context/*',
  requireAuth,
  apiLimiter,
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const projectId = req.params.id;
      // Get the file path from the wildcard - handles nested paths like src/services/auth.js
      const filePath = req.params[0];

      if (!filePath) {
        return res.status(400).json({
          success: false,
          error: 'FILE_PATH_REQUIRED',
          message: 'File path is required'
        });
      }

      const context = await graphService.getFileContext(projectId, filePath, userId);

      if (!context) {
        return res.status(404).json({
          success: false,
          error: 'CONTEXT_NOT_FOUND',
          message: 'File not found in graph or graph has expired'
        });
      }

      res.json({
        success: true,
        context
      });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================================
// GET /api/graph/:id/diagram - Generate Mermaid diagram
// ============================================================================
router.get(
  '/:id/diagram',
  requireAuth,
  apiLimiter,
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const projectId = req.params.id;
      const { type, focusFile, maxNodes } = req.query;

      const diagram = await graphService.generateDiagram(projectId, userId, {
        type: type || 'architecture',
        focusFile: focusFile || null,
        maxNodes: maxNodes ? parseInt(maxNodes, 10) : 30
      });

      if (!diagram) {
        return res.status(404).json({
          success: false,
          error: 'DIAGRAM_FAILED',
          message: 'Could not generate diagram. Graph may have expired.'
        });
      }

      res.json({
        success: true,
        diagram,
        type: type || 'architecture'
      });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================================
// POST /api/graph/:id/refresh - Refresh graph with changed files
// ============================================================================
router.post(
  '/:id/refresh',
  requireAuth,
  apiLimiter,
  validateBody({
    files: { required: true, type: 'array' }
  }),
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const projectId = req.params.id;
      const { files } = req.body;

      // Validate files
      if (!Array.isArray(files) || files.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'FILES_REQUIRED',
          message: 'At least one file is required for refresh'
        });
      }

      const graph = await graphService.refreshGraph(projectId, userId, files);

      if (!graph) {
        return res.status(404).json({
          success: false,
          error: 'GRAPH_NOT_FOUND',
          message: 'Graph not found or has expired'
        });
      }

      res.json({
        success: true,
        graph: {
          projectId: graph.projectId,
          persistentProjectId: graph.persistentProjectId,
          projectName: graph.projectName,
          branch: graph.branch,
          stats: graph.stats,
          nodeCount: graph.nodes.length,
          edgeCount: graph.edges.length,
          analyzedAt: graph.analyzedAt,
          expiresAt: graph.expiresAt
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================================
// DELETE /api/graph/:id - Delete a graph
// ============================================================================
router.delete(
  '/:id',
  requireAuth,
  apiLimiter,
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const projectId = req.params.id;

      const deleted = await graphService.deleteGraph(projectId, userId);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: 'GRAPH_NOT_FOUND',
          message: 'Graph not found'
        });
      }

      res.json({
        success: true,
        message: 'Graph deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
