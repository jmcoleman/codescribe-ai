/**
 * Unit tests for projectService
 *
 * Tests the Project Management service including:
 * - CRUD operations
 * - Ownership validation
 * - Input validation
 * - Pagination
 *
 * Pattern 11: ES Modules vs CommonJS (see TEST-PATTERNS-GUIDE.md)
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock @vercel/postgres BEFORE importing projectService
jest.mock('@vercel/postgres', () => ({
  sql: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 })
}));

// Mock graphService BEFORE importing projectService
jest.mock('../graphService.js', () => ({
  getGraphByPersistentProjectId: jest.fn(),
  analyzeProject: jest.fn()
}));

import projectService, {
  createProject,
  getProject,
  listProjects,
  updateProject,
  deleteProject,
  projectExists,
  getProjectCount,
  getProjectGraph,
  analyzeProjectFiles,
  hasActiveGraph,
  getProjectWithGraph
} from '../projectService.js';
import { sql } from '@vercel/postgres';
import { getGraphByPersistentProjectId, analyzeProject as analyzeProjectGraph } from '../graphService.js';

describe('ProjectService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================================
  // CREATE PROJECT
  // ============================================================================

  describe('createProject', () => {
    it('should create a project with required fields', async () => {
      const mockRow = {
        id: 1,
        user_id: 1,
        name: 'Test Project',
        description: null,
        github_repo_url: null,
        created_at: new Date(),
        updated_at: new Date()
      };
      sql.mockResolvedValue({ rows: [mockRow] });

      const project = await createProject(1, { name: 'Test Project' });

      expect(project).toBeDefined();
      expect(project.id).toBe(1);
      expect(project.name).toBe('Test Project');
      expect(project.userId).toBe(1);
      expect(sql).toHaveBeenCalled();
    });

    it('should create a project with all fields', async () => {
      const mockRow = {
        id: 1,
        user_id: 1,
        name: 'Full Project',
        description: 'A complete project',
        github_repo_url: 'https://github.com/user/repo',
        created_at: new Date(),
        updated_at: new Date()
      };
      sql.mockResolvedValue({ rows: [mockRow] });

      const project = await createProject(1, {
        name: 'Full Project',
        description: 'A complete project',
        githubRepoUrl: 'https://github.com/user/repo'
      });

      expect(project.name).toBe('Full Project');
      expect(project.description).toBe('A complete project');
      expect(project.githubRepoUrl).toBe('https://github.com/user/repo');
    });

    it('should trim whitespace from name', async () => {
      const mockRow = {
        id: 1,
        user_id: 1,
        name: 'Trimmed',
        description: null,
        github_repo_url: null,
        created_at: new Date(),
        updated_at: new Date()
      };
      sql.mockResolvedValue({ rows: [mockRow] });

      await createProject(1, { name: '  Trimmed  ' });

      expect(sql).toHaveBeenCalled();
    });

    it('should throw error when user ID is missing', async () => {
      await expect(
        createProject(null, { name: 'Test' })
      ).rejects.toThrow('User ID is required');
    });

    it('should throw error when name is missing', async () => {
      await expect(
        createProject(1, { name: '' })
      ).rejects.toThrow('Project name is required');
    });

    it('should throw error when name is only whitespace', async () => {
      await expect(
        createProject(1, { name: '   ' })
      ).rejects.toThrow('Project name is required');
    });

    it('should throw error when input is null', async () => {
      await expect(
        createProject(1, null)
      ).rejects.toThrow('Project name is required');
    });

    it('should throw error when name exceeds 255 characters', async () => {
      const longName = 'A'.repeat(256);
      await expect(
        createProject(1, { name: longName })
      ).rejects.toThrow('Project name must be 255 characters or less');
    });

    it('should throw error for invalid GitHub URL', async () => {
      await expect(
        createProject(1, {
          name: 'Test',
          githubRepoUrl: 'https://gitlab.com/user/repo'
        })
      ).rejects.toThrow('Invalid GitHub repository URL');
    });

    it('should throw error for malformed URL', async () => {
      await expect(
        createProject(1, {
          name: 'Test',
          githubRepoUrl: 'not-a-url'
        })
      ).rejects.toThrow('Invalid GitHub repository URL');
    });

    it('should accept valid GitHub URLs with www prefix', async () => {
      const mockRow = {
        id: 1,
        user_id: 1,
        name: 'Test',
        description: null,
        github_repo_url: 'https://www.github.com/user/repo',
        created_at: new Date(),
        updated_at: new Date()
      };
      sql.mockResolvedValue({ rows: [mockRow] });

      const project = await createProject(1, {
        name: 'Test',
        githubRepoUrl: 'https://www.github.com/user/repo'
      });

      expect(project.githubRepoUrl).toBe('https://www.github.com/user/repo');
    });

    it('should handle null description gracefully', async () => {
      const mockRow = {
        id: 1,
        user_id: 1,
        name: 'Test',
        description: null,
        github_repo_url: null,
        created_at: new Date(),
        updated_at: new Date()
      };
      sql.mockResolvedValue({ rows: [mockRow] });

      const project = await createProject(1, {
        name: 'Test',
        description: null
      });

      expect(project.description).toBeNull();
    });
  });

  // ============================================================================
  // GET PROJECT
  // ============================================================================

  describe('getProject', () => {
    it('should get a project by ID', async () => {
      const mockRow = {
        id: 1,
        user_id: 1,
        name: 'Test Project',
        description: 'Description',
        github_repo_url: null,
        created_at: new Date(),
        updated_at: new Date()
      };
      sql.mockResolvedValue({ rows: [mockRow] });

      const project = await getProject(1, 1);

      expect(project).toBeDefined();
      expect(project.id).toBe(1);
      expect(project.name).toBe('Test Project');
    });

    it('should return null for non-existent project', async () => {
      sql.mockResolvedValue({ rows: [] });

      const project = await getProject(999, 1);

      expect(project).toBeNull();
    });

    it('should return null for project owned by different user', async () => {
      sql.mockResolvedValue({ rows: [] }); // Query includes user_id check

      const project = await getProject(1, 999);

      expect(project).toBeNull();
    });

    it('should return null when projectId is missing', async () => {
      const project = await getProject(null, 1);
      expect(project).toBeNull();
    });

    it('should return null when userId is missing', async () => {
      const project = await getProject(1, null);
      expect(project).toBeNull();
    });
  });

  // ============================================================================
  // LIST PROJECTS
  // ============================================================================

  describe('listProjects', () => {
    it('should list projects for a user', async () => {
      const mockRows = [
        { id: 1, user_id: 1, name: 'Project A', description: null, github_repo_url: null, created_at: new Date(), updated_at: new Date() },
        { id: 2, user_id: 1, name: 'Project B', description: 'Desc', github_repo_url: null, created_at: new Date(), updated_at: new Date() }
      ];

      // Mock count query then list query
      sql.mockResolvedValueOnce({ rows: [{ total: '2' }] })
        .mockResolvedValueOnce({ rows: mockRows });

      const result = await listProjects(1);

      expect(result.projects).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('should return empty array for user with no projects', async () => {
      sql.mockResolvedValueOnce({ rows: [{ total: '0' }] })
        .mockResolvedValueOnce({ rows: [] });

      const result = await listProjects(1);

      expect(result.projects).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should apply pagination with limit', async () => {
      const mockRows = [
        { id: 1, user_id: 1, name: 'Project A', description: null, github_repo_url: null, created_at: new Date(), updated_at: new Date() }
      ];

      sql.mockResolvedValueOnce({ rows: [{ total: '10' }] })
        .mockResolvedValueOnce({ rows: mockRows });

      const result = await listProjects(1, { limit: 1 });

      expect(result.projects).toHaveLength(1);
      expect(result.total).toBe(10);
    });

    it('should apply pagination with offset', async () => {
      sql.mockResolvedValueOnce({ rows: [{ total: '10' }] })
        .mockResolvedValueOnce({ rows: [] });

      await listProjects(1, { limit: 5, offset: 100 });

      expect(sql).toHaveBeenCalledTimes(2);
    });

    it('should cap limit at 100', async () => {
      sql.mockResolvedValueOnce({ rows: [{ total: '0' }] })
        .mockResolvedValueOnce({ rows: [] });

      await listProjects(1, { limit: 500 });

      // Should use 100 as max limit
      expect(sql).toHaveBeenCalledTimes(2);
    });

    it('should return empty for missing userId', async () => {
      const result = await listProjects(null);

      expect(result.projects).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should use default pagination values', async () => {
      sql.mockResolvedValueOnce({ rows: [{ total: '0' }] })
        .mockResolvedValueOnce({ rows: [] });

      await listProjects(1);

      expect(sql).toHaveBeenCalledTimes(2);
    });
  });

  // ============================================================================
  // UPDATE PROJECT
  // ============================================================================

  describe('updateProject', () => {
    const existingProject = {
      id: 1,
      user_id: 1,
      name: 'Original',
      description: 'Original desc',
      github_repo_url: 'https://github.com/user/repo',
      created_at: new Date(),
      updated_at: new Date()
    };

    it('should update project name', async () => {
      const updatedRow = { ...existingProject, name: 'Updated' };

      // First call is getProject (ownership check), second is update
      sql.mockResolvedValueOnce({ rows: [existingProject] })
        .mockResolvedValueOnce({ rows: [updatedRow] });

      const project = await updateProject(1, 1, { name: 'Updated' });

      expect(project.name).toBe('Updated');
    });

    it('should update project description', async () => {
      const updatedRow = { ...existingProject, description: 'New desc' };

      sql.mockResolvedValueOnce({ rows: [existingProject] })
        .mockResolvedValueOnce({ rows: [updatedRow] });

      const project = await updateProject(1, 1, { description: 'New desc' });

      expect(project.description).toBe('New desc');
    });

    it('should update githubRepoUrl', async () => {
      const updatedRow = { ...existingProject, github_repo_url: 'https://github.com/new/repo' };

      sql.mockResolvedValueOnce({ rows: [existingProject] })
        .mockResolvedValueOnce({ rows: [updatedRow] });

      const project = await updateProject(1, 1, { githubRepoUrl: 'https://github.com/new/repo' });

      expect(project.githubRepoUrl).toBe('https://github.com/new/repo');
    });

    it('should allow setting description to null', async () => {
      const updatedRow = { ...existingProject, description: null };

      sql.mockResolvedValueOnce({ rows: [existingProject] })
        .mockResolvedValueOnce({ rows: [updatedRow] });

      const project = await updateProject(1, 1, { description: '' });

      expect(project.description).toBeNull();
    });

    it('should allow setting githubRepoUrl to null', async () => {
      const updatedRow = { ...existingProject, github_repo_url: null };

      sql.mockResolvedValueOnce({ rows: [existingProject] })
        .mockResolvedValueOnce({ rows: [updatedRow] });

      const project = await updateProject(1, 1, { githubRepoUrl: '' });

      expect(project.githubRepoUrl).toBeNull();
    });

    it('should return null for non-existent project', async () => {
      sql.mockResolvedValue({ rows: [] });

      const project = await updateProject(999, 1, { name: 'New' });

      expect(project).toBeNull();
    });

    it('should return null when projectId is missing', async () => {
      const project = await updateProject(null, 1, { name: 'New' });
      expect(project).toBeNull();
    });

    it('should return null when userId is missing', async () => {
      const project = await updateProject(1, null, { name: 'New' });
      expect(project).toBeNull();
    });

    it('should throw error for name exceeding 255 characters', async () => {
      sql.mockResolvedValueOnce({ rows: [existingProject] });

      const longName = 'A'.repeat(256);
      await expect(
        updateProject(1, 1, { name: longName })
      ).rejects.toThrow('Project name must be 255 characters or less');
    });

    it('should throw error for invalid GitHub URL', async () => {
      sql.mockResolvedValueOnce({ rows: [existingProject] });

      await expect(
        updateProject(1, 1, { githubRepoUrl: 'https://gitlab.com/user/repo' })
      ).rejects.toThrow('Invalid GitHub repository URL');
    });

    it('should preserve existing values for unspecified fields', async () => {
      // Only update name, keep other fields
      sql.mockResolvedValueOnce({ rows: [existingProject] })
        .mockResolvedValueOnce({ rows: [{ ...existingProject, name: 'New Name' }] });

      const project = await updateProject(1, 1, { name: 'New Name' });

      expect(project.name).toBe('New Name');
      expect(project.description).toBe('Original desc');
      expect(project.githubRepoUrl).toBe('https://github.com/user/repo');
    });
  });

  // ============================================================================
  // DELETE PROJECT
  // ============================================================================

  describe('deleteProject', () => {
    it('should delete a project', async () => {
      sql.mockResolvedValue({ rowCount: 1 });

      const result = await deleteProject(1, 1);

      expect(result).toBe(true);
    });

    it('should return false for non-existent project', async () => {
      sql.mockResolvedValue({ rowCount: 0 });

      const result = await deleteProject(999, 1);

      expect(result).toBe(false);
    });

    it('should return false for project owned by different user', async () => {
      sql.mockResolvedValue({ rowCount: 0 });

      const result = await deleteProject(1, 999);

      expect(result).toBe(false);
    });

    it('should return false when projectId is missing', async () => {
      const result = await deleteProject(null, 1);
      expect(result).toBe(false);
    });

    it('should return false when userId is missing', async () => {
      const result = await deleteProject(1, null);
      expect(result).toBe(false);
    });
  });

  // ============================================================================
  // PROJECT EXISTS
  // ============================================================================

  describe('projectExists', () => {
    it('should return true for existing project', async () => {
      sql.mockResolvedValue({ rows: [{ 1: 1 }] });

      const exists = await projectExists(1, 1);

      expect(exists).toBe(true);
    });

    it('should return false for non-existent project', async () => {
      sql.mockResolvedValue({ rows: [] });

      const exists = await projectExists(999, 1);

      expect(exists).toBe(false);
    });

    it('should return false when projectId is missing', async () => {
      const exists = await projectExists(null, 1);
      expect(exists).toBe(false);
    });

    it('should return false when userId is missing', async () => {
      const exists = await projectExists(1, null);
      expect(exists).toBe(false);
    });
  });

  // ============================================================================
  // GET PROJECT COUNT
  // ============================================================================

  describe('getProjectCount', () => {
    it('should return project count for user', async () => {
      sql.mockResolvedValue({ rows: [{ count: '5' }] });

      const count = await getProjectCount(1);

      expect(count).toBe(5);
    });

    it('should return 0 for user with no projects', async () => {
      sql.mockResolvedValue({ rows: [{ count: '0' }] });

      const count = await getProjectCount(1);

      expect(count).toBe(0);
    });

    it('should return 0 when userId is missing', async () => {
      const count = await getProjectCount(null);
      expect(count).toBe(0);
    });
  });

  // ============================================================================
  // GET PROJECT GRAPH
  // ============================================================================

  describe('getProjectGraph', () => {
    const mockProject = {
      id: 1,
      user_id: 1,
      name: 'Test Project',
      description: null,
      github_repo_url: null,
      created_at: new Date(),
      updated_at: new Date()
    };

    const mockGraph = {
      projectId: 'abc123',
      userId: 1,
      projectName: 'Test Project',
      persistentProjectId: 1,
      nodes: [],
      edges: [],
      stats: { totalFiles: 5 },
      analyzedAt: new Date(),
      expiresAt: new Date(Date.now() + 86400000)
    };

    it('should return linked graph for a project', async () => {
      sql.mockResolvedValueOnce({ rows: [mockProject] });
      getGraphByPersistentProjectId.mockResolvedValueOnce(mockGraph);

      const graph = await getProjectGraph(1, 1);

      expect(graph).toBeDefined();
      expect(graph.projectId).toBe('abc123');
      expect(getGraphByPersistentProjectId).toHaveBeenCalledWith(1, 1);
    });

    it('should return null for non-existent project', async () => {
      sql.mockResolvedValueOnce({ rows: [] });

      const graph = await getProjectGraph(999, 1);

      expect(graph).toBeNull();
    });

    it('should return null when projectId is missing', async () => {
      const graph = await getProjectGraph(null, 1);

      expect(graph).toBeNull();
    });

    it('should return null when userId is missing', async () => {
      const graph = await getProjectGraph(1, null);

      expect(graph).toBeNull();
    });

    it('should return null when project has no linked graph', async () => {
      sql.mockResolvedValueOnce({ rows: [mockProject] });
      getGraphByPersistentProjectId.mockResolvedValueOnce(null);

      const graph = await getProjectGraph(1, 1);

      expect(graph).toBeNull();
    });
  });

  // ============================================================================
  // ANALYZE PROJECT FILES
  // ============================================================================

  describe('analyzeProjectFiles', () => {
    const mockProject = {
      id: 1,
      user_id: 1,
      name: 'Test Project',
      description: null,
      github_repo_url: 'https://github.com/user/repo',
      created_at: new Date(),
      updated_at: new Date()
    };

    const mockFiles = [
      { path: 'src/index.js', content: 'export default function main() {}' }
    ];

    const mockGraph = {
      projectId: 'abc123',
      userId: 1,
      projectName: 'Test Project',
      persistentProjectId: 1,
      nodes: [{ id: 'src/index.js' }],
      edges: [],
      stats: { totalFiles: 1 }
    };

    it('should analyze files and link graph to project', async () => {
      sql.mockResolvedValueOnce({ rows: [mockProject] });
      analyzeProjectGraph.mockResolvedValueOnce(mockGraph);

      const graph = await analyzeProjectFiles(1, 1, mockFiles);

      expect(graph).toBeDefined();
      expect(graph.projectId).toBe('abc123');
      expect(analyzeProjectGraph).toHaveBeenCalledWith(
        1,
        'Test Project',
        mockFiles,
        {
          branch: 'main',
          projectPath: 'https://github.com/user/repo',
          persistentProjectId: 1
        }
      );
    });

    it('should use custom branch option', async () => {
      sql.mockResolvedValueOnce({ rows: [mockProject] });
      analyzeProjectGraph.mockResolvedValueOnce(mockGraph);

      await analyzeProjectFiles(1, 1, mockFiles, { branch: 'develop' });

      expect(analyzeProjectGraph).toHaveBeenCalledWith(
        1,
        'Test Project',
        mockFiles,
        expect.objectContaining({ branch: 'develop' })
      );
    });

    it('should return null for non-existent project', async () => {
      sql.mockResolvedValueOnce({ rows: [] });

      const graph = await analyzeProjectFiles(999, 1, mockFiles);

      expect(graph).toBeNull();
      expect(analyzeProjectGraph).not.toHaveBeenCalled();
    });

    it('should return null when projectId is missing', async () => {
      const graph = await analyzeProjectFiles(null, 1, mockFiles);

      expect(graph).toBeNull();
    });

    it('should return null when userId is missing', async () => {
      const graph = await analyzeProjectFiles(1, null, mockFiles);

      expect(graph).toBeNull();
    });

    it('should return null when files array is empty', async () => {
      const graph = await analyzeProjectFiles(1, 1, []);

      expect(graph).toBeNull();
    });
  });

  // ============================================================================
  // HAS ACTIVE GRAPH
  // ============================================================================

  describe('hasActiveGraph', () => {
    const mockProject = {
      id: 1,
      user_id: 1,
      name: 'Test Project',
      description: null,
      github_repo_url: null,
      created_at: new Date(),
      updated_at: new Date()
    };

    it('should return true when project has active graph', async () => {
      sql.mockResolvedValueOnce({ rows: [mockProject] });
      getGraphByPersistentProjectId.mockResolvedValueOnce({ projectId: 'abc123' });

      const result = await hasActiveGraph(1, 1);

      expect(result).toBe(true);
    });

    it('should return false when project has no graph', async () => {
      sql.mockResolvedValueOnce({ rows: [mockProject] });
      getGraphByPersistentProjectId.mockResolvedValueOnce(null);

      const result = await hasActiveGraph(1, 1);

      expect(result).toBe(false);
    });

    it('should return false for non-existent project', async () => {
      sql.mockResolvedValueOnce({ rows: [] });

      const result = await hasActiveGraph(999, 1);

      expect(result).toBe(false);
    });
  });

  // ============================================================================
  // GET PROJECT WITH GRAPH
  // ============================================================================

  describe('getProjectWithGraph', () => {
    const mockProject = {
      id: 1,
      user_id: 1,
      name: 'Test Project',
      description: 'A test project',
      github_repo_url: 'https://github.com/user/repo',
      created_at: new Date(),
      updated_at: new Date()
    };

    const mockGraph = {
      projectId: 'abc123',
      userId: 1,
      projectName: 'Test Project',
      persistentProjectId: 1,
      nodes: [],
      edges: [],
      stats: { totalFiles: 5 },
      analyzedAt: new Date(),
      expiresAt: new Date(Date.now() + 86400000)
    };

    it('should return project with graph summary', async () => {
      sql.mockResolvedValueOnce({ rows: [mockProject] });
      getGraphByPersistentProjectId.mockResolvedValueOnce(mockGraph);

      const result = await getProjectWithGraph(1, 1);

      expect(result).toBeDefined();
      expect(result.name).toBe('Test Project');
      expect(result.graph).toBeDefined();
      expect(result.graph.projectId).toBe('abc123');
      expect(result.graph.fileCount).toBe(5);
    });

    it('should return project with null graph when no graph exists', async () => {
      sql.mockResolvedValueOnce({ rows: [mockProject] });
      getGraphByPersistentProjectId.mockResolvedValueOnce(null);

      const result = await getProjectWithGraph(1, 1);

      expect(result).toBeDefined();
      expect(result.name).toBe('Test Project');
      expect(result.graph).toBeNull();
    });

    it('should return null for non-existent project', async () => {
      sql.mockResolvedValueOnce({ rows: [] });

      const result = await getProjectWithGraph(999, 1);

      expect(result).toBeNull();
    });

    it('should return null when projectId is missing', async () => {
      const result = await getProjectWithGraph(null, 1);

      expect(result).toBeNull();
    });

    it('should return null when userId is missing', async () => {
      const result = await getProjectWithGraph(1, null);

      expect(result).toBeNull();
    });
  });

  // ============================================================================
  // DEFAULT EXPORT
  // ============================================================================

  describe('default export', () => {
    it('should export all methods', () => {
      expect(projectService.createProject).toBeDefined();
      expect(projectService.getProject).toBeDefined();
      expect(projectService.listProjects).toBeDefined();
      expect(projectService.updateProject).toBeDefined();
      expect(projectService.deleteProject).toBeDefined();
      expect(projectService.projectExists).toBeDefined();
      expect(projectService.getProjectCount).toBeDefined();
      // Graph-related functions
      expect(projectService.getProjectGraph).toBeDefined();
      expect(projectService.analyzeProjectFiles).toBeDefined();
      expect(projectService.hasActiveGraph).toBeDefined();
      expect(projectService.getProjectWithGraph).toBeDefined();
    });
  });
});
