/**
 * Graph Service - Dependency Graph Engine
 *
 * Builds and manages project dependency graphs for context-aware documentation.
 * Stores METADATA ONLY - no source code is persisted (SOC2 compliance).
 *
 * Part of: Graph Engine API (Epic 5.4)
 */

import { parseCode } from './codeParser.js';
import { sql } from '@vercel/postgres';
import crypto from 'crypto';

// Graph TTL: 24 hours (in milliseconds)
const GRAPH_TTL_MS = 24 * 60 * 60 * 1000;

// Chunk size for processing large projects (memory-friendly)
const CHUNK_SIZE = 500;

/**
 * GraphNode represents a single file in the dependency graph
 * @typedef {Object} GraphNode
 * @property {string} id - File path (relative to project root)
 * @property {string} fileName - Just the filename
 * @property {Array<{name: string, type: string}>} exports - What this file exports
 * @property {Array<{source: string, specifiers: Array}>} imports - What this file imports
 * @property {Array<{name: string, params: string[], async: boolean}>} functions - Functions defined
 * @property {Array<{name: string, methods: Array}>} classes - Classes defined
 * @property {number} complexity - Cyclomatic complexity
 * @property {number} dependentCount - Number of files that import this
 * @property {number} dependencyCount - Number of files this imports
 * @property {string} language - Detected language
 */

/**
 * GraphEdge represents a dependency between two files
 * @typedef {Object} GraphEdge
 * @property {string} from - Source file path
 * @property {string} to - Target file path
 * @property {Array<string>} specifiers - What is imported (function names, etc.)
 * @property {string} type - 'import' | 'reexport' | 'dynamic'
 */

/**
 * ProjectGraph is the complete dependency graph for a project
 * @typedef {Object} ProjectGraph
 * @property {string} projectId - Unique identifier
 * @property {number} userId - Owner's user ID
 * @property {string} projectName - Human-readable project name
 * @property {string} branch - Git branch (default: 'main')
 * @property {GraphNode[]} nodes - All file nodes
 * @property {GraphEdge[]} edges - All dependency edges
 * @property {Object} stats - Aggregate statistics
 * @property {Date} expiresAt - When this graph expires
 */

/**
 * Generate a unique project ID
 * @param {number} userId - User ID
 * @param {string} projectName - Project name
 * @param {string} branch - Git branch
 * @returns {string} Unique project ID
 */
function generateProjectId(userId, projectName, branch = 'main') {
  const input = `${userId}:${projectName}:${branch}:${Date.now()}`;
  return crypto.createHash('sha256').update(input).digest('hex').substring(0, 32);
}

/**
 * Resolve import path to a normalized file path
 * Handles: relative paths, package imports, index files
 * @param {string} importSource - The import source (e.g., './utils', 'lodash')
 * @param {string} currentFile - The file containing the import
 * @param {Set<string>} projectFiles - Set of all project file paths
 * @returns {string|null} Resolved file path or null if external
 */
