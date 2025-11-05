/**
 * AccountTab Component Tests
 *
 * Tests account management functionality including:
 * - Profile editing (name, email)
 * - Password change (email auth only)
 * - Data export (GDPR/CCPA compliance)
 * - Form validation
 * - API integration
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { AccountTab } from '../AccountTab';

// Mock toast utility
vi.mock('../../../utils/toast', () => ({
  toastCompact: vi.fn(),
}));

// Mock useAuth hook
const mockUpdateProfile = vi.fn();
vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

import { toastCompact } from '../../../utils/toast';
import { useAuth } from '../../../contexts/AuthContext';

// Helper to render component
const renderWithRouter = () => {
  return render(
    <BrowserRouter>
      <AccountTab />
    </BrowserRouter>
  );
};

describe('AccountTab', () => {
  let mockFetch;
  let originalCreateElement;
  let originalCreateObjectURL;
  let originalRevokeObjectURL;
  let originalAppendChild;
  let originalRemoveChild;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockFetch = vi.fn();
    global.fetch = mockFetch;

    // Save original DOM methods
    originalCreateElement = document.createElement;
    originalCreateObjectURL = global.URL.createObjectURL;
    originalRevokeObjectURL = global.URL.revokeObjectURL;
    originalAppendChild = document.body.appendChild;
    originalRemoveChild = document.body.removeChild;

    // Default mock for useAuth
    useAuth.mockReturnValue({
      user: {
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        tier: 'pro',
        auth_method: 'email',
      },
      updateProfile: mockUpdateProfile,
    });
  });

  afterEach(() => {
    // Restore original DOM methods
    document.createElement = originalCreateElement;
    if (originalCreateObjectURL) global.URL.createObjectURL = originalCreateObjectURL;
    if (originalRevokeObjectURL) global.URL.revokeObjectURL = originalRevokeObjectURL;
    document.body.appendChild = originalAppendChild;
    document.body.removeChild = originalRemoveChild;
    cleanup();
  });

  describe('Profile Information Section', () => {
    it('should render profile section with user information', () => {
      renderWithRouter();

      expect(screen.getByRole('heading', { name: /Profile Information/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/First Name/i)).toHaveValue('Test');
      expect(screen.getByLabelText(/Last Name/i)).toHaveValue('User');
      expect(screen.getByLabelText(/Email Address/i)).toHaveValue('test@example.com');
    });

    it('should have all inputs disabled initially', () => {
      renderWithRouter();

      expect(screen.getByLabelText(/First Name/i)).toBeDisabled();
      expect(screen.getByLabelText(/Last Name/i)).toBeDisabled();
      expect(screen.getByLabelText(/Email Address/i)).toBeDisabled();
    });

    it('should show Edit button when not editing', () => {
      renderWithRouter();

      const editButton = screen.getByRole('button', { name: /^Edit$/i });
      expect(editButton).toBeInTheDocument();
      expect(editButton).toBeEnabled();
    });

    it('should enable inputs when Edit is clicked', async () => {
      const user = userEvent.setup();
      renderWithRouter();

      await user.click(screen.getByRole('button', { name: /^Edit$/i }));

      expect(screen.getByLabelText(/First Name/i)).toBeEnabled();
      expect(screen.getByLabelText(/Last Name/i)).toBeEnabled();
      expect(screen.getByLabelText(/Email Address/i)).toBeEnabled();
    });

    it('should show Save and Cancel buttons when editing', async () => {
      const user = userEvent.setup();
      renderWithRouter();

      await user.click(screen.getByRole('button', { name: /^Edit$/i }));

      expect(screen.getByRole('button', { name: /Save Changes/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^Cancel$/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /^Edit$/i })).not.toBeInTheDocument();
    });

    it('should allow editing profile fields', async () => {
      const user = userEvent.setup();
      renderWithRouter();

      await user.click(screen.getByRole('button', { name: /^Edit$/i }));

      const firstNameInput = screen.getByLabelText(/First Name/i);
      const lastNameInput = screen.getByLabelText(/Last Name/i);
      const emailInput = screen.getByLabelText(/Email Address/i);

      await user.clear(firstNameInput);
      await user.type(firstNameInput, 'Updated');
      expect(firstNameInput).toHaveValue('Updated');

      await user.clear(lastNameInput);
      await user.type(lastNameInput, 'Name');
      expect(lastNameInput).toHaveValue('Name');

      await user.clear(emailInput);
      await user.type(emailInput, 'updated@example.com');
      expect(emailInput).toHaveValue('updated@example.com');
    });
  });

  describe('Profile Form Validation', () => {
    it('should show error if email is empty', async () => {
      const user = userEvent.setup();
      renderWithRouter();

      await user.click(screen.getByRole('button', { name: /^Edit$/i }));

      const emailInput = screen.getByLabelText(/Email Address/i);
      await user.clear(emailInput);

      await user.click(screen.getByRole('button', { name: /Save Changes/i }));

      await waitFor(() => {
        expect(screen.getByText(/Email is required/i)).toBeInTheDocument();
      });
    });

    it('should show error if first name provided without last name', async () => {
      const user = userEvent.setup();
      renderWithRouter();

      await user.click(screen.getByRole('button', { name: /^Edit$/i }));

      const lastNameInput = screen.getByLabelText(/Last Name/i);
      await user.clear(lastNameInput);

      await user.click(screen.getByRole('button', { name: /Save Changes/i }));

      await waitFor(() => {
        expect(screen.getByText(/Both first and last name are required/i)).toBeInTheDocument();
      });
    });

    it('should show error if last name provided without first name', async () => {
      const user = userEvent.setup();
      renderWithRouter();

      await user.click(screen.getByRole('button', { name: /^Edit$/i }));

      const firstNameInput = screen.getByLabelText(/First Name/i);
      await user.clear(firstNameInput);

      await user.click(screen.getByRole('button', { name: /Save Changes/i }));

      await waitFor(() => {
        expect(screen.getByText(/Both first and last name are required/i)).toBeInTheDocument();
      });
    });
  });

  describe('Profile Save Functionality', () => {
    it('should call updateProfile with correct data', async () => {
      const user = userEvent.setup();
      mockUpdateProfile.mockResolvedValueOnce({ success: true });
      renderWithRouter();

      await user.click(screen.getByRole('button', { name: /^Edit$/i }));

      const firstNameInput = screen.getByLabelText(/First Name/i);
      const lastNameInput = screen.getByLabelText(/Last Name/i);
      const emailInput = screen.getByLabelText(/Email Address/i);

      await user.clear(firstNameInput);
      await user.type(firstNameInput, 'Updated');
      await user.clear(lastNameInput);
      await user.type(lastNameInput, 'Name');
      await user.clear(emailInput);
      await user.type(emailInput, 'updated@example.com');

      await user.click(screen.getByRole('button', { name: /Save Changes/i }));

      await waitFor(() => {
        expect(mockUpdateProfile).toHaveBeenCalledWith({
          email: 'updated@example.com',
          first_name: 'Updated',
          last_name: 'Name',
        });
      });
    });

    it('should show success toast on successful save', async () => {
      const user = userEvent.setup();
      mockUpdateProfile.mockResolvedValueOnce({ success: true });
      renderWithRouter();

      await user.click(screen.getByRole('button', { name: /^Edit$/i }));
      await user.click(screen.getByRole('button', { name: /Save Changes/i }));

      await waitFor(() => {
        expect(toastCompact).toHaveBeenCalledWith('Profile updated successfully', 'success');
      });
    });

    it('should exit edit mode on successful save', async () => {
      const user = userEvent.setup();
      mockUpdateProfile.mockResolvedValueOnce({ success: true });
      renderWithRouter();

      await user.click(screen.getByRole('button', { name: /^Edit$/i }));
      await user.click(screen.getByRole('button', { name: /Save Changes/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^Edit$/i })).toBeInTheDocument();
      });
    });

    it('should show loading state while saving', async () => {
      const user = userEvent.setup();
      mockUpdateProfile.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100)));
      renderWithRouter();

      await user.click(screen.getByRole('button', { name: /^Edit$/i }));
      await user.click(screen.getByRole('button', { name: /Save Changes/i }));

      await waitFor(() => {
        expect(screen.getByText(/Saving.../i)).toBeInTheDocument();
      });
    });

    it('should show error on save failure', async () => {
      const user = userEvent.setup();
      mockUpdateProfile.mockRejectedValueOnce(new Error('Update failed'));
      renderWithRouter();

      await user.click(screen.getByRole('button', { name: /^Edit$/i }));
      await user.click(screen.getByRole('button', { name: /Save Changes/i }));

      await waitFor(() => {
        expect(screen.getByText(/Update failed/i)).toBeInTheDocument();
      });
    });
  });

  describe('Cancel Functionality', () => {
    it('should reset fields to original values when Cancel is clicked', async () => {
      const user = userEvent.setup();
      renderWithRouter();

      await user.click(screen.getByRole('button', { name: /^Edit$/i }));

      const firstNameInput = screen.getByLabelText(/First Name/i);
      await user.clear(firstNameInput);
      await user.type(firstNameInput, 'Changed');

      await user.click(screen.getByRole('button', { name: /^Cancel$/i }));

      // Field should be reset to original value
      expect(screen.getByLabelText(/First Name/i)).toHaveValue('Test');
    });

    it('should clear error messages when Cancel is clicked', async () => {
      const user = userEvent.setup();
      renderWithRouter();

      await user.click(screen.getByRole('button', { name: /^Edit$/i }));

      const emailInput = screen.getByLabelText(/Email Address/i);
      await user.clear(emailInput);
      await user.click(screen.getByRole('button', { name: /Save Changes/i }));

      await waitFor(() => {
        expect(screen.getByText(/Email is required/i)).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /^Cancel$/i }));

      expect(screen.queryByText(/Email is required/i)).not.toBeInTheDocument();
    });

    it('should exit edit mode when Cancel is clicked', async () => {
      const user = userEvent.setup();
      renderWithRouter();

      await user.click(screen.getByRole('button', { name: /^Edit$/i }));
      await user.click(screen.getByRole('button', { name: /^Cancel$/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^Edit$/i })).toBeInTheDocument();
      });

      // Save Changes button is hidden with CSS (max-h-0 opacity-0) but still in DOM
      // Check that inputs are disabled instead (which confirms edit mode is off)
      expect(screen.getByLabelText(/First Name/i)).toBeDisabled();
      expect(screen.getByLabelText(/Last Name/i)).toBeDisabled();
      expect(screen.getByLabelText(/Email Address/i)).toBeDisabled();
    });
  });

  describe('Password Section (Email Auth)', () => {
    it('should show password section for email auth users', () => {
      renderWithRouter();

      expect(screen.getByRole('heading', { name: /^Password$/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Change Password/i })).toBeInTheDocument();
    });

    it('should not show password section for GitHub auth users', () => {
      useAuth.mockReturnValue({
        user: {
          email: 'test@example.com',
          first_name: 'Test',
          last_name: 'User',
          tier: 'pro',
          auth_method: 'github',
        },
        updateProfile: mockUpdateProfile,
      });

      renderWithRouter();

      expect(screen.queryByRole('heading', { name: /^Password$/i })).not.toBeInTheDocument();
    });

    it('should show password form when Change Password is clicked', async () => {
      const user = userEvent.setup();
      renderWithRouter();

      await user.click(screen.getByRole('button', { name: /Change Password/i }));

      expect(screen.getByLabelText(/Current Password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^New Password$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Confirm New Password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Update Password/i })).toBeInTheDocument();
    });

    it('should validate all password fields are required', async () => {
      const user = userEvent.setup();
      renderWithRouter();

      await user.click(screen.getByRole('button', { name: /Change Password/i }));
      await user.click(screen.getByRole('button', { name: /Update Password/i }));

      await waitFor(() => {
        expect(screen.getByText(/All fields are required/i)).toBeInTheDocument();
      });
    });

    it('should validate minimum password length', async () => {
      const user = userEvent.setup();
      renderWithRouter();

      await user.click(screen.getByRole('button', { name: /Change Password/i }));

      await user.type(screen.getByLabelText(/Current Password/i), 'oldpass123');
      await user.type(screen.getByLabelText(/^New Password$/i), 'short');
      await user.type(screen.getByLabelText(/Confirm New Password/i), 'short');

      await user.click(screen.getByRole('button', { name: /Update Password/i }));

      await waitFor(() => {
        expect(screen.getByText(/must be at least 8 characters/i)).toBeInTheDocument();
      });
    });

    it('should validate passwords match', async () => {
      const user = userEvent.setup();
      renderWithRouter();

      await user.click(screen.getByRole('button', { name: /Change Password/i }));

      await user.type(screen.getByLabelText(/Current Password/i), 'oldpass123');
      await user.type(screen.getByLabelText(/^New Password$/i), 'newpassword123');
      await user.type(screen.getByLabelText(/Confirm New Password/i), 'differentpassword');

      await user.click(screen.getByRole('button', { name: /Update Password/i }));

      await waitFor(() => {
        expect(screen.getByText(/Passwords do not match/i)).toBeInTheDocument();
      });
    });

    it('should show success toast on successful password change', async () => {
      const user = userEvent.setup();
      renderWithRouter();

      await user.click(screen.getByRole('button', { name: /Change Password/i }));

      await user.type(screen.getByLabelText(/Current Password/i), 'oldpass123');
      await user.type(screen.getByLabelText(/^New Password$/i), 'newpassword123');
      await user.type(screen.getByLabelText(/Confirm New Password/i), 'newpassword123');

      await user.click(screen.getByRole('button', { name: /Update Password/i }));

      await waitFor(() => {
        expect(toastCompact).toHaveBeenCalledWith('Password changed successfully', 'success');
      });
    });

    it('should close password form and clear fields after successful change', async () => {
      const user = userEvent.setup();
      renderWithRouter();

      await user.click(screen.getByRole('button', { name: /Change Password/i }));

      await user.type(screen.getByLabelText(/Current Password/i), 'oldpass123');
      await user.type(screen.getByLabelText(/^New Password$/i), 'newpassword123');
      await user.type(screen.getByLabelText(/Confirm New Password/i), 'newpassword123');

      await user.click(screen.getByRole('button', { name: /Update Password/i }));

      await waitFor(() => {
        expect(screen.queryByLabelText(/Current Password/i)).not.toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: /Change Password/i })).toBeInTheDocument();
    });

    it('should cancel password change and clear fields', async () => {
      const user = userEvent.setup();
      renderWithRouter();

      await user.click(screen.getByRole('button', { name: /Change Password/i }));

      await user.type(screen.getByLabelText(/Current Password/i), 'oldpass123');

      // Click Cancel button (within password form)
      const cancelButtons = screen.getAllByRole('button', { name: /^Cancel$/i });
      const passwordCancelBtn = cancelButtons[cancelButtons.length - 1]; // Last Cancel button
      await user.click(passwordCancelBtn);

      expect(screen.queryByLabelText(/Current Password/i)).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Change Password/i })).toBeInTheDocument();
    });
  });

  describe('Data Export Section (GDPR/CCPA)', () => {
    it('should render data export section', () => {
      renderWithRouter();

      expect(screen.getByRole('heading', { name: /Export Your Data/i })).toBeInTheDocument();
      expect(screen.getByText(/GDPR\/CCPA compliance/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Download My Data/i })).toBeInTheDocument();
    });

    it('should show what is included in the export', () => {
      renderWithRouter();

      expect(screen.getByText(/What's included in the export/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Profile information/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/Account settings and preferences/i)).toBeInTheDocument();
      expect(screen.getByText(/Usage history and statistics/i)).toBeInTheDocument();
      expect(screen.getByText(/Subscription and billing information/i)).toBeInTheDocument();
    });

    it('should call data export API when button is clicked', async () => {
      const user = userEvent.setup();
      const mockBlob = new Blob(['{"user": "data"}'], { type: 'application/json' });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: {
          get: (header) => header === 'Content-Disposition' ? 'attachment; filename="export-2024-11-04.json"' : null
        },
        blob: () => Promise.resolve(mockBlob)
      });

      localStorage.setItem('token', 'test-token');

      // Render FIRST, before mocking DOM APIs
      renderWithRouter();

      // NOW mock DOM APIs for file download (after React has finished rendering)
      const mockCreateObjectURL = vi.fn(() => 'blob:mock-url');
      const mockRevokeObjectURL = vi.fn();
      global.URL.createObjectURL = mockCreateObjectURL;
      global.URL.revokeObjectURL = mockRevokeObjectURL;

      const mockClick = vi.fn();
      const mockAppendChild = vi.fn();
      const mockRemoveChild = vi.fn();
      document.createElement = vi.fn((tag) => {
        if (tag === 'a') {
          return {
            href: '',
            download: '',
            click: mockClick,
          };
        }
        // Call original createElement for other elements
        return originalCreateElement.call(document, tag);
      });
      document.body.appendChild = mockAppendChild;
      document.body.removeChild = mockRemoveChild;

      await user.click(screen.getByRole('button', { name: /Download My Data/i }));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/user/data-export'),
          expect.objectContaining({
            method: 'GET',
            headers: expect.objectContaining({
              'Authorization': 'Bearer test-token'
            })
          })
        );
      });
    });

    it('should download file with correct filename from Content-Disposition', async () => {
      const user = userEvent.setup();
      const mockBlob = new Blob(['{"user": "data"}'], { type: 'application/json' });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: {
          get: (header) => header === 'Content-Disposition' ? 'attachment; filename="export-2024-11-04.json"' : null
        },
        blob: () => Promise.resolve(mockBlob)
      });

      localStorage.setItem('token', 'test-token');

      // Render FIRST, before mocking DOM APIs
      renderWithRouter();

      // NOW mock DOM APIs for file download (after React has finished rendering)
      let downloadedFilename = '';
      const mockClick = vi.fn();
      document.createElement = vi.fn((tag) => {
        if (tag === 'a') {
          const element = {
            href: '',
            download: '',
            click: mockClick,
          };
          Object.defineProperty(element, 'download', {
            set: (val) => { downloadedFilename = val; },
            get: () => downloadedFilename,
          });
          return element;
        }
        // Call original createElement for other elements
        return originalCreateElement.call(document, tag);
      });
      document.body.appendChild = vi.fn();
      document.body.removeChild = vi.fn();
      global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
      global.URL.revokeObjectURL = vi.fn();

      await user.click(screen.getByRole('button', { name: /Download My Data/i }));

      await waitFor(() => {
        expect(downloadedFilename).toBe('export-2024-11-04.json');
      });
    });

    it('should show success toast on successful download', async () => {
      const user = userEvent.setup();
      const mockBlob = new Blob(['{"user": "data"}'], { type: 'application/json' });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: {
          get: () => null
        },
        blob: () => Promise.resolve(mockBlob)
      });

      localStorage.setItem('token', 'test-token');

      // Render FIRST, before mocking DOM APIs
      renderWithRouter();

      // NOW mock DOM APIs for file download (after React has finished rendering)
      document.createElement = vi.fn(() => ({ href: '', download: '', click: vi.fn() }));
      document.body.appendChild = vi.fn();
      document.body.removeChild = vi.fn();
      global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
      global.URL.revokeObjectURL = vi.fn();

      await user.click(screen.getByRole('button', { name: /Download My Data/i }));

      await waitFor(() => {
        expect(toastCompact).toHaveBeenCalledWith('Data export downloaded successfully', 'success');
      });
    });

    it('should show error toast on export failure', async () => {
      const user = userEvent.setup();

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Export failed' })
      });

      localStorage.setItem('token', 'test-token');

      renderWithRouter();

      await user.click(screen.getByRole('button', { name: /Download My Data/i }));

      await waitFor(() => {
        expect(toastCompact).toHaveBeenCalledWith('Export failed', 'error');
      });
    });

    it('should handle network errors gracefully', async () => {
      const user = userEvent.setup();

      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      localStorage.setItem('token', 'test-token');

      renderWithRouter();

      await user.click(screen.getByRole('button', { name: /Download My Data/i }));

      await waitFor(() => {
        expect(toastCompact).toHaveBeenCalledWith('Network error', 'error');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      renderWithRouter();

      const profileHeading = screen.getByRole('heading', { name: /Profile Information/i });
      expect(profileHeading).toBeInTheDocument();
      expect(profileHeading.tagName).toBe('H2');

      const exportHeading = screen.getByRole('heading', { name: /Export Your Data/i });
      expect(exportHeading).toBeInTheDocument();
      expect(exportHeading.tagName).toBe('H2');
    });

    it('should have proper labels for all inputs', () => {
      renderWithRouter();

      expect(screen.getByLabelText(/First Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Last Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    });

    it('should hide decorative icons from screen readers', () => {
      renderWithRouter();

      const icons = document.querySelectorAll('[aria-hidden="true"]');
      expect(icons.length).toBeGreaterThan(0);
    });
  });
});
