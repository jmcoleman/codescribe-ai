/**
 * Tests for projectsApi Service
 *
 * Tests all project API calls including:
 * - Creating projects
 * - Listing projects
 * - Getting project details and summary
 * - Updating projects
 * - Deleting projects
 *
 * Part of: Graph Engine API (Epic 5.4) - Phase 4: Frontend Integration
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as projectsApi from '../projectsApi';

// Mock global fetch
global.fetch = vi.fn();

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(() => 'mock-token'),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true
});

describe('projectsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue('mock-token');
  });

  describe('createProject', () => {
    it('should call POST /projects with correct data', async () => {
      const mockResponseData = {
        success: true,
        project: {
          id: 123,
          name: 'My Project',
          description: 'Test description',
          githubRepoUrl: null,
          createdAt: '2025-12-07T12:00:00Z',
          updatedAt: '2025-12-07T12:00:00Z'
        }
      };

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponseData
      });

      const result = await projectsApi.createProject({
        name: 'My Project',
        description: 'Test description'
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/projects'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token',
            'Content-Type': 'application/json'
          }),
          body: expect.stringContaining('"name":"My Project"')
        })
      );

      expect(result.success).toBe(true);
      expect(result.project.name).toBe('My Project');
    });

    it('should throw error on failed request', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        json: async () => ({ message: 'Project name is required' })
      });

      await expect(projectsApi.createProject({
        name: ''
      })).rejects.toThrow('Project name is required');
    });

    it('should handle optional fields as null', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, project: { id: 1, name: 'Test' } })
      });

      await projectsApi.createProject({ name: 'Test' });

      const callBody = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(callBody.description).toBeNull();
      expect(callBody.githubRepoUrl).toBeNull();
    });
  });

  describe('getProjects', () => {
    it('should get projects with pagination', async () => {
      const mockResponseData = {
        success: true,
        projects: [
          { id: 1, name: 'Project 1' },
          { id: 2, name: 'Project 2' }
        ],
        pagination: {
          total: 10,
          limit: 20,
          offset: 0,
          hasMore: false
        }
      };

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponseData
      });

      const result = await projectsApi.getProjects({ limit: 20, offset: 0 });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/projects?'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token'
          })
        })
      );

      expect(result.projects).toHaveLength(2);
      expect(result.pagination.total).toBe(10);
    });

    it('should include pagination params in URL', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ projects: [], pagination: {} })
      });

      await projectsApi.getProjects({ limit: 50, offset: 100 });

      const url = global.fetch.mock.calls[0][0];
      expect(url).toContain('limit=50');
      expect(url).toContain('offset=100');
    });
  });

  describe('getProject', () => {
    it('should get a single project by ID', async () => {
      const mockResponseData = {
        success: true,
        project: {
          id: 123,
          name: 'My Project',
          description: 'Test',
          githubRepoUrl: 'https://github.com/user/repo'
        }
      };

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponseData
      });

      const result = await projectsApi.getProject(123);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/projects/123'),
        expect.any(Object)
      );

      expect(result.project.id).toBe(123);
    });

    it('should throw error for non-existent project', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        json: async () => ({ message: 'Project not found' })
      });

      await expect(projectsApi.getProject(999)).rejects.toThrow('Project not found');
    });
  });

  describe('getProjectSummary', () => {
    it('should get project summary with graph and batch stats', async () => {
      const mockResponseData = {
        success: true,
        project: {
          id: 123,
          name: 'My Project',
          graph: {
            projectId: 'graph-abc',
            fileCount: 10,
            analyzedAt: '2025-12-07T12:00:00Z'
          },
          batchStats: {
            batchCount: 5,
            totalFiles: 25,
            successCount: 23,
            avgQuality: 85
          }
        }
      };

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponseData
      });

      const result = await projectsApi.getProjectSummary(123);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/projects/123/summary'),
        expect.any(Object)
      );

      expect(result.project.graph).toBeDefined();
      expect(result.project.batchStats.batchCount).toBe(5);
    });
  });

  describe('getProjectBatches', () => {
    it('should get batches for a project', async () => {
      const mockResponseData = {
        success: true,
        batches: [
          { id: 'batch-1', totalFiles: 5 },
          { id: 'batch-2', totalFiles: 3 }
        ],
        pagination: {
          total: 2,
          limit: 20,
          offset: 0
        }
      };

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponseData
      });

      const result = await projectsApi.getProjectBatches(123, { limit: 20 });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/projects/123/batches'),
        expect.any(Object)
      );

      expect(result.batches).toHaveLength(2);
    });
  });

  describe('updateProject', () => {
    it('should update project with partial data', async () => {
      const mockResponseData = {
        success: true,
        project: {
          id: 123,
          name: 'Updated Name',
          description: 'Original description'
        }
      };

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponseData
      });

      const result = await projectsApi.updateProject(123, { name: 'Updated Name' });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/projects/123'),
        expect.objectContaining({
          method: 'PUT',
          body: expect.stringContaining('"name":"Updated Name"')
        })
      );

      expect(result.project.name).toBe('Updated Name');
    });

    it('should throw error for invalid project ID', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        json: async () => ({ message: 'Project not found' })
      });

      await expect(projectsApi.updateProject(999, { name: 'Test' }))
        .rejects.toThrow('Project not found');
    });
  });

  describe('deleteProject', () => {
    it('should delete a project', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, message: 'Project deleted successfully' })
      });

      const result = await projectsApi.deleteProject(123);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/projects/123'),
        expect.objectContaining({
          method: 'DELETE'
        })
      );

      expect(result.success).toBe(true);
    });

    it('should throw error for non-existent project', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        json: async () => ({ message: 'Project not found' })
      });

      await expect(projectsApi.deleteProject(999)).rejects.toThrow('Project not found');
    });
  });

  describe('authentication', () => {
    it('should include auth token in all requests', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, projects: [] })
      });

      await projectsApi.getProjects();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token'
          })
        })
      );
    });

    it('should handle missing auth token', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, projects: [] })
      });

      await projectsApi.getProjects();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': ''
          })
        })
      );
    });
  });
});
