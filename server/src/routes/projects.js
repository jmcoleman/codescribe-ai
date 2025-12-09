/**
 * Projects API Routes
 *
 * Provides endpoints for project management (CRUD operations).
 * Part of: Graph Engine API (Epic 5.4) - Phase 1-3: Projects Entity
 *
 * Endpoints:
 * - POST   /api/projects           - Create a new project
 * - GET    /api/projects           - List user's projects
 * - GET    /api/projects/:id       - Get a specific project
 * - GET    /api/projects/:id/summary - Get project with graph and batch stats
 * - GET    /api/projects/:id/batches - Get batches for a project
 * - PUT    /api/projects/:id       - Update a project
 * - DELETE /api/projects/:id       - Delete a project
 *
 * Access: Pro+ tier only (projectManagement feature)
 */

import express from 'express';
import { requireAuth, validateBody } from '../middleware/auth.js';
import { apiLimiter } from '../middleware/rateLimiter.js';
import { requireFeature } from '../middleware/tierGate.js';
import projectService from '../services/projectService.js';

const router = express.Router();

// Apply tier gating to all routes - Pro+ only
const requireProjectAccess = requireFeature('projectManagement');

// ============================================================================
// POST /api/projects - Create a new project
// ============================================================================
router.post(
  '/',
  requireAuth,
  requireProjectAccess,
  apiLimiter,
  validateBody({
    name: { required: true, type: 'string', maxLength: 255 },
    description: { required: false, type: 'string' },
    githubRepoUrl: { required: false, type: 'string', maxLength: 500 }
  }),
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { name, description, githubRepoUrl } = req.body;

      const project = await projectService.createProject(userId, {
        name,
        description,
        githubRepoUrl
      });

      res.status(201).json({
        success: true,
        project
      });
    } catch (error) {
      // Handle validation errors
      if (error.message.includes('required') || error.message.includes('must be') || error.message.includes('Invalid')) {
        return res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: error.message
        });
      }
      next(error);
    }
  }
);

// ============================================================================
// GET /api/projects - List user's projects
// ============================================================================
router.get(
  '/',
  requireAuth,
  requireProjectAccess,
  apiLimiter,
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit, 10) || 20;
      const offset = parseInt(req.query.offset, 10) || 0;

      const { projects, total } = await projectService.listProjects(userId, {
        limit,
        offset
      });

      res.json({
        success: true,
        projects,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + projects.length < total
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================================
// GET /api/projects/:id - Get a specific project
// ============================================================================
router.get(
  '/:id',
  requireAuth,
  requireProjectAccess,
  apiLimiter,
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const projectId = parseInt(req.params.id, 10);

      if (isNaN(projectId)) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_PROJECT_ID',
          message: 'Project ID must be a number'
        });
      }

      const project = await projectService.getProject(projectId, userId);

      if (!project) {
        return res.status(404).json({
          success: false,
          error: 'PROJECT_NOT_FOUND',
          message: 'Project not found'
        });
      }

      res.json({
        success: true,
        project
      });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================================
// GET /api/projects/:id/summary - Get project with graph and batch stats
// ============================================================================
router.get(
  '/:id/summary',
  requireAuth,
  requireProjectAccess,
  apiLimiter,
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const projectId = parseInt(req.params.id, 10);

      if (isNaN(projectId)) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_PROJECT_ID',
          message: 'Project ID must be a number'
        });
      }

      const project = await projectService.getProjectSummary(projectId, userId);

      if (!project) {
        return res.status(404).json({
          success: false,
          error: 'PROJECT_NOT_FOUND',
          message: 'Project not found'
        });
      }

      res.json({
        success: true,
        project
      });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================================
// GET /api/projects/:id/batches - Get batches for a project
// ============================================================================
router.get(
  '/:id/batches',
  requireAuth,
  requireProjectAccess,
  apiLimiter,
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const projectId = parseInt(req.params.id, 10);

      if (isNaN(projectId)) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_PROJECT_ID',
          message: 'Project ID must be a number'
        });
      }

      const limit = parseInt(req.query.limit, 10) || 20;
      const offset = parseInt(req.query.offset, 10) || 0;

      const { batches, total } = await projectService.getProjectBatches(
        projectId,
        userId,
        { limit, offset }
      );

      res.json({
        success: true,
        batches,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + batches.length < total
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================================
// PUT /api/projects/:id - Update a project
// ============================================================================
router.put(
  '/:id',
  requireAuth,
  requireProjectAccess,
  apiLimiter,
  validateBody({
    name: { required: false, type: 'string', maxLength: 255 },
    description: { required: false, type: 'string' },
    githubRepoUrl: { required: false, type: 'string', maxLength: 500 }
  }),
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const projectId = parseInt(req.params.id, 10);

      if (isNaN(projectId)) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_PROJECT_ID',
          message: 'Project ID must be a number'
        });
      }

      const { name, description, githubRepoUrl } = req.body;

      // Ensure at least one field is being updated
      if (name === undefined && description === undefined && githubRepoUrl === undefined) {
        return res.status(400).json({
          success: false,
          error: 'NO_UPDATES',
          message: 'At least one field must be provided for update'
        });
      }

      const project = await projectService.updateProject(projectId, userId, {
        name,
        description,
        githubRepoUrl
      });

      if (!project) {
        return res.status(404).json({
          success: false,
          error: 'PROJECT_NOT_FOUND',
          message: 'Project not found'
        });
      }

      res.json({
        success: true,
        project
      });
    } catch (error) {
      // Handle validation errors
      if (error.message.includes('required') || error.message.includes('must be') || error.message.includes('Invalid')) {
        return res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: error.message
        });
      }
      next(error);
    }
  }
);

// ============================================================================
// DELETE /api/projects/:id - Delete a project
// ============================================================================
router.delete(
  '/:id',
  requireAuth,
  requireProjectAccess,
  apiLimiter,
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const projectId = parseInt(req.params.id, 10);

      if (isNaN(projectId)) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_PROJECT_ID',
          message: 'Project ID must be a number'
        });
      }

      const deleted = await projectService.deleteProject(projectId, userId);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: 'PROJECT_NOT_FOUND',
          message: 'Project not found'
        });
      }

      res.json({
        success: true,
        message: 'Project deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
