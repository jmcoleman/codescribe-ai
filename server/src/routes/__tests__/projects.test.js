/**
 * Integration tests for Projects API routes
 *
 * Tests the /api/projects endpoints including:
 * - CRUD operations
 * - Authentication requirements
 * - Tier gating (Pro+ only)
 * - Input validation
 *
 * Pattern 11: ES Modules vs CommonJS (see TEST-PATTERNS-GUIDE.md)
 */

import request from 'supertest';
import express from 'express';

// Mock dependencies BEFORE importing routes
jest.mock('../../services/projectService.js');
jest.mock('../../middleware/auth.js', () => ({
  requireAuth: (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    next();
  },
  validateBody: (schema) => (req, res, next) => {
    // Simple validation
    for (const [field, rules] of Object.entries(schema)) {
      if (rules.required && !req.body[field]) {
        return res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: `${field} is required`
        });
      }
      if (rules.maxLength && req.body[field] && req.body[field].length > rules.maxLength) {
        return res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: `${field} exceeds maximum length`
        });
      }
    }
    next();
  }
}));
jest.mock('../../middleware/tierGate.js', () => ({
  requireFeature: (feature) => (req, res, next) => {
    // Check if user has the feature based on effectiveTier
    const tier = req.user?.effectiveTier || 'free';
    const proFeatures = ['pro', 'team', 'enterprise'];

    if (feature === 'projectManagement' && !proFeatures.includes(tier)) {
      return res.status(403).json({
        error: 'Upgrade Required',
        message: `Feature "${feature}" is not available in your current plan.`,
        feature,
        currentTier: req.user?.tier || 'free',
        effectiveTier: tier,
        upgradePath: '/pricing'
      });
    }
    next();
  }
}));
jest.mock('../../middleware/rateLimiter.js', () => ({
  apiLimiter: (req, res, next) => next()
}));

// Import AFTER all mocks are set up
import projectsRoutes from '../projects.js';
import projectService from '../../services/projectService.js';

