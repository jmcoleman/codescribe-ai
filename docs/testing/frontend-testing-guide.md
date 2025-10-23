# Frontend Testing Guide - CodeScribe AI

**Test Framework:** Vitest + React Testing Library
**Component Coverage:** DocPanel, CodePanel (planned)
**Test Count:** 45 tests (100% passing)
**Last Updated:** October 13, 2025

---

## 📋 Overview

This guide covers the complete frontend testing infrastructure for CodeScribe AI, including setup, test coverage, and best practices.

### Why Frontend Testing?

1. **Quality Assurance**: Catch rendering bugs before they reach users
2. **Refactoring Safety**: Change code confidently without breaking UI
3. **Documentation**: Tests serve as living documentation of component behavior
4. **Accessibility**: Ensure components meet a11y standards
5. **Regression Prevention**: Prevent bugs from reoccurring

---

## 🛠️ Testing Infrastructure

### Installed Packages

```json
{
  "devDependencies": {
    "vitest": "^3.2.4",
    "@testing-library/react": "^16.3.0",
    "@testing-library/jest-dom": "^6.9.1",
    "@testing-library/user-event": "^14.6.1",
    "jsdom": "^27.0.0"
  }
}
```

### Configuration Files

#### [vitest.config.js](../../client/vitest.config.js)
```javascript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '*.config.js',
        'dist/'
      ]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
```

#### [src/test/setup.js](../../client/src/test/setup.js)
- Configures global test environment
- Mocks browser APIs (IntersectionObserver, ResizeObserver)
- Sets up automatic cleanup after each test
- Imports jest-dom matchers

---

## 🧪 DocPanel Test Suite

**File:** [src/components/__tests__/DocPanel.test.jsx](../../client/src/components/__tests__/DocPanel.test.jsx)
**Component:** [DocPanel.jsx](../../client/src/components/DocPanel.jsx)
**Tests:** 45 total (100% passing)

### Test Coverage Breakdown

#### 1. **Empty State Tests** (2 tests)
Tests the initial state when no documentation exists.

```javascript
✓ should render empty state when no documentation provided
✓ should not show quality score in empty state
```

**What's tested:**
- Empty state message display
- Absence of quality score badge
- Container styling and layout

---

#### 2. **Loading State Tests** (3 tests)
Tests the UI during documentation generation.

```javascript
✓ should render loading state when generating
✓ should show animated sparkles icon during generation
✓ should not show empty state message when generating
```

**What's tested:**
- Loading spinner/animation
- "Generating documentation..." message
- State transition from empty → loading

---

#### 3. **Documentation Rendering Tests** (6 tests)
Tests basic markdown rendering functionality.

```javascript
✓ should render documentation when provided
✓ should render markdown headings correctly (h1, h2, h3)
✓ should render markdown lists correctly
✓ should render markdown links correctly
✓ should render markdown bold and italic correctly
```

**What's tested:**
- Markdown-to-HTML conversion
- Heading hierarchy (h1-h6)
- Lists (ordered, unordered)
- Links with proper href attributes
- Text formatting (bold, italic)

---

#### 4. **GitHub Flavored Markdown (GFM) Tests** (3 tests)
Tests extended markdown features.

```javascript
✓ should render tables correctly
✓ should render strikethrough text
✓ should render task lists with checkboxes
```

**What's tested:**
- Tables with headers and cells
- Strikethrough (`~~text~~`)
- Task lists (`- [x]` / `- [ ]`)
- remarkGfm plugin integration

---

#### 5. **Syntax Highlighting Tests** (7 tests)
Tests code block rendering with syntax highlighting.

```javascript
✓ should render inline code with proper styling
✓ should render JavaScript code blocks with syntax highlighting
✓ should render Python code blocks with syntax highlighting
✓ should render TypeScript code blocks
✓ should render code blocks with multiple languages
✓ should handle code blocks without language identifier
✓ should properly escape special characters in code blocks
```

**What's tested:**
- Inline code (`code`) styling
- react-syntax-highlighter integration
- Multiple language support (JS, Python, TS, etc.)
- Code tokenization
- Special character handling
- Fallback for unlabeled code blocks

---

#### 6. **Quality Score Display Tests** (10 tests)
Tests quality score badge and breakdown functionality.

