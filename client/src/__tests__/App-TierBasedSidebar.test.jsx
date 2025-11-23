/**
 * App Component Tests - Tier-Based Sidebar Access Control
 *
 * Tests that the multi-file sidebar and batch processing features
 * are properly gated by subscription tier.
 *
 * Access Control:
 * - Free tier: NO sidebar (single file only)
 * - Starter tier: NO sidebar (single file only)
 * - Pro tier: Sidebar visible with batch processing
 * - Team tier: Sidebar visible with batch processing
 * - Enterprise tier: Sidebar visible with batch processing
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithTheme as render } from './utils/renderWithTheme';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';
import { ThemeProvider } from '../contexts/ThemeContext';
import * as tierFeatures from '../utils/tierFeatures';

// Mock modules
vi.mock('../services/documentsApi', () => ({
  default: {
    generateDocumentation: vi.fn(() => Promise.resolve({
      success: true,
      documentation: '# Test',
      qualityScore: { score: 85, grade: 'B' }
    }))
  }
}));

vi.mock('../services/workspaceApi', () => ({
  default: {
    getWorkspace: vi.fn(() => Promise.resolve({ success: true, files: [] })),
    addWorkspaceFile: vi.fn(() => Promise.resolve({ success: true, file: { id: 1 } })),
    deleteWorkspaceFile: vi.fn(() => Promise.resolve({ success: true })),
    clearWorkspace: vi.fn(() => Promise.resolve({ success: true }))
  }
}));

vi.mock('react-resizable-panels', () => ({
  Panel: ({ children }) => <div data-testid="panel">{children}</div>,
  PanelGroup: ({ children }) => <div data-testid="panel-group">{children}</div>,
  PanelResizeHandle: () => <div data-testid="resize-handle" />
}));

// Mock AuthContext - will be updated per test
const mockAuthContext = {
  isAuthenticated: false,
  user: null,
  loading: false,
  login: vi.fn(),
  logout: vi.fn(),
  signup: vi.fn(),
  updateUser: vi.fn(),
  checkAuth: vi.fn()
};

vi.mock('../contexts/AuthContext', () => ({
  AuthProvider: ({ children }) => children,
  useAuth: () => mockAuthContext
}));

// Helper to render App with all required providers
function renderApp(user = null) {
  // Update mock auth context for this render
  mockAuthContext.isAuthenticated = !!user;
  mockAuthContext.user = user;
  mockAuthContext.loading = false;

  return render(
    <MemoryRouter>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </MemoryRouter>
  );
}

describe('App - Tier-Based Sidebar Access Control', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    // Reset mock auth context
    mockAuthContext.isAuthenticated = false;
    mockAuthContext.user = null;
    mockAuthContext.loading = false;

    // Spy on hasFeature to ensure it's called correctly
    vi.spyOn(tierFeatures, 'hasFeature');
  });

  describe('Unauthenticated Users', () => {
    it('should NOT show sidebar when not logged in', () => {
      renderApp(null);

      // Sidebar should not be in the document
      expect(screen.queryByText(/Files \(/i)).not.toBeInTheDocument();

      // Should show the main app (Header is rendered)
      const appHeaders = screen.getAllByText(/CodeScribe AI/i);
      expect(appHeaders.length).toBeGreaterThan(0);
    });

    it('should return false for batchProcessing when not authenticated', async () => {
      renderApp(null);

      // Wait for render cycle to complete
      await waitFor(() => {
        expect(mockAuthContext.isAuthenticated).toBe(false);
        expect(mockAuthContext.user).toBeNull();
      });

      // hasFeature with null user should return false for batchProcessing
      const result = tierFeatures.hasFeature(null, 'batchProcessing');
      expect(result).toBe(false);

      // Sidebar should not be visible
      expect(screen.queryByText(/Files \(/i)).not.toBeInTheDocument();
    });
  });

  describe('Free Tier - NO Sidebar Access', () => {
    const freeUser = {
      id: 1,
      email: 'free@example.com',
      firstName: 'Free',
      lastName: 'User',
      tier: 'free',
      emailVerified: true
    };

    it('should NOT show sidebar for free tier users', async () => {
      renderApp(freeUser);

      await waitFor(() => {
        expect(screen.queryByText(/Files \(/i)).not.toBeInTheDocument();
      });
    });

    it('should call hasFeature and return false for batchProcessing', async () => {
      renderApp(freeUser);

      await waitFor(() => {
        expect(tierFeatures.hasFeature).toHaveBeenCalledWith(
          expect.objectContaining({ tier: 'free' }),
          'batchProcessing'
        );
      });
    });

    it('should NOT show sidebar menu button in mobile header', async () => {
      renderApp(freeUser);

      // Sidebar menu button should not exist for free tier
      await waitFor(() => {
        const menuButtons = screen.queryAllByRole('button', { name: /menu/i });
        // Should only have main menu, not sidebar menu
        expect(menuButtons.length).toBeLessThanOrEqual(1);
      });
    });

    it('should show single-file mode only (no sidebar)', () => {
      renderApp(freeUser);

      // Should NOT have sidebar
      expect(screen.queryByText(/Files \(/i)).not.toBeInTheDocument();

      // Should NOT have sidebar collapse/expand button
      expect(screen.queryByRole('button', { name: /collapse sidebar|expand sidebar/i })).not.toBeInTheDocument();

      // App should be rendered (verify we're testing the right thing)
      const appHeaders = screen.queryAllByText(/CodeScribe AI/i);
      expect(appHeaders.length).toBeGreaterThan(0);
    });
  });

  describe('Starter Tier - NO Sidebar Access', () => {
    const starterUser = {
      id: 2,
      email: 'starter@example.com',
      firstName: 'Starter',
      lastName: 'User',
      tier: 'starter',
      emailVerified: true
    };

    it('should NOT show sidebar for starter tier users', async () => {
      renderApp(starterUser);

      await waitFor(() => {
        expect(screen.queryByText(/Files \(/i)).not.toBeInTheDocument();
      });
    });

    it('should call hasFeature and return false for batchProcessing', async () => {
      renderApp(starterUser);

      await waitFor(() => {
        expect(tierFeatures.hasFeature).toHaveBeenCalledWith(
          expect.objectContaining({ tier: 'starter' }),
          'batchProcessing'
        );
      });
    });

    it('should NOT show sidebar menu button in mobile header', async () => {
      renderApp(starterUser);

      await waitFor(() => {
        const menuButtons = screen.queryAllByRole('button', { name: /menu/i });
        expect(menuButtons.length).toBeLessThanOrEqual(1);
      });
    });

    it('should show single-file mode only (no sidebar)', () => {
      renderApp(starterUser);

      // Should NOT have sidebar
      expect(screen.queryByText(/Files \(/i)).not.toBeInTheDocument();

      // Should NOT have sidebar collapse/expand button
      expect(screen.queryByRole('button', { name: /collapse sidebar|expand sidebar/i })).not.toBeInTheDocument();

      // App should be rendered (verify we're testing the right thing)
      const appHeaders = screen.queryAllByText(/CodeScribe AI/i);
      expect(appHeaders.length).toBeGreaterThan(0);
    });
  });

  describe('Pro Tier - HAS Sidebar Access', () => {
    const proUser = {
      id: 3,
      email: 'pro@example.com',
      firstName: 'Pro',
      lastName: 'User',
      tier: 'pro',
      emailVerified: true
    };

    it('should show sidebar for pro tier users', async () => {
      renderApp(proUser);

      await waitFor(() => {
        expect(screen.getByText(/Files \(/i)).toBeInTheDocument();
      });
    });

    it('should call hasFeature and return true for batchProcessing', async () => {
      renderApp(proUser);

      await waitFor(() => {
        expect(tierFeatures.hasFeature).toHaveBeenCalledWith(
          expect.objectContaining({ tier: 'pro' }),
          'batchProcessing'
        );
      });
    });

    it('should show sidebar collapse/expand button', async () => {
      renderApp(proUser);

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /collapse sidebar|expand sidebar/i })
        ).toBeInTheDocument();
      });
    });

    it('should show add files button', async () => {
      renderApp(proUser);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add files/i })).toBeInTheDocument();
      });
    });

    it('should show GitHub import button', async () => {
      renderApp(proUser);

      await waitFor(() => {
        // GitHub button has aria-label="Import from GitHub" (may have multiple for mobile/desktop)
        const githubButtons = screen.getAllByRole('button', { name: /import from github/i });
        expect(githubButtons.length).toBeGreaterThan(0);
      });
    });

    it('should render with PanelGroup for resizable layout', async () => {
      const { container } = renderApp(proUser);

      await waitFor(() => {
        expect(container.querySelector('[data-testid="panel-group"]')).toBeInTheDocument();
      });
    });
  });

  describe('Team Tier - HAS Sidebar Access', () => {
    const teamUser = {
      id: 4,
      email: 'team@example.com',
      firstName: 'Team',
      lastName: 'User',
      tier: 'team',
      emailVerified: true
    };

    it('should show sidebar for team tier users', async () => {
      renderApp(teamUser);

      await waitFor(() => {
        expect(screen.getByText(/Files \(/i)).toBeInTheDocument();
      });
    });

    it('should call hasFeature and return true for batchProcessing', async () => {
      renderApp(teamUser);

      await waitFor(() => {
        expect(tierFeatures.hasFeature).toHaveBeenCalledWith(
          expect.objectContaining({ tier: 'team' }),
          'batchProcessing'
        );
      });
    });

    it('should show add files button', async () => {
      renderApp(teamUser);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add files/i })).toBeInTheDocument();
      });
    });

    it('should show GitHub import button', async () => {
      renderApp(teamUser);

      await waitFor(() => {
        // GitHub button has aria-label="Import from GitHub" (may have multiple for mobile/desktop)
        const githubButtons = screen.getAllByRole('button', { name: /import from github/i });
        expect(githubButtons.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Enterprise Tier - HAS Sidebar Access', () => {
    const enterpriseUser = {
      id: 5,
      email: 'enterprise@example.com',
      firstName: 'Enterprise',
      lastName: 'User',
      tier: 'enterprise',
      emailVerified: true
    };

    it('should show sidebar for enterprise tier users', async () => {
      renderApp(enterpriseUser);

      await waitFor(() => {
        expect(screen.getByText(/Files \(/i)).toBeInTheDocument();
      });
    });

    it('should call hasFeature and return true for batchProcessing', async () => {
      renderApp(enterpriseUser);

      await waitFor(() => {
        expect(tierFeatures.hasFeature).toHaveBeenCalledWith(
          expect.objectContaining({ tier: 'enterprise' }),
          'batchProcessing'
        );
      });
    });

    it('should show add files button', async () => {
      renderApp(enterpriseUser);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add files/i })).toBeInTheDocument();
      });
    });

    it('should show GitHub import button', async () => {
      renderApp(enterpriseUser);

      await waitFor(() => {
        // GitHub button has aria-label="Import from GitHub" (may have multiple for mobile/desktop)
        const githubButtons = screen.getAllByRole('button', { name: /import from github/i });
        expect(githubButtons.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Feature Flag Consistency', () => {
    it('should consistently gate sidebar across all tier checks', async () => {
      const tiers = [
        { tier: 'free', shouldHaveSidebar: false },
        { tier: 'starter', shouldHaveSidebar: false },
        { tier: 'pro', shouldHaveSidebar: true },
        { tier: 'team', shouldHaveSidebar: true },
        { tier: 'enterprise', shouldHaveSidebar: true }
      ];

      for (const { tier, shouldHaveSidebar } of tiers) {
        const user = {
          id: 1,
          email: `${tier}@example.com`,
          firstName: tier,
          tier,
          emailVerified: true
        };

        const { unmount } = renderApp(user);

        if (shouldHaveSidebar) {
          await waitFor(() => {
            expect(screen.getByText(/Files \(/i)).toBeInTheDocument();
          });
        } else {
          await waitFor(() => {
            expect(screen.queryByText(/Files \(/i)).not.toBeInTheDocument();
          });
        }

        unmount();
        vi.clearAllMocks();
      }
    });

    it('should use hasFeature utility correctly for all tiers', () => {
      const testCases = [
        { tier: 'free', expected: false },
        { tier: 'starter', expected: false },
        { tier: 'pro', expected: true },
        { tier: 'team', expected: true },
        { tier: 'enterprise', expected: true }
      ];

      testCases.forEach(({ tier, expected }) => {
        const user = { id: 1, tier, emailVerified: true };
        const result = tierFeatures.hasFeature(user, 'batchProcessing');
        expect(result).toBe(expected);
      });
    });
  });

  describe('Workspace Persistence - Tier Gated', () => {
    it('should not load workspace for free tier', async () => {
      const freeUser = {
        id: 1,
        email: 'free@example.com',
        tier: 'free',
        emailVerified: true
      };

      const workspaceApi = await import('../services/workspaceApi');

      renderApp(freeUser);

      await waitFor(() => {
        // Workspace should not be loaded for free tier
        expect(workspaceApi.default.getWorkspace).not.toHaveBeenCalled();
      });
    });

    it('should not load workspace for starter tier', async () => {
      const starterUser = {
        id: 2,
        email: 'starter@example.com',
        tier: 'starter',
        emailVerified: true
      };

      const workspaceApi = await import('../services/workspaceApi');

      renderApp(starterUser);

      await waitFor(() => {
        expect(workspaceApi.default.getWorkspace).not.toHaveBeenCalled();
      });
    });

    it('should load workspace for pro tier', async () => {
      const proUser = {
        id: 3,
        email: 'pro@example.com',
        tier: 'pro',
        emailVerified: true
      };

      const workspaceApi = await import('../services/workspaceApi');

      renderApp(proUser);

      await waitFor(() => {
        expect(workspaceApi.default.getWorkspace).toHaveBeenCalled();
      });
    });

    it('should load workspace for team tier', async () => {
      const teamUser = {
        id: 4,
        email: 'team@example.com',
        tier: 'team',
        emailVerified: true
      };

      const workspaceApi = await import('../services/workspaceApi');

      renderApp(teamUser);

      await waitFor(() => {
        expect(workspaceApi.default.getWorkspace).toHaveBeenCalled();
      });
    });

    it('should load workspace for enterprise tier', async () => {
      const enterpriseUser = {
        id: 5,
        email: 'enterprise@example.com',
        tier: 'enterprise',
        emailVerified: true
      };

      const workspaceApi = await import('../services/workspaceApi');

      renderApp(enterpriseUser);

      await waitFor(() => {
        expect(workspaceApi.default.getWorkspace).toHaveBeenCalled();
      });
    });
  });
});
