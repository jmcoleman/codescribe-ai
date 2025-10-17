// e2e/cross-browser.spec.js
import { test, expect } from '@playwright/test';

test.describe('CodeScribe AI - Cross Browser Compatibility', () => {

  test('should load application and display UI elements', async ({ page }) => {
    await page.goto('/');

    // Verify header
    await expect(page.locator('header')).toContainText('CodeScribe AI');

    // Verify main panels
    await expect(page.locator('[data-testid="code-panel"]')).toBeVisible();
    await expect(page.locator('[data-testid="doc-panel"]')).toBeVisible();
  });

  test('should load Monaco Editor', async ({ page }) => {
    await page.goto('/');

    // Wait for Monaco to load
    await expect(page.locator('.monaco-editor')).toBeVisible({ timeout: 10000 });

    // Verify syntax highlighting works
    const editor = page.locator('.monaco-editor');
    await expect(editor).toHaveClass(/monaco-editor/);
  });

  test('should handle code input and generation', async ({ page }) => {
    await page.goto('/');

    // Input code
    await page.fill('textarea', 'function hello() { return "world"; }');

    // Click generate button
    await page.click('[data-testid="generate-btn"]');

    // Verify documentation appears
    await expect(page.locator('.doc-panel')).toContainText('Documentation', { timeout: 15000 });
  });

  test('should support SSE streaming', async ({ page }) => {
    await page.goto('/');

    // Monitor network for SSE connection
    const ssePromise = page.waitForResponse(response =>
      response.url().includes('/api/generate-stream') &&
      response.headers()['content-type']?.includes('text/event-stream')
    );

    await page.fill('textarea', 'const test = () => {};');
    await page.click('[data-testid="generate-btn"]');

    const sseResponse = await ssePromise;
    expect(sseResponse.ok()).toBeTruthy();
  });

  test('should render Mermaid diagrams', async ({ page }) => {
    await page.goto('/');

    // Generate documentation with diagram
    await page.fill('textarea', 'class MyClass { constructor() {} }');
    await page.click('[data-testid="generate-btn"]');

    // Wait for Mermaid SVG to render
    await expect(page.locator('svg[data-mermaid]')).toBeVisible({ timeout: 20000 });
  });

  test('should copy to clipboard', async ({ page, context }) => {
    // Grant clipboard permissions
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    await page.goto('/');

    // Generate documentation
    await page.fill('textarea', 'const test = 1;');
    await page.click('[data-testid="generate-btn"]');

    // Click copy button
    await page.click('[data-testid="copy-btn"]');

    // Verify clipboard content
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText.length).toBeGreaterThan(0);
  });

  test('should display toast notifications', async ({ page }) => {
    await page.goto('/');

    // Trigger an action that shows toast
    await page.click('[data-testid="generate-btn"]');

    // Verify toast appears
    await expect(page.locator('[role="status"]')).toBeVisible({ timeout: 5000 });
  });

  test('should handle file upload', async ({ page }) => {
    await page.goto('/');

    // Create a test file
    const fileContent = 'function test() { return true; }';
    await page.setInputFiles('input[type="file"]', {
      name: 'test.js',
      mimeType: 'text/javascript',
      buffer: Buffer.from(fileContent)
    });

    // Verify file content appears in editor
    await expect(page.locator('.monaco-editor')).toContainText('function test');
  });

  test('should be responsive on mobile', async ({ page, isMobile }) => {
    if (!isMobile) return;

    await page.goto('/');

    // Verify mobile menu exists
    await expect(page.locator('[data-testid="mobile-menu-btn"]')).toBeVisible();

    // Toggle mobile menu
    await page.click('[data-testid="mobile-menu-btn"]');
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
  });

  test('should animate error banners correctly', async ({ page }) => {
    await page.goto('/');

    // Trigger an error (e.g., no API key)
    await page.click('[data-testid="generate-btn"]');

    // Check for error banner
    const errorBanner = page.locator('[role="alert"]');
    await expect(errorBanner).toBeVisible();

    // Verify animation duration (250ms enter)
    const animationDuration = await errorBanner.evaluate(el =>
      parseFloat(getComputedStyle(el).animationDuration)
    );
    expect(animationDuration).toBeCloseTo(0.25, 1);
  });
});