```javascript
✓ should display quality score badge when provided
✓ should not display quality score when null
✓ should render correct grade color for A grade (green)
✓ should render correct grade color for B grade (blue)
✓ should render correct grade color for C grade (yellow)
✓ should render correct grade color for D grade (red)
✓ should render correct grade color for F grade (red)
✓ should call onViewBreakdown when quality badge clicked
✓ should show strengths count in footer
✓ should show improvements count in footer
✓ should not show improvements section when no improvements needed
```

**What's tested:**
- Quality score badge visibility
- Grade-based color mapping (A=green, B=blue, C=yellow, D/F=red)
- Click handler for breakdown modal
- Footer stats (strengths/improvements count)
- Conditional rendering based on score

---

#### 7. **State Transition Tests** (3 tests)
Tests component behavior during state changes.

```javascript
✓ should transition from empty to loading state
✓ should transition from loading to documentation state
✓ should show documentation even while generating (streaming)
```

**What's tested:**
- Empty → Loading transition
- Loading → Documentation transition
- Streaming documentation (partial content while generating)
- Component re-rendering

---

#### 8. **Complex Documentation Examples** (3 tests)
Tests real-world documentation formats.

```javascript
✓ should render complete README-style documentation
✓ should render JSDoc-style documentation
✓ should render API documentation with endpoints
```

**What's tested:**
- Multi-section README (Features, Installation, Usage, API)
- JSDoc format with parameters, returns, examples
- API endpoint documentation with JSON responses
- Nested markdown structures
- Mixed content types

---

#### 9. **Accessibility Tests** (3 tests)
Tests WCAG 2.1 Level AA compliance.

```javascript
✓ should have proper heading hierarchy
✓ should have accessible button for quality score
✓ should render links with proper attributes
```

**What's tested:**
- Heading hierarchy (h1 → h2 → h3...)
- Button accessibility (role, enabled state)
- Link attributes (href)
- Screen reader compatibility

---

#### 10. **Edge Cases Tests** (5 tests)
Tests error handling and edge conditions.

```javascript
✓ should handle empty string documentation
✓ should handle very long documentation (1000+ lines)
✓ should handle documentation with special markdown characters
✓ should handle malformed markdown gracefully
✓ should handle documentation with HTML entities
```

**What's tested:**
- Empty strings
- Large content (performance)
- Special characters (`*`, `_`, `[`, `]`, etc.)
- Malformed markdown (unclosed tags)
- HTML entity escaping

---

## 🚀 Running Tests

### Basic Commands

```bash
# Run all tests
npm test

# Run tests in watch mode (during development)
npm test

# Run tests once (CI/CD)
npm test -- --run

# Run tests with coverage
npm test:coverage

# Run tests with UI (visual test runner)
npm test:ui

# Run specific test file
npm test -- DocPanel.test.jsx

# Run specific test suite
npm test -- -t "Syntax Highlighting"

# Run tests in specific directory
npm test -- src/components/__tests__/
```

### Watch Mode (Recommended for Development)

```bash
npm test
```

**Features:**
- Auto-runs tests when files change
- Press `a` to run all tests
- Press `f` to run only failed tests
- Press `q` to quit

### Coverage Report

```bash
npm test:coverage
```

**Output:**
```
--------------------------------|---------|----------|---------|---------|
File                            | % Stmts | % Branch | % Funcs | % Lines |
--------------------------------|---------|----------|---------|---------|
All files                       |   95.45 |    88.89 |     100 |   95.24 |
 src/components                 |   95.45 |    88.89 |     100 |   95.24 |
  DocPanel.jsx                  |   95.45 |    88.89 |     100 |   95.24 |
--------------------------------|---------|----------|---------|---------|
```

**Coverage files:** `coverage/index.html` (visual report)

---

## 📝 Writing New Tests

### Test Structure

```javascript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MyComponent } from '../MyComponent';

describe('MyComponent', () => {
  describe('Feature Group', () => {
    it('should do something specific', () => {
      // 1. Arrange: Set up test data
      const props = { title: 'Test' };

      // 2. Act: Render component
      render(<MyComponent {...props} />);

      // 3. Assert: Verify expected behavior
      expect(screen.getByText('Test')).toBeInTheDocument();
    });
  });
});
```

### Common Patterns

#### 1. **Testing User Interactions**