describe('Projects API Routes', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Mock authentication middleware - attach user to request based on auth header
    app.use((req, res, next) => {
      if (req.headers.authorization === 'Bearer pro-token') {
        req.user = { id: 1, tier: 'pro', effectiveTier: 'pro' };
      } else if (req.headers.authorization === 'Bearer free-token') {
        req.user = { id: 2, tier: 'free', effectiveTier: 'free' };
      } else if (req.headers.authorization === 'Bearer team-token') {
        req.user = { id: 3, tier: 'team', effectiveTier: 'team' };
      }
      next();
    });

    app.use('/api/projects', projectsRoutes);
    jest.clearAllMocks();
  });

  // ============================================================================
  // AUTHENTICATION
  // ============================================================================

  describe('Authentication', () => {
    it('should require authentication for all endpoints', async () => {
      await request(app).post('/api/projects').send({ name: 'Test' }).expect(401);
      await request(app).get('/api/projects').expect(401);
      await request(app).get('/api/projects/1').expect(401);
      await request(app).put('/api/projects/1').send({ name: 'Test' }).expect(401);
      await request(app).delete('/api/projects/1').expect(401);
    });
  });

  // ============================================================================
  // TIER GATING
  // ============================================================================

  describe('Tier Gating', () => {
    it('should block free tier users', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', 'Bearer free-token')
        .send({ name: 'Test Project' })
        .expect(403);

      expect(res.body.error).toBe('Upgrade Required');
      expect(res.body.feature).toBe('projectManagement');
    });

    it('should allow pro tier users', async () => {
      projectService.createProject.mockResolvedValue({
        id: 1,
        userId: 1,
        name: 'Test Project',
        description: null,
        githubRepoUrl: null,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', 'Bearer pro-token')
        .send({ name: 'Test Project' })
        .expect(201);

      expect(res.body.success).toBe(true);
    });

    it('should allow team tier users', async () => {
      projectService.listProjects.mockResolvedValue({ projects: [], total: 0 });

      const res = await request(app)
        .get('/api/projects')
        .set('Authorization', 'Bearer team-token')
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });

  // ============================================================================
  // POST /api/projects - Create Project
  // ============================================================================

  describe('POST /api/projects', () => {
    it('should create a project with required fields', async () => {
      const mockProject = {
        id: 1,
        userId: 1,
        name: 'Test Project',
        description: null,
        githubRepoUrl: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      projectService.createProject.mockResolvedValue(mockProject);

      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', 'Bearer pro-token')
        .send({ name: 'Test Project' })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.project.name).toBe('Test Project');
      expect(projectService.createProject).toHaveBeenCalledWith(1, {
        name: 'Test Project',
        description: undefined,
        githubRepoUrl: undefined
      });
    });

    it('should create a project with all fields', async () => {
      const mockProject = {
        id: 1,
        userId: 1,
        name: 'Full Project',
        description: 'A complete project',
        githubRepoUrl: 'https://github.com/user/repo',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      projectService.createProject.mockResolvedValue(mockProject);

      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', 'Bearer pro-token')
        .send({
          name: 'Full Project',
          description: 'A complete project',
          githubRepoUrl: 'https://github.com/user/repo'
        })
        .expect(201);

      expect(res.body.project.description).toBe('A complete project');
      expect(res.body.project.githubRepoUrl).toBe('https://github.com/user/repo');
    });

    it('should return 400 when name is missing', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', 'Bearer pro-token')
        .send({ description: 'Missing name' })
        .expect(400);

      expect(res.body.error).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for validation errors from service', async () => {
      projectService.createProject.mockRejectedValue(new Error('Invalid GitHub repository URL'));

      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', 'Bearer pro-token')
        .send({
          name: 'Test',
          githubRepoUrl: 'not-a-url'
        })
        .expect(400);

      expect(res.body.error).toBe('VALIDATION_ERROR');
    });
  });

  // ============================================================================
  // GET /api/projects - List Projects
  // ============================================================================

  describe('GET /api/projects', () => {
    it('should list user projects', async () => {
      const mockProjects = [
        { id: 1, userId: 1, name: 'Project A', description: null, githubRepoUrl: null, createdAt: new Date(), updatedAt: new Date() },
        { id: 2, userId: 1, name: 'Project B', description: 'Desc', githubRepoUrl: null, createdAt: new Date(), updatedAt: new Date() }
      ];
      projectService.listProjects.mockResolvedValue({ projects: mockProjects, total: 2 });

      const res = await request(app)
        .get('/api/projects')
        .set('Authorization', 'Bearer pro-token')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.projects).toHaveLength(2);
      expect(res.body.pagination.total).toBe(2);
    });

    it('should support pagination', async () => {
      projectService.listProjects.mockResolvedValue({ projects: [], total: 100 });

      const res = await request(app)
        .get('/api/projects?limit=10&offset=20')
        .set('Authorization', 'Bearer pro-token')
        .expect(200);

      expect(projectService.listProjects).toHaveBeenCalledWith(1, { limit: 10, offset: 20 });
      expect(res.body.pagination.limit).toBe(10);
      expect(res.body.pagination.offset).toBe(20);
    });

    it('should use default pagination when not specified', async () => {
      projectService.listProjects.mockResolvedValue({ projects: [], total: 0 });

      await request(app)
        .get('/api/projects')
        .set('Authorization', 'Bearer pro-token')
        .expect(200);

      expect(projectService.listProjects).toHaveBeenCalledWith(1, { limit: 20, offset: 0 });
    });

    it('should calculate hasMore correctly', async () => {
      const mockProjects = [{ id: 1, name: 'Project' }];
      projectService.listProjects.mockResolvedValue({ projects: mockProjects, total: 10 });

      const res = await request(app)
        .get('/api/projects?limit=1&offset=0')
        .set('Authorization', 'Bearer pro-token')
        .expect(200);

      expect(res.body.pagination.hasMore).toBe(true);
    });
  });

  // ============================================================================
  // GET /api/projects/:id - Get Project
  // ============================================================================

  describe('GET /api/projects/:id', () => {
    it('should get a project by ID', async () => {
      const mockProject = {
        id: 1,
        userId: 1,
        name: 'Test Project',
        description: 'Description',
        githubRepoUrl: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      projectService.getProject.mockResolvedValue(mockProject);

      const res = await request(app)
        .get('/api/projects/1')
        .set('Authorization', 'Bearer pro-token')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.project.name).toBe('Test Project');
      expect(projectService.getProject).toHaveBeenCalledWith(1, 1);
    });

    it('should return 404 for non-existent project', async () => {
      projectService.getProject.mockResolvedValue(null);

      const res = await request(app)
        .get('/api/projects/999')
        .set('Authorization', 'Bearer pro-token')
        .expect(404);

      expect(res.body.error).toBe('PROJECT_NOT_FOUND');
    });

    it('should return 400 for invalid project ID', async () => {
      const res = await request(app)
        .get('/api/projects/not-a-number')
        .set('Authorization', 'Bearer pro-token')
        .expect(400);

      expect(res.body.error).toBe('INVALID_PROJECT_ID');
    });
  });

  // ============================================================================
  // PUT /api/projects/:id - Update Project
  // ============================================================================

  describe('PUT /api/projects/:id', () => {
    it('should update a project', async () => {
      const mockProject = {
        id: 1,
        userId: 1,
        name: 'Updated Name',
        description: 'Updated desc',
        githubRepoUrl: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      projectService.updateProject.mockResolvedValue(mockProject);

      const res = await request(app)
        .put('/api/projects/1')
        .set('Authorization', 'Bearer pro-token')
        .send({ name: 'Updated Name', description: 'Updated desc' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.project.name).toBe('Updated Name');
    });

    it('should return 404 for non-existent project', async () => {
      projectService.updateProject.mockResolvedValue(null);

      const res = await request(app)
        .put('/api/projects/999')
        .set('Authorization', 'Bearer pro-token')
        .send({ name: 'New Name' })
        .expect(404);

      expect(res.body.error).toBe('PROJECT_NOT_FOUND');
    });

    it('should return 400 for invalid project ID', async () => {
      const res = await request(app)
        .put('/api/projects/not-a-number')
        .set('Authorization', 'Bearer pro-token')
        .send({ name: 'New Name' })
        .expect(400);

      expect(res.body.error).toBe('INVALID_PROJECT_ID');
    });

    it('should return 400 when no updates provided', async () => {
      const res = await request(app)
        .put('/api/projects/1')
        .set('Authorization', 'Bearer pro-token')
        .send({})
        .expect(400);

      expect(res.body.error).toBe('NO_UPDATES');
    });

    it('should return 400 for validation errors', async () => {
      projectService.updateProject.mockRejectedValue(new Error('Invalid GitHub repository URL'));

      const res = await request(app)
        .put('/api/projects/1')
        .set('Authorization', 'Bearer pro-token')
        .send({ githubRepoUrl: 'not-a-url' })
        .expect(400);

      expect(res.body.error).toBe('VALIDATION_ERROR');
    });
  });

  // ============================================================================
  // DELETE /api/projects/:id - Delete Project
  // ============================================================================

  describe('DELETE /api/projects/:id', () => {
    it('should delete a project', async () => {
      projectService.deleteProject.mockResolvedValue(true);

      const res = await request(app)
        .delete('/api/projects/1')
        .set('Authorization', 'Bearer pro-token')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('deleted');
      expect(projectService.deleteProject).toHaveBeenCalledWith(1, 1);
    });

    it('should return 404 for non-existent project', async () => {
      projectService.deleteProject.mockResolvedValue(false);

      const res = await request(app)
        .delete('/api/projects/999')
        .set('Authorization', 'Bearer pro-token')
        .expect(404);

      expect(res.body.error).toBe('PROJECT_NOT_FOUND');
    });

    it('should return 400 for invalid project ID', async () => {
      const res = await request(app)
        .delete('/api/projects/not-a-number')
        .set('Authorization', 'Bearer pro-token')
        .expect(400);

      expect(res.body.error).toBe('INVALID_PROJECT_ID');
    });
  });

  // ============================================================================
  // OWNERSHIP ENFORCEMENT
  // ============================================================================

  describe('Ownership Enforcement', () => {
    it('should only access own projects', async () => {
      // The service layer enforces ownership, routes just pass userId
      projectService.getProject.mockResolvedValue(null);

      const res = await request(app)
        .get('/api/projects/1')
        .set('Authorization', 'Bearer pro-token')
        .expect(404);

      // Verifies user ID was passed to service
      expect(projectService.getProject).toHaveBeenCalledWith(1, 1);
    });
  });
});