function resolveImportPath(importSource, currentFile, projectFiles) {
  // Skip external packages (node_modules)
  if (!importSource.startsWith('.') && !importSource.startsWith('/')) {
    return null; // External package
  }

  // Get the directory of the current file
  const currentDir = currentFile.substring(0, currentFile.lastIndexOf('/')) || '.';

  // Resolve relative path
  let resolvedPath;
  if (importSource.startsWith('./')) {
    resolvedPath = `${currentDir}/${importSource.substring(2)}`;
  } else if (importSource.startsWith('../')) {
    // Handle parent directory traversal
    const parts = currentDir.split('/');
    let importParts = importSource.split('/');
    while (importParts[0] === '..') {
      parts.pop();
      importParts.shift();
    }
    resolvedPath = [...parts, ...importParts].join('/');
  } else if (importSource.startsWith('/')) {
    resolvedPath = importSource.substring(1);
  } else {
    resolvedPath = importSource;
  }

  // Normalize path (remove ./ and resolve ..)
  resolvedPath = normalizePath(resolvedPath);

  // Try to find the actual file (with various extensions)
  const extensions = ['', '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '/index.js', '/index.ts', '/index.jsx', '/index.tsx'];

  for (const ext of extensions) {
    const candidate = resolvedPath + ext;
    if (projectFiles.has(candidate)) {
      return candidate;
    }
  }

  // File not found in project (might be external or misconfigured)
  return null;
}

/**
 * Normalize a file path (remove redundant ./ and resolve ..)
 * @param {string} path - Path to normalize
 * @returns {string} Normalized path
 */
function normalizePath(path) {
  const parts = path.split('/').filter(p => p && p !== '.');
  const resolved = [];

  for (const part of parts) {
    if (part === '..') {
      resolved.pop();
    } else {
      resolved.push(part);
    }
  }

  return resolved.join('/');
}

/**
 * Detect language from file extension
 * @param {string} filePath - File path
 * @returns {string} Language identifier
 */
function detectLanguage(filePath) {
  const ext = filePath.substring(filePath.lastIndexOf('.')).toLowerCase();
  const languageMap = {
    '.js': 'javascript',
    '.jsx': 'javascript',
    '.mjs': 'javascript',
    '.cjs': 'javascript',
    '.ts': 'typescript',
    '.tsx': 'typescript',
    '.py': 'python',
    '.go': 'go',
    '.rs': 'rust',
    '.java': 'java',
    '.rb': 'ruby',
    '.php': 'php',
    '.cs': 'csharp',
    '.cpp': 'cpp',
    '.c': 'c',
    '.h': 'c',
    '.hpp': 'cpp'
  };
  return languageMap[ext] || 'unknown';
}

/**
 * Analyze a project and build its dependency graph
 * Uses chunked processing for large projects to manage memory efficiently.
 *
 * @param {number} userId - User ID
 * @param {string} projectName - Project name
 * @param {Array<{path: string, content: string}>} files - Array of file objects
 * @param {Object} options - Analysis options
 * @param {string} [options.branch='main'] - Git branch
 * @param {string} [options.projectPath] - Project root path
 * @param {number} [options.persistentProjectId] - Optional persistent project ID (FK to projects table)
 * @param {Function} [options.onProgress] - Optional progress callback (chunksProcessed, totalChunks)
 * @returns {Promise<ProjectGraph>} The complete project graph
 */
export async function analyzeProject(userId, projectName, files, options = {}) {
  const { branch = 'main', projectPath = '', persistentProjectId = null, onProgress } = options;

  const startTime = Date.now();
  const isLargeProject = files.length > CHUNK_SIZE;

  if (isLargeProject) {
    console.log(`[Graph Analysis] Large project: ${files.length} files, processing in chunks of ${CHUNK_SIZE}`);
  }

  // Generate unique project ID
  const projectId = generateProjectId(userId, projectName, branch);

  // Create set of all file paths for import resolution (needed for cross-chunk resolution)
  const projectFilePaths = new Set(files.map(f => f.path));

  // Split files into chunks for memory-efficient processing
  const chunks = chunkArray(files, CHUNK_SIZE);
  const totalChunks = chunks.length;

  // Process files in chunks, collecting nodes and pending edges
  const allNodes = [];
  const pendingEdges = []; // { from, importSource, specifiers }

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];

    if (isLargeProject) {
      console.log(`[Graph Analysis] Processing chunk ${i + 1}/${totalChunks}: ${chunk.length} files`);
    }

    // Process this chunk
    const { nodes, edges } = await processFileChunk(chunk, projectFilePaths);
    allNodes.push(...nodes);
    pendingEdges.push(...edges);

    // Report progress if callback provided
    if (onProgress) {
      onProgress(i + 1, totalChunks);
    }

    // Yield control between chunks to prevent blocking event loop
    if (isLargeProject && i < chunks.length - 1) {
      await new Promise(resolve => setImmediate(resolve));
    }
  }

  // Resolve all edges now that we have complete node set
  const edges = resolveAllEdges(pendingEdges, projectFilePaths);

  // Calculate dependent counts
  for (const edge of edges) {
    const targetNode = allNodes.find(n => n.id === edge.to);
    if (targetNode) {
      targetNode.dependentCount++;
    }
  }

  // Calculate aggregate statistics
  const processingTime = Date.now() - startTime;
  const stats = {
    totalFiles: allNodes.length,
    totalFunctions: allNodes.reduce((sum, n) => sum + n.functions.length, 0),
    totalClasses: allNodes.reduce((sum, n) => sum + n.classes.length, 0),
    totalExports: allNodes.reduce((sum, n) => sum + n.exports.length, 0),
    totalEdges: edges.length,
    avgComplexity: allNodes.length > 0
      ? (allNodes.reduce((sum, n) => sum + n.complexity, 0) / allNodes.length).toFixed(2)
      : 0,
    maxDependents: Math.max(...allNodes.map(n => n.dependentCount), 0),
    languages: [...new Set(allNodes.map(n => n.language))].filter(l => l !== 'unknown'),
    chunksProcessed: totalChunks,
    processingTimeMs: processingTime
  };

  if (isLargeProject) {
    console.log(`[Graph Analysis] Complete: ${allNodes.length} nodes, ${edges.length} edges in ${processingTime}ms`);
  }

  // Calculate expiration time
  const expiresAt = new Date(Date.now() + GRAPH_TTL_MS);

  // Build the complete graph object
  const graph = {
    projectId,
    userId,
    projectName,
    projectPath,
    branch,
    persistentProjectId,
    nodes: allNodes,
    edges,
    stats,
    analyzedAt: new Date(),
    expiresAt
  };

  // Persist to database
  await saveGraph(graph);

  return graph;
}

