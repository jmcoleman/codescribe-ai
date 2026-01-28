/**
 * Tests for EventsTable Component
 *
 * Tests rendering, filtering, pagination, and CSV export.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EventsTable from '../EventsTable';

// Mock fetch
global.fetch = vi.fn();

// Mock AuthContext
vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    getToken: () => 'test-token',
  }),
}));

// Mock useTableColumnSizing hook
vi.mock('../../../hooks/useTableColumnSizing', () => ({
  useTableColumnSizing: () => ({
    columnSizing: {},
    onColumnSizingChange: vi.fn(),
    isLoading: false,
  }),
}));

describe('EventsTable', () => {
  const mockStartDate = new Date('2024-01-01');
  const mockEndDate = new Date('2024-01-31');

  const mockEventsResponse = {
    success: true,
    events: [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        eventName: 'session_start',
        category: 'workflow',
        sessionId: 'sess-123',
        userId: null,
        ipAddress: '192.168.1.1',
        eventData: { referrer: 'google.com' },
        isInternal: false,
        createdAt: '2024-01-15T10:30:00Z',
      },
      {
        id: '223e4567-e89b-12d3-a456-426614174001',
        eventName: 'doc_generation',
        category: 'usage',
        sessionId: 'sess-123',
        userId: 42,
        ipAddress: '192.168.1.1',
        eventData: { doc_type: 'README', language: 'javascript' },
        isInternal: false,
        createdAt: '2024-01-15T10:35:00Z',
      },
    ],
    total: 2,
    page: 1,
    limit: 50,
    totalPages: 1,
  };

  const mockEventNamesResponse = {
    success: true,
    eventNames: ['session_start', 'code_input', 'doc_generation', 'signup'],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch.mockImplementation((url) => {
      if (url.includes('/event-names')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockEventNamesResponse),
        });
      }
      if (url.includes('/events')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockEventsResponse),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });
    });
  });

  describe('Rendering', () => {
    it('renders loading state initially', () => {
      render(
        <EventsTable
          startDate={mockStartDate}
          endDate={mockEndDate}
          excludeInternal={false}
        />
      );

      // Should show header with loading text
      expect(screen.getByText('Raw Events')).toBeInTheDocument();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('renders events after loading', async () => {
      render(
        <EventsTable
          startDate={mockStartDate}
          endDate={mockEndDate}
          excludeInternal={false}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('session_start')).toBeInTheDocument();
      });

      expect(screen.getByText('doc_generation')).toBeInTheDocument();
      expect(screen.getByText('2 events found')).toBeInTheDocument();
    });

    it('renders empty state when no events', async () => {
      global.fetch.mockImplementation((url) => {
        if (url.includes('/event-names')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockEventNamesResponse),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            events: [],
            total: 0,
            page: 1,
            limit: 50,
            totalPages: 0,
          }),
        });
      });

      render(
        <EventsTable
          startDate={mockStartDate}
          endDate={mockEndDate}
          excludeInternal={false}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('No events found')).toBeInTheDocument();
      });
    });
  });

  describe('Event Details', () => {
    it('expands row to show event data on click', async () => {
      render(
        <EventsTable
          startDate={mockStartDate}
          endDate={mockEndDate}
          excludeInternal={false}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('session_start')).toBeInTheDocument();
      });

      // Find and click the expand button for the first row
      const expandButtons = screen.getAllByRole('button', { name: /expand row/i });
      fireEvent.click(expandButtons[0]);

      // Should show event data (multiple rows have this text rendered via CSS animation)
      await waitFor(() => {
        const eventDataElements = screen.getAllByText('Event Data:');
        expect(eventDataElements.length).toBeGreaterThan(0);
      });

      // Check JSON is displayed for the expanded row
      expect(screen.getByText(/referrer/)).toBeInTheDocument();
    });

    it('shows user ID for authenticated events (not found case)', async () => {
      render(
        <EventsTable
          startDate={mockStartDate}
          endDate={mockEndDate}
          excludeInternal={false}
        />
      );

      await waitFor(() => {
        // The second event has userId: 42 but no userEmail, so shows "User #42 (not found)"
        expect(screen.getByText(/User #42/)).toBeInTheDocument();
      });
    });

    it('shows category badges with correct colors', async () => {
      render(
        <EventsTable
          startDate={mockStartDate}
          endDate={mockEndDate}
          excludeInternal={false}
        />
      );

      await waitFor(() => {
        // CategoryBadge displays labels: 'Workflow' for workflow, 'Usage' for usage
        expect(screen.getByText('Workflow')).toBeInTheDocument();
        expect(screen.getByText('Usage')).toBeInTheDocument();
      });
    });
  });

  describe('Filtering', () => {
    it('renders category filter dropdown', async () => {
      render(
        <EventsTable
          startDate={mockStartDate}
          endDate={mockEndDate}
          excludeInternal={false}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('session_start')).toBeInTheDocument();
      });

      // Filter label should be present (from FilterBar component)
      expect(screen.getByText('Filters:')).toBeInTheDocument();
    });
  });

  describe('CSV Export', () => {
    it('renders export button', async () => {
      render(
        <EventsTable
          startDate={mockStartDate}
          endDate={mockEndDate}
          excludeInternal={false}
        />
      );

      await waitFor(() => {
        expect(screen.getByLabelText('Export CSV')).toBeInTheDocument();
      });
    });

    it('disables export when no events', async () => {
      global.fetch.mockImplementation((url) => {
        if (url.includes('/event-names')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockEventNamesResponse),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            events: [],
            total: 0,
            page: 1,
            limit: 50,
            totalPages: 0,
          }),
        });
      });

      render(
        <EventsTable
          startDate={mockStartDate}
          endDate={mockEndDate}
          excludeInternal={false}
        />
      );

      await waitFor(() => {
        const exportButton = screen.getByLabelText('Export CSV');
        expect(exportButton).toBeDisabled();
      });
    });
  });

  describe('Pagination', () => {
    it('shows pagination info when multiple pages', async () => {
      global.fetch.mockImplementation((url) => {
        if (url.includes('/event-names')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockEventNamesResponse),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            ...mockEventsResponse,
            total: 150,
            totalPages: 3,
          }),
        });
      });

      render(
        <EventsTable
          startDate={mockStartDate}
          endDate={mockEndDate}
          excludeInternal={false}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Showing 1 to/)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error when fetch fails', async () => {
      global.fetch.mockImplementation((url) => {
        if (url.includes('/event-names')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockEventNamesResponse),
          });
        }
        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: 'Server error' }),
        });
      });

      render(
        <EventsTable
          startDate={mockStartDate}
          endDate={mockEndDate}
          excludeInternal={false}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Failed to fetch events')).toBeInTheDocument();
      });
    });
  });

  describe('Column Resizing', () => {
    it('passes column sizing props to BaseTable', async () => {
      render(
        <EventsTable
          startDate={mockStartDate}
          endDate={mockEndDate}
          excludeInternal={false}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('session_start')).toBeInTheDocument();
      });

      // BaseTable is rendered with the data table role
      expect(screen.getByRole('table', { name: 'Data table' })).toBeInTheDocument();
    });
  });
});
