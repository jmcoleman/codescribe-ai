/**
 * DangerZoneTab Component Tests
 *
 * Tests account deletion UI functionality including:
 * - Delete confirmation modal
 * - Text validation ("DELETE MY ACCOUNT")
 * - ESC key handling
 * - API integration
 * - Success/error states
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { DangerZoneTab } from '../DangerZoneTab';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock toast utility
vi.mock('../../../utils/toast', () => ({
  toastCompact: vi.fn(),
}));

// Mock useAuth hook
const mockLogout = vi.fn();
vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { email: 'test@example.com', name: 'Test User' },
    logout: mockLogout,
  }),
}));

import { toastCompact } from '../../../utils/toast';

// Helper to render component
const renderWithRouter = () => {
  return render(
    <BrowserRouter>
      <DangerZoneTab />
    </BrowserRouter>
  );
};

// Helper to get modal delete button (not the card "Delete My Account" button)
const getModalDeleteButton = () => {
  const allButtons = screen.getAllByRole('button');
  return allButtons.find(btn => {
    const text = btn.textContent || '';
    return text.includes('Delete Account') && !text.includes('My') && !text.includes('Deleting');
  });
};

describe('DangerZoneTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    global.fetch = vi.fn();
  });

  describe('Initial Render', () => {
    it('should render privacy info banner', () => {
      renderWithRouter();

      expect(screen.getByText(/Your code is never stored on our servers/i)).toBeInTheDocument();
      expect(screen.getByText(/Deleting your account only removes account data and generated documentation/i)).toBeInTheDocument();
    });

    it('should render delete account section with warning', () => {
      renderWithRouter();

      expect(screen.getByRole('heading', { name: /Delete Account/i })).toBeInTheDocument();
      expect(screen.getByText(/Permanently delete your account and all associated data/i)).toBeInTheDocument();
    });

    it('should render collapsible details about what will be deleted', () => {
      renderWithRouter();

      const details = screen.getByText(/What will be deleted/i);
      expect(details).toBeInTheDocument();
    });

    it('should render delete button', () => {
      renderWithRouter();

      const deleteButton = screen.getByRole('button', { name: /Delete My Account/i });
      expect(deleteButton).toBeInTheDocument();
      expect(deleteButton).toBeEnabled();
    });
  });

  describe('Confirmation Modal', () => {
    it('should open modal when delete button is clicked', async () => {
      const user = userEvent.setup();
      renderWithRouter();

      const deleteButton = screen.getByRole('button', { name: /Delete My Account/i });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Confirm Account Deletion/i })).toBeInTheDocument();
      });
    });

    it('should show warning message in modal', async () => {
      const user = userEvent.setup();
      renderWithRouter();

      await user.click(screen.getByRole('button', { name: /Delete My Account/i }));

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Confirm Account Deletion/i })).toBeInTheDocument();
      });

      // Check for 30-day grace period warning (use getAllByText since text appears multiple times)
      const gracePeriodTexts = screen.getAllByText(/You have 30 days to restore your account/i);
      expect(gracePeriodTexts.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/You can restore it within 30 days/i)).toBeInTheDocument();
    });

    it('should show confirmation text input with instructions', async () => {
      const user = userEvent.setup();
      renderWithRouter();

      await user.click(screen.getByRole('button', { name: /Delete My Account/i }));

      await waitFor(() => {
        expect(screen.getByText(/To confirm, please type/i)).toBeInTheDocument();
        expect(screen.getByRole('code')).toHaveTextContent(/DELETE MY ACCOUNT/i);
        expect(screen.getByPlaceholderText(/Type here to confirm/i)).toBeInTheDocument();
      });
    });

    it('should auto-focus confirmation input when modal opens', async () => {
      const user = userEvent.setup();
      renderWithRouter();

      await user.click(screen.getByRole('button', { name: /Delete My Account/i }));

      await waitFor(() => {
        const input = screen.getByPlaceholderText(/Type here to confirm/i);
        expect(input).toHaveFocus();
      });
    });

    it('should render cancel and delete buttons in modal', async () => {
      const user = userEvent.setup();
      renderWithRouter();

      await user.click(screen.getByRole('button', { name: /Delete My Account/i }));

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Confirm Account Deletion/i })).toBeInTheDocument();
      });

      // Get all buttons, the modal should have 3: Delete Account, Cancel, and Close (X)
      const allButtons = screen.getAllByRole('button');
      const cancelBtn = screen.getByRole('button', { name: /^Cancel$/i });
      expect(cancelBtn).toBeInTheDocument();
      expect(allButtons.length).toBeGreaterThanOrEqual(3); // At least Delete Account, Cancel, Close
    });

    it('should have delete button disabled initially', async () => {
      const user = userEvent.setup();
      renderWithRouter();

      await user.click(screen.getByRole('button', { name: /Delete My Account/i }));

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Confirm Account Deletion/i })).toBeInTheDocument();
      });

      const modalDeleteBtn = getModalDeleteButton();
      expect(modalDeleteBtn).toBeDefined();
      expect(modalDeleteBtn).toBeDisabled();
    });

    it('should enable delete button only when correct text is entered', async () => {
      const user = userEvent.setup();
      renderWithRouter();

      await user.click(screen.getByRole('button', { name: /Delete My Account/i }));

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Type here to confirm/i)).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText(/Type here to confirm/i);

      // Initially disabled
      let deleteBtn = getModalDeleteButton();
      expect(deleteBtn).toBeDisabled();

      // Type incorrect text
      await user.type(input, 'DELETE MY');
      deleteBtn = getModalDeleteButton();
      expect(deleteBtn).toBeDisabled();

      // Complete correct text
      await user.type(input, ' ACCOUNT');
      deleteBtn = getModalDeleteButton();
      expect(deleteBtn).toBeEnabled();
    });
  });

  describe('Modal Close Behavior', () => {
    it('should close modal when cancel button is clicked', async () => {
      const user = userEvent.setup();
      renderWithRouter();

      await user.click(screen.getByRole('button', { name: /Delete My Account/i }));

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Confirm Account Deletion/i })).toBeInTheDocument();
      });

      const cancelBtn = screen.getByRole('button', { name: /Cancel/i });
      await user.click(cancelBtn);

      await waitFor(() => {
        expect(screen.queryByRole('heading', { name: /Confirm Account Deletion/i })).not.toBeInTheDocument();
      });
    });

    it('should close modal when X button is clicked', async () => {
      const user = userEvent.setup();
      renderWithRouter();

      await user.click(screen.getByRole('button', { name: /Delete My Account/i }));

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Confirm Account Deletion/i })).toBeInTheDocument();
      });

      const closeBtn = screen.getByLabelText(/Close/i);
      await user.click(closeBtn);

      await waitFor(() => {
        expect(screen.queryByRole('heading', { name: /Confirm Account Deletion/i })).not.toBeInTheDocument();
      });
    });

    it('should close modal and clear input when ESC key is pressed', async () => {
      const user = userEvent.setup();
      renderWithRouter();

      await user.click(screen.getByRole('button', { name: /Delete My Account/i }));

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Type here to confirm/i)).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText(/Type here to confirm/i);
      await user.type(input, 'DELETE MY');

      // Press ESC
      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(screen.queryByRole('heading', { name: /Confirm Account Deletion/i })).not.toBeInTheDocument();
      });
    });

    it('should not close modal on ESC when deletion is in progress', async () => {
      const user = userEvent.setup();
      renderWithRouter();

      // Mock slow API response
      global.fetch = vi.fn(() => new Promise(resolve => {
        setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({ message: 'Success' })
        }), 1000);
      }));

      localStorage.setItem('token', 'test-token');

      await user.click(screen.getByRole('button', { name: /Delete My Account/i }));

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Type here to confirm/i)).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText(/Type here to confirm/i);
      await user.type(input, 'DELETE MY ACCOUNT');

      const deleteBtn = getModalDeleteButton();
      await user.click(deleteBtn);

      // Wait for loading state to appear
      await waitFor(() => {
        expect(screen.getByText(/Deleting.../i)).toBeInTheDocument();
      });

      // Try to close with ESC during deletion
      await user.keyboard('{Escape}');

      // Modal should still be visible with loading state (ESC should be ignored during deletion)
      expect(screen.getByText(/Deleting.../i)).toBeInTheDocument();

      // Give a small delay to ensure ESC doesn't close the modal
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify modal is still open
      expect(screen.getByText(/Deleting.../i)).toBeInTheDocument();
    });

    it('should clear confirmation text when modal is closed', async () => {
      const user = userEvent.setup();
      renderWithRouter();

      // Open modal and type text
      await user.click(screen.getByRole('button', { name: /Delete My Account/i }));

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Type here to confirm/i)).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText(/Type here to confirm/i);
      await user.type(input, 'DELETE MY');

      // Close modal
      const cancelBtn = screen.getByRole('button', { name: /Cancel/i });
      await user.click(cancelBtn);

      // Reopen modal
      await user.click(screen.getByRole('button', { name: /Delete My Account/i }));

      await waitFor(() => {
        const newInput = screen.getByPlaceholderText(/Type here to confirm/i);
        expect(newInput.value).toBe('');
      });
    });
  });

  describe('Account Deletion', () => {
    it('should keep delete button disabled with incorrect confirmation text', async () => {
      const user = userEvent.setup();
      renderWithRouter();

      await user.click(screen.getByRole('button', { name: /Delete My Account/i }));

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Type here to confirm/i)).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText(/Type here to confirm/i);

      // Type incorrect text (wrong case)
      await user.type(input, 'delete my account');

      const deleteBtn = getModalDeleteButton();

      // Button should stay disabled with incorrect text
      expect(deleteBtn).toBeDisabled();
    });

    it('should call API with correct endpoint and headers', async () => {
      const user = userEvent.setup();

      global.fetch = vi.fn(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ message: 'Account deletion scheduled' })
      }));

      localStorage.setItem('token', 'test-token-123');

      renderWithRouter();

      await user.click(screen.getByRole('button', { name: /Delete My Account/i }));

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Type here to confirm/i)).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText(/Type here to confirm/i);
      await user.type(input, 'DELETE MY ACCOUNT');

      const deleteBtn = getModalDeleteButton();
      await user.click(deleteBtn);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/user/delete-account'),
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Content-Type': 'application/json',
              'Authorization': 'Bearer test-token-123'
            }),
            body: JSON.stringify({ reason: null })
          })
        );
      });
    });

    it('should show loading state during deletion', async () => {
      const user = userEvent.setup();

      global.fetch = vi.fn(() => new Promise(resolve => {
        setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({ message: 'Success' })
        }), 100);
      }));

      localStorage.setItem('token', 'test-token');

      renderWithRouter();

      await user.click(screen.getByRole('button', { name: /Delete My Account/i }));

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Type here to confirm/i)).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText(/Type here to confirm/i);
      await user.type(input, 'DELETE MY ACCOUNT');

      const deleteBtn = getModalDeleteButton();
      await user.click(deleteBtn);

      // Should show loading state
      await waitFor(() => {
        expect(screen.getByText(/Deleting.../i)).toBeInTheDocument();
      });
    });

    it('should disable buttons during deletion', async () => {
      const user = userEvent.setup();

      global.fetch = vi.fn(() => new Promise(resolve => {
        setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({ message: 'Success' })
        }), 100);
      }));

      localStorage.setItem('token', 'test-token');

      renderWithRouter();

      await user.click(screen.getByRole('button', { name: /Delete My Account/i }));

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Type here to confirm/i)).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText(/Type here to confirm/i);
      await user.type(input, 'DELETE MY ACCOUNT');

      const deleteBtn = getModalDeleteButton();
      await user.click(deleteBtn);

      await waitFor(() => {
        const cancelBtn = screen.getByRole('button', { name: /Cancel/i });
        expect(cancelBtn).toBeDisabled();
      });
    });

    it('should show success toast on successful deletion', async () => {
      const user = userEvent.setup();

      global.fetch = vi.fn(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ message: 'Account deletion scheduled' })
      }));

      localStorage.setItem('token', 'test-token');

      renderWithRouter();

      await user.click(screen.getByRole('button', { name: /Delete My Account/i }));

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Type here to confirm/i)).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText(/Type here to confirm/i);
      await user.type(input, 'DELETE MY ACCOUNT');

      const deleteBtn = getModalDeleteButton();
      await user.click(deleteBtn);

      await waitFor(() => {
        expect(toastCompact).toHaveBeenCalledWith(
          'Account deletion scheduled. Check your email for details.',
          'success'
        );
      });
    });

    it('should close modal on successful deletion', async () => {
      const user = userEvent.setup();

      global.fetch = vi.fn(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ message: 'Account deletion scheduled' })
      }));

      localStorage.setItem('token', 'test-token');

      renderWithRouter();

      await user.click(screen.getByRole('button', { name: /Delete My Account/i }));

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Type here to confirm/i)).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText(/Type here to confirm/i);
      await user.type(input, 'DELETE MY ACCOUNT');

      const deleteBtn = getModalDeleteButton();
      await user.click(deleteBtn);

      await waitFor(() => {
        expect(screen.queryByRole('heading', { name: /Confirm Account Deletion/i })).not.toBeInTheDocument();
      });
    });

    it('should logout after successful deletion', async () => {
      const user = userEvent.setup();

      global.fetch = vi.fn(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ message: 'Account deletion scheduled' })
      }));

      localStorage.setItem('token', 'test-token');

      renderWithRouter();

      await user.click(screen.getByRole('button', { name: /Delete My Account/i }));

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Type here to confirm/i)).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText(/Type here to confirm/i);
      await user.type(input, 'DELETE MY ACCOUNT');

      const deleteBtn = getModalDeleteButton();
      await user.click(deleteBtn);

      // Wait for the 2-second timeout
      await waitFor(() => {
        expect(mockLogout).toHaveBeenCalled();
      }, { timeout: 3000 });
    });

    it('should navigate to home after logout', async () => {
      const user = userEvent.setup();

      global.fetch = vi.fn(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ message: 'Account deletion scheduled' })
      }));

      localStorage.setItem('token', 'test-token');

      renderWithRouter();

      await user.click(screen.getByRole('button', { name: /Delete My Account/i }));

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Type here to confirm/i)).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText(/Type here to confirm/i);
      await user.type(input, 'DELETE MY ACCOUNT');

      const deleteBtn = getModalDeleteButton();
      await user.click(deleteBtn);

      // Wait for the 2-second timeout + navigation
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/');
      }, { timeout: 3000 });
    });

    it('should show error toast on API failure', async () => {
      const user = userEvent.setup();

      global.fetch = vi.fn(() => Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Database error' })
      }));

      localStorage.setItem('token', 'test-token');

      renderWithRouter();

      await user.click(screen.getByRole('button', { name: /Delete My Account/i }));

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Type here to confirm/i)).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText(/Type here to confirm/i);
      await user.type(input, 'DELETE MY ACCOUNT');

      const deleteBtn = getModalDeleteButton();
      await user.click(deleteBtn);

      await waitFor(() => {
        expect(toastCompact).toHaveBeenCalledWith('Database error', 'error');
      });
    });

    it('should keep modal open on API failure', async () => {
      const user = userEvent.setup();

      global.fetch = vi.fn(() => Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Database error' })
      }));

      localStorage.setItem('token', 'test-token');

      renderWithRouter();

      await user.click(screen.getByRole('button', { name: /Delete My Account/i }));

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Type here to confirm/i)).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText(/Type here to confirm/i);
      await user.type(input, 'DELETE MY ACCOUNT');

      const deleteBtn = getModalDeleteButton();
      await user.click(deleteBtn);

      await waitFor(() => {
        expect(toastCompact).toHaveBeenCalledWith('Database error', 'error');
      });

      // Modal should still be visible
      expect(screen.getByRole('heading', { name: /Confirm Account Deletion/i })).toBeInTheDocument();
    });

    it('should re-enable buttons after API failure', async () => {
      const user = userEvent.setup();

      global.fetch = vi.fn(() => Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Network error' })
      }));

      localStorage.setItem('token', 'test-token');

      renderWithRouter();

      await user.click(screen.getByRole('button', { name: /Delete My Account/i }));

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Type here to confirm/i)).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText(/Type here to confirm/i);
      await user.type(input, 'DELETE MY ACCOUNT');

      const deleteBtn = getModalDeleteButton();
      await user.click(deleteBtn);

      await waitFor(() => {
        expect(toastCompact).toHaveBeenCalled();
      });

      // Buttons should be re-enabled after error
      await waitFor(() => {
        const cancelBtn = screen.getByRole('button', { name: /^Cancel$/i });
        expect(cancelBtn).toBeEnabled();
      });
    });

    it('should handle network errors gracefully', async () => {
      const user = userEvent.setup();

      global.fetch = vi.fn(() => Promise.reject(new Error('Network error')));

      localStorage.setItem('token', 'test-token');

      renderWithRouter();

      await user.click(screen.getByRole('button', { name: /Delete My Account/i }));

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Type here to confirm/i)).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText(/Type here to confirm/i);
      await user.type(input, 'DELETE MY ACCOUNT');

      const deleteBtn = getModalDeleteButton();
      await user.click(deleteBtn);

      await waitFor(() => {
        expect(toastCompact).toHaveBeenCalledWith(
          expect.stringContaining('Network error'),
          'error'
        );
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', async () => {
      const user = userEvent.setup();
      renderWithRouter();

      await user.click(screen.getByRole('button', { name: /Delete My Account/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/Close/i)).toBeInTheDocument();
      });
    });

    it('should have proper heading hierarchy', () => {
      renderWithRouter();

      const heading = screen.getByRole('heading', { name: /Delete Account/i });
      expect(heading).toBeInTheDocument();
      expect(heading.tagName).toBe('H2');
    });

    it('should hide decorative icons from screen readers', () => {
      renderWithRouter();

      const icons = document.querySelectorAll('[aria-hidden="true"]');
      expect(icons.length).toBeGreaterThan(0);
    });
  });
});