/**
 * Process a chunk of files, returning nodes and pending edge references
 * @param {Array<{path: string, content: string}>} files - Files to process
 * @param {Set<string>} projectFilePaths - Complete set of project file paths
 * @returns {Promise<{nodes: Array, edges: Array}>}
 */
async function processFileChunk(files, projectFilePaths) {
  const nodes = [];
  const pendingEdges = [];

  for (const file of files) {
    const language = detectLanguage(file.path);

    // Parse the file to extract structure
    let analysis;
    try {
      analysis = await parseCode(file.content, language);
    } catch (error) {
      console.error(`Failed to parse ${file.path}:`, error.message);
      // Create a minimal node for unparseable files
      analysis = {
        functions: [],
        classes: [],
        exports: [],
        imports: [],
        cyclomaticComplexity: 0
      };
    }

    // Build the node (NO source code stored!)
    const node = {
      id: file.path,
      fileName: file.path.substring(file.path.lastIndexOf('/') + 1),
      exports: analysis.exports || [],
      imports: analysis.imports || [],
      functions: (analysis.functions || []).map(f => ({
        name: f.name,
        params: f.params || [],
        async: f.async || false
      })),
      classes: (analysis.classes || []).map(c => ({
        name: c.name,
        methods: (c.methods || []).map(m => m.name)
      })),
      complexity: analysis.cyclomaticComplexity || 0,
      dependentCount: 0, // Will be calculated after all edges resolved
      dependencyCount: 0,
      language
    };

    nodes.push(node);

    // Collect pending edges (to be resolved after all chunks processed)
    for (const imp of analysis.imports || []) {
      pendingEdges.push({
        from: file.path,
        importSource: imp.source,
        specifiers: imp.specifiers?.map(s => s.local || s.imported || 'default') || []
      });
      node.dependencyCount++;
    }
  }

  return { nodes, edges: pendingEdges };
}

/**
 * Resolve all pending edges against the complete file manifest
 * @param {Array} pendingEdges - Pending edge references
 * @param {Set<string>} projectFilePaths - Complete set of project file paths
 * @returns {Array} Resolved edges
 */
function resolveAllEdges(pendingEdges, projectFilePaths) {
  const edgeMap = new Map(); // Deduplicate edges

  for (const pending of pendingEdges) {
    const resolvedPath = resolveImportPath(pending.importSource, pending.from, projectFilePaths);

    if (resolvedPath) {
      const edgeKey = `${pending.from}:${resolvedPath}`;
      if (!edgeMap.has(edgeKey)) {
        edgeMap.set(edgeKey, {
          from: pending.from,
          to: resolvedPath,
          specifiers: pending.specifiers,
          type: 'import'
        });
      }
    }
  }

  return Array.from(edgeMap.values());
}

