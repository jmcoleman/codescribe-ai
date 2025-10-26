/**
 * E2E tests for authentication flow
 * Tests login, signup, logout, and forgot password functionality
 *
 * Run with: npx playwright test e2e/auth.spec.js
 */

import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');

    // Wait for app to load
    await expect(page.locator('header')).toContainText('CodeScribe AI');
  });

  test.describe('Sign In Modal', () => {
    test('should open login modal when Sign In button is clicked', async ({ page }) => {
      // Click Sign In button in header
      const signInButton = page.getByRole('button', { name: /sign in/i }).first();
      await expect(signInButton).toBeVisible();
      await signInButton.click();

      // Verify modal opens
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
      await expect(page.getByLabel(/email address/i)).toBeVisible();
      await expect(page.getByLabel(/^password$/i)).toBeVisible();
    });

    test('should validate required fields', async ({ page }) => {
      // Open login modal
      await page.getByRole('button', { name: /sign in/i }).first().click();
      await expect(page.getByRole('dialog')).toBeVisible();

      // Click submit button inside modal (not header button)
      await page.getByRole('dialog').getByRole('button', { name: /sign in/i }).click();

      // Should show error
      await expect(page.getByText(/email is required/i)).toBeVisible();
    });

    test('should validate email format', async ({ page }) => {
      // Open login modal
      await page.getByRole('button', { name: /sign in/i }).first().click();
      await expect(page.getByRole('dialog')).toBeVisible();

      // Enter invalid email
      await page.getByLabel(/email address/i).fill('invalid-email');
      await page.getByLabel(/^password$/i).fill('password123');
      await page.getByRole('dialog').getByRole('button', { name: /sign in/i }).click();

      // Should show format error
      await expect(page.getByText(/please enter a valid email/i)).toBeVisible();
    });

    test('should close modal when close button is clicked', async ({ page }) => {
      // Open modal
      await page.getByRole('button', { name: /sign in/i }).first().click();
      await expect(page.getByRole('dialog')).toBeVisible();

      // Click close button
      await page.getByLabel(/close login modal/i).click();

      // Modal should be closed
      await expect(page.getByRole('dialog')).not.toBeVisible();
    });

    test('should close modal when Escape is pressed', async ({ page }) => {
      // Open modal
      await page.getByRole('button', { name: /sign in/i }).first().click();
      await expect(page.getByRole('dialog')).toBeVisible();

      // Press Escape
      await page.keyboard.press('Escape');

      // Modal should be closed
      await expect(page.getByRole('dialog')).not.toBeVisible();
    });

    test('should close modal when backdrop is clicked', async ({ page }) => {
      // Open modal
      await page.getByRole('button', { name: /sign in/i }).first().click();
      await expect(page.getByRole('dialog')).toBeVisible();

      // Wait for click-outside to be enabled (200ms delay)
      await page.waitForTimeout(250);

      // Click backdrop (outside modal content)
      const backdrop = page.locator('[role="dialog"]').locator('..');
      await backdrop.click({ position: { x: 10, y: 10 } });

      // Modal should be closed
      await expect(page.getByRole('dialog')).not.toBeVisible();
    });

    test('should switch to signup modal', async ({ page }) => {
      // Open login modal
      await page.getByRole('button', { name: /sign in/i }).first().click();
      await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();

      // Click sign up link
      await page.getByText(/sign up/i).click();

      // Should show signup modal
      await expect(page.getByRole('heading', { name: /create account/i })).toBeVisible();
      await expect(page.getByLabel(/confirm password/i)).toBeVisible();
    });

    test('should switch to forgot password modal', async ({ page }) => {
      // Open login modal
      await page.getByRole('button', { name: /sign in/i }).first().click();
      await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();

      // Click forgot password link
      await page.getByText(/forgot password/i).click();

      // Should show forgot password modal
      await expect(page.getByRole('heading', { name: /reset password/i })).toBeVisible();
      await expect(page.getByText(/enter your email address/i)).toBeVisible();
    });
  });

  test.describe('Sign Up Modal', () => {
    test('should open signup modal from login modal', async ({ page }) => {
      // Open login modal and switch to signup
      await page.getByRole('button', { name: /sign in/i }).first().click();
      await page.getByText(/sign up/i).click();

      // Verify signup modal
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByRole('heading', { name: /create account/i })).toBeVisible();
      await expect(page.getByLabel(/email address/i)).toBeVisible();
      await expect(page.getByLabel(/^password$/i)).toBeVisible();
      await expect(page.getByLabel(/confirm password/i)).toBeVisible();
    });

    test('should validate password requirements', async ({ page }) => {
      // Open signup modal
      await page.getByRole('button', { name: /sign in/i }).first().click();
      await page.getByText(/sign up/i).click();

      // Enter short password
      await page.getByLabel(/email address/i).fill('test@example.com');
      await page.getByLabel(/^password$/i).fill('short');
      await page.getByRole('dialog').getByRole('button', { name: /create account/i }).click();

      // Should show password length error
      await expect(page.getByText(/password must be at least 8 characters/i)).toBeVisible();
    });

    test('should show password strength indicator', async ({ page }) => {
      // Open signup modal
      await page.getByRole('button', { name: /sign in/i }).first().click();
      await page.getByText(/sign up/i).click();

      // Type password
      await page.getByLabel(/^password$/i).fill('Test');

      // Should show strength indicator
      await expect(page.getByText(/at least 8 characters/i)).toBeVisible();
      await expect(page.getByText(/one uppercase letter/i)).toBeVisible();
      await expect(page.getByText(/one lowercase letter/i)).toBeVisible();
      await expect(page.getByText(/one number/i)).toBeVisible();
    });

    test('should validate password confirmation', async ({ page }) => {
      // Open signup modal
      await page.getByRole('button', { name: /sign in/i }).first().click();
      await page.getByText(/sign up/i).click();

      // Enter mismatched passwords
      await page.getByLabel(/email address/i).fill('test@example.com');
      await page.getByLabel(/^password$/i).fill('Password123');
      await page.getByLabel(/confirm password/i).fill('Password456');
      await page.getByRole('dialog').getByRole('button', { name: /create account/i }).click();

      // Should show mismatch error
      await expect(page.getByText(/passwords do not match/i)).toBeVisible();
    });

    test('should switch back to login modal', async ({ page }) => {
      // Open signup modal
      await page.getByRole('button', { name: /sign in/i }).first().click();
      await page.getByText(/sign up/i).click();
      await expect(page.getByRole('heading', { name: /create account/i })).toBeVisible();

      // Click sign in link
      await page.getByText(/^sign in$/i).click();

      // Should show login modal
      await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
    });
  });

  test.describe('Forgot Password Modal', () => {
    test('should open forgot password modal from login modal', async ({ page }) => {
      // Open login modal and switch to forgot password
      await page.getByRole('button', { name: /sign in/i }).first().click();
      await page.getByText(/forgot password/i).click();

      // Verify forgot password modal
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByRole('heading', { name: /reset password/i })).toBeVisible();
      await expect(page.getByText(/enter your email address/i)).toBeVisible();
    });

    test('should validate email field', async ({ page }) => {
      // Open forgot password modal
      await page.getByRole('button', { name: /sign in/i }).first().click();
      await page.getByText(/forgot password/i).click();

      // Submit without email
      await page.getByRole('button', { name: /send reset link/i }).click();

      // Should show error
      await expect(page.getByText(/email is required/i)).toBeVisible();
    });

    test('should switch back to login modal', async ({ page }) => {
      // Open forgot password modal
      await page.getByRole('button', { name: /sign in/i }).first().click();
      await page.getByText(/forgot password/i).click();
      await expect(page.getByRole('heading', { name: /reset password/i })).toBeVisible();

      // Click back to sign in
      await page.getByText(/back to sign in/i).click();

      // Should show login modal
      await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
    });
  });

  test.describe('Login Flow (with mock server)', () => {
    test('should successfully login with valid credentials', async ({ page }) => {
      // Mock successful login response
      await page.route('**/api/auth/login', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            token: 'mock-jwt-token',
            user: {
              id: 1,
              email: 'test@example.com',
              tier: 'free',
            },
          }),
        });
      });

      // Open login modal
      await page.getByRole('button', { name: /sign in/i }).first().click();

      // Fill in credentials
      await page.getByLabel(/email address/i).fill('test@example.com');
      await page.getByLabel(/^password$/i).fill('password123');

      // Submit form
      await page.getByRole('button', { name: /^sign in$/i }).click();

      // Modal should close
      await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });

      // Should show user email in header
      await expect(page.getByText(/test/i)).toBeVisible();
    });

    test('should show error for invalid credentials', async ({ page }) => {
      // Mock failed login response
      await page.route('**/api/auth/login', async (route) => {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Invalid email or password',
          }),
        });
      });

      // Open login modal
      await page.getByRole('button', { name: /sign in/i }).first().click();

      // Fill in credentials
      await page.getByLabel(/email address/i).fill('wrong@example.com');
      await page.getByLabel(/^password$/i).fill('wrongpassword');

      // Submit form
      await page.getByRole('button', { name: /^sign in$/i }).click();

      // Should show error message
      await expect(page.getByText(/invalid email or password/i)).toBeVisible();

      // Modal should remain open
      await expect(page.getByRole('dialog')).toBeVisible();
    });
  });

  test.describe('Signup Flow (with mock server)', () => {
    test('should successfully signup with valid data', async ({ page }) => {
      // Mock successful signup response
      await page.route('**/api/auth/signup', async (route) => {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            token: 'mock-jwt-token',
            user: {
              id: 2,
              email: 'newuser@example.com',
              tier: 'free',
            },
          }),
        });
      });

      // Open signup modal
      await page.getByRole('button', { name: /sign in/i }).first().click();
      await page.getByText(/sign up/i).click();

      // Fill in form
      await page.getByLabel(/email address/i).fill('newuser@example.com');
      await page.getByLabel(/^password$/i).fill('StrongPass123');
      await page.getByLabel(/confirm password/i).fill('StrongPass123');

      // Submit form
      await page.getByRole('dialog').getByRole('button', { name: /create account/i }).click();

      // Modal should close
      await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });

      // Should show user email in header
      await expect(page.getByText(/newuser/i)).toBeVisible();
    });

    test('should show error when email already exists', async ({ page }) => {
      // Mock duplicate email response
      await page.route('**/api/auth/signup', async (route) => {
        await route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'User with this email already exists',
          }),
        });
      });

      // Open signup modal
      await page.getByRole('button', { name: /sign in/i }).first().click();
      await page.getByText(/sign up/i).click();

      // Fill in form
      await page.getByLabel(/email address/i).fill('existing@example.com');
      await page.getByLabel(/^password$/i).fill('Password123');
      await page.getByLabel(/confirm password/i).fill('Password123');

      // Submit form
      await page.getByRole('dialog').getByRole('button', { name: /create account/i }).click();

      // Should show error
      await expect(page.getByText(/user with this email already exists/i)).toBeVisible();

      // Modal should remain open
      await expect(page.getByRole('dialog')).toBeVisible();
    });
  });

  test.describe('Logout Flow (with mock server)', () => {
    test('should logout successfully', async ({ page }) => {
      // Mock login
      await page.route('**/api/auth/login', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            token: 'mock-jwt-token',
            user: { id: 1, email: 'test@example.com', tier: 'free' },
          }),
        });
      });

      // Mock logout
      await page.route('**/api/auth/logout', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Logged out successfully',
          }),
        });
      });

      // Login first
      await page.getByRole('button', { name: /sign in/i }).first().click();
      await page.getByLabel(/email address/i).fill('test@example.com');
      await page.getByLabel(/^password$/i).fill('password123');
      await page.getByRole('button', { name: /^sign in$/i }).click();

      // Wait for modal to close and user to be logged in
      await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });
      await expect(page.getByText(/test/i)).toBeVisible();

      // Click logout button
      await page.getByLabel(/sign out/i).click();

      // Should show Sign In button again
      await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should support keyboard navigation in login modal', async ({ page }) => {
      // Open login modal
      await page.getByRole('button', { name: /sign in/i }).first().click();

      // Tab through form elements
      await page.keyboard.press('Tab'); // Email input
      await expect(page.getByLabel(/email address/i)).toBeFocused();

      await page.keyboard.press('Tab'); // Password input
      await expect(page.getByLabel(/^password$/i)).toBeFocused();

      await page.keyboard.press('Tab'); // Forgot password link
      await expect(page.getByText(/forgot password/i)).toBeFocused();

      await page.keyboard.press('Tab'); // Sign in button
      await expect(page.getByRole('button', { name: /^sign in$/i })).toBeFocused();
    });

    test('should have proper ARIA labels', async ({ page }) => {
      // Open login modal
      await page.getByRole('button', { name: /sign in/i }).first().click();

      const dialog = page.getByRole('dialog');
      await expect(dialog).toHaveAttribute('aria-modal', 'true');
      await expect(dialog).toHaveAttribute('aria-labelledby');
    });
  });
});
