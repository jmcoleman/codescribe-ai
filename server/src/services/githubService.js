/**
 * GitHub Service
 * Handles GitHub API interactions for loading files and repository trees
 * Supports both server-level token and per-user tokens for private repo access
 */

import { Octokit } from '@octokit/rest';

class GitHubService {
  constructor() {
    // Initialize default Octokit client with server token (if available)
    // Public repos: 60 requests/hour (unauthenticated)
    // With token: 5000 requests/hour
    const options = {};

    if (process.env.GITHUB_TOKEN) {
      options.auth = process.env.GITHUB_TOKEN;
    }

    this.octokit = new Octokit(options);

    // File size limit: 100KB (reasonable for LLM context)
    this.MAX_FILE_SIZE = 100 * 1024; // 100KB in bytes
  }

  /**
   * Create an Octokit client with a specific user token
   * Used for accessing private repositories on behalf of authenticated users
   * @param {string} userToken - User's GitHub OAuth access token
   * @returns {Octokit} Authenticated Octokit client
   */
  getClientForUser(userToken) {
    if (userToken) {
      return new Octokit({ auth: userToken });
    }
    // Fall back to default client (server token or unauthenticated)
    return this.octokit;
  }

  /**
   * Parse GitHub URL to extract owner, repo, path, and ref
   * @param {string} input - GitHub URL or owner/repo shorthand
   * @returns {Object|null} Parsed components or null if invalid
   */
  parseGitHubUrl(input) {
    if (!input || typeof input !== 'string') {
      return null;
    }

    const trimmed = input.trim();

    // Pattern 1: owner/repo/path/to/file[@ref] (shorthand with path)
    const shorthandFilePattern = /^([\w-]+)\/([\w.-]+)\/(.+?)(?:@([\w.-]+))?$/;
    const shorthandFileMatch = trimmed.match(shorthandFilePattern);

    if (shorthandFileMatch) {
      return {
        owner: shorthandFileMatch[1],
        repo: shorthandFileMatch[2],
        path: shorthandFileMatch[3],
        ref: shorthandFileMatch[4] || null,
        type: 'file'
      };
    }

    // Pattern 2: owner/repo[@ref] (shorthand repo only)
    const shorthandPattern = /^([\w-]+)\/([\w.-]+)(?:@([\w.-]+))?$/;
    const shorthandMatch = trimmed.match(shorthandPattern);

    if (shorthandMatch) {
      return {
        owner: shorthandMatch[1],
        repo: shorthandMatch[2],
        ref: shorthandMatch[3] || null,
        path: null,
        type: 'repo'
      };
    }

    // Pattern 3: github.com/owner/repo[/tree|blob/ref/path]
    const githubPattern = /github\.com\/([\w-]+)\/([\w.-]+)(?:\/(tree|blob)\/([\w.-]+)(?:\/(.+))?)?/;
    const githubMatch = trimmed.match(githubPattern);

    if (githubMatch) {
      const [, owner, repo, type, ref, path] = githubMatch;
      return {
        owner,
        repo,
        ref: ref || null,
        path: path || null,
        type: type === 'blob' && path ? 'file' : 'repo'
      };
    }

    // Pattern 4: raw.githubusercontent.com/owner/repo/ref/path
    const rawPattern = /raw\.githubusercontent\.com\/([\w-]+)\/([\w.-]+)\/([\w.-]+)\/(.+)/;
    const rawMatch = trimmed.match(rawPattern);

    if (rawMatch) {
      return {
        owner: rawMatch[1],
        repo: rawMatch[2],
        ref: rawMatch[3],
        path: rawMatch[4],
        type: 'file'
      };
    }

    return null;
  }

  /**
   * Fetch file content from GitHub
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {string} path - File path
   * @param {string} ref - Branch, tag, or commit SHA (optional)
   * @param {string} userToken - User's GitHub OAuth token for private repos (optional)
   * @returns {Promise<Object>} File content and metadata
   */
  async fetchFile(owner, repo, path, ref = null, userToken = null) {
    try {
      const client = this.getClientForUser(userToken);
      const params = {
        owner,
        repo,
        path,
      };

      if (ref) {
        params.ref = ref;
      }

      const response = await client.rest.repos.getContent(params);

      // Check if it's a file (not a directory)
      if (response.data.type !== 'file') {
        throw new Error('Path is not a file');
      }

      // Check file size
      if (response.data.size > this.MAX_FILE_SIZE) {
        throw new Error(`File too large (${Math.round(response.data.size / 1024)}KB). Maximum size is ${Math.round(this.MAX_FILE_SIZE / 1024)}KB`);
      }

      // Decode base64 content
      const content = Buffer.from(response.data.content, 'base64').toString('utf-8');

      // Detect language from filename
      const language = this.detectLanguage(response.data.name);

      return {
        content,
        language,
        size: response.data.size,
        name: response.data.name,
        path: response.data.path,
        sha: response.data.sha,
        url: response.data.html_url
      };
    } catch (error) {
      throw this.normalizeError(error);
    }
  }