/**
 * Split an array into chunks of specified size
 * @param {Array} array - Array to split
 * @param {number} size - Chunk size
 * @returns {Array<Array>} Array of chunks
 */
function chunkArray(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Save a project graph to the database
 * @param {ProjectGraph} graph - The graph to save
 */
async function saveGraph(graph) {
  const nodesJson = JSON.stringify(graph.nodes);
  const edgesJson = JSON.stringify(graph.edges);
  const statsJson = JSON.stringify(graph.stats);
  const projectPath = graph.projectPath || '';
  const persistentProjectId = graph.persistentProjectId || null;

  await sql`
    INSERT INTO project_graphs (
      project_id, user_id, project_name, project_path, branch,
      persistent_project_id,
      nodes, edges, stats,
      file_count, total_functions, total_classes, total_exports,
      analyzed_at, expires_at, updated_at
    )
    VALUES (
      ${graph.projectId}, ${graph.userId}, ${graph.projectName}, ${projectPath}, ${graph.branch},
      ${persistentProjectId},
      ${nodesJson}::jsonb, ${edgesJson}::jsonb, ${statsJson}::jsonb,
      ${graph.stats.totalFiles}, ${graph.stats.totalFunctions}, ${graph.stats.totalClasses}, ${graph.stats.totalExports},
      ${graph.analyzedAt}, ${graph.expiresAt}, NOW()
    )
    ON CONFLICT (project_id)
    DO UPDATE SET
      nodes = EXCLUDED.nodes,
      edges = EXCLUDED.edges,
      stats = EXCLUDED.stats,
      persistent_project_id = EXCLUDED.persistent_project_id,
      file_count = EXCLUDED.file_count,
      total_functions = EXCLUDED.total_functions,
      total_classes = EXCLUDED.total_classes,
      total_exports = EXCLUDED.total_exports,
      analyzed_at = EXCLUDED.analyzed_at,
      expires_at = EXCLUDED.expires_at,
      updated_at = NOW()
    RETURNING id
  `;
}

/**
 * Get a project graph by ID
 * @param {string} projectId - Project ID
 * @param {number} userId - User ID (for authorization)
 * @returns {Promise<ProjectGraph|null>} The graph or null if not found/expired
 */
export async function getGraph(projectId, userId) {
  const result = await sql`
    SELECT *
    FROM project_graphs
    WHERE project_id = ${projectId}
      AND user_id = ${userId}
      AND expires_at > NOW()
  `;

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    projectId: row.project_id,
    userId: row.user_id,
    projectName: row.project_name,
    projectPath: row.project_path,
    branch: row.branch,
    persistentProjectId: row.persistent_project_id,
    nodes: row.nodes,
    edges: row.edges,
    stats: row.stats,
    analyzedAt: row.analyzed_at,
    expiresAt: row.expires_at
  };
}

/**
 * Get a project graph by persistent project ID
 * This is used when a user has a persistent project and wants to find its associated graph
 *
 * @param {number} persistentProjectId - Persistent project ID (FK to projects table)
 * @param {number} userId - User ID (for authorization)
 * @returns {Promise<ProjectGraph|null>} The graph or null if not found/expired
 */
export async function getGraphByPersistentProjectId(persistentProjectId, userId) {
  if (!persistentProjectId || !userId) {
    return null;
  }

  const result = await sql`
    SELECT *
    FROM project_graphs
    WHERE persistent_project_id = ${persistentProjectId}
      AND user_id = ${userId}
      AND expires_at > NOW()
    ORDER BY analyzed_at DESC
    LIMIT 1
  `;

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    projectId: row.project_id,
    userId: row.user_id,
    projectName: row.project_name,
    projectPath: row.project_path,
    branch: row.branch,
    persistentProjectId: row.persistent_project_id,
    nodes: row.nodes,
    edges: row.edges,
    stats: row.stats,
    analyzedAt: row.analyzed_at,
    expiresAt: row.expires_at
  };
}

/**
 * Get file context from a project graph
 * Returns information about a specific file's role in the project
 *
 * @param {string} projectId - Project ID
 * @param {string} filePath - Path to the file
 * @param {number} userId - User ID (for authorization)
 * @returns {Promise<Object|null>} File context or null
 */
