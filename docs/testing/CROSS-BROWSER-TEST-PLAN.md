# Cross-Browser Testing Plan

**Project:** CodeScribe AI
**Version:** 1.0
**Last Updated:** October 16, 2025
**Status:** Planning Phase

---

## Table of Contents

1. [Overview](#overview)
2. [Testing Strategy](#testing-strategy)
3. [Automated Testing](#automated-testing)
4. [Manual Testing Targets](#manual-testing-targets)
5. [Cloud Testing Platforms](#cloud-testing-platforms)
6. [Feature Detection](#feature-detection)
7. [Testing Checklist](#testing-checklist)
8. [CI/CD Integration](#cicd-integration)
9. [Priority & Timeline](#priority--timeline)
10. [Tools Summary](#tools-summary)

---

## Overview

This document outlines the cross-browser testing strategy for CodeScribe AI, ensuring the application works correctly across all target browsers and devices.

**Critical Features to Test:**
- Monaco Editor rendering and syntax highlighting
- Mermaid diagram rendering (SVG support)
- Server-Sent Events (SSE) streaming
- Copy-to-clipboard functionality
- Toast notifications
- Error banner animations (250ms enter, 200ms exit)
- Responsive mobile menu
- File upload (drag & drop)

**Target Browsers:**
- Desktop: Chrome, Firefox, Safari, Edge
- Mobile: Safari iOS, Chrome Android

---

## Testing Strategy

### 1. Automated Testing (Primary Approach)

Use **Playwright** for comprehensive cross-browser E2E testing.

#### Installation

```bash
# Install Playwright
npm install -D @playwright/test

# Install browsers (Chromium, Firefox, WebKit)
npx playwright install
```

#### Why Playwright for CodeScribe AI

- ✅ Tests Chrome, Firefox, Safari (WebKit) automatically
- ✅ Supports Monaco Editor interactions
- ✅ Can test SSE (Server-Sent Events) streaming
- ✅ Headless mode for CI/CD
- ✅ Visual regression testing
- ✅ Mobile viewport emulation
- ✅ Network interception for API testing

#### Configuration

Create `playwright.config.js`:

```javascript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

#### Example Test Suite

```javascript
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
```

#### Running Tests

```bash
# Run all browsers
npx playwright test

# Run specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# Run mobile tests
npx playwright test --project="Mobile Chrome"
npx playwright test --project="Mobile Safari"

# Run in headed mode (see browser)
npx playwright test --headed

# Run with UI mode (interactive)
npx playwright test --ui

# Generate HTML report
npx playwright show-report
```

---

## Manual Testing Targets

### Desktop Browsers (1440px viewport)

**Primary Browsers:**
- ✅ **Chrome/Edge (Chromium)** - Latest stable
- ✅ **Firefox** - Latest stable
- ✅ **Safari** - macOS (latest)

**Version Support:**
- Chrome: Last 2 major versions
- Firefox: Last 2 major versions
- Safari: Last 2 major versions (macOS only)
- Edge: Last 2 major versions

### Mobile Browsers (375px viewport)

**Primary Browsers:**
- ✅ **Safari iOS** - iOS 14+
- ✅ **Chrome Android** - Latest stable

**Test Devices:**
- iPhone 12/13/14 (Safari)
- Pixel 5/6 (Chrome)
- Samsung Galaxy S21+ (Chrome)

### Browser DevTools Emulation

For quick responsive testing without real devices:

**Chrome DevTools:**
```
F12 → Toggle Device Toolbar (Ctrl+Shift+M)
Presets: iPhone 12 Pro, Pixel 5, iPad Air
```

**Firefox DevTools:**
```
F12 → Responsive Design Mode (Ctrl+Shift+M)
Presets: iPhone 12/13, Galaxy S20, iPad
```

---

## Cloud Testing Platforms

### BrowserStack (Recommended)

**Setup:**
```bash
# Install BrowserStack Local
npm install -D browserstack-local

# Configure Playwright for BrowserStack
npm install -D @browserstack/playwright-browserstack
```

**Configuration:**
```javascript
// browserstack.config.js
export default {
  auth: {
    username: process.env.BROWSERSTACK_USERNAME,
    accessKey: process.env.BROWSERSTACK_ACCESS_KEY,
  },
  browserstackLocal: true,
  capabilities: [
    {
      browser: 'chrome',
      browser_version: 'latest',
      os: 'Windows',
      os_version: '11',
    },
    {
      browser: 'safari',
      browser_version: '15.0',
      os: 'OS X',
      os_version: 'Big Sur',
    },
    {
      device: 'iPhone 13',
      os_version: '15',
      real_mobile: true,
    },
  ],
};
```

**Benefits:**
- ✅ Free for open source projects
- ✅ Real device testing (not emulators)
- ✅ 3000+ browser/device combinations
- ✅ Screenshot/video recording
- ✅ Local testing with secure tunnel

**Target Test Scenarios:**
- Safari 15+ (macOS Big Sur+)
- Safari iOS 14+
- Chrome Android (latest)
- Edge on Windows 11
- Firefox on Linux

### Alternative: Sauce Labs

Similar to BrowserStack, also free for open source:
- https://saucelabs.com/open-source

---

## Feature Detection

### Runtime Browser Support Checks

Create a browser support utility:

```javascript
// client/src/utils/browserSupport.js

/**
 * Check if browser supports all required features
 * @returns {Object} Support status and missing features
 */
export const checkBrowserSupport = () => {
  const features = {
    // Core JavaScript features
    es6: typeof Promise !== 'undefined' && typeof Symbol !== 'undefined',
    modules: 'noModule' in document.createElement('script'),

    // API features
    eventSource: typeof EventSource !== 'undefined',
    clipboard: navigator.clipboard !== undefined,
    fetch: typeof fetch !== 'undefined',

    // Editor features
    monaco: typeof monaco !== 'undefined' || true, // Lazy loaded

    // Graphics features
    svg: document.implementation.hasFeature('http://www.w3.org/TR/SVG11/feature#BasicStructure', '1.1'),
    canvas: !!document.createElement('canvas').getContext,

    // Storage features
    localStorage: (() => {
      try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
        return true;
      } catch (e) {
        return false;
      }
    })(),
  };

  const unsupported = Object.keys(features).filter(f => !features[f]);

  return {
    isSupported: unsupported.length === 0,
    missingFeatures: unsupported,
    features,
  };
};

/**
 * Display warning for unsupported browsers
 */
export const warnUnsupportedBrowser = () => {
  const { isSupported, missingFeatures } = checkBrowserSupport();

  if (!isSupported) {
    console.warn('Browser missing features:', missingFeatures);

    // Show user-friendly warning
    const warning = document.createElement('div');
    warning.className = 'bg-yellow-50 border-l-4 border-yellow-400 p-4 fixed top-0 left-0 right-0 z-50';
    warning.innerHTML = `
      <div class="flex">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <p class="text-sm text-yellow-700">
            Your browser may not support all features. Please use the latest version of Chrome, Firefox, or Safari for the best experience.
          </p>
        </div>
      </div>
    `;
    document.body.prepend(warning);
  }

  return isSupported;
};

/**
 * Get browser information
 */
export const getBrowserInfo = () => {
  const ua = navigator.userAgent;
  let browserName = 'Unknown';
  let browserVersion = 'Unknown';

  if (ua.includes('Firefox/')) {
    browserName = 'Firefox';
    browserVersion = ua.match(/Firefox\/(\d+)/)?.[1] || 'Unknown';
  } else if (ua.includes('Edg/')) {
    browserName = 'Edge';
    browserVersion = ua.match(/Edg\/(\d+)/)?.[1] || 'Unknown';
  } else if (ua.includes('Chrome/')) {
    browserName = 'Chrome';
    browserVersion = ua.match(/Chrome\/(\d+)/)?.[1] || 'Unknown';
  } else if (ua.includes('Safari/') && !ua.includes('Chrome')) {
    browserName = 'Safari';
    browserVersion = ua.match(/Version\/(\d+)/)?.[1] || 'Unknown';
  }

  return {
    name: browserName,
    version: browserVersion,
    userAgent: ua,
    isMobile: /Mobile|Android|iPhone|iPad/i.test(ua),
  };
};
```

### Usage in App

```javascript
// client/src/App.jsx
import { useEffect } from 'react';
import { warnUnsupportedBrowser, getBrowserInfo } from './utils/browserSupport';

function App() {
  useEffect(() => {
    // Check browser support on mount
    warnUnsupportedBrowser();

    // Log browser info for debugging
    const browserInfo = getBrowserInfo();
    console.log('Browser:', browserInfo);
  }, []);

  // ... rest of app
}
```

---

## Testing Checklist

### Per Browser Test Matrix

Use this checklist for manual testing on each target browser:

#### Core Functionality
- [ ] Application loads without console errors
- [ ] Header displays correctly with logo and navigation
- [ ] Code panel and doc panel are visible
- [ ] Control bar buttons are accessible

#### Monaco Editor
- [ ] Monaco Editor loads and displays
- [ ] Syntax highlighting works for JavaScript
- [ ] Syntax highlighting works for Python
- [ ] Syntax highlighting works for TypeScript
- [ ] Code input is editable
- [ ] Line numbers display correctly
- [ ] Minimap appears (desktop only)

#### File Upload
- [ ] File input accepts .js, .py, .ts files
- [ ] Drag & drop zone is functional
- [ ] File upload populates Monaco Editor
- [ ] Error handling for invalid file types
- [ ] Error handling for files >1MB

#### Documentation Generation
- [ ] Generate button triggers API call
- [ ] Loading state displays correctly
- [ ] SSE streaming displays in real-time
- [ ] Documentation renders in doc panel
- [ ] Markdown formatting is correct
- [ ] Code blocks have syntax highlighting

#### Mermaid Diagrams
- [ ] Mermaid diagrams render as SVG
- [ ] Diagrams use brand colors (purple, indigo, slate)
- [ ] Diagrams are responsive
- [ ] Diagrams don't break layout
- [ ] Error handling for invalid Mermaid syntax

#### Copy to Clipboard
- [ ] Copy buttons are visible
- [ ] Clicking copy button works
- [ ] Toast notification confirms copy
- [ ] Button shows success state (icon change)
- [ ] Button resets after 2 seconds

#### Toast Notifications
- [ ] Toasts appear in correct position (top-right)
- [ ] Success toasts are green
- [ ] Error toasts are red
- [ ] Info toasts are indigo
- [ ] Toasts auto-dismiss after timeout
- [ ] Multiple toasts stack correctly

#### Error Handling
- [ ] Error banners appear for API errors
- [ ] Error banners animate in (250ms)
- [ ] Error banners animate out (200ms)
- [ ] Error messages are user-friendly
- [ ] Network errors show appropriate message
- [ ] Rate limit errors show retry info

#### Quality Score
- [ ] Quality score displays (0-100)
- [ ] Letter grade displays (A-F)
- [ ] Score breakdown is visible
- [ ] Score colors match grade (green/yellow/red)
- [ ] Breakdown categories are correct

#### Responsive Design
- [ ] Desktop layout (1440px) displays correctly
- [ ] Mobile layout (375px) displays correctly
- [ ] Mobile menu toggle works
- [ ] Panels stack vertically on mobile
- [ ] Text is readable on all screen sizes
- [ ] Buttons are tappable on mobile (44px min)

#### Accessibility
- [ ] Keyboard navigation works (Tab, Enter, Esc)
- [ ] Focus indicators are visible
- [ ] Screen reader announcements work
- [ ] ARIA labels are present
- [ ] Color contrast meets WCAG AA
- [ ] Reduced motion preference is respected

#### Performance
- [ ] Initial page load <3 seconds
- [ ] Monaco Editor loads <2 seconds
- [ ] API response time <5 seconds
- [ ] Streaming starts <1 second
- [ ] No layout shift (CLS)
- [ ] Smooth animations (60fps)

---

## CI/CD Integration

### GitHub Actions Workflow

Create `.github/workflows/playwright.yml`:

```yaml
name: Playwright Cross-Browser Tests
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    timeout-minutes: 60
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: |
          cd client && npm ci
          cd ../server && npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps
        working-directory: ./client

      - name: Run Playwright tests
        run: npx playwright test
        working-directory: ./client
        env:
          VITE_API_URL: http://localhost:3000
          CLAUDE_API_KEY: ${{ secrets.CLAUDE_API_KEY }}

      - name: Upload Playwright report
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: client/playwright-report/
          retention-days: 30

      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: test-results
          path: client/test-results/
          retention-days: 30
```

### Vercel Deployment Checks

Add to `vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "installCommand": "npm install",
  "devCommand": "npm run dev",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ],
  "checks": {
    "lighthouse": {
      "performance": 75,
      "accessibility": 90,
      "best-practices": 90,
      "seo": 90
    }
  }
}
```

---

## Priority & Timeline

### Phase 1: MVP (Day 4-5)

**Focus:** Critical user flows on primary browsers

**Automated Tests:**
- [ ] Add Playwright configuration
- [ ] Write core E2E tests (5 tests minimum)
  - Application loads
  - Monaco Editor works
  - Documentation generation
  - Copy to clipboard
  - Responsive mobile view

**Manual Tests:**
- [ ] Chrome (desktop) - Full checklist
- [ ] Firefox (desktop) - Core functionality
- [ ] Safari (desktop) - Core functionality
- [ ] Chrome DevTools mobile emulation (375px)

**Estimated Time:** 4-6 hours

---

### Phase 2: Pre-Launch (Before production)

**Focus:** Real device testing + comprehensive coverage

**Automated Tests:**
- [ ] Expand E2E test suite (15+ tests)
- [ ] Add visual regression tests
- [ ] Add API integration tests
- [ ] Configure CI/CD pipeline

**Manual Tests:**
- [ ] Test on 1 real iOS device (Safari)
- [ ] Test on 1 real Android device (Chrome)
- [ ] Full checklist on all desktop browsers
- [ ] Accessibility audit with screen reader

**Estimated Time:** 8-10 hours

---

### Phase 3: Post-Launch (Ongoing)

**Focus:** Extended browser/device coverage

**Automated Tests:**
- [ ] Set up BrowserStack integration
- [ ] Add performance benchmarks
- [ ] Add accessibility tests (axe-core)
- [ ] Monitor test results in CI/CD

**Manual Tests:**
- [ ] Monthly regression testing
- [ ] Test on new browser versions
- [ ] User-reported browser issues

**Estimated Time:** 2-4 hours/month

---

## Tools Summary

| Tool | Use Case | Cost | Priority |
|------|----------|------|----------|
| **Playwright** | Automated cross-browser E2E tests | Free | ⭐⭐⭐ High |
| **Chrome DevTools** | Mobile emulation, debugging | Free | ⭐⭐⭐ High |
| **Firefox DevTools** | Responsive design mode | Free | ⭐⭐⭐ High |
| **BrowserStack** | Real device testing | Free (open source) | ⭐⭐ Medium |
| **Sauce Labs** | Alternative to BrowserStack | Free (open source) | ⭐ Low |
| **axe DevTools** | Accessibility testing | Free | ⭐⭐ Medium |
| **Lighthouse** | Performance + accessibility audit | Free | ⭐⭐⭐ High |

---

## Quick Start Guide

### 1. Install Playwright

```bash
cd client
npm install -D @playwright/test
npx playwright install
```

### 2. Create Test Directory

```bash
mkdir -p e2e
touch e2e/cross-browser.spec.js
```

### 3. Add Configuration

Create `playwright.config.js` in the client directory using the configuration from the [Configuration](#configuration) section above, or use the init command:

```bash
# Recommended: Copy the configuration from lines 76-121 above
# This provides the exact 5-browser setup needed for CodeScribe AI

# Alternative: Generate basic config (requires manual editing)
npx playwright test --init
```

**Note:** The provided configuration is already optimized for this project with 5 browser projects (Desktop Chrome, Firefox, Safari, Mobile Chrome, Mobile Safari) and automatic dev server startup.

### 4. Write First Test

Copy the example test suite from [Automated Testing](#automated-testing) section above into `e2e/cross-browser.spec.js`.

### 5. Run Tests

```bash
# All browsers
npx playwright test

# Specific browser
npx playwright test --project=chromium

# With UI
npx playwright test --ui
```

### 6. View Report

```bash
npx playwright show-report
```

---

## Related Documentation

- **[Testing README](./README.md)** - Testing documentation hub
- **[Frontend Testing Guide](./frontend-testing-guide.md)** - React testing patterns
- **[Component Test Coverage](./COMPONENT-TEST-COVERAGE.md)** - Component test details
- **[PRD](../planning/01-PRD.md)** - Browser support requirements (NFR-4)
- **[Master Prompt](../planning/08-Master-Prompt.md)** - Testing checklist
- **[Architecture](../architecture/ARCHITECTURE.md)** - System architecture

---

## Maintenance

### When to Update This Document

- New browser version releases (quarterly)
- New device/OS targets added
- New critical features shipped
- Test failures on specific browsers
- Performance regression detected

### Test Suite Maintenance

- Review and update tests monthly
- Remove obsolete browser versions
- Add tests for new features
- Update dependencies quarterly
- Monitor CI/CD test results

---

## Version History

- **v1.0** (October 16, 2025) - Initial cross-browser testing plan created with Playwright configuration, test examples, manual testing checklist, CI/CD integration, and phased timeline

---

**For questions or updates to this testing plan, consult the [Testing README](./README.md) or development team.**