  /**
   * Fetch repository branches
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {string} userToken - User's GitHub OAuth token for private repos (optional)
   * @returns {Promise<Array>} List of branches with name and commit info
   */
  async fetchBranches(owner, repo, userToken = null) {
    try {
      const client = this.getClientForUser(userToken);
      const response = await client.rest.repos.listBranches({
        owner,
        repo,
        per_page: 100 // Get up to 100 branches (most repos have fewer)
      });

      return response.data.map(branch => ({
        name: branch.name,
        sha: branch.commit.sha,
        protected: branch.protected
      }));
    } catch (error) {
      throw this.normalizeError(error);
    }
  }

  /**
   * Fetch repository file tree
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {string} ref - Branch, tag, or commit SHA (optional)
   * @param {string} userToken - User's GitHub OAuth token for private repos (optional)
   * @returns {Promise<Object>} Repository tree structure
   */
  async fetchTree(owner, repo, ref = null, userToken = null) {
    try {
      const client = this.getClientForUser(userToken);

      let branch;
      let repoInfo = null;

      // Only fetch repository metadata if we need the default branch
      if (!ref) {
        repoInfo = await client.rest.repos.get({ owner, repo });
        branch = repoInfo.data.default_branch;
      } else {
        branch = ref;
      }

      // Get the tree recursively
      const response = await client.rest.git.getTree({
        owner,
        repo,
        tree_sha: branch,
        recursive: 'true'
      });

      // Filter out blobs (files) and trees (directories)
      const items = response.data.tree.map(item => ({
        path: item.path,
        type: item.type, // 'blob' for files, 'tree' for directories
        size: item.size,
        sha: item.sha,
        url: item.url
      }));

      // Build hierarchical structure
      const tree = this.buildTreeStructure(items);

      const result = {
        owner,
        repo,
        branch,
        tree,
        truncated: response.data.truncated,
        totalItems: items.length
      };

      // Only include metadata if we fetched it
      if (repoInfo) {
        result.stars = repoInfo.data.stargazers_count;
        result.description = repoInfo.data.description;
        result.isPrivate = repoInfo.data.private;
      }

      return result;
    } catch (error) {
      throw this.normalizeError(error);
    }
  }

  /**
   * Build hierarchical tree structure from flat list
   * @param {Array} items - Flat list of files and directories
   * @returns {Array} Hierarchical tree structure
   */
  buildTreeStructure(items) {
    const root = [];
    const map = {};

    // Sort items by path depth and name
    items.sort((a, b) => {
      const depthA = a.path.split('/').length;
      const depthB = b.path.split('/').length;
      if (depthA !== depthB) return depthA - depthB;
      return a.path.localeCompare(b.path);
    });

    items.forEach(item => {
      const parts = item.path.split('/');
      const name = parts[parts.length - 1];
      const parentPath = parts.slice(0, -1).join('/');

      const node = {
        name,
        path: item.path,
        type: item.type,
        size: item.size,
        sha: item.sha,
        children: item.type === 'tree' ? [] : undefined
      };

      map[item.path] = node;

      if (parentPath === '') {
        root.push(node);
      } else if (map[parentPath]) {
        if (!map[parentPath].children) {
          map[parentPath].children = [];
        }
        map[parentPath].children.push(node);
      }
    });

    return root;
  }

