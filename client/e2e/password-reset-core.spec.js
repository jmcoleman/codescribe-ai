/**
 * Core E2E tests for password reset flow
 * Tests the critical happy paths and realistic error scenarios
 *
 * Run with: npx playwright test e2e/password-reset-core.spec.js
 */

import { test, expect } from '@playwright/test';

test.describe('Password Reset - Core Flow', () => {
  const testEmail = 'test@example.com';
  const newPassword = 'NewPassword123';
  const resetToken = 'mock-reset-token-32-characters-long-abc123def456';

  test.describe('Forgot Password Request', () => {
    test('should successfully request password reset', async ({ page }) => {
      // Mock successful API response
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

      // Open forgot password modal
      await page.getByRole('button', { name: /sign in/i }).click();
      await page.getByText(/forgot password/i).click();

      // Verify modal opened
      await expect(page.getByText('Reset Password')).toBeVisible();

      // Fill and submit form
      await page.getByLabel(/email address/i).fill(testEmail);
      await page.getByRole('button', { name: /send reset link/i }).click();

      // Verify success message
      await expect(
        page.getByText(/password reset link has been sent/i)
      ).toBeVisible({ timeout: 5000 });
    });

    test('should validate required email field', async ({ page }) => {
      await page.goto('/');
      await page.getByRole('button', { name: /sign in/i }).click();
      await page.getByText(/forgot password/i).click();

      // Submit without email
      await page.getByRole('button', { name: /send reset link/i }).click();

      // Should show validation error
      await expect(page.getByText(/email is required/i)).toBeVisible();
    });

    test('should show loading state during submission', async ({ page }) => {
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

      await page.goto('/');
      await page.getByRole('button', { name: /sign in/i }).click();
      await page.getByText(/forgot password/i).click();

      await page.getByLabel(/email address/i).fill(testEmail);
      await page.getByRole('button', { name: /send reset link/i }).click();

      // Button should show loading state
      await expect(page.getByRole('button', { name: /sending/i })).toBeVisible();
    });
  });

  test.describe('Password Reset Confirmation', () => {
    test('should successfully reset password with valid token', async ({ page }) => {
      // Mock successful reset
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

      // Verify page loaded
      await expect(page.getByText('Reset Your Password')).toBeVisible();

      // Fill in passwords
      await page.getByLabel(/^new password$/i).fill(newPassword);
      await page.getByLabel(/confirm new password/i).fill(newPassword);

      // Submit
      await page.getByRole('button', { name: /^reset password$/i }).click();

      // Verify success
      await expect(page.getByText(/password reset successfully/i)).toBeVisible();
      await expect(page.getByText(/redirecting to home page/i)).toBeVisible();

      // Should redirect to home
      await page.waitForURL('/', { timeout: 3000 });
    });

    test('should validate password mismatch', async ({ page }) => {
      await page.goto(`/reset-password?token=${resetToken}`);

      // Enter mismatched passwords
      await page.getByLabel(/^new password$/i).fill('Password123');
      await page.getByLabel(/confirm new password/i).fill('Different456');
      await page.getByRole('button', { name: /^reset password$/i }).click();

      // Should show error
      await expect(page.getByText(/passwords do not match/i)).toBeVisible();
    });

    test('should validate password length', async ({ page }) => {
      await page.goto(`/reset-password?token=${resetToken}`);

      // Enter short password
      await page.getByLabel(/^new password$/i).fill('short');
      await page.getByLabel(/confirm new password/i).fill('short');
      await page.getByRole('button', { name: /^reset password$/i }).click();

      // Should show length error
      await expect(page.getByText(/must be at least 8 characters/i)).toBeVisible();
    });

    test('should show error for missing token', async ({ page }) => {
      await page.goto('/reset-password');

      // Should show error
      await expect(page.getByText(/invalid or missing reset token/i)).toBeVisible();

      // Submit button should be disabled
      await expect(page.getByRole('button', { name: /^reset password$/i })).toBeDisabled();
    });

    test('should handle expired token', async ({ page }) => {
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

      // Should show error
      await expect(page.getByText(/invalid or expired reset token/i)).toBeVisible();
    });

    test('should toggle password visibility', async ({ page }) => {
      await page.goto(`/reset-password?token=${resetToken}`);

      const passwordInput = page.getByLabel(/^new password$/i);

      // Initially password type
      await expect(passwordInput).toHaveAttribute('type', 'password');

      // Click show password
      await page.getByLabel(/show password/i).first().click();
      await expect(passwordInput).toHaveAttribute('type', 'text');

      // Click hide password
      await page.getByLabel(/hide password/i).first().click();
      await expect(passwordInput).toHaveAttribute('type', 'password');
    });

    test('should auto-focus password input', async ({ page }) => {
      await page.goto(`/reset-password?token=${resetToken}`);

      // Password input should be focused
      await expect(page.getByLabel(/^new password$/i)).toBeFocused();
    });
  });

  test.describe('Complete Flow Integration', () => {
    test('should complete full password reset flow', async ({ page }) => {
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

      // Step 2: Reset password with token
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

      await expect(page.getByText(/password reset successfully/i)).toBeVisible();

      // Step 3: Verify redirect
      await page.waitForURL('/', { timeout: 3000 });
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper ARIA attributes on reset page', async ({ page }) => {
      await page.goto(`/reset-password?token=${resetToken}`);

      // Check form elements have labels
      await expect(page.getByLabel(/^new password$/i)).toBeVisible();
      await expect(page.getByLabel(/confirm new password/i)).toBeVisible();

      // Trigger error to verify alert role
      await page.getByLabel(/^new password$/i).fill('abc');
      await page.getByLabel(/confirm new password/i).fill('abc');
      await page.getByRole('button', { name: /^reset password$/i }).click();

      // Error alert should have role="alert"
      await expect(page.locator('[role="alert"]')).toBeVisible({ timeout: 3000 });
    });

    test('should support keyboard navigation on reset page', async ({ page }) => {
      await page.goto(`/reset-password?token=${resetToken}`);

      // Password input is auto-focused
      await expect(page.getByLabel(/^new password$/i)).toBeFocused();

      // Tab to show password button
      await page.keyboard.press('Tab');
      await expect(page.getByLabel(/show password/i).first()).toBeFocused();

      // Tab to confirm password
      await page.keyboard.press('Tab');
      await expect(page.getByLabel(/confirm new password/i)).toBeFocused();
    });

    test('should close forgot password modal on Escape', async ({ page }) => {
      await page.goto('/');
      await page.getByRole('button', { name: /sign in/i }).click();
      await page.getByText(/forgot password/i).click();

      // Modal should be open
      await expect(page.getByRole('dialog')).toBeVisible();

      // Press Escape
      await page.keyboard.press('Escape');

      // Modal should close
      await expect(page.getByRole('dialog')).not.toBeVisible();
    });
  });
});