export async function getFileContext(projectId, filePath, userId) {
  const graph = await getGraph(projectId, userId);
  if (!graph) {
    return null;
  }

  // Find the node for this file
  const node = graph.nodes.find(n => n.id === filePath);
  if (!node) {
    return null;
  }

  // Find files that import this file (dependents)
  const dependents = graph.edges
    .filter(e => e.to === filePath)
    .map(e => ({
      file: e.from,
      imports: e.specifiers
    }));

  // Find files this file imports (dependencies)
  const dependencies = graph.edges
    .filter(e => e.from === filePath)
    .map(e => ({
      file: e.to,
      imports: e.specifiers
    }));

  // Build context string for LLM injection
  const contextParts = [];

  if (node.exports.length > 0) {
    const exportNames = node.exports.map(e => e.name).join(', ');
    contextParts.push(`This module exports: ${exportNames}`);
  }

  if (dependents.length > 0) {
    const depList = dependents.map(d => d.file).join(', ');
    contextParts.push(`It is imported by ${dependents.length} file(s): ${depList}`);
  }

  if (dependencies.length > 0) {
    const depList = dependencies.map(d => d.file).join(', ');
    contextParts.push(`It depends on ${dependencies.length} internal file(s): ${depList}`);
  }

  if (node.functions.length > 0) {
    const funcNames = node.functions.map(f => f.name).join(', ');
    contextParts.push(`Key functions: ${funcNames}`);
  }

  if (node.classes.length > 0) {
    const classNames = node.classes.map(c => c.name).join(', ');
    contextParts.push(`Classes defined: ${classNames}`);
  }

  return {
    file: filePath,
    node,
    dependents,
    dependencies,
    contextString: contextParts.join('. ') + '.',
    stats: {
      dependentCount: dependents.length,
      dependencyCount: dependencies.length,
      exportCount: node.exports.length,
      functionCount: node.functions.length,
      classCount: node.classes.length,
      complexity: node.complexity
    }
  };
}

/**
 * Generate a Mermaid diagram from a project graph
 *
 * @param {string} projectId - Project ID
 * @param {number} userId - User ID (for authorization)
 * @param {Object} options - Diagram options
 * @param {string} [options.type='architecture'] - Diagram type
 * @param {string} [options.focusFile] - Optional file to center the diagram on
 * @param {number} [options.maxNodes=30] - Maximum nodes to show
 * @returns {Promise<string|null>} Mermaid diagram syntax or null
 */
export async function generateDiagram(projectId, userId, options = {}) {
  const { type = 'architecture', focusFile, maxNodes = 30 } = options;

  const graph = await getGraph(projectId, userId);
  if (!graph) {
    return null;
  }

  switch (type) {
    case 'architecture':
      return generateArchitectureDiagram(graph, maxNodes);
    case 'dependencies':
      return generateDependencyDiagram(graph, focusFile, maxNodes);
    case 'dataflow':
      return generateDataFlowDiagram(graph, focusFile);
    default:
      return generateArchitectureDiagram(graph, maxNodes);
  }
}

/**
 * Generate an architecture overview diagram
 * Groups files by directory and shows key dependencies
 */
function generateArchitectureDiagram(graph, maxNodes) {
  const lines = ['flowchart TB'];

  // Group nodes by directory
  const directories = new Map();
  for (const node of graph.nodes) {
    const dir = node.id.substring(0, node.id.lastIndexOf('/')) || 'root';
    if (!directories.has(dir)) {
      directories.set(dir, []);
    }
    directories.get(dir).push(node);
  }

  // Create subgraphs for each directory
  let nodeCount = 0;
  const includedNodes = new Set();

  for (const [dir, nodes] of directories) {
    if (nodeCount >= maxNodes) break;

    // Sort by importance (dependents + exports)
    const sortedNodes = nodes.sort((a, b) =>
      (b.dependentCount + b.exports.length) - (a.dependentCount + a.exports.length)
    );

    const dirId = dir.replace(/[^a-zA-Z0-9]/g, '_');
    lines.push(`  subgraph ${dirId}["${dir}"]`);

    for (const node of sortedNodes) {
      if (nodeCount >= maxNodes) break;

      const nodeId = node.id.replace(/[^a-zA-Z0-9]/g, '_');
      const label = node.fileName;
      const shape = node.classes.length > 0 ? `[[${label}]]` : `[${label}]`;
      lines.push(`    ${nodeId}${shape}`);
      includedNodes.add(node.id);
      nodeCount++;
    }

    lines.push('  end');
  }

  // Add edges between included nodes
  for (const edge of graph.edges) {
    if (includedNodes.has(edge.from) && includedNodes.has(edge.to)) {
      const fromId = edge.from.replace(/[^a-zA-Z0-9]/g, '_');
      const toId = edge.to.replace(/[^a-zA-Z0-9]/g, '_');
      lines.push(`  ${fromId} --> ${toId}`);
    }
  }

  return lines.join('\n');
}