```javascript
it('should call onClick when button clicked', async () => {
  const user = userEvent.setup();
  const onClick = vi.fn();

  render(<Button onClick={onClick} />);

  const button = screen.getByRole('button');
  await user.click(button);

  expect(onClick).toHaveBeenCalledTimes(1);
});
```

#### 2. **Testing Async Rendering**

```javascript
it('should load data asynchronously', async () => {
  render(<AsyncComponent />);

  // Wait for element to appear
  await waitFor(() => {
    expect(screen.getByText('Loaded')).toBeInTheDocument();
  });
});
```

#### 3. **Testing State Changes**

```javascript
it('should update when props change', () => {
  const { rerender } = render(<Counter count={0} />);
  expect(screen.getByText('Count: 0')).toBeInTheDocument();

  rerender(<Counter count={5} />);
  expect(screen.getByText('Count: 5')).toBeInTheDocument();
});
```

#### 4. **Testing Conditional Rendering**

```javascript
it('should show error when error prop provided', () => {
  render(<Form error="Invalid input" />);
  expect(screen.getByText('Invalid input')).toBeInTheDocument();

  render(<Form error={null} />);
  expect(screen.queryByText('Invalid input')).not.toBeInTheDocument();
});
```

---

## 🎯 Best Practices

### 1. **Query Priority**

Use queries in this order (most to least preferred):

```javascript
// 1. Accessible to everyone (best)
screen.getByRole('button', { name: /submit/i })
screen.getByLabelText('Email address')
screen.getByPlaceholderText('Enter email')
screen.getByText('Submit')

// 2. Semantic queries
screen.getByAltText('Profile picture')
screen.getByTitle('Close dialog')

// 3. Test IDs (last resort)
screen.getByTestId('submit-button')
```

### 2. **Async Testing**

```javascript
// ✅ Good: Use waitFor for async operations
await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument();
});

// ❌ Bad: Don't use arbitrary timeouts
setTimeout(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument();
}, 1000);
```

### 3. **User Events**

```javascript
// ✅ Good: Use userEvent for realistic interactions
const user = userEvent.setup();
await user.click(button);
await user.type(input, 'Hello');

// ❌ Bad: Don't use fireEvent directly
fireEvent.click(button);
```

### 4. **Queries: getBy vs queryBy vs findBy**

```javascript
// getBy: Element must exist (throws if not found)
const element = screen.getByText('Hello');

// queryBy: Element may not exist (returns null)
const element = screen.queryByText('Hello'); // null if not found

// findBy: Async, waits for element to appear
const element = await screen.findByText('Hello');
```

### 5. **Test Organization**

```javascript
describe('Component', () => {
  describe('Feature 1', () => {
    it('should do X', () => { /* ... */ });
    it('should do Y', () => { /* ... */ });
  });

  describe('Feature 2', () => {
    it('should do Z', () => { /* ... */ });
  });
});
```

---

## 🐛 Common Issues & Solutions

### Issue 1: "Unable to find element with role"

**Problem:** SVG icons with `aria-hidden="true"` don't have `role="img"`

```javascript
// ❌ Bad
expect(screen.getByRole('img')).toBeInTheDocument();

// ✅ Good
const container = screen.getByText('Label').parentElement;
expect(container).toHaveClass('flex');
```

### Issue 2: "Found multiple elements with text"

**Problem:** Text appears multiple times in tokenized code blocks

```javascript
// ❌ Bad
expect(screen.getByText(/code/)).toBeInTheDocument();

// ✅ Good
const elements = screen.getAllByText(/code/);
expect(elements.length).toBeGreaterThan(0);
```

### Issue 3: "Element is not accessible"

**Problem:** Element has `display: none` or `visibility: hidden`

```javascript
// Use queryBy for elements that may not be visible
const element = screen.queryByText('Hidden');
expect(element).not.toBeInTheDocument();
```

### Issue 4: "Syntax highlighter not rendering"

**Problem:** react-syntax-highlighter is async

```javascript
// ✅ Good: Use waitFor
await waitFor(() => {
  expect(screen.getByText('const')).toBeInTheDocument();
});
```

---

## 📊 Test Coverage Goals

### Current Coverage

| Component | Statements | Branches | Functions | Lines |
|-----------|------------|----------|-----------|-------|
| DocPanel  | 95.45%     | 88.89%   | 100%      | 95.24%|

