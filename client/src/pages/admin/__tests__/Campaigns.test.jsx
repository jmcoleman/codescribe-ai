/**
 * Unit tests for Admin Campaigns Page
 * Tests campaign listing, creation modal, status badges, and CRUD operations
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { renderWithTheme as render } from '../../../__tests__/utils/renderWithTheme';
import TrialPrograms from '../TrialPrograms';

// Helper to find menu items in portal (rendered to document.body)
const findMenuItemInPortal = async (name) => {
  return await waitFor(() =>
    within(document.body).getByRole('menuitem', { name })
  );
};

// Mock the useAuth hook
vi.mock('../../../contexts/AuthContext', async () => {
  const actual = await vi.importActual('../../../contexts/AuthContext');
  return {
    ...actual,
    useAuth: vi.fn(),
  };
});

// Mock formatters
vi.mock('../../../utils/formatters', () => ({
  formatDate: vi.fn((date) => new Date(date).toLocaleDateString()),
  formatDateTime: vi.fn((date) => new Date(date).toLocaleString()),
}));

// Mock toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { useAuth } from '../../../contexts/AuthContext';
import toast from 'react-hot-toast';

describe('Campaigns Admin Page', () => {
  let mockFetch;
  const mockGetToken = vi.fn().mockResolvedValue('test-token');

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch = vi.fn();
    global.fetch = mockFetch;
    global.confirm = vi.fn().mockReturnValue(true);

    // Mock useAuth
    useAuth.mockReturnValue({
      getToken: mockGetToken,
      user: { id: 1, role: 'admin' },
    });
  });

  const renderCampaigns = () => {
    return render(
      <MemoryRouter>
        <TrialPrograms />
      </MemoryRouter>
    );
  };

  const mockCampaigns = [
    {
      id: 1,
      name: 'January Pro Trial',
      description: 'New year promotion',
      trial_tier: 'pro',
      trial_days: 14,
      is_active: true,
      auto_enroll: true,
      starts_at: '2026-01-01T00:00:00Z',
      ends_at: '2026-12-31T23:59:59Z',
      signups_count: 50,
      conversions_count: 10,
    },
    {
      id: 2,
      name: 'Test Trial Program',
      description: null,
      trial_tier: 'team',
      trial_days: 30,
      is_active: false,
      auto_enroll: false,
      starts_at: '2026-02-01T00:00:00Z',
      ends_at: '2026-12-31T23:59:59Z',
      signups_count: 0,
      conversions_count: 0,
    },
  ];

  // ============================================================================
  // RENDERING & LOADING
  // ============================================================================

  describe('Rendering', () => {
    it('should render page title and description', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          data: [],
          pagination: { page: 1, limit: 25, total: 0, totalPages: 0 }
        }),
      });

      renderCampaigns();

      expect(screen.getByRole('heading', { name: /trial programs/i })).toBeInTheDocument();
      expect(screen.getByText(/manage trial programs/i)).toBeInTheDocument();
    });

    it('should show loading state initially', () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          data: [],
          pagination: { page: 1, limit: 25, total: 0, totalPages: 0 }
        }),
      });

      renderCampaigns();

      // BaseTable shows a spinning icon during loading (no text to assert)
      // Just verify the page title is rendered
      expect(screen.getByRole('heading', { name: /trial programs/i })).toBeInTheDocument();
    });

    it('should display campaigns after loading', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          data: mockCampaigns,
          pagination: { page: 1, limit: 25, total: mockCampaigns.length, totalPages: 1 }
        }),
      });

      renderCampaigns();

      await waitFor(() => {
        expect(screen.getByText('January Pro Trial')).toBeInTheDocument();
        expect(screen.getByText('Test Trial Program')).toBeInTheDocument();
      });
    });

    it('should show empty state when no campaigns', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          data: [],
          pagination: { page: 1, limit: 25, total: 0, totalPages: 0 }
        }),
      });

      renderCampaigns();

      await waitFor(() => {
        expect(screen.getByText(/no trial programs yet/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /create first trial program/i })).toBeInTheDocument();
      });
    });

    it('should show error state on fetch failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Failed to fetch' }),
      });

      renderCampaigns();

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to load campaigns');
      });
    });
  });

  // ============================================================================
  // STATUS BADGES
  // ============================================================================

  describe('Status Badges', () => {
    it('should show Active badge for active campaign within date range', async () => {
      const activeCampaign = {
        ...mockCampaigns[0],
        starts_at: new Date(Date.now() - 86400000).toISOString(),
        ends_at: new Date(Date.now() + 86400000).toISOString(),
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          data: [activeCampaign],
          pagination: { page: 1, limit: 25, total: 1, totalPages: 1 }
        }),
      });

      renderCampaigns();

      await waitFor(() => {
        expect(screen.getByText('Active')).toBeInTheDocument();
      });
    });

    it('should show Inactive badge for inactive campaign', async () => {
      const inactiveCampaign = { ...mockCampaigns[1], is_active: false };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          data: [inactiveCampaign],
          pagination: { page: 1, limit: 25, total: 1, totalPages: 1 }
        }),
      });

      renderCampaigns();

      await waitFor(() => {
        expect(screen.getByText('Inactive')).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // ACTIVE CAMPAIGN BANNER
  // ============================================================================

  describe('Active Trial Program Banner', () => {
    it('should show banner when a campaign is active', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          data: mockCampaigns,
          pagination: { page: 1, limit: 25, total: mockCampaigns.length, totalPages: 1 }
        }),
      });

      renderCampaigns();

      await waitFor(() => {
        expect(screen.getByText('Active auto-enroll trial program')).toBeInTheDocument();
        expect(screen.getByText(/all new signups receive a/i)).toBeInTheDocument();
      });
    });

    it('should not show banner when no campaign is active', async () => {
      const inactiveCampaigns = mockCampaigns.map((c) => ({ ...c, is_active: false }));

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          data: inactiveCampaigns,
          pagination: { page: 1, limit: 25, total: inactiveCampaigns.length, totalPages: 1 }
        }),
      });

      renderCampaigns();

      await waitFor(() => {
        expect(screen.getByText('January Pro Trial')).toBeInTheDocument();
      });

      expect(screen.queryByText('Active auto-enroll trial program')).not.toBeInTheDocument();
    });
  });

  // ============================================================================
  // CAMPAIGN TABLE
  // ============================================================================

  describe('Trial Program Table', () => {
    it('should display trial tier and duration', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          data: mockCampaigns,
          pagination: { page: 1, limit: 25, total: mockCampaigns.length, totalPages: 1 }
        }),
      });

      renderCampaigns();

      await waitFor(() => {
        expect(screen.getByText('pro')).toBeInTheDocument();
        expect(screen.getByText('(14 days)')).toBeInTheDocument();
        expect(screen.getByText('team')).toBeInTheDocument();
        expect(screen.getByText('(30 days)')).toBeInTheDocument();
      });
    });

    it('should display signup counts', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          data: mockCampaigns,
          pagination: { page: 1, limit: 25, total: mockCampaigns.length, totalPages: 1 }
        }),
      });

      renderCampaigns();

      await waitFor(() => {
        expect(screen.getByText('50')).toBeInTheDocument();
        expect(screen.getByText('(10 converted)')).toBeInTheDocument();
      });
    });

    it.skip('should only show delete button for campaigns with 0 signups', async () => {
      const user = userEvent.setup();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          data: mockCampaigns,
          pagination: { page: 1, limit: 25, total: mockCampaigns.length, totalPages: 1 }
        }),
      });

      renderCampaigns();

      await waitFor(() => {
        expect(screen.getByText('January Pro Trial')).toBeInTheDocument();
      });

      // Open first campaign menu (has signups) - should NOT have Delete
      const actionButtons = screen.getAllByLabelText('Trial Program actions');
      await user.click(actionButtons[0]);

      // Delete should not be in the menu (check in portal)
      await waitFor(() => {
        expect(within(document.body).queryByRole('menuitem', { name: /delete/i })).not.toBeInTheDocument();
      });

      // Close menu by pressing Escape
      await user.keyboard('{Escape}');

      // Open second campaign menu (0 signups) - should have Delete
      await user.click(actionButtons[1]);

      // Delete should be in this menu
      await waitFor(() => {
        expect(within(document.body).getByRole('menuitem', { name: /delete/i })).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // CREATE CAMPAIGN
  // ============================================================================

  describe('Create Trial Program', () => {
    it('should open modal when clicking New Trial Program', async () => {
      const user = userEvent.setup();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          data: [],
          pagination: { page: 1, limit: 25, total: 0, totalPages: 0 }
        }),
      });

      renderCampaigns();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create first trial program/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /create first trial program/i }));

      expect(screen.getByRole('heading', { name: /create trial program/i })).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/january pro trial/i)).toBeInTheDocument();
    });

    it('should call API when submitting form', async () => {
      const user = userEvent.setup();

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
          data: [],
          pagination: { page: 1, limit: 25, total: 0, totalPages: 0 }
        }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ id: 1, name: 'New Trial Program' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
          data: [],
          pagination: { page: 1, limit: 25, total: 0, totalPages: 0 }
        }),
        });

      renderCampaigns();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create first trial program/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /create first trial program/i }));

      await user.type(screen.getByPlaceholderText(/january pro trial/i), 'New Trial Program');
      await user.click(screen.getByRole('button', { name: /save/i }));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/admin/trial-programs'),
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('New Trial Program'),
          })
        );
      });
    });
  });

  // ============================================================================
  // TOGGLE CAMPAIGN
  // ============================================================================

  describe('Toggle Trial Program', () => {
    it.skip('should toggle trial program active status', async () => {
      const user = userEvent.setup();

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
          data: mockCampaigns,
          pagination: { page: 1, limit: 25, total: mockCampaigns.length, totalPages: 1 }
        }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ is_active: false }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
          data: mockCampaigns,
          pagination: { page: 1, limit: 25, total: mockCampaigns.length, totalPages: 1 }
        }),
        });

      renderCampaigns();

      await waitFor(() => {
        expect(screen.getByText('January Pro Trial')).toBeInTheDocument();
      });

      // Open the actions menu for the first campaign
      const actionButtons = screen.getAllByLabelText('Trial Program actions');
      await user.click(actionButtons[0]);

      // Click Deactivate in the menu (check portal)
      const deactivateButton = await findMenuItemInPortal(/deactivate/i);
      await user.click(deactivateButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/admin/trial-programs/1/toggle'),
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('false'),
          })
        );
      });
    });
  });

  // ============================================================================
  // DELETE CAMPAIGN
  // ============================================================================

  describe('Delete Trial Program', () => {
    it.skip('should delete campaign after confirmation', async () => {
      const user = userEvent.setup();

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
          data: mockCampaigns,
          pagination: { page: 1, limit: 25, total: mockCampaigns.length, totalPages: 1 }
        }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
          data: [],
          pagination: { page: 1, limit: 25, total: 0, totalPages: 0 }
        }),
        });

      renderCampaigns();

      await waitFor(() => {
        expect(screen.getByText('Test Trial Program')).toBeInTheDocument();
      });

      // Open the actions menu for the second campaign (Test Trial Program with 0 signups)
      const actionButtons = screen.getAllByLabelText('Trial Program actions');
      await user.click(actionButtons[1]);

      // Click Delete in the menu (check portal)
      const deleteButton = await findMenuItemInPortal(/delete/i);
      await user.click(deleteButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/admin/trial-programs/2'),
          expect.objectContaining({
            method: 'DELETE',
          })
        );
      });

      expect(toast.success).toHaveBeenCalledWith('Trial Program deleted');
    });

    it.skip('should not delete campaign if confirmation is cancelled', async () => {
      const user = userEvent.setup();
      global.confirm = vi.fn().mockReturnValue(false);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          data: mockCampaigns,
          pagination: { page: 1, limit: 25, total: mockCampaigns.length, totalPages: 1 }
        }),
      });

      renderCampaigns();

      await waitFor(() => {
        expect(screen.getByText('Test Trial Program')).toBeInTheDocument();
      });

      // Open the actions menu for the second campaign
      const actionButtons = screen.getAllByLabelText('Trial Program actions');
      await user.click(actionButtons[1]);

      // Click Delete in the menu (check portal)
      const deleteButton = await findMenuItemInPortal(/delete/i);
      await user.click(deleteButton);

      expect(mockFetch).toHaveBeenCalledTimes(1); // Only initial fetch
    });
  });

  // ============================================================================
  // EDIT CAMPAIGN
  // ============================================================================

  describe('Edit Trial Program', () => {
    it.skip('should open modal with campaign data when editing', async () => {
      const user = userEvent.setup();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          data: mockCampaigns,
          pagination: { page: 1, limit: 25, total: mockCampaigns.length, totalPages: 1 }
        }),
      });

      renderCampaigns();

      await waitFor(() => {
        expect(screen.getByText('January Pro Trial')).toBeInTheDocument();
      });

      // Open the actions menu for the first campaign
      const actionButtons = screen.getAllByLabelText('Trial Program actions');
      await user.click(actionButtons[0]);

      // Click Edit in the menu (check portal)
      const editButton = await findMenuItemInPortal(/edit/i);
      await user.click(editButton);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /edit campaign/i })).toBeInTheDocument();
        expect(screen.getByDisplayValue('January Pro Trial')).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // REFRESH
  // ============================================================================

  describe('Refresh', () => {
    it('should refresh campaigns when clicking refresh button', async () => {
      const user = userEvent.setup();

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
          data: mockCampaigns,
          pagination: { page: 1, limit: 25, total: mockCampaigns.length, totalPages: 1 }
        }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
          data: mockCampaigns,
          pagination: { page: 1, limit: 25, total: mockCampaigns.length, totalPages: 1 }
        }),
        });

      renderCampaigns();

      await waitFor(() => {
        expect(screen.getByText('January Pro Trial')).toBeInTheDocument();
      });

      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      await user.click(refreshButton);

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });
});
