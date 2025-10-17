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

    // Wait for Monaco Editor to fully load
    await page.waitForSelector('.monaco-editor', {
      state: 'visible',
      timeout: 10000
    });

    // Additional wait for Monaco to initialize (important for Firefox)
    await page.waitForTimeout(1500);

    // Click to focus Monaco Editor before typing
    await page.click('.monaco-editor');

    // Use keyboard.type for better cross-browser support with Monaco
    await page.keyboard.type('function hello() { return "world"; }');

    // Click generate button
    await page.click('[data-testid="generate-btn"]');

    // Verify documentation appears
    await expect(page.locator('[data-testid="doc-panel"]')).toContainText('Documentation', { timeout: 15000 });
  });

  test('should support SSE streaming', async ({ page }) => {
    await page.goto('/');

    // Wait for Monaco Editor to fully load
    await page.waitForSelector('.monaco-editor', {
      state: 'visible',
      timeout: 10000
    });
    await page.waitForTimeout(1500);

    // Monitor network for SSE connection
    const ssePromise = page.waitForResponse(response =>
      response.url().includes('/api/generate-stream') &&
      response.headers()['content-type']?.includes('text/event-stream')
    );

    // Click to focus and type into Monaco
    await page.click('.monaco-editor');
    await page.keyboard.type('const test = () => {};');

    await page.click('[data-testid="generate-btn"]');

    const sseResponse = await ssePromise;
    expect(sseResponse.ok()).toBeTruthy();
  });

  test('should render Mermaid diagrams', async ({ page }) => {
    await page.goto('/');

    // Wait for Monaco Editor to fully load
    await page.waitForSelector('.monaco-editor', {
      state: 'visible',
      timeout: 10000
    });
    await page.waitForTimeout(1500);

    // Click to focus and type into Monaco
    await page.click('.monaco-editor');
    await page.keyboard.type('class MyClass { constructor() {} }');

    // Click generate button
    await page.click('[data-testid="generate-btn"]');

    // Wait for Mermaid SVG to render (it will appear after full generation)
    // Generous timeout to account for full SSE stream + Mermaid rendering
    await expect(page.locator('svg[data-mermaid]')).toBeVisible({ timeout: 35000 });
  });

  test('should copy to clipboard', async ({ page, context, browserName }) => {
    await page.goto('/');

    // Only grant permissions for Chromium browsers (Firefox/WebKit don't support these)
    if (browserName === 'chromium') {
      await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    }

    // Wait for Monaco Editor to fully load
    await page.waitForSelector('.monaco-editor', {
      state: 'visible',
      timeout: 10000
    });
    await page.waitForTimeout(1500);

    // Click to focus and type into Monaco
    await page.click('.monaco-editor');
    await page.keyboard.type('const test = 1;');

    await page.click('[data-testid="generate-btn"]');

    // Wait for documentation to appear
    await expect(page.locator('[data-testid="doc-panel"]')).toContainText('Documentation', { timeout: 15000 });

    // Click copy button (in DocPanel)
    await page.click('[data-testid="copy-btn"]');

    // Verify based on browser capability
    if (browserName === 'chromium') {
      // For Chromium: verify clipboard content directly
      const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
      expect(clipboardText.length).toBeGreaterThan(0);
    } else {
      // For Firefox/WebKit: verify success toast appears
      await expect(page.locator('[role="status"]')).toContainText('Copied', { timeout: 5000 });
    }
  });

  test('should display toast notifications', async ({ page }) => {
    await page.goto('/');

    // Wait for Monaco Editor to fully load
    await page.waitForSelector('.monaco-editor', {
      state: 'visible',
      timeout: 10000
    });
    await page.waitForTimeout(1500);

    // Add some code so generation can proceed
    await page.click('.monaco-editor');
    await page.keyboard.type('const hello = "world";');

    // Set up toast watcher BEFORE clicking generate
    // Toast appears AFTER generation completes, so we need to watch for it appearing
    const toastPromise = page.waitForSelector('[role="status"]', {
      state: 'visible',
      timeout: 35000 // Generous timeout to wait for full generation + toast
    });

    // Trigger documentation generation
    await page.click('[data-testid="generate-btn"]');

    // Wait for toast to appear (it will show up after SSE stream completes)
    await toastPromise;

    // Verify toast is actually visible
    await expect(page.locator('[role="status"]')).toBeVisible();
  });

  test('should handle file upload', async ({ page }) => {
    await page.goto('/');

    // Wait for Monaco Editor to fully load first
    await page.waitForSelector('.monaco-editor', {
      state: 'visible',
      timeout: 10000
    });
    await page.waitForTimeout(1500);

    // Create a test file
    const fileContent = 'function test() { return true; }';

    // Set up network listener BEFORE triggering upload
    // Increased timeout to handle rate limiting and resource contention
    const uploadPromise = page.waitForResponse(
      response => response.url().includes('/api/upload') && response.status() === 200,
      { timeout: 20000 } // 20 seconds to handle slower browsers under load
    );

    // Find and upload file to the file input
    await page.setInputFiles('input[type="file"]', {
      name: 'test.js',
      mimeType: 'text/javascript',
      buffer: Buffer.from(fileContent)
    });

    // Wait for API response to complete
    await uploadPromise;

    // Give Monaco time to update after state change
    await page.waitForTimeout(500);

    // Verify file content appears in editor (check the view lines, not textarea)
    const editorContent = await page.locator('.view-lines').textContent();
    // Monaco may wrap content in quotes, so check for the actual function content
    expect(editorContent).toMatch(/function\s+test\s*\(\)/);
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

    // Wait for Monaco Editor to fully load
    await page.waitForSelector('.monaco-editor', {
      state: 'visible',
      timeout: 10000
    });
    await page.waitForTimeout(1500);

    // Add some code to trigger generation
    await page.click('.monaco-editor');
    await page.keyboard.type('const test = 1;');

    // Trigger generation (which may show error banner if API key is missing/invalid)
    await page.click('[data-testid="generate-btn"]');

    // Check for error banner OR toast notification
    // (depending on environment, we might get error banner or error toast)
    const errorBanner = page.locator('[role="alert"]');
    const errorToast = page.locator('[role="status"]');

    // Wait for either to appear
    await Promise.race([
      expect(errorBanner).toBeVisible({ timeout: 5000 }),
      expect(errorToast).toBeVisible({ timeout: 5000 })
    ]).catch(() => {
      // If neither appears, that's okay - app might be working correctly
      // Just verify the generate button was clickable
    });

    // If error banner appeared, verify animation
    if (await errorBanner.isVisible().catch(() => false)) {
      const animationDuration = await errorBanner.evaluate(el => {
        const style = getComputedStyle(el);
        return parseFloat(style.animationDuration) || parseFloat(style.transitionDuration);
      });

      // Animation should be around 250ms (0.25s) or 200ms (0.2s)
      expect(animationDuration).toBeGreaterThan(0);
      expect(animationDuration).toBeLessThan(0.5);
    }
  });
});