/**
 * Generate a dependency diagram focused on a specific file
 */
function generateDependencyDiagram(graph, focusFile, maxNodes) {
  const lines = ['flowchart LR'];

  if (!focusFile) {
    // Show most connected files
    const sortedNodes = [...graph.nodes]
      .sort((a, b) => (b.dependentCount + b.dependencyCount) - (a.dependentCount + a.dependencyCount))
      .slice(0, maxNodes);

    const includedIds = new Set(sortedNodes.map(n => n.id));

    for (const node of sortedNodes) {
      const nodeId = node.id.replace(/[^a-zA-Z0-9]/g, '_');
      lines.push(`  ${nodeId}["${node.fileName}"]`);
    }

    for (const edge of graph.edges) {
      if (includedIds.has(edge.from) && includedIds.has(edge.to)) {
        const fromId = edge.from.replace(/[^a-zA-Z0-9]/g, '_');
        const toId = edge.to.replace(/[^a-zA-Z0-9]/g, '_');
        lines.push(`  ${fromId} --> ${toId}`);
      }
    }
  } else {
    // Focus on specific file
    const focusNode = graph.nodes.find(n => n.id === focusFile);
    if (!focusNode) {
      return null;
    }

    const focusId = focusFile.replace(/[^a-zA-Z0-9]/g, '_');
    lines.push(`  ${focusId}["${focusNode.fileName}"]:::focus`);

    // Add dependents (files that import this)
    const dependents = graph.edges.filter(e => e.to === focusFile);
    for (const edge of dependents.slice(0, maxNodes / 2)) {
      const fromId = edge.from.replace(/[^a-zA-Z0-9]/g, '_');
      const fromNode = graph.nodes.find(n => n.id === edge.from);
      lines.push(`  ${fromId}["${fromNode?.fileName || edge.from}"]:::dependent`);
      lines.push(`  ${fromId} --> ${focusId}`);
    }

    // Add dependencies (files this imports)
    const dependencies = graph.edges.filter(e => e.from === focusFile);
    for (const edge of dependencies.slice(0, maxNodes / 2)) {
      const toId = edge.to.replace(/[^a-zA-Z0-9]/g, '_');
      const toNode = graph.nodes.find(n => n.id === edge.to);
      lines.push(`  ${toId}["${toNode?.fileName || edge.to}"]:::dependency`);
      lines.push(`  ${focusId} --> ${toId}`);
    }

    // Add styling
    lines.push('  classDef focus fill:#6366f1,stroke:#4f46e5,color:#fff');
    lines.push('  classDef dependent fill:#22c55e,stroke:#16a34a,color:#fff');
    lines.push('  classDef dependency fill:#f59e0b,stroke:#d97706,color:#fff');
  }

  return lines.join('\n');
}

/**
 * Generate a data flow diagram showing function call chains
 */
