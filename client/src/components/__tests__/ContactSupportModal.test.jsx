/**
 * Tests for ContactSupportModal Component
 *
 * FIXED: Pattern 6 - Mock AuthContext to control auth state
 * Component relies on isAuthenticated, user, and getToken from useAuth()
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContactSupportModal } from '../ContactSupportModal';

// Mock API_URL
vi.mock('../../config/api', () => ({
  API_URL: 'http://localhost:3000',
}));

// Mock AuthContext (Pattern 6 - Mock the hook directly)
const mockAuthContext = {
  user: null,
  isAuthenticated: false,
  getToken: vi.fn(() => null),
};

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext,
}));

// Helper to render with mocked auth state
const renderWithAuth = (ui, { user = null } = {}) => {
  // Update mock context for this render
  mockAuthContext.user = user;
  mockAuthContext.isAuthenticated = !!user;
  mockAuthContext.getToken = vi.fn(() => user ? 'fake-token' : null);

  return render(ui);
};

describe('ContactSupportModal', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock auth state
    mockAuthContext.user = null;
    mockAuthContext.isAuthenticated = false;
    mockAuthContext.getToken = vi.fn(() => null);
    global.fetch = vi.fn();
  });

  describe('Rendering - Unauthenticated', () => {
    it('should not render when isOpen is false', () => {
      renderWithAuth(<ContactSupportModal isOpen={false} onClose={mockOnClose} />);
      expect(screen.queryByText('Contact Support')).not.toBeInTheDocument();
    });

    it('should render when isOpen is true', () => {
      renderWithAuth(<ContactSupportModal isOpen={true} onClose={mockOnClose} />);
      expect(screen.getByText('Contact Support')).toBeInTheDocument();
    });

    it('should show name and email fields for unauthenticated users', () => {
      renderWithAuth(<ContactSupportModal isOpen={true} onClose={mockOnClose} />);
      expect(screen.getByLabelText(/First Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Last Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    });
  });

  describe('Rendering - Authenticated', () => {
    it('should display user info for authenticated users with name', () => {
      const user = {
        first_name: 'Alice',
        last_name: 'Smith',
        email: 'alice@example.com',
      };

      renderWithAuth(<ContactSupportModal isOpen={true} onClose={mockOnClose} />, { user });

      expect(screen.getByText(/Alice Smith/)).toBeInTheDocument();
      expect(screen.queryByLabelText(/First Name/i)).not.toBeInTheDocument();
      expect(screen.getByText(/alice@example.com/)).toBeInTheDocument();
    });

    it('should show name fields for authenticated users without name', () => {
      const user = {
        email: 'bob@example.com',
      };

      renderWithAuth(<ContactSupportModal isOpen={true} onClose={mockOnClose} />, { user });

      expect(screen.getByLabelText(/First Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Last Name/i)).toBeInTheDocument();
      expect(screen.queryByLabelText(/Email/i)).not.toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('should submit successfully for unauthenticated users', async () => {
      const user = userEvent.setup();
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      renderWithAuth(<ContactSupportModal isOpen={true} onClose={mockOnClose} />);

      await user.type(screen.getByLabelText(/First Name/i), 'Jane');
      await user.type(screen.getByLabelText(/Last Name/i), 'Smith');
      await user.type(screen.getByLabelText(/Email/i), 'jane@example.com');
      await user.type(screen.getByLabelText(/Message/i), 'Test message');
      await user.click(screen.getByRole('button', { name: /Send Message/i }));

      await waitFor(() => {
        expect(screen.getByText('Support Request Sent!')).toBeInTheDocument();
      });
    });

    it('should submit with auth token for authenticated users', async () => {
      const user = userEvent.setup();
      const authUser = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      renderWithAuth(<ContactSupportModal isOpen={true} onClose={mockOnClose} />, { user: authUser });

      await user.type(screen.getByLabelText(/Message/i), 'Test message');
      await user.click(screen.getByRole('button', { name: /Send Message/i }));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          'http://localhost:3000/api/contact/support',
          expect.objectContaining({
            headers: expect.objectContaining({
              'Authorization': expect.stringContaining('Bearer'),
            }),
          })
        );
      });
    });
  });

  describe('Character Limit', () => {
    it('should enforce 1000 character limit', async () => {
      const user = userEvent.setup();
      renderWithAuth(<ContactSupportModal isOpen={true} onClose={mockOnClose} />);

      const messageField = screen.getByLabelText(/Message/i);

      // Use paste instead of type for performance with large strings
      const longText = 'a'.repeat(1100);
      await user.click(messageField);
      await user.paste(longText);

      // The field enforces maxLength=1000, so it should only have 1000 chars
      await waitFor(() => {
        expect(screen.getByText('1000/1000')).toBeInTheDocument();
      });

      expect(messageField.value.length).toBe(1000);
    });
  });

  describe('Modal Close', () => {
    it('should close modal when close button clicked', async () => {
      const user = userEvent.setup();
      renderWithAuth(<ContactSupportModal isOpen={true} onClose={mockOnClose} />);

      await user.click(screen.getByLabelText(/Close modal/i));
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });
});
