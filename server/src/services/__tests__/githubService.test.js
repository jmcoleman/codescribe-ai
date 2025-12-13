/**
 * Unit tests for GitHubService
 * Tests GitHub API client management and private repo support
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// Mock @octokit/rest
jest.mock('@octokit/rest', () => ({
  Octokit: jest.fn().mockImplementation((config) => ({
    config,
    rest: {
      repos: {
        get: jest.fn(),
        listBranches: jest.fn()
      },
      git: {
        getTree: jest.fn(),
        getBlob: jest.fn()
      }
    }
  }))
}));

// Import after mocking
import { Octokit } from '@octokit/rest';
import githubService from '../githubService.js';

describe('GitHubService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getClientForUser', () => {
    it('should return authenticated client when user token is provided', () => {
      const userToken = 'gho_user_token_123';

      const client = githubService.getClientForUser(userToken);

      expect(Octokit).toHaveBeenCalledWith({ auth: userToken });
      expect(client).toBeDefined();
    });

    it('should return default client when no user token is provided', () => {
      const client = githubService.getClientForUser(null);

      // Should return the default octokit instance
      expect(client).toBe(githubService.octokit);
    });

    it('should return default client when user token is undefined', () => {
      const client = githubService.getClientForUser(undefined);

      expect(client).toBe(githubService.octokit);
    });

    it('should return default client when user token is empty string', () => {
      const client = githubService.getClientForUser('');

      expect(client).toBe(githubService.octokit);
    });

    it('should create new client instance for each user token', () => {
      const token1 = 'gho_token_1';
      const token2 = 'gho_token_2';

      const client1 = githubService.getClientForUser(token1);
      const client2 = githubService.getClientForUser(token2);

      expect(Octokit).toHaveBeenCalledTimes(2);
      expect(Octokit).toHaveBeenNthCalledWith(1, { auth: token1 });
      expect(Octokit).toHaveBeenNthCalledWith(2, { auth: token2 });
    });
  });

  describe('fetchTree with user token', () => {
    it('should use user token when provided', async () => {
      const userToken = 'gho_user_token_456';
      const mockRepoInfo = {
        data: {
          default_branch: 'main',
          stargazers_count: 100,
          description: 'Test repo',
          private: true
        }
      };
      const mockTreeResponse = {
        data: {
          tree: [],
          truncated: false
        }
      };

      // Create a mock client
      const mockClient = {
        rest: {
          repos: {
            get: jest.fn().mockResolvedValue(mockRepoInfo)
          },
          git: {
            getTree: jest.fn().mockResolvedValue(mockTreeResponse)
          }
        }
      };

      // Mock getClientForUser to return our mock client
      githubService.getClientForUser = jest.fn().mockReturnValue(mockClient);

      await githubService.fetchTree('owner', 'repo', null, userToken);

      expect(githubService.getClientForUser).toHaveBeenCalledWith(userToken);
      expect(mockClient.rest.repos.get).toHaveBeenCalledWith({ owner: 'owner', repo: 'repo' });
    });

    it('should call getClientForUser with null when no token provided', async () => {
      // Spy on getClientForUser
      const spy = jest.spyOn(githubService, 'getClientForUser');

      // We expect this to fail because mock isn't complete,
      // but we can verify getClientForUser was called correctly
      try {
        await githubService.fetchTree('owner', 'repo', null, null);
      } catch (e) {
        // Expected - mock not complete
      }

      expect(spy).toHaveBeenCalledWith(null);
      spy.mockRestore();
    });

    it('should include isPrivate in response', async () => {
      const mockRepoInfo = {
        data: {
          default_branch: 'main',
          stargazers_count: 100,
          description: 'Private repo',
          private: true
        }
      };
      const mockTreeResponse = {
        data: {
          tree: [
            { path: 'README.md', type: 'blob', size: 100, sha: 'abc123' }
          ],
          truncated: false
        }
      };

      const mockClient = {
        rest: {
          repos: {
            get: jest.fn().mockResolvedValue(mockRepoInfo)
          },
          git: {
            getTree: jest.fn().mockResolvedValue(mockTreeResponse)
          }
        }
      };

      githubService.getClientForUser = jest.fn().mockReturnValue(mockClient);

      const result = await githubService.fetchTree('owner', 'repo', null, 'token');

      expect(result.isPrivate).toBe(true);
    });

    it('should return isPrivate false for public repos', async () => {
      const mockRepoInfo = {
        data: {
          default_branch: 'main',
          stargazers_count: 50,
          description: 'Public repo',
          private: false
        }
      };
      const mockTreeResponse = {
        data: {
          tree: [],
          truncated: false
        }
      };

      const mockClient = {
        rest: {
          repos: {
            get: jest.fn().mockResolvedValue(mockRepoInfo)
          },
          git: {
            getTree: jest.fn().mockResolvedValue(mockTreeResponse)
          }
        }
      };

      githubService.getClientForUser = jest.fn().mockReturnValue(mockClient);

      const result = await githubService.fetchTree('owner', 'repo', null, 'token');

      expect(result.isPrivate).toBe(false);
    });
  });

  describe('fetchBranches with user token', () => {
    it('should use user token for branch fetching', async () => {
      const userToken = 'gho_branch_token';
      const mockBranches = {
        data: [
          { name: 'main', commit: { sha: 'abc123' } },
          { name: 'develop', commit: { sha: 'def456' } }
        ]
      };

      const mockClient = {
        rest: {
          repos: {
            listBranches: jest.fn().mockResolvedValue(mockBranches)
          }
        }
      };

      githubService.getClientForUser = jest.fn().mockReturnValue(mockClient);

      const result = await githubService.fetchBranches('owner', 'repo', userToken);

      expect(githubService.getClientForUser).toHaveBeenCalledWith(userToken);
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('main');
    });
  });

  describe('fetchFile with user token', () => {
    it('should use user token for file fetching', async () => {
      const userToken = 'gho_file_token';
      const mockFileContent = {
        data: {
          type: 'file',
          content: Buffer.from('console.log("hello")').toString('base64'),
          encoding: 'base64',
          sha: 'file_sha_123',
          size: 21,
          name: 'index.js',
          path: 'index.js',
          html_url: 'https://github.com/owner/repo/blob/main/index.js'
        }
      };

      const mockClient = {
        rest: {
          repos: {
            getContent: jest.fn().mockResolvedValue(mockFileContent)
          }
        }
      };

      githubService.getClientForUser = jest.fn().mockReturnValue(mockClient);

      const result = await githubService.fetchFile('owner', 'repo', 'index.js', null, userToken);

      expect(githubService.getClientForUser).toHaveBeenCalledWith(userToken);
      expect(result.content).toBe('console.log("hello")');
    });
  });

  describe('Error handling', () => {
    it('should normalize 404 errors for private repos', async () => {
      const mockClient = {
        rest: {
          repos: {
            get: jest.fn().mockRejectedValue({
              status: 404,
              message: 'Not Found'
            })
          }
        }
      };

      githubService.getClientForUser = jest.fn().mockReturnValue(mockClient);

      await expect(
        githubService.fetchTree('owner', 'private-repo', null, null)
      ).rejects.toThrow();
    });

    it('should normalize rate limit errors', async () => {
      const mockClient = {
        rest: {
          repos: {
            get: jest.fn().mockRejectedValue({
              status: 403,
              message: 'API rate limit exceeded'
            })
          }
        }
      };

      githubService.getClientForUser = jest.fn().mockReturnValue(mockClient);

      await expect(
        githubService.fetchTree('owner', 'repo', null, null)
      ).rejects.toThrow();
    });
  });
});
