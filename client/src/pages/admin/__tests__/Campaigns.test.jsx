/**
 * Unit tests for Admin Campaigns Page
 * Tests campaign listing, creation modal, status badges, and CRUD operations
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { renderWithTheme as render } from '../../../__tests__/utils/renderWithTheme';
import Campaigns from '../Campaigns';

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
        <Campaigns />
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
      starts_at: '2024-01-01T00:00:00Z',
      ends_at: '2024-01-31T23:59:59Z',
      signups_count: 50,
      conversions_count: 10,
    },
    {
      id: 2,
      name: 'Test Campaign',
      description: null,
      trial_tier: 'team',
      trial_days: 30,
      is_active: false,
      starts_at: '2024-02-01T00:00:00Z',
      ends_at: null,
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
        json: () => Promise.resolve({ data: [] }),
      });

      renderCampaigns();

      expect(screen.getByRole('heading', { name: /trial campaigns/i })).toBeInTheDocument();
      expect(screen.getByText(/manage auto-trial campaigns/i)).toBeInTheDocument();
    });

    it('should show loading state initially', () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      });

      renderCampaigns();

      expect(screen.getByText(/loading campaigns/i)).toBeInTheDocument();
    });

    it('should display campaigns after loading', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockCampaigns }),
      });

      renderCampaigns();

      await waitFor(() => {
        expect(screen.getByText('January Pro Trial')).toBeInTheDocument();
        expect(screen.getByText('Test Campaign')).toBeInTheDocument();
      });
    });

    it('should show empty state when no campaigns', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      });

      renderCampaigns();

      await waitFor(() => {
        expect(screen.getByText(/no campaigns yet/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /create first campaign/i })).toBeInTheDocument();
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
        json: () => Promise.resolve({ data: [activeCampaign] }),
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
        json: () => Promise.resolve({ data: [inactiveCampaign] }),
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

  describe('Active Campaign Banner', () => {
    it('should show banner when a campaign is active', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockCampaigns }),
      });

      renderCampaigns();

      await waitFor(() => {
        expect(screen.getByText('Campaign Active')).toBeInTheDocument();
        expect(screen.getByText(/all new signups receive a/i)).toBeInTheDocument();
      });
    });

    it('should not show banner when no campaign is active', async () => {
      const inactiveCampaigns = mockCampaigns.map((c) => ({ ...c, is_active: false }));

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: inactiveCampaigns }),
      });

      renderCampaigns();

      await waitFor(() => {
        expect(screen.getByText('January Pro Trial')).toBeInTheDocument();
      });

      expect(screen.queryByText('Campaign Active')).not.toBeInTheDocument();
    });
  });

  // ============================================================================
  // CAMPAIGN TABLE
  // ============================================================================

  describe('Campaign Table', () => {
    it('should display trial tier and duration', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockCampaigns }),
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
        json: () => Promise.resolve({ data: mockCampaigns }),
      });

      renderCampaigns();

      await waitFor(() => {
        expect(screen.getByText('50')).toBeInTheDocument();
        expect(screen.getByText('(10 converted)')).toBeInTheDocument();
      });
    });

    it('should only show delete button for campaigns with 0 signups', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockCampaigns }),
      });

      renderCampaigns();

      await waitFor(() => {
        // Campaign with signups should not have delete button visible
        // Campaign with 0 signups should have delete button
        const deleteButtons = screen.getAllByTitle('Delete');
        expect(deleteButtons).toHaveLength(1);
      });
    });
  });

  // ============================================================================
  // CREATE CAMPAIGN
  // ============================================================================

  describe('Create Campaign', () => {
    it('should open modal when clicking New Campaign', async () => {
      const user = userEvent.setup();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      });

      renderCampaigns();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create first campaign/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /create first campaign/i }));

      expect(screen.getByRole('heading', { name: /create campaign/i })).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/january pro trial/i)).toBeInTheDocument();
    });

    it('should call API when submitting form', async () => {
      const user = userEvent.setup();

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ data: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ id: 1, name: 'New Campaign' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ data: [] }),
        });

      renderCampaigns();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create first campaign/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /create first campaign/i }));

      await user.type(screen.getByPlaceholderText(/january pro trial/i), 'New Campaign');
      await user.click(screen.getByRole('button', { name: /create campaign/i }));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/admin/campaigns'),
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('New Campaign'),
          })
        );
      });
    });
  });

  // ============================================================================
  // TOGGLE CAMPAIGN
  // ============================================================================

  describe('Toggle Campaign', () => {
    it('should toggle campaign active status', async () => {
      const user = userEvent.setup();

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ data: mockCampaigns }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ is_active: false }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ data: mockCampaigns }),
        });

      renderCampaigns();

      await waitFor(() => {
        expect(screen.getByText('January Pro Trial')).toBeInTheDocument();
      });

      // Find deactivate button (pause icon) for active campaign
      const deactivateButton = screen.getByTitle('Deactivate');
      await user.click(deactivateButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/admin/campaigns/1/toggle'),
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

  describe('Delete Campaign', () => {
    it('should delete campaign after confirmation', async () => {
      const user = userEvent.setup();

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ data: mockCampaigns }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ data: [] }),
        });

      renderCampaigns();

      await waitFor(() => {
        expect(screen.getByText('Test Campaign')).toBeInTheDocument();
      });

      const deleteButton = screen.getByTitle('Delete');
      await user.click(deleteButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/admin/campaigns/2'),
          expect.objectContaining({
            method: 'DELETE',
          })
        );
      });

      expect(toast.success).toHaveBeenCalledWith('Campaign deleted');
    });

    it('should not delete campaign if confirmation is cancelled', async () => {
      const user = userEvent.setup();
      global.confirm = vi.fn().mockReturnValue(false);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockCampaigns }),
      });

      renderCampaigns();

      await waitFor(() => {
        expect(screen.getByText('Test Campaign')).toBeInTheDocument();
      });

      const deleteButton = screen.getByTitle('Delete');
      await user.click(deleteButton);

      expect(mockFetch).toHaveBeenCalledTimes(1); // Only initial fetch
    });
  });

  // ============================================================================
  // EDIT CAMPAIGN
  // ============================================================================

  describe('Edit Campaign', () => {
    it('should open modal with campaign data when editing', async () => {
      const user = userEvent.setup();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockCampaigns }),
      });

      renderCampaigns();

      await waitFor(() => {
        expect(screen.getByText('January Pro Trial')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByTitle('Edit');
      await user.click(editButtons[0]);

      expect(screen.getByRole('heading', { name: /edit campaign/i })).toBeInTheDocument();
      expect(screen.getByDisplayValue('January Pro Trial')).toBeInTheDocument();
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
          json: () => Promise.resolve({ data: mockCampaigns }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ data: mockCampaigns }),
        });

      renderCampaigns();

      await waitFor(() => {
        expect(screen.getByText('January Pro Trial')).toBeInTheDocument();
      });

      const refreshButton = screen.getByTitle('Refresh');
      await user.click(refreshButton);

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });
});