### Coverage Targets

- **Statements:** ≥ 90%
- **Branches:** ≥ 85%
- **Functions:** ≥ 90%
- **Lines:** ≥ 90%

### Uncovered Edge Cases

- [ ] Network error handling (when Claude API fails)
- [ ] Extremely large code blocks (>50KB)
- [ ] Rapid state transitions (stress testing)
- [ ] Memory leak detection (long-running tests)

---

## 🔄 CI/CD Integration

### GitHub Actions Example

```yaml
name: Frontend Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm test -- --run
      - run: npm test:coverage
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
```

---

## 🗺️ Future Test Plans

### Components to Test

1. **CodePanel** (planned)
   - Monaco Editor integration
   - File upload handling
   - Language selection
   - Code validation

2. **QualityScore** (planned)
   - Breakdown modal display
   - Score animations
   - Criteria visualization

3. **ControlBar** (planned)
   - Button interactions
   - Form submission
   - Validation messages

4. **App** (integration tests - planned)
   - End-to-end user flow
   - API integration
   - Error boundary testing

### Integration Tests

```javascript
// Example: Full user flow
it('should generate documentation from code input', async () => {
  const user = userEvent.setup();

  render(<App />);

  // 1. User enters code
  const editor = screen.getByRole('textbox');
  await user.type(editor, 'function hello() {}');

  // 2. User clicks generate
  const generateBtn = screen.getByRole('button', { name: /generate/i });
  await user.click(generateBtn);

  // 3. Documentation appears
  await waitFor(() => {
    expect(screen.getByText(/# Documentation/)).toBeInTheDocument();
  });

  // 4. Quality score displays
  expect(screen.getByText(/Quality:/)).toBeInTheDocument();
});
```

---

## 📱 Mobile Device Testing

### Testing Mobile UI in DevTools (Quick Testing)

For rapid iteration and most UI testing, use browser DevTools:

**Chrome/Edge:**
1. Open http://localhost:5173/ in your browser
2. Press `F12` (or right-click → Inspect)
3. Click the **device toolbar icon** or press `Ctrl+Shift+M` (Windows/Linux) / `Cmd+Shift+M` (Mac)
4. Select a mobile device from the dropdown (iPhone 12, Pixel 5, etc.)
5. **Hard refresh:** `Ctrl+Shift+R` / `Cmd+Shift+R`

**Firefox:**
1. Open http://localhost:5173/
2. Press `F12`
3. Click **Responsive Design Mode** or press `Ctrl+Shift+M` / `Cmd+Shift+M`
4. Choose device dimensions

**When to use DevTools mobile testing:**
- ✅ UI layout and responsive design
- ✅ CSS breakpoints and media queries
- ✅ Quick iteration during development
- ❌ Touch interactions (use real device)
- ❌ Mobile browser quirks (use real device)

---

### Testing on Real Mobile Devices (Most Accurate)

For touch interactions, mobile browser quirks, and final validation, test on real devices.

#### Step 1: Find Your Computer's Local IP

**Mac:**
```bash
ipconfig getifaddr en0 || ipconfig getifaddr en1
```

**Windows (PowerShell):**
```powershell
ipconfig | findstr IPv4
```

**Linux:**
```bash
hostname -I | awk '{print $1}'
```

Example output: `192.168.1.92`

#### Step 2: Start Dev Server with Network Access

**From project root:**
```bash
# Kill any existing dev servers
pkill -f vite; pkill -f nodemon

# Start frontend with network access
cd client && npm run dev -- --host

# In a new terminal, start backend
cd server && npm run dev
```

The Vite output will show:
```
➜  Local:   http://localhost:5173/
➜  Network: http://192.168.1.92:5173/
```

#### Step 3: Access from Mobile Device

**Requirements:**
- Mobile device must be on the **same WiFi network** as your computer
- Firewall may need to allow incoming connections on port 5173

**On your mobile device:**
1. Open Safari (iOS) or Chrome (Android)
2. Navigate to: `http://YOUR_IP_ADDRESS:5173/`
   - Example: `http://192.168.1.92:5173/`
3. Test the app

