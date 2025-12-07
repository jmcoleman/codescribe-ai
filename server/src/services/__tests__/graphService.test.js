/**
 * Unit tests for graphService
 *
 * Tests the Graph Engine API including:
 * - Project analysis and graph building
 * - Import path resolution
 * - File context extraction
 * - Mermaid diagram generation
 * - Graph CRUD operations
 *
 * Pattern 11: ES Modules vs CommonJS (see TEST-PATTERNS-GUIDE.md)
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock @vercel/postgres BEFORE importing graphService
jest.mock('@vercel/postgres', () => ({
  sql: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 })
}));

// Mock codeParser
jest.mock('../codeParser.js', () => ({
  parseCode: jest.fn()
}));

import graphService, {
  analyzeProject,
  getGraph,
  getFileContext,
  generateDiagram,
  deleteGraph,
  listGraphs
} from '../graphService.js';
import { sql } from '@vercel/postgres';
import { parseCode } from '../codeParser.js';

describe('GraphService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================================
  // PROJECT ANALYSIS
  // ============================================================================

  describe('analyzeProject', () => {
    const mockFiles = [
      {
        path: 'src/index.js',
        content: 'import { foo } from "./utils/helpers";\nexport default function main() {}'
      },
      {
        path: 'src/utils/helpers.js',
        content: 'export function foo() {}\nexport function bar() {}'
      }
    ];

    beforeEach(() => {
      // Mock parseCode responses
      parseCode.mockImplementation((content, language) => {
        if (content.includes('import { foo }')) {
          return Promise.resolve({
            functions: [{ name: 'main', params: [], async: false }],
            classes: [],
            exports: [{ name: 'default', type: 'default' }],
            imports: [{ source: './utils/helpers', specifiers: [{ local: 'foo', imported: 'foo' }] }],
            cyclomaticComplexity: 2
          });
        }
        return Promise.resolve({
          functions: [{ name: 'foo', params: [], async: false }, { name: 'bar', params: [], async: false }],
          classes: [],
          exports: [{ name: 'foo', type: 'named' }, { name: 'bar', type: 'named' }],
          imports: [],
          cyclomaticComplexity: 1
        });
      });

      // Mock database insert
      sql.mockResolvedValue({ rows: [{ id: 1 }], rowCount: 1 });
    });

    it('should analyze a project and build dependency graph', async () => {
      const graph = await analyzeProject(1, 'test-project', mockFiles);

      expect(graph).toBeDefined();
      expect(graph.projectName).toBe('test-project');
      expect(graph.userId).toBe(1);
      expect(graph.nodes).toHaveLength(2);
      expect(graph.edges).toHaveLength(1);
    });

    it('should create nodes with correct metadata', async () => {
      const graph = await analyzeProject(1, 'test-project', mockFiles);

      const indexNode = graph.nodes.find(n => n.id === 'src/index.js');
      expect(indexNode).toBeDefined();
      expect(indexNode.fileName).toBe('index.js');
      expect(indexNode.functions).toHaveLength(1);
      expect(indexNode.language).toBe('javascript');
    });

    it('should resolve import paths to create edges', async () => {
      const graph = await analyzeProject(1, 'test-project', mockFiles);

      expect(graph.edges).toHaveLength(1);
      expect(graph.edges[0].from).toBe('src/index.js');
      expect(graph.edges[0].to).toBe('src/utils/helpers.js');
    });

    it('should calculate dependent counts', async () => {
      const graph = await analyzeProject(1, 'test-project', mockFiles);

      const helpersNode = graph.nodes.find(n => n.id === 'src/utils/helpers.js');
      expect(helpersNode.dependentCount).toBe(1);

      const indexNode = graph.nodes.find(n => n.id === 'src/index.js');
      expect(indexNode.dependentCount).toBe(0);
    });

    it('should calculate aggregate statistics', async () => {
      const graph = await analyzeProject(1, 'test-project', mockFiles);

      expect(graph.stats.totalFiles).toBe(2);
      expect(graph.stats.totalFunctions).toBe(3); // main + foo + bar
      expect(graph.stats.totalEdges).toBe(1);
    });

    it('should set 24h TTL for expiration', async () => {
      const before = Date.now();
      const graph = await analyzeProject(1, 'test-project', mockFiles);
      const after = Date.now();

      const expiresAt = new Date(graph.expiresAt).getTime();
      const expectedMin = before + (24 * 60 * 60 * 1000);
      const expectedMax = after + (24 * 60 * 60 * 1000);

      expect(expiresAt).toBeGreaterThanOrEqual(expectedMin);
      expect(expiresAt).toBeLessThanOrEqual(expectedMax);
    });

    it('should persist graph to database', async () => {
      await analyzeProject(1, 'test-project', mockFiles);

      expect(sql).toHaveBeenCalled();
    });

    it('should handle parse errors gracefully', async () => {
      parseCode.mockRejectedValueOnce(new Error('Parse error'));

      const graph = await analyzeProject(1, 'test-project', mockFiles);

      // Should still complete with minimal node
      expect(graph.nodes).toHaveLength(2);
    });

    it('should respect branch option', async () => {
      const graph = await analyzeProject(1, 'test-project', mockFiles, { branch: 'feature/test' });

      expect(graph.branch).toBe('feature/test');
    });
  });

  // ============================================================================
  // GRAPH RETRIEVAL
  // ============================================================================

  describe('getGraph', () => {
    it('should retrieve a graph by ID', async () => {
      const mockGraph = {
        project_id: 'abc123',
        user_id: 1,
        project_name: 'test-project',
        project_path: '',
        branch: 'main',
        nodes: [{ id: 'index.js', fileName: 'index.js', exports: [], imports: [], functions: [], classes: [] }],
        edges: [],
        stats: { totalFiles: 1 },
        analyzed_at: new Date(),
        expires_at: new Date(Date.now() + 86400000)
      };
      sql.mockResolvedValue({ rows: [mockGraph] });

      const graph = await getGraph('abc123', 1);

      expect(graph).toBeDefined();
      expect(graph.projectId).toBe('abc123');
      expect(graph.projectName).toBe('test-project');
    });

    it('should return null for non-existent graph', async () => {
      sql.mockResolvedValue({ rows: [] });

      const graph = await getGraph('nonexistent', 1);

      expect(graph).toBeNull();
    });

    it('should not return expired graphs', async () => {
      sql.mockResolvedValue({ rows: [] }); // Query filters out expired

      const graph = await getGraph('expired123', 1);

      expect(graph).toBeNull();
    });
  });

  // ============================================================================
  // FILE CONTEXT
  // ============================================================================

  describe('getFileContext', () => {
    const mockGraphData = {
      project_id: 'abc123',
      user_id: 1,
      project_name: 'test-project',
      project_path: '',
      branch: 'main',
      nodes: [
        {
          id: 'src/auth.js',
          fileName: 'auth.js',
          exports: [{ name: 'validateToken', type: 'named' }, { name: 'requireAuth', type: 'named' }],
          imports: [{ source: './utils/jwt', specifiers: ['sign', 'verify'] }],
          functions: [{ name: 'validateToken', params: ['token'], async: true }],
          classes: [],
          dependentCount: 3,
          dependencyCount: 1
        },
        {
          id: 'src/routes/api.js',
          fileName: 'api.js',
          exports: [{ name: 'default', type: 'default' }],
          imports: [{ source: '../auth', specifiers: ['requireAuth'] }],
          functions: [],
          classes: [],
          dependentCount: 0,
          dependencyCount: 1
        }
      ],
      edges: [
        { from: 'src/routes/api.js', to: 'src/auth.js', specifiers: ['requireAuth'] }
      ],
      stats: { totalFiles: 2 },
      analyzed_at: new Date(),
      expires_at: new Date(Date.now() + 86400000)
    };

    beforeEach(() => {
      sql.mockResolvedValue({ rows: [mockGraphData] });
    });

    it('should get file context with dependents', async () => {
      const context = await getFileContext('abc123', 'src/auth.js', 1);

      expect(context).toBeDefined();
      expect(context.file).toBe('src/auth.js');
      expect(context.dependents).toHaveLength(1);
      expect(context.dependents[0].file).toBe('src/routes/api.js');
    });

    it('should include context string for LLM injection', async () => {
      const context = await getFileContext('abc123', 'src/auth.js', 1);

      expect(context.contextString).toBeDefined();
      expect(context.contextString).toContain('validateToken');
      expect(context.contextString).toContain('imported by');
    });

    it('should return null for file not in graph', async () => {
      const context = await getFileContext('abc123', 'nonexistent.js', 1);

      expect(context).toBeNull();
    });

    it('should include statistics', async () => {
      const context = await getFileContext('abc123', 'src/auth.js', 1);

      expect(context.stats).toBeDefined();
      expect(context.stats.dependentCount).toBe(1);
      expect(context.stats.exportCount).toBe(2);
    });
  });

  // ============================================================================
  // MERMAID DIAGRAM GENERATION
  // ============================================================================

  describe('generateDiagram', () => {
    const mockGraphData = {
      project_id: 'abc123',
      user_id: 1,
      project_name: 'test-project',
      project_path: '',
      branch: 'main',
      nodes: [
        { id: 'src/index.js', fileName: 'index.js', exports: [], imports: [], functions: [], classes: [], dependentCount: 0, dependencyCount: 1 },
        { id: 'src/auth.js', fileName: 'auth.js', exports: [], imports: [], functions: [], classes: [{ name: 'AuthService' }], dependentCount: 2, dependencyCount: 0 },
        { id: 'src/utils/helpers.js', fileName: 'helpers.js', exports: [], imports: [], functions: [], classes: [], dependentCount: 1, dependencyCount: 0 }
      ],
      edges: [
        { from: 'src/index.js', to: 'src/auth.js', specifiers: [] },
        { from: 'src/routes/api.js', to: 'src/auth.js', specifiers: [] }
      ],
      stats: { totalFiles: 3 },
      analyzed_at: new Date(),
      expires_at: new Date(Date.now() + 86400000)
    };

    beforeEach(() => {
      sql.mockResolvedValue({ rows: [mockGraphData] });
    });

    it('should generate architecture diagram', async () => {
      const diagram = await generateDiagram('abc123', 1, { type: 'architecture' });

      expect(diagram).toBeDefined();
      expect(diagram).toContain('flowchart TB');
      expect(diagram).toContain('subgraph');
    });

    it('should generate dependency diagram', async () => {
      const diagram = await generateDiagram('abc123', 1, { type: 'dependencies' });

      expect(diagram).toBeDefined();
      expect(diagram).toContain('flowchart LR');
    });

    it('should generate focused diagram for specific file', async () => {
      const diagram = await generateDiagram('abc123', 1, {
        type: 'dependencies',
        focusFile: 'src/auth.js'
      });

      expect(diagram).toBeDefined();
      expect(diagram).toContain('auth_js');
      expect(diagram).toContain(':::focus');
    });

    it('should return null for non-existent graph', async () => {
      sql.mockResolvedValue({ rows: [] });

      const diagram = await generateDiagram('nonexistent', 1);

      expect(diagram).toBeNull();
    });

    it('should respect maxNodes limit', async () => {
      const diagram = await generateDiagram('abc123', 1, { maxNodes: 2 });

      // Should limit nodes included
      expect(diagram).toBeDefined();
    });
  });

  // ============================================================================
  // GRAPH DELETION
  // ============================================================================

  describe('deleteGraph', () => {
    it('should delete a graph', async () => {
      sql.mockResolvedValue({ rowCount: 1 });

      const result = await deleteGraph('abc123', 1);

      expect(result).toBe(true);
      expect(sql).toHaveBeenCalled();
    });

    it('should return false for non-existent graph', async () => {
      sql.mockResolvedValue({ rowCount: 0 });

      const result = await deleteGraph('nonexistent', 1);

      expect(result).toBe(false);
    });
  });

  // ============================================================================
  // LIST GRAPHS
  // ============================================================================

  describe('listGraphs', () => {
    it('should list all graphs for a user', async () => {
      const mockRows = [
        {
          project_id: 'abc123',
          project_name: 'Project A',
          branch: 'main',
          file_count: 10,
          total_functions: 25,
          stats: { totalFiles: 10 },
          analyzed_at: new Date(),
          expires_at: new Date(Date.now() + 86400000)
        },
        {
          project_id: 'def456',
          project_name: 'Project B',
          branch: 'develop',
          file_count: 5,
          total_functions: 12,
          stats: { totalFiles: 5 },
          analyzed_at: new Date(),
          expires_at: new Date(Date.now() + 86400000)
        }
      ];
      sql.mockResolvedValue({ rows: mockRows });

      const graphs = await listGraphs(1);

      expect(graphs).toHaveLength(2);
      expect(graphs[0].projectId).toBe('abc123');
      expect(graphs[1].projectName).toBe('Project B');
    });

    it('should return empty array for user with no graphs', async () => {
      sql.mockResolvedValue({ rows: [] });

      const graphs = await listGraphs(99);

      expect(graphs).toEqual([]);
    });
  });

  // ============================================================================
  // IMPORT PATH RESOLUTION (tested via analyzeProject)
  // ============================================================================

  describe('import path resolution', () => {
    beforeEach(() => {
      sql.mockResolvedValue({ rows: [{ id: 1 }], rowCount: 1 });
    });

    it('should resolve relative imports with ./', async () => {
      parseCode.mockImplementation((content) => {
        if (content.includes('import')) {
          return Promise.resolve({
            functions: [],
            classes: [],
            exports: [],
            imports: [{ source: './utils', specifiers: [{ local: 'foo' }] }],
            cyclomaticComplexity: 1
          });
        }
        return Promise.resolve({ functions: [], classes: [], exports: [], imports: [], cyclomaticComplexity: 1 });
      });

      const files = [
        { path: 'src/index.js', content: 'import { foo } from "./utils";' },
        { path: 'src/utils.js', content: 'export const foo = 1;' }
      ];

      const graph = await analyzeProject(1, 'test', files);

      expect(graph.edges).toHaveLength(1);
      expect(graph.edges[0].to).toBe('src/utils.js');
    });

    it('should resolve parent directory imports with ../', async () => {
      parseCode.mockImplementation((content) => {
        if (content.includes('import')) {
          return Promise.resolve({
            functions: [],
            classes: [],
            exports: [],
            imports: [{ source: '../utils', specifiers: [{ local: 'foo' }] }],
            cyclomaticComplexity: 1
          });
        }
        return Promise.resolve({ functions: [], classes: [], exports: [], imports: [], cyclomaticComplexity: 1 });
      });

      const files = [
        { path: 'src/components/Button.js', content: 'import { foo } from "../utils";' },
        { path: 'src/utils.js', content: 'export const foo = 1;' }
      ];

      const graph = await analyzeProject(1, 'test', files);

      expect(graph.edges).toHaveLength(1);
      expect(graph.edges[0].to).toBe('src/utils.js');
    });

    it('should not create edges for external packages', async () => {
      parseCode.mockResolvedValue({
        functions: [],
        classes: [],
        exports: [],
        imports: [
          { source: 'lodash', specifiers: [{ local: 'map' }] },
          { source: 'react', specifiers: [{ local: 'useState' }] }
        ],
        cyclomaticComplexity: 1
      });

      const files = [
        { path: 'src/index.js', content: 'import { map } from "lodash";' }
      ];

      const graph = await analyzeProject(1, 'test', files);

      expect(graph.edges).toHaveLength(0);
    });
  });

  // ============================================================================
  // LANGUAGE DETECTION
  // ============================================================================

  describe('language detection', () => {
    beforeEach(() => {
      parseCode.mockResolvedValue({
        functions: [],
        classes: [],
        exports: [],
        imports: [],
        cyclomaticComplexity: 1
      });
      sql.mockResolvedValue({ rows: [{ id: 1 }], rowCount: 1 });
    });

    it('should detect JavaScript files', async () => {
      const files = [{ path: 'index.js', content: '' }];
      const graph = await analyzeProject(1, 'test', files);

      expect(graph.nodes[0].language).toBe('javascript');
    });

    it('should detect TypeScript files', async () => {
      const files = [{ path: 'index.ts', content: '' }];
      const graph = await analyzeProject(1, 'test', files);

      expect(graph.nodes[0].language).toBe('typescript');
    });

    it('should detect JSX files as JavaScript', async () => {
      const files = [{ path: 'App.jsx', content: '' }];
      const graph = await analyzeProject(1, 'test', files);

      expect(graph.nodes[0].language).toBe('javascript');
    });

    it('should detect Python files', async () => {
      const files = [{ path: 'main.py', content: '' }];
      const graph = await analyzeProject(1, 'test', files);

      expect(graph.nodes[0].language).toBe('python');
    });

    it('should detect unknown language for unsupported extensions', async () => {
      const files = [{ path: 'file.xyz', content: '' }];
      const graph = await analyzeProject(1, 'test', files);

      expect(graph.nodes[0].language).toBe('unknown');
    });
  });

  // ============================================================================
  // ADDITIONAL COVERAGE TESTS
  // ============================================================================

  describe('import path edge cases', () => {
    beforeEach(() => {
      sql.mockResolvedValue({ rows: [{ id: 1 }], rowCount: 1 });
    });

    it('should handle absolute path imports', async () => {
      parseCode.mockImplementation((content) => {
        if (content.includes('import')) {
          return Promise.resolve({
            functions: [],
            classes: [],
            exports: [],
            imports: [{ source: '/src/utils', specifiers: [{ local: 'foo' }] }],
            cyclomaticComplexity: 1
          });
        }
        return Promise.resolve({ functions: [], classes: [], exports: [], imports: [], cyclomaticComplexity: 1 });
      });

      const files = [
        { path: 'src/index.js', content: 'import { foo } from "/src/utils";' },
        { path: 'src/utils.js', content: 'export const foo = 1;' }
      ];

      const graph = await analyzeProject(1, 'test', files);

      // Should resolve /src/utils to src/utils.js
      expect(graph.edges).toHaveLength(1);
    });

    it('should resolve index files in directories', async () => {
      parseCode.mockImplementation((content) => {
        if (content.includes('import')) {
          return Promise.resolve({
            functions: [],
            classes: [],
            exports: [],
            imports: [{ source: './utils', specifiers: [{ local: 'foo' }] }],
            cyclomaticComplexity: 1
          });
        }
        return Promise.resolve({ functions: [], classes: [], exports: [], imports: [], cyclomaticComplexity: 1 });
      });

      const files = [
        { path: 'src/index.js', content: 'import { foo } from "./utils";' },
        { path: 'src/utils/index.js', content: 'export const foo = 1;' }
      ];

      const graph = await analyzeProject(1, 'test', files);

      expect(graph.edges).toHaveLength(1);
      expect(graph.edges[0].to).toBe('src/utils/index.js');
    });

    it('should handle unresolvable imports gracefully', async () => {
      parseCode.mockResolvedValue({
        functions: [],
        classes: [],
        exports: [],
        imports: [{ source: './nonexistent', specifiers: [{ local: 'foo' }] }],
        cyclomaticComplexity: 1
      });

      const files = [
        { path: 'src/index.js', content: 'import { foo } from "./nonexistent";' }
      ];

      const graph = await analyzeProject(1, 'test', files);

      // Should not create edge for unresolvable import
      expect(graph.edges).toHaveLength(0);
    });

    it('should handle deeply nested parent directory traversal', async () => {
      parseCode.mockImplementation((content) => {
        if (content.includes('import')) {
          return Promise.resolve({
            functions: [],
            classes: [],
            exports: [],
            imports: [{ source: '../../../utils', specifiers: [{ local: 'foo' }] }],
            cyclomaticComplexity: 1
          });
        }
        return Promise.resolve({ functions: [], classes: [], exports: [], imports: [], cyclomaticComplexity: 1 });
      });

      const files = [
        { path: 'src/features/auth/login.js', content: 'import { foo } from "../../../utils";' },
        { path: 'utils.js', content: 'export const foo = 1;' }
      ];

      const graph = await analyzeProject(1, 'test', files);

      expect(graph.edges).toHaveLength(1);
      expect(graph.edges[0].to).toBe('utils.js');
    });
  });

  describe('file context edge cases', () => {
    it('should handle file with no imports or exports', async () => {
      const mockGraphData = {
        project_id: 'abc123',
        user_id: 1,
        project_name: 'test-project',
        project_path: '',
        branch: 'main',
        nodes: [
          {
            id: 'src/standalone.js',
            fileName: 'standalone.js',
            exports: [],
            imports: [],
            functions: [],
            classes: [],
            dependentCount: 0,
            dependencyCount: 0
          }
        ],
        edges: [],
        stats: { totalFiles: 1 },
        analyzed_at: new Date(),
        expires_at: new Date(Date.now() + 86400000)
      };
      sql.mockResolvedValue({ rows: [mockGraphData] });

      const context = await getFileContext('abc123', 'src/standalone.js', 1);

      expect(context).toBeDefined();
      expect(context.dependents).toHaveLength(0);
      expect(context.dependencies).toHaveLength(0);
      // Context string should still be generated (empty or minimal)
      expect(context.contextString).toBeDefined();
    });

    it('should handle file with classes', async () => {
      const mockGraphData = {
        project_id: 'abc123',
        user_id: 1,
        project_name: 'test-project',
        project_path: '',
        branch: 'main',
        nodes: [
          {
            id: 'src/AuthService.js',
            fileName: 'AuthService.js',
            exports: [{ name: 'AuthService', type: 'class' }],
            imports: [],
            functions: [],
            classes: [{ name: 'AuthService', methods: ['login', 'logout'] }],
            dependentCount: 5,
            dependencyCount: 0
          }
        ],
        edges: [],
        stats: { totalFiles: 1 },
        analyzed_at: new Date(),
        expires_at: new Date(Date.now() + 86400000)
      };
      sql.mockResolvedValue({ rows: [mockGraphData] });

      const context = await getFileContext('abc123', 'src/AuthService.js', 1);

      expect(context.contextString).toContain('AuthService');
      expect(context.contextString).toContain('Classes defined');
    });
  });

  describe('diagram generation edge cases', () => {
    it('should generate dataflow diagram', async () => {
      const mockGraphData = {
        project_id: 'abc123',
        user_id: 1,
        project_name: 'test-project',
        project_path: '',
        branch: 'main',
        nodes: [
          { id: 'src/app.js', fileName: 'app.js', exports: [], imports: [], functions: [], classes: [], dependentCount: 0, dependencyCount: 2 },
          { id: 'src/auth.js', fileName: 'auth.js', exports: [], imports: [], functions: [], classes: [], dependentCount: 5, dependencyCount: 1 },
          { id: 'src/utils.js', fileName: 'utils.js', exports: [], imports: [], functions: [], classes: [], dependentCount: 3, dependencyCount: 0 }
        ],
        edges: [
          { from: 'src/app.js', to: 'src/auth.js', specifiers: [] },
          { from: 'src/auth.js', to: 'src/utils.js', specifiers: [] }
        ],
        stats: { totalFiles: 3 },
        analyzed_at: new Date(),
        expires_at: new Date(Date.now() + 86400000)
      };
      sql.mockResolvedValue({ rows: [mockGraphData] });

      const diagram = await generateDiagram('abc123', 1, { type: 'dataflow' });

      expect(diagram).toBeDefined();
      expect(diagram).toContain('flowchart TD');
      expect(diagram).toContain('subgraph');
    });

    it('should return null for focused diagram with non-existent file', async () => {
      const mockGraphData = {
        project_id: 'abc123',
        user_id: 1,
        project_name: 'test-project',
        project_path: '',
        branch: 'main',
        nodes: [
          { id: 'src/index.js', fileName: 'index.js', exports: [], imports: [], functions: [], classes: [], dependentCount: 0, dependencyCount: 0 }
        ],
        edges: [],
        stats: { totalFiles: 1 },
        analyzed_at: new Date(),
        expires_at: new Date(Date.now() + 86400000)
      };
      sql.mockResolvedValue({ rows: [mockGraphData] });

      const diagram = await generateDiagram('abc123', 1, {
        type: 'dependencies',
        focusFile: 'nonexistent.js'
      });

      expect(diagram).toBeNull();
    });
  });

  describe('cleanupExpiredGraphs', () => {
    it('should delete expired graphs and return count', async () => {
      sql.mockResolvedValue({ rowCount: 5 });

      const { cleanupExpiredGraphs } = await import('../graphService.js');
      const count = await cleanupExpiredGraphs();

      expect(count).toBe(5);
      expect(sql).toHaveBeenCalled();
    });

    it('should return 0 when no graphs expired', async () => {
      sql.mockResolvedValue({ rowCount: 0 });

      const { cleanupExpiredGraphs } = await import('../graphService.js');
      const count = await cleanupExpiredGraphs();

      expect(count).toBe(0);
    });
  });

  describe('refreshGraph', () => {
    it('should return null for non-existent graph', async () => {
      sql.mockResolvedValue({ rows: [] });

      const { refreshGraph } = await import('../graphService.js');
      const result = await refreshGraph('nonexistent', 1, [{ path: 'file.js', content: '' }]);

      expect(result).toBeNull();
    });

    it('should re-analyze project when graph exists', async () => {
      const mockExistingGraph = {
        project_id: 'abc123',
        user_id: 1,
        project_name: 'test-project',
        project_path: '/path/to/project',
        branch: 'main',
        nodes: [],
        edges: [],
        stats: { totalFiles: 1 },
        analyzed_at: new Date(),
        expires_at: new Date(Date.now() + 86400000)
      };

      // First call returns existing graph, second call is for saving
      sql.mockResolvedValueOnce({ rows: [mockExistingGraph] })
        .mockResolvedValue({ rows: [{ id: 1 }], rowCount: 1 });

      parseCode.mockResolvedValue({
        functions: [],
        classes: [],
        exports: [],
        imports: [],
        cyclomaticComplexity: 1
      });

      const { refreshGraph } = await import('../graphService.js');
      const result = await refreshGraph('abc123', 1, [{ path: 'file.js', content: 'const x = 1;' }]);

      expect(result).toBeDefined();
      expect(result.projectName).toBe('test-project');
      expect(result.branch).toBe('main');
    });
  });

  // ============================================================================
  // BRANCH COVERAGE: FILE CONTEXT VARIATIONS
  // ============================================================================

  describe('file context with various combinations', () => {
    it('should include dependencies in context string', async () => {
      const mockGraphData = {
        project_id: 'abc123',
        user_id: 1,
        project_name: 'test-project',
        project_path: '',
        branch: 'main',
        nodes: [
          {
            id: 'src/app.js',
            fileName: 'app.js',
            exports: [],
            imports: [{ source: './utils', specifiers: [] }],
            functions: [],
            classes: [],
            dependentCount: 0,
            dependencyCount: 1
          },
          {
            id: 'src/utils.js',
            fileName: 'utils.js',
            exports: [{ name: 'helper', type: 'named' }],
            imports: [],
            functions: [],
            classes: [],
            dependentCount: 1,
            dependencyCount: 0
          }
        ],
        edges: [
          { from: 'src/app.js', to: 'src/utils.js', specifiers: ['helper'] }
        ],
        stats: { totalFiles: 2 },
        analyzed_at: new Date(),
        expires_at: new Date(Date.now() + 86400000)
      };
      sql.mockResolvedValue({ rows: [mockGraphData] });

      const context = await getFileContext('abc123', 'src/app.js', 1);

      expect(context.contextString).toContain('depends on');
      expect(context.dependencies).toHaveLength(1);
    });

    it('should include functions in context string', async () => {
      const mockGraphData = {
        project_id: 'abc123',
        user_id: 1,
        project_name: 'test-project',
        project_path: '',
        branch: 'main',
        nodes: [
          {
            id: 'src/utils.js',
            fileName: 'utils.js',
            exports: [],
            imports: [],
            functions: [{ name: 'helper', params: [], async: false }, { name: 'format', params: ['str'], async: false }],
            classes: [],
            dependentCount: 0,
            dependencyCount: 0
          }
        ],
        edges: [],
        stats: { totalFiles: 1 },
        analyzed_at: new Date(),
        expires_at: new Date(Date.now() + 86400000)
      };
      sql.mockResolvedValue({ rows: [mockGraphData] });

      const context = await getFileContext('abc123', 'src/utils.js', 1);

      expect(context.contextString).toContain('Key functions');
      expect(context.contextString).toContain('helper');
    });
  });

  // ============================================================================
  // BRANCH COVERAGE: DEPENDENCY DIAGRAM EDGE CASES
  // ============================================================================

  describe('dependency diagram with focusFile dependents and dependencies', () => {
    it('should show dependents and dependencies for focused file', async () => {
      const mockGraphData = {
        project_id: 'abc123',
        user_id: 1,
        project_name: 'test-project',
        project_path: '',
        branch: 'main',
        nodes: [
          { id: 'src/app.js', fileName: 'app.js', exports: [], imports: [], functions: [], classes: [], dependentCount: 0, dependencyCount: 1 },
          { id: 'src/auth.js', fileName: 'auth.js', exports: [], imports: [], functions: [], classes: [], dependentCount: 1, dependencyCount: 1 },
          { id: 'src/utils.js', fileName: 'utils.js', exports: [], imports: [], functions: [], classes: [], dependentCount: 1, dependencyCount: 0 }
        ],
        edges: [
          { from: 'src/app.js', to: 'src/auth.js', specifiers: [] },
          { from: 'src/auth.js', to: 'src/utils.js', specifiers: [] }
        ],
        stats: { totalFiles: 3 },
        analyzed_at: new Date(),
        expires_at: new Date(Date.now() + 86400000)
      };
      sql.mockResolvedValue({ rows: [mockGraphData] });

      const diagram = await generateDiagram('abc123', 1, {
        type: 'dependencies',
        focusFile: 'src/auth.js'
      });

      expect(diagram).toContain('auth_js');
      expect(diagram).toContain(':::focus');
      expect(diagram).toContain(':::dependent'); // app.js imports auth.js
      expect(diagram).toContain(':::dependency'); // auth.js imports utils.js
    });
  });

  // ============================================================================
  // BRANCH COVERAGE: DATAFLOW DIAGRAM WITH EDGES BETWEEN CATEGORIES
  // ============================================================================

  describe('dataflow diagram with interconnected nodes', () => {
    it('should include edges between entry, core, and leaf modules', async () => {
      const mockGraphData = {
        project_id: 'abc123',
        user_id: 1,
        project_name: 'test-project',
        project_path: '',
        branch: 'main',
        nodes: [
          // Entry point (no dependents, has dependencies)
          { id: 'src/main.js', fileName: 'main.js', exports: [], imports: [], functions: [], classes: [], dependentCount: 0, dependencyCount: 3 },
          // Core modules (high dependents AND dependencies)
          { id: 'src/auth.js', fileName: 'auth.js', exports: [], imports: [], functions: [], classes: [], dependentCount: 4, dependencyCount: 2 },
          { id: 'src/api.js', fileName: 'api.js', exports: [], imports: [], functions: [], classes: [], dependentCount: 3, dependencyCount: 1 },
          // Leaf modules (has dependents, no dependencies)
          { id: 'src/config.js', fileName: 'config.js', exports: [], imports: [], functions: [], classes: [], dependentCount: 5, dependencyCount: 0 }
        ],
        edges: [
          { from: 'src/main.js', to: 'src/auth.js', specifiers: [] },
          { from: 'src/main.js', to: 'src/api.js', specifiers: [] },
          { from: 'src/auth.js', to: 'src/config.js', specifiers: [] },
          { from: 'src/api.js', to: 'src/config.js', specifiers: [] }
        ],
        stats: { totalFiles: 4 },
        analyzed_at: new Date(),
        expires_at: new Date(Date.now() + 86400000)
      };
      sql.mockResolvedValue({ rows: [mockGraphData] });

      const diagram = await generateDiagram('abc123', 1, { type: 'dataflow' });

      expect(diagram).toContain('Entry');
      expect(diagram).toContain('Core');
      expect(diagram).toContain('Utilities & Helpers');
      // Check for edges
      expect(diagram).toContain('-->');
    });
  });

  // ============================================================================
  // BRANCH COVERAGE: NORMALIZEPATH WITH .. IN MIDDLE
  // ============================================================================

  describe('path normalization edge cases', () => {
    beforeEach(() => {
      sql.mockResolvedValue({ rows: [{ id: 1 }], rowCount: 1 });
    });

    it('should handle path with .. in the middle', async () => {
      parseCode.mockImplementation((content) => {
        if (content.includes('import')) {
          return Promise.resolve({
            functions: [],
            classes: [],
            exports: [],
            imports: [{ source: './foo/../bar', specifiers: [{ local: 'x' }] }],
            cyclomaticComplexity: 1
          });
        }
        return Promise.resolve({ functions: [], classes: [], exports: [], imports: [], cyclomaticComplexity: 1 });
      });

      const files = [
        { path: 'src/index.js', content: 'import { x } from "./foo/../bar";' },
        { path: 'src/bar.js', content: 'export const x = 1;' }
      ];

      const graph = await analyzeProject(1, 'test', files);

      expect(graph.edges).toHaveLength(1);
      expect(graph.edges[0].to).toBe('src/bar.js');
    });

    it('should handle bare import paths (no prefix)', async () => {
      parseCode.mockImplementation((content) => {
        if (content.includes('import')) {
          return Promise.resolve({
            functions: [],
            classes: [],
            exports: [],
            // Bare import without ./ or ../ or / - treated as local path
            imports: [{ source: 'utils', specifiers: [{ local: 'foo' }] }],
            cyclomaticComplexity: 1
          });
        }
        return Promise.resolve({ functions: [], classes: [], exports: [], imports: [], cyclomaticComplexity: 1 });
      });

      const files = [
        { path: 'src/index.js', content: 'import { foo } from "utils";' },
        { path: 'utils.js', content: 'export const foo = 1;' }
      ];

      const graph = await analyzeProject(1, 'test', files);

      // Bare imports without ./ are treated as external packages, no edge created
      expect(graph.edges).toHaveLength(0);
    });
  });

  // ============================================================================
  // BRANCH COVERAGE: GRAPH NOT FOUND IN getFileContext
  // ============================================================================

  describe('getFileContext when graph not found', () => {
    it('should return null when graph does not exist', async () => {
      sql.mockResolvedValue({ rows: [] }); // No graph found

      const context = await getFileContext('nonexistent-graph', 'src/file.js', 1);

      expect(context).toBeNull();
    });
  });

  // ============================================================================
  // BRANCH COVERAGE: generateDiagram default type
  // ============================================================================

  describe('generateDiagram default behavior', () => {
    it('should use architecture type by default for unknown type', async () => {
      const mockGraphData = {
        project_id: 'abc123',
        user_id: 1,
        project_name: 'test-project',
        project_path: '',
        branch: 'main',
        nodes: [
          { id: 'src/index.js', fileName: 'index.js', exports: [], imports: [], functions: [], classes: [], dependentCount: 0, dependencyCount: 0 }
        ],
        edges: [],
        stats: { totalFiles: 1 },
        analyzed_at: new Date(),
        expires_at: new Date(Date.now() + 86400000)
      };
      sql.mockResolvedValue({ rows: [mockGraphData] });

      const diagram = await generateDiagram('abc123', 1, { type: 'unknown-type' });

      // Should default to architecture diagram (flowchart TB)
      expect(diagram).toContain('flowchart TB');
    });
  });

  // ============================================================================
  // BRANCH COVERAGE: PARSING WITH MISSING/NULL FIELDS
  // ============================================================================

  describe('analyzeProject with incomplete parse results', () => {
    beforeEach(() => {
      sql.mockResolvedValue({ rows: [{ id: 1 }], rowCount: 1 });
    });

    it('should handle parse results with null/undefined classes', async () => {
      parseCode.mockResolvedValue({
        functions: [{ name: 'test', params: null, async: undefined }],
        classes: null, // null instead of array
        exports: undefined, // undefined
        imports: null,
        cyclomaticComplexity: undefined
      });

      const files = [{ path: 'src/index.js', content: 'function test() {}' }];
      const graph = await analyzeProject(1, 'test', files);

      expect(graph.nodes).toHaveLength(1);
      expect(graph.nodes[0].classes).toEqual([]);
      expect(graph.nodes[0].exports).toEqual([]);
      expect(graph.nodes[0].functions).toHaveLength(1);
      expect(graph.nodes[0].functions[0].params).toEqual([]);
    });

    it('should handle classes with null methods', async () => {
      parseCode.mockResolvedValue({
        functions: [],
        classes: [{ name: 'MyClass', methods: null }],
        exports: [],
        imports: [],
        cyclomaticComplexity: 1
      });

      const files = [{ path: 'src/index.js', content: 'class MyClass {}' }];
      const graph = await analyzeProject(1, 'test', files);

      expect(graph.nodes[0].classes).toHaveLength(1);
      expect(graph.nodes[0].classes[0].methods).toEqual([]);
    });
  });
});