  /**
   * Detect programming language from filename
   * @param {string} filename - Name of the file
   * @returns {string} Language identifier
   */
  detectLanguage(filename) {
    const extension = filename.split('.').pop()?.toLowerCase();

    const languageMap = {
      // JavaScript/TypeScript
      js: 'javascript',
      jsx: 'javascript',
      ts: 'typescript',
      tsx: 'typescript',
      mjs: 'javascript',
      cjs: 'javascript',

      // Python
      py: 'python',
      pyw: 'python',

      // Java
      java: 'java',

      // C/C++
      c: 'c',
      cpp: 'cpp',
      cc: 'cpp',
      cxx: 'cpp',
      h: 'c',
      hpp: 'cpp',

      // C#
      cs: 'csharp',

      // Go
      go: 'go',

      // Rust
      rs: 'rust',

      // Ruby
      rb: 'ruby',

      // PHP
      php: 'php',

      // Swift
      swift: 'swift',

      // Kotlin
      kt: 'kotlin',
      kts: 'kotlin',

      // Scala
      scala: 'scala',

      // Shell
      sh: 'bash',
      bash: 'bash',
      zsh: 'bash',

      // SQL
      sql: 'sql',

      // HTML/CSS
      html: 'html',
      htm: 'html',
      css: 'css',
      scss: 'scss',
      sass: 'sass',
      less: 'less',

      // Markup
      md: 'markdown',
      markdown: 'markdown',
      xml: 'xml',
      json: 'json',
      yaml: 'yaml',
      yml: 'yaml',
      toml: 'toml',

      // Other
      vue: 'vue',
      svelte: 'svelte',
      r: 'r',
      m: 'matlab',
      dart: 'dart',
      lua: 'lua',
      perl: 'perl',
      pl: 'perl'
    };

    return languageMap[extension] || 'text';
  }

  /**
   * Normalize GitHub API errors
   * @param {Error} error - Original error
   * @returns {Error} Normalized error with friendly message
   */
  normalizeError(error) {
    if (error.status === 404) {
      return new Error('Repository or file not found. Please check the URL and try again.');
    }

    if (error.status === 403) {
      if (error.response?.headers?.['x-ratelimit-remaining'] === '0') {
        const resetTime = error.response.headers['x-ratelimit-reset'];
        const resetDate = new Date(resetTime * 1000);
        const minutesUntilReset = Math.ceil((resetDate - new Date()) / 60000);
        return new Error(`GitHub rate limit exceeded. Try again in ${minutesUntilReset} minutes or add a GitHub token.`);
      }
      return new Error('Access forbidden. This repository may be private.');
    }

    if (error.status === 401) {
      return new Error('Authentication failed. Please check your GitHub token.');
    }

    if (error.message.includes('File too large')) {
      return error;
    }

    if (error.message.includes('Path is not a file')) {
      return error;
    }

    // Default error
    return new Error(error.message || 'Failed to fetch from GitHub. Please try again.');
  }

  /**
   * Validate GitHub URL
   * @param {string} input - URL or owner/repo to validate
   * @returns {boolean} True if valid
   */
  validateUrl(input) {
    return this.parseGitHubUrl(input) !== null;
  }

  /**
   * Fetch organizations the authenticated user belongs to
   * @param {string} userToken - User's GitHub OAuth token (optional - returns empty if not provided)
   * @returns {Promise<Array>} List of organizations with name, login, avatar, and description
   */
  async fetchUserOrganizations(userToken) {
    if (!userToken) {
      // Can't determine user's organizations without their token
      return [];
    }

    try {
      const client = this.getClientForUser(userToken);
      const response = await client.rest.orgs.listForAuthenticatedUser({
        per_page: 100 // Most users have fewer than 100 orgs
      });

      return response.data.map(org => ({
        login: org.login,
        name: org.login, // Display name (same as login for orgs)
        avatarUrl: org.avatar_url,
        description: org.description,
        type: 'organization'
      }));
    } catch (error) {
      throw this.normalizeError(error);
    }
  }

  /**
   * Fetch repositories for the authenticated user
   * @param {string} userToken - User's GitHub OAuth token (optional - returns empty if not provided)
   * @returns {Promise<Array>} List of repositories with metadata
   */
  async fetchUserRepositories(userToken) {
    if (!userToken) {
      // Can't determine user's repositories without their token
      return [];
    }

    try {
      const client = this.getClientForUser(userToken);

      // Get authenticated user info first to get their login
      const userResponse = await client.rest.users.getAuthenticated();
      const userLogin = userResponse.data.login;

      // Fetch repos owned by the user (not org repos or forks from orgs)
      const response = await client.rest.repos.listForAuthenticatedUser({
        affiliation: 'owner', // Only repos the user owns
        per_page: 100,
        sort: 'full_name',
        direction: 'asc'
      });

      // Filter to only repos where owner is the user (exclude org repos)
      const userRepos = response.data.filter(repo => repo.owner.login === userLogin);

      return userRepos.map(repo => ({
        name: repo.name,
        fullName: repo.full_name,
        owner: repo.owner.login,
        description: repo.description,
        isPrivate: repo.private,
        defaultBranch: repo.default_branch,
        updatedAt: repo.updated_at,
        language: repo.language,
        stars: repo.stargazers_count,
        htmlUrl: repo.html_url
      }));
    } catch (error) {
      throw this.normalizeError(error);
    }
  }