function generateDataFlowDiagram(graph, entryPoint) {
  const lines = ['flowchart TD'];

  // Find entry points (files with high dependents, low dependencies)
  const entryPoints = graph.nodes
    .filter(n => n.dependentCount === 0 && n.dependencyCount > 0)
    .slice(0, 5);

  // Find core modules (high both ways)
  const coreModules = graph.nodes
    .filter(n => n.dependentCount > 2 && n.dependencyCount > 0)
    .slice(0, 10);

  // Find leaf modules (imported but don't import)
  const leafModules = graph.nodes
    .filter(n => n.dependentCount > 0 && n.dependencyCount === 0)
    .slice(0, 5);

  lines.push('  subgraph Entry["Entry Points"]');
  for (const node of entryPoints) {
    const nodeId = node.id.replace(/[^a-zA-Z0-9]/g, '_');
    lines.push(`    ${nodeId}["${node.fileName}"]`);
  }
  lines.push('  end');

  lines.push('  subgraph Core["Core Modules"]');
  for (const node of coreModules) {
    const nodeId = node.id.replace(/[^a-zA-Z0-9]/g, '_');
    lines.push(`    ${nodeId}["${node.fileName}"]`);
  }
  lines.push('  end');

  lines.push('  subgraph Leaf["Utilities & Helpers"]');
  for (const node of leafModules) {
    const nodeId = node.id.replace(/[^a-zA-Z0-9]/g, '_');
    lines.push(`    ${nodeId}["${node.fileName}"]`);
  }
  lines.push('  end');

  // Add key edges
  const includedIds = new Set([
    ...entryPoints.map(n => n.id),
    ...coreModules.map(n => n.id),
    ...leafModules.map(n => n.id)
  ]);

  for (const edge of graph.edges) {
    if (includedIds.has(edge.from) && includedIds.has(edge.to)) {
      const fromId = edge.from.replace(/[^a-zA-Z0-9]/g, '_');
      const toId = edge.to.replace(/[^a-zA-Z0-9]/g, '_');
      lines.push(`  ${fromId} --> ${toId}`);
    }
  }

  return lines.join('\n');
}

/**
 * Refresh a graph with updated files (incremental update)
 *
 * @param {string} projectId - Project ID
 * @param {number} userId - User ID
 * @param {Array<{path: string, content: string}>} changedFiles - Files that changed
 * @returns {Promise<ProjectGraph|null>} Updated graph or null
 */
export async function refreshGraph(projectId, userId, changedFiles) {
  const existingGraph = await getGraph(projectId, userId);
  if (!existingGraph) {
    return null;
  }

  // For now, do a full re-analysis
  // Future optimization: only re-parse changed files and update edges
  const allFiles = changedFiles; // Would merge with existing in production

  return analyzeProject(userId, existingGraph.projectName, allFiles, {
    branch: existingGraph.branch,
    projectPath: existingGraph.projectPath
  });
}

/**
 * Delete a project graph
 *
 * @param {string} projectId - Project ID
 * @param {number} userId - User ID (for authorization)
 * @returns {Promise<boolean>} True if deleted
 */
export async function deleteGraph(projectId, userId) {
  const result = await sql`
    DELETE FROM project_graphs
    WHERE project_id = ${projectId} AND user_id = ${userId}
    RETURNING id
  `;
  return result.rowCount > 0;
}

/**
 * List all graphs for a user
 *
 * @param {number} userId - User ID
 * @returns {Promise<Array>} List of graph summaries
 */
export async function listGraphs(userId) {
  const result = await sql`
    SELECT
      project_id,
      project_name,
      branch,
      persistent_project_id,
      file_count,
      total_functions,
      stats,
      analyzed_at,
      expires_at
    FROM project_graphs
    WHERE user_id = ${userId}
      AND expires_at > NOW()
    ORDER BY analyzed_at DESC
  `;

  return result.rows.map(row => ({
    projectId: row.project_id,
    projectName: row.project_name,
    branch: row.branch,
    persistentProjectId: row.persistent_project_id,
    fileCount: row.file_count,
    totalFunctions: row.total_functions,
    stats: row.stats,
    analyzedAt: row.analyzed_at,
    expiresAt: row.expires_at
  }));
}

/**
 * Clean up expired graphs (called by cron job)
 * @returns {Promise<number>} Number of deleted graphs
 */
export async function cleanupExpiredGraphs() {
  const result = await sql`
    DELETE FROM project_graphs
    WHERE expires_at < NOW()
    RETURNING id
  `;
  return result.rowCount;
}

export default {
  analyzeProject,
  getGraph,
  getGraphByPersistentProjectId,
  getFileContext,
  generateDiagram,
  refreshGraph,
  deleteGraph,
  listGraphs,
  cleanupExpiredGraphs
};