**Mobile-Specific Testing Checklist:**
- [ ] Touch interactions (tap, swipe, long-press)
- [ ] Mobile menu functionality
- [ ] File upload on mobile browsers
- [ ] Keyboard behavior on mobile
- [ ] Safe area insets (iPhone notch, Android navigation)
- [ ] Landscape vs portrait orientation
- [ ] iOS Safari quirks
- [ ] Android Chrome quirks

#### Troubleshooting

**"Can't connect" from mobile device:**
- Verify both devices are on same WiFi network
- Check firewall settings (allow port 5173)
- Try your computer's IP address in a browser (should load the app)
- Restart dev server with `--host` flag

**"Hard refresh" on mobile:**
- **iOS Safari:** Close tab completely, reopen URL
- **Android Chrome:** Settings → Privacy → Clear cached images and files

**Mobile menu flashes and closes immediately:**
- This was fixed by removing FocusTrap and adding `allowClickOutside` delay
- See [MobileMenu.jsx](../../client/src/components/MobileMenu.jsx) for implementation

#### Viewing Console on Mobile Devices

**iOS (Safari):**
1. On iPhone/iPad: Settings → Safari → Advanced → Enable "Web Inspector"
2. On Mac: Connect via USB → Safari → Develop menu → [Your Device] → [Webpage]
3. Full DevTools with Console, Network, Elements available

**Android (Chrome):**
1. On Android: Settings → About Chrome → Tap "Build Number" 7x → Developer Options → Enable "USB Debugging"
2. On Computer: Chrome → `chrome://inspect` → Find device → Click "Inspect"
3. Full DevTools available

**Alternative (Any Device) - Eruda:**

Add to `client/index.html` before `</head>` for a floating mobile console:

```html
<script>
  if (window.location.hostname !== 'localhost' &&
      window.location.hostname !== '127.0.0.1') {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/eruda';
    script.onload = () => eruda.init();
    document.head.appendChild(script);
  }
</script>
```

⚠️ Remove before production!

---

### Network Testing Best Practices

**Security Note:**
- Dev server is exposed to local network only (not internet)
- Anyone on your WiFi can access it
- Don't use on public/untrusted networks

**Performance:**
- Network testing may be slower than localhost
- Hot Module Replacement (HMR) works over network
- Keep DevTools open on desktop to see console errors

**When to use real device testing:**
- Final QA before production deployment
- Touch interaction testing
- Browser-specific bug reproduction
- Performance testing on real hardware

---

## 📚 Resources

### Documentation

- **Vitest:** https://vitest.dev/
- **React Testing Library:** https://testing-library.com/react
- **jest-dom matchers:** https://github.com/testing-library/jest-dom
- **user-event:** https://testing-library.com/docs/user-event/intro

### CodeScribe AI Docs

- [PRD](../planning/01-PRD.md) - Product requirements
- [Architecture](../architecture/ARCHITECTURE.md) - System design
- [Dev Guide](../planning/05-Dev-Guide.md) - Implementation guide
- [Monaco Tests](./monaco-syntax-highlighting-tests.md) - Backend prompt tests

---

## 🎓 Testing Philosophy

### Test Pyramid

```
        /\
       /  \         E2E Tests (Few)
      /----\        Integration Tests (Some)
     /------\       Unit Tests (Many)
    /--------\
```

**CodeScribe AI Strategy:**
- **Unit Tests (Many):** Component rendering, props, state
- **Integration Tests (Some):** Component interactions, API calls
- **E2E Tests (Few):** Critical user paths (manual QA for MVP)

### What to Test

✅ **DO Test:**
- User-visible behavior
- Accessibility
- Error states
- Loading states
- Edge cases

❌ **DON'T Test:**
- Implementation details (internal state, private methods)
- Third-party libraries (react-markdown, react-syntax-highlighter)
- Styling specifics (use visual regression instead)
- Console.logs or debug code

---

## 🏆 Success Criteria

✅ **All tests passing:** 45/45 (100%)
✅ **Coverage ≥ 90%:** 95.45%
✅ **No flaky tests:** 0 failures
✅ **Fast execution:** < 5 seconds
✅ **Clear error messages:** Descriptive assertions
✅ **Documentation complete:** This file

**Status:** ✅ **All criteria met**

---

**Last Updated:** October 22, 2025
**Maintainer:** CodeScribe AI Team
**Version:** 1.1 - Added Mobile Device Testing section
