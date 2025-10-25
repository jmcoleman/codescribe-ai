/**
 * E2E tests for complete password reset flow
 * Tests forgot password request → email → reset password confirmation
 *
 * Run with: npx playwright test e2e/password-reset.spec.js
 */

import { test, expect } from '@playwright/test';

test.describe('Password Reset Flow', () => {
  const testEmail = 'test@example.com';
  const newPassword = 'NewPassword123';
  const resetToken = 'mock-reset-token-32-characters-long-abc123def456';

  test.describe('Forgot Password - Request Reset', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('header')).toContainText('CodeScribe AI');
    });

    test('should successfully request password reset for valid email', async ({ page }) => {
      // Mock successful forgot password response
      await page.route('**/api/auth/forgot-password', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'If an account exists with this email, a password reset link has been sent.',
          }),
        });
      });

      // Open login modal, then switch to forgot password
      await page.getByRole('button', { name: /sign in/i }).click();
      await page.getByText(/forgot password/i).click();

      // Verify forgot password modal is open
      await expect(page.getByText('Reset Password')).toBeVisible();

      // Fill in email
      await page.getByLabel(/email address/i).fill(testEmail);

      // Submit form
      await page.getByRole('button', { name: /send reset link/i }).click();

      // Should show success message
      await expect(
        page.getByText(/if an account exists with this email, a password reset link has been sent/i)
      ).toBeVisible({ timeout: 5000 });
    });

    test('should validate email format', async ({ page }) => {
      await page.getByRole('button', { name: /sign in/i }).click();
      await page.getByText(/forgot password/i).click();

      const emailInput = page.getByLabel(/email address/i);

      // Enter invalid email (HTML5 validation will catch most invalid formats)
      // Use a malformed email that still passes browser's basic check
      await emailInput.fill('test');

      // Check that HTML5 validation is active (has type="email")
      await expect(emailInput).toHaveAttribute('type', 'email');
    });

    test('should validate required email field', async ({ page }) => {
      await page.getByRole('button', { name: /sign in/i }).click();
      await page.getByText(/forgot password/i).click();

      // Submit without email
      await page.getByRole('button', { name: /send reset link/i }).click();

      // Should show error
      await expect(page.getByText(/email is required/i)).toBeVisible();
    });

    test('should handle server errors gracefully', async ({ page }) => {
      // Mock server error
      await page.route('**/api/auth/forgot-password', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Failed to send reset email',
          }),
        });
      });

      await page.getByRole('button', { name: /sign in/i }).click();
      await page.getByText(/forgot password/i).click();

      await page.getByLabel(/email address/i).fill(testEmail);
      await page.getByRole('button', { name: /send reset link/i }).click();

      // Should show error message (from server or default)
      await expect(page.getByText(/failed to send reset email|an unexpected error occurred/i)).toBeVisible();
    });

    test('should allow multiple reset requests for same email', async ({ page }) => {
      // Mock successful response for both requests
      let requestCount = 0;
      await page.route('**/api/auth/forgot-password', async (route) => {
        requestCount++;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'If an account exists with this email, a password reset link has been sent.',
          }),
        });
      });

      await page.getByRole('button', { name: /sign in/i }).click();
      await page.getByText(/forgot password/i).click();

      // First request
      await page.getByLabel(/email address/i).fill(testEmail);
      await page.getByRole('button', { name: /send reset link/i }).click();
      await expect(page.getByText(/password reset link has been sent/i)).toBeVisible();

      // Modal stays open with success message, form is hidden
      // Wait a bit for state to settle
      await page.waitForTimeout(500);

      // Close and reopen modal for second request
      await page.getByLabel(/close/i).click();
      await page.getByRole('button', { name: /sign in/i }).click();
      await page.getByText(/forgot password/i).click();

      // Second request
      await page.getByLabel(/email address/i).fill(testEmail);
      await page.getByRole('button', { name: /send reset link/i }).click();
      await expect(page.getByText(/password reset link has been sent/i)).toBeVisible();

      // Verify both requests were made
      expect(requestCount).toBe(2);
    });

    test('should show loading state while submitting', async ({ page }) => {
      // Mock delayed response
      await page.route('**/api/auth/forgot-password', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'If an account exists with this email, a password reset link has been sent.',
          }),
        });
      });

      await page.getByRole('button', { name: /sign in/i }).click();
      await page.getByText(/forgot password/i).click();

      await page.getByLabel(/email address/i).fill(testEmail);
      await page.getByRole('button', { name: /send reset link/i }).click();

      // Button should show loading state
      await expect(page.getByRole('button', { name: /sending/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /sending/i })).toBeDisabled();
    });
  });

  test.describe('Password Reset Confirmation - Set New Password', () => {
    test('should successfully reset password with valid token', async ({ page }) => {
      // Mock successful reset password response
      await page.route('**/api/auth/reset-password', async (route) => {
        const request = route.request();
        const postData = request.postDataJSON();

        // Verify token and password are sent
        expect(postData.token).toBe(resetToken);
        expect(postData.password).toBe(newPassword);

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Password reset successfully. You can now log in with your new password.',
          }),
        });
      });

      // Navigate to reset password page with token
      await page.goto(`/reset-password?token=${resetToken}`);

      // Verify page loads
      await expect(page.getByText('Reset Your Password')).toBeVisible();
      await expect(page.getByText('Enter your new password below')).toBeVisible();

      // Fill in new password
      await page.getByLabel(/^new password$/i).fill(newPassword);
      await page.getByLabel(/confirm new password/i).fill(newPassword);

      // Submit form
      await page.getByRole('button', { name: /^reset password$/i }).click();

      // Should show success message
      await expect(page.getByText(/password reset successfully/i)).toBeVisible();
      await expect(page.getByText(/redirecting to home page/i)).toBeVisible();

      // Wait for redirect (2 second timeout)
      const navigationPromise = page.waitForURL('/', { timeout: 3000 });
      await navigationPromise;

      // Should be on home page
      expect(page.url()).toContain('/');
    });

    test('should validate password length requirement', async ({ page }) => {
      await page.goto(`/reset-password?token=${resetToken}`);

      // Enter short password
      await page.getByLabel(/^new password$/i).fill('short');
      await page.getByLabel(/confirm new password/i).fill('short');
      await page.getByRole('button', { name: /^reset password$/i }).click();

      // Should show validation error (check for the actual text from ResetPassword component)
      await expect(page.getByText(/password must be at least 8 characters/i)).toBeVisible();
    });

    test('should validate password confirmation match', async ({ page }) => {
      await page.goto(`/reset-password?token=${resetToken}`);

      // Enter mismatched passwords
      await page.getByLabel(/^new password$/i).fill('Password123');
      await page.getByLabel(/confirm new password/i).fill('DifferentPass456');
      await page.getByRole('button', { name: /^reset password$/i }).click();

      // Should show mismatch error
      await expect(page.getByText(/passwords do not match/i)).toBeVisible();
    });

    test('should validate required password fields', async ({ page }) => {
      await page.goto(`/reset-password?token=${resetToken}`);

      // Try to submit with empty password (browser validation will prevent submit)
      const submitButton = page.getByRole('button', { name: /^reset password$/i });
      const passwordInput = page.getByLabel(/^new password$/i);

      // Check that password field has required attribute
      await expect(passwordInput).toHaveAttribute('required');

      // Verify button is enabled (form relies on HTML5 validation)
      await expect(submitButton).toBeEnabled();
    });

    test('should show error for missing or invalid token', async ({ page }) => {
      // Navigate without token
      await page.goto('/reset-password');

      // Should show error message
      await expect(
        page.getByText(/invalid or missing reset token/i)
      ).toBeVisible();

      // Submit button should be disabled
      await expect(page.getByRole('button', { name: /^reset password$/i })).toBeDisabled();
    });

    test('should handle expired token error', async ({ page }) => {
      // Mock expired token response
      await page.route('**/api/auth/reset-password', async (route) => {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Invalid or expired reset token',
          }),
        });
      });

      await page.goto(`/reset-password?token=expired-token`);

      await page.getByLabel(/^new password$/i).fill(newPassword);
      await page.getByLabel(/confirm new password/i).fill(newPassword);
      await page.getByRole('button', { name: /^reset password$/i }).click();

      // Should show error message
      await expect(page.getByText(/invalid or expired reset token/i)).toBeVisible();
    });

    test('should handle server errors gracefully', async ({ page }) => {
      // Mock server error
      await page.route('**/api/auth/reset-password', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Failed to reset password',
          }),
        });
      });

      await page.goto(`/reset-password?token=${resetToken}`);

      await page.getByLabel(/^new password$/i).fill(newPassword);
      await page.getByLabel(/confirm new password/i).fill(newPassword);
      await page.getByRole('button', { name: /^reset password$/i }).click();

      // Should show error message
      await expect(page.getByText(/failed to reset password/i)).toBeVisible();
    });

    test('should toggle password visibility', async ({ page }) => {
      await page.goto(`/reset-password?token=${resetToken}`);

      const passwordInput = page.getByLabel(/^new password$/i);
      const confirmInput = page.getByLabel(/confirm new password/i);

      // Initially password type
      await expect(passwordInput).toHaveAttribute('type', 'password');
      await expect(confirmInput).toHaveAttribute('type', 'password');

      // Click show password button for new password
      await page.getByLabel(/show password/i).first().click();
      await expect(passwordInput).toHaveAttribute('type', 'text');

      // Click hide password button
      await page.getByLabel(/hide password/i).first().click();
      await expect(passwordInput).toHaveAttribute('type', 'password');

      // Test confirm password visibility toggle
      await page.getByLabel(/show password/i).last().click();
      await expect(confirmInput).toHaveAttribute('type', 'text');
    });

    test('should auto-focus password input on page load', async ({ page }) => {
      await page.goto(`/reset-password?token=${resetToken}`);

      // Password input should be focused
      await expect(page.getByLabel(/^new password$/i)).toBeFocused();
    });

    test('should navigate back to home page', async ({ page }) => {
      await page.goto(`/reset-password?token=${resetToken}`);

      // Click back to home link
      await page.getByText(/back to home/i).click();

      // Should navigate to home page
      const navigationPromise = page.waitForURL('/', { timeout: 3000 });
      await navigationPromise;
      expect(page.url()).toContain('/');
    });

    test('should disable form after successful reset', async ({ page }) => {
      // Mock successful response
      await page.route('**/api/auth/reset-password', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Password reset successfully. You can now log in with your new password.',
          }),
        });
      });

      await page.goto(`/reset-password?token=${resetToken}`);

      await page.getByLabel(/^new password$/i).fill(newPassword);
      await page.getByLabel(/confirm new password/i).fill(newPassword);
      await page.getByRole('button', { name: /^reset password$/i }).click();

      // Wait for success message
      await expect(page.getByText(/password reset successfully/i)).toBeVisible();

      // Form should be hidden
      await expect(page.getByLabel(/^new password$/i)).not.toBeVisible();
      await expect(page.getByRole('button', { name: /^reset password$/i })).not.toBeVisible();
    });
  });

  test.describe('Complete Flow - Forgot Password to Reset', () => {
    test('should complete full password reset flow', async ({ page }) => {
      let capturedResetToken = '';

      // Step 1: Request password reset
      await page.route('**/api/auth/forgot-password', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'If an account exists with this email, a password reset link has been sent.',
          }),
        });
      });

      await page.goto('/');
      await page.getByRole('button', { name: /sign in/i }).click();
      await page.getByText(/forgot password/i).click();
      await page.getByLabel(/email address/i).fill(testEmail);
      await page.getByRole('button', { name: /send reset link/i }).click();

      await expect(page.getByText(/password reset link has been sent/i)).toBeVisible();

      // Step 2: Simulate clicking email link (navigate to reset page)
      capturedResetToken = resetToken; // In real scenario, this comes from email

      // Step 3: Reset password
      await page.route('**/api/auth/reset-password', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Password reset successfully. You can now log in with your new password.',
          }),
        });
      });

      await page.goto(`/reset-password?token=${capturedResetToken}`);
      await page.getByLabel(/^new password$/i).fill(newPassword);
      await page.getByLabel(/confirm new password/i).fill(newPassword);
      await page.getByRole('button', { name: /^reset password$/i }).click();

      await expect(page.getByText(/password reset successfully/i)).toBeVisible();

      // Step 4: Verify redirect to home
      await page.waitForURL('/', { timeout: 3000 });
      expect(page.url()).toContain('/');

      // Step 5: Login with new password
      await page.route('**/api/auth/login', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            token: 'new-jwt-token',
            user: {
              id: 1,
              email: testEmail,
              tier: 'free',
            },
          }),
        });
      });

      await page.getByRole('button', { name: /sign in/i }).click();
      await page.getByLabel(/email address/i).fill(testEmail);
      await page.getByLabel(/^password$/i).fill(newPassword);
      // Click the submit button within the modal (not the header button)
      await page.getByRole('dialog').getByRole('button', { name: /^sign in$/i }).click();

      // Should successfully log in
      await expect(page.getByRole('dialog')).not.toBeVisible();
      await expect(page.getByText(/test/i)).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should support keyboard navigation on reset page', async ({ page }) => {
      await page.goto(`/reset-password?token=${resetToken}`);

      // Password input should already be focused (auto-focus)
      await expect(page.getByLabel(/^new password$/i)).toBeFocused();

      await page.keyboard.press('Tab'); // Show password button
      await expect(page.getByLabel(/show password/i).first()).toBeFocused();

      await page.keyboard.press('Tab'); // Confirm password input
      await expect(page.getByLabel(/confirm new password/i)).toBeFocused();
    });

    test('should have proper ARIA labels on reset page', async ({ page }) => {
      await page.goto(`/reset-password?token=${resetToken}`);

      // Check that password inputs have proper labels
      await expect(page.getByLabel(/^new password$/i)).toBeVisible();
      await expect(page.getByLabel(/confirm new password/i)).toBeVisible();

      // Trigger an error to verify error alerts have role="alert"
      await page.getByLabel(/^new password$/i).fill('Ab1');  // Too short (< 8 chars)
      await page.getByLabel(/confirm new password/i).fill('Ab1');
      await page.getByRole('button', { name: /^reset password$/i }).click();

      // Wait for and verify error alert appears
      const alert = page.locator('[role="alert"]');
      await expect(alert).toBeVisible({ timeout: 3000 });
    });

    test('should announce success message to screen readers', async ({ page }) => {
      await page.route('**/api/auth/reset-password', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Password reset successfully.',
          }),
        });
      });

      await page.goto(`/reset-password?token=${resetToken}`);

      await page.getByLabel(/^new password$/i).fill(newPassword);
      await page.getByLabel(/confirm new password/i).fill(newPassword);
      await page.getByRole('button', { name: /^reset password$/i }).click();

      // Success message should have role="alert"
      const successAlert = page.locator('[role="alert"]');
      await expect(successAlert).toBeVisible();
      await expect(successAlert).toContainText(/password reset successfully/i);
    });
  });
});