  /**
   * Fetch repositories for a specific organization
   * @param {string} org - Organization login name
   * @param {string} userToken - User's GitHub OAuth token (optional - uses server token for public repos if not provided)
   * @returns {Promise<Array>} List of repositories with metadata
   */
  async fetchOrganizationRepositories(org, userToken) {
    // User token is optional - will fall back to server token via getClientForUser()
    // With server token: only public repos are returned
    // With user token: public + private repos the user has access to

    try {
      const client = this.getClientForUser(userToken);
      const response = await client.rest.repos.listForOrg({
        org,
        per_page: 100,
        sort: 'full_name',
        direction: 'asc',
        type: 'all' // Include public and private repos the user has access to
      });

      return response.data.map(repo => ({
        name: repo.name,
        fullName: repo.full_name,
        owner: repo.owner.login,
        description: repo.description,
        isPrivate: repo.private,
        defaultBranch: repo.default_branch,
        updatedAt: repo.updated_at,
        language: repo.language,
        stars: repo.stargazers_count,
        htmlUrl: repo.html_url
      }));
    } catch (error) {
      throw this.normalizeError(error);
    }
  }

  /**
   * Fetch repositories for any owner (user or organization) with pagination support
   * Automatically detects whether the owner is a user or org and uses the appropriate API
   * @param {string} owner - GitHub username or organization name
   * @param {string} userToken - User's GitHub OAuth token (optional - uses server token for public repos if not provided)
   * @param {number} page - Page number (1-indexed, default: 1)
   * @param {number} perPage - Results per page (default: 100, max: 100)
   * @returns {Promise<Object>} Paginated list of repositories with metadata
   */
  async fetchOwnerRepositories(owner, userToken, page = 1, perPage = 100) {
    try {
      const client = this.getClientForUser(userToken);
      const isAuthenticated = !!userToken;

      // Validate pagination params
      const validPage = Math.max(1, parseInt(page) || 1);
      const validPerPage = Math.min(100, Math.max(1, parseInt(perPage) || 100));

      // Check if owner is the authenticated user and if it's an org
      let isAuthenticatedUser = false;
      let isOrganization = false;

      if (isAuthenticated) {
        try {
          const { data: authenticatedUser } = await client.rest.users.getAuthenticated();
          isAuthenticatedUser = authenticatedUser.login.toLowerCase() === owner.toLowerCase();
        } catch (err) {
          console.warn('[GitHub] Failed to get authenticated user:', err.message);
        }
      }

      // Check if the owner is an organization (not a user)
      try {
        const { data: ownerData } = await client.rest.users.getByUsername({ username: owner });
        isOrganization = ownerData.type === 'Organization';
      } catch (err) {
        // If we can't fetch owner data, assume it's a user
        console.warn('[GitHub] Failed to get owner type for:', owner, err.message);
      }

      // Route to appropriate endpoint based on owner type
      let response;

      if (isAuthenticatedUser) {
        // Fetching authenticated user's own repos (includes private)
        response = await client.rest.repos.listForAuthenticatedUser({
          per_page: validPerPage,
          page: validPage,
          sort: 'full_name',
          direction: 'asc',
          affiliation: 'owner' // Only repos owned by the user (includes both public and private)
        });
      } else if (isOrganization) {
        // Fetching organization repos (includes private repos user has access to when authenticated)
        response = await client.rest.repos.listForOrg({
          org: owner,
          per_page: validPerPage,
          page: validPage,
          sort: 'full_name',
          direction: 'asc',
          type: 'all' // Includes public and private repos the authenticated user has access to
        });
      } else {
        // Fetching another user's repos (public only)
        response = await client.rest.repos.listForUser({
          username: owner,
          per_page: validPerPage,
          page: validPage,
          sort: 'full_name',
          direction: 'asc',
          type: 'all'
        });
      }

      const repos = response.data;

      // Check if there are more pages by looking at response headers or data length
      // If we got a full page, there might be more
      const hasMore = repos.length === validPerPage;

      return {
        repositories: repos.map(repo => ({
          name: repo.name,
          fullName: repo.full_name,
          owner: repo.owner.login,
          description: repo.description,
          isPrivate: repo.private,
          defaultBranch: repo.default_branch,
          updatedAt: repo.updated_at,
          language: repo.language,
          stars: repo.stargazers_count,
          htmlUrl: repo.html_url
        })),
        page: validPage,
        perPage: validPerPage,
        hasMore,
        isAuthenticated,
        count: repos.length
      };
    } catch (error) {
      throw this.normalizeError(error);
    }
  }
}

export default new GitHubService();
