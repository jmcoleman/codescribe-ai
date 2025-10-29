# Skipped Tests Reference

**Purpose:** Central reference for all intentionally skipped tests in the codebase
**Last Updated:** October 29, 2025 (v2.2.0)
**Total Skipped:** 15 frontend tests (using `.skip()`)

**Note:** Backend database tests (21 tests in `/src/db/__tests__/`) are **excluded** via `jest.config.cjs`, not "skipped" with `.skip()`. They run separately in Docker sandbox before deployment and are NOT counted in this document's skip tracking.

---

## 📊 Quick Summary

| Category | Count | Impact | Reason |
|----------|-------|--------|--------|
| GitHub Import Feature | 6 | ✅ None | Feature not implemented (Phase 3) |
| Timing-Dependent Tests | 4 | ✅ None | Prevent flaky CI/CD |
| Focus Management Edge Cases | 2 | ✅ None | jsdom limitations |
| Debug Logging Tests | 2 | ✅ None | Development only |
| Focus Restoration | 1 | ✅ None | jsdom limitations |

**Total Frontend Skipped:** 15 tests (tracked in this document)

**Deployment Impact:** ✅ **NONE** - All skipped tests are intentional and documented

---

## ℹ️ Backend Database Tests (Not Tracked Here)

**21 tests in `server/src/db/__tests__/`** are **excluded** from default test runs via `jest.config.cjs`:
```javascript
testPathIgnorePatterns: ['/src/db/__tests__/']
```

These tests run separately with `npm run test:db` in Docker sandbox **before** deployment. They are not "skipped" tests (no `.skip()`) - they're infrastructure tests that require a database. See [DB-MIGRATION-MANAGEMENT.MD](../database/DB-MIGRATION-MANAGEMENT.MD) for details.

---

## 🟡 Frontend: GitHub Import Feature (6 tests)

### Status: ✅ **NOT YET IMPLEMENTED (Phase 3, Epic 3.3)**

### File
`client/src/components/__tests__/ControlBar.test.jsx`

### Skipped Tests
1. **Line 96:** `should call onGithubImport when clicked`
   - Tests GitHub button click handler
   - Feature: Import single file from GitHub URL

2. **Line 108:** `should disable github button when disabled prop is true`
   - Tests disabled state for GitHub button
   - Feature: Button state management

3. **Line 115:** `should have secondary variant styling`
   - Tests GitHub button uses secondary variant
   - Feature: Consistent button styling

4. **Line 122:** `should display github icon`
   - Tests GitHub icon renders correctly
   - Feature: Visual button indicator

5. **Line 129:** `should show responsive text content`
   - Tests "Load from GitHub" text on desktop, hidden on mobile
   - Feature: Responsive button text

6. **Line 513:** `should handle github import → select type → generate`
   - End-to-end test for GitHub import workflow
   - Feature: Complete GitHub import flow

### Why Skipped
Feature is **not yet implemented** and hidden behind feature flag:
```javascript
const ENABLE_GITHUB_IMPORT = false; // Phase 3, Epic 3.3
```

### When to Unskip
**Phase 3, Epic 3.3** - GitHub Single-File Import
- Create GitHub URL parser utility
- Add "Load from GitHub" button to ControlBar
- Create GitHubImportModal component
- Fetch file from raw.githubusercontent.com
- Handle CORS, 404, rate limits
- Unskip all 6 tests and verify they pass

### Documentation
- [TODO.md - Epic 3.3](../planning/TODO.md#epic-33-advanced-file-handling) - Implementation plan

### Production Impact
✅ **NONE** - Button is hidden in production UI (`ENABLE_GITHUB_IMPORT = false`)

---

## 🟠 Frontend: Timing-Dependent Tests (4 tests)

### Status: ✅ **INTENTIONALLY SKIPPED - Prevents Flaky CI/CD**

### File
`client/src/components/__tests__/CopyButton.test.jsx`

### Skipped Tests
1. **Line 58:** `resets to default state after 2 seconds`
   - Tests button returns to default state after timer expires
   - **Issue:** `setTimeout` behavior is unreliable in test environments

2. **Line 86:** `handles copy errors gracefully`
   - Tests error handling with clipboard API failures
   - **Issue:** Async clipboard API + timer creates race conditions

3. **Line 124:** `disables button while in copied state`
   - Tests button disabled state during 2-second "Copied!" display
   - **Issue:** Timing window too narrow for consistent testing

4. **Line 303:** `changes text to "Copied!" after clicking`
   - Tests visual feedback after successful copy
   - **Issue:** State change + timer creates flaky assertion timing

### Why Skipped
Timing-based tests are **inherently flaky** because:
- `setTimeout` behavior varies across test runners
- React state updates may not sync perfectly with timers
- CI/CD environments have unpredictable execution timing
- Flaky tests erode confidence in the entire test suite

**Philosophy:** Better to have **zero flaky tests** than an unstable pipeline

### Coverage
Core copy functionality is **fully tested** with 30 passing tests:
- ✅ Click to copy functionality
- ✅ Clipboard API integration
- ✅ Toast notifications
- ✅ Accessibility (aria-labels, keyboard nav)
- ✅ Error states
- ✅ Disabled states

### Manual Verification
Feature works correctly in:
- ✅ Development environment
- ✅ Production (codescribeai.com)
- ✅ All supported browsers

### When to Revisit
Consider unskipping if:
1. Adopting a test library with better timer control (e.g., `@testing-library/user-event` with fake timers)
2. Refactoring to use React Testing Library's `waitFor` with retry logic
3. Implementing proper test isolation with `vi.useFakeTimers()`

### Production Impact
✅ **NONE** - Copy button works perfectly in production

---

## 🟢 Frontend: Focus Management Edge Cases (2 tests)

### Status: ✅ **JSDOM LIMITATION**

### File
`client/src/components/__tests__/LoginModal.test.jsx`

### Skipped Tests
1. **Line 488:** `should focus email field when server returns authentication error`
   - Tests focus management after async server error
   - **Issue:** jsdom doesn't reliably simulate focus after async operations

2. **Line 523:** `should focus email field on network error`
   - Tests focus management after network failure
   - **Issue:** jsdom focus timing differs from real browsers

### Why Skipped
**jsdom limitations:**
- jsdom is a lightweight DOM implementation for Node.js testing
- Focus behavior differs significantly from real browsers
- Async focus management after network requests is particularly problematic
- Tests would pass/fail randomly based on timing

### Coverage
Core focus management is **thoroughly tested** with 10 passing tests:
- ✅ Auto-focus email field on modal open
- ✅ Focus first field with validation error
- ✅ Focus management with `flushSync` pattern
- ✅ Focus trap (Tab key navigation)
- ✅ Progressive validation (clear errors on input)

See: [FORM-VALIDATION-GUIDE.md](../components/FORM-VALIDATION-GUIDE.md) for complete focus management patterns

### Manual Verification
Focus works correctly in real browsers:
- ✅ Chrome, Firefox, Safari, Edge tested
- ✅ Server errors focus email field as expected
- ✅ Network errors focus email field as expected
- ✅ Keyboard navigation works perfectly

### Alternative Testing
Could test with:
- Playwright E2E tests (real browser)
- Cypress component tests (real browser)
- Manual testing checklist

### Production Impact
✅ **NONE** - Focus management works in all real browsers

---

## 🔵 Frontend: Debug Logging Tests (2 tests)

### Status: ✅ **DEVELOPMENT ONLY**

### File
`client/src/components/__tests__/MermaidDiagram.test.jsx`

### Skipped Test Suite
**Line 490:** `Console Logging` (entire describe block)
- 2 tests for console.warn/error during diagram rendering
- Used for debugging Mermaid initialization issues

### Why Skipped
Console logging is **for development debugging only**:
- Not relevant to production functionality
- Tests would create noise in CI/CD logs
- Console assertions are brittle and low value

### Coverage
Mermaid diagram functionality is **fully tested** with 26 passing tests:
- ✅ Diagram rendering
- ✅ Syntax validation
- ✅ Theme application
- ✅ Error handling
- ✅ Loading states
- ✅ Accessibility

### When to Unskip
**Never** - Console logging tests should remain skipped or be deleted

### Recommendation
Consider removing these tests entirely as they provide no value

### Production Impact
✅ **NONE** - Production code doesn't rely on console output

---

## 🟣 Frontend: Focus Restoration (1 test)

### Status: ✅ **JSDOM LIMITATION**

### File
`client/src/components/__tests__/QualityScore.test.jsx`

### Skipped Test
**Line 517:** `should restore focus when modal closes`
- Tests that focus returns to trigger element after modal closes
- Comment: "Test is skipped due to jsdom limitations with focus management"

### Why Skipped
Same reason as other focus tests - **jsdom doesn't reliably simulate focus restoration**

### Coverage
QualityScore modal functionality is **fully tested** with 46 passing tests:
- ✅ Modal open/close
- ✅ Expandable sections
- ✅ Score calculations
- ✅ Breakdown display
- ✅ Keyboard navigation
- ✅ Accessibility

### Manual Verification
Focus restoration works correctly in production:
- ✅ Focus returns to "View Details" button after modal closes
- ✅ Tested in Chrome, Firefox, Safari

### Production Impact
✅ **NONE** - Focus restoration works in real browsers

---

## 📋 Maintenance Guidelines

### When Adding Skipped Tests

1. **Add skip reason in test file:**
   ```javascript
   // TODO: Skipped because [specific reason]
   it.skip('test description', () => {
     // test code
   });
   ```

2. **Update this document:**
   - Add to appropriate category
   - Include file path and line number
   - Explain reason clearly
   - Document when to unskip
   - Add to total count in Quick Summary

3. **Update test counts in:**
   - `claude.md` (lines 15, 47, 284)
   - `docs/testing/README.md` (Quick Stats section)
   - `CHANGELOG.md` (for next release)

### When Unskipping Tests

1. **Remove `.skip` from test**
2. **Verify test passes:** `npm test -- path/to/test.jsx`
3. **Update this document:** Remove entry or move to "Previously Skipped" section
4. **Update test counts** in documentation

### Review Schedule

**Quarterly:** Review this document and verify:
- [ ] All skipped tests still have valid reasons
- [ ] Line numbers are accurate
- [ ] Total count matches actual skipped tests
- [ ] "When to Unskip" conditions are still relevant

### Verification Commands

```bash
# Count frontend skipped tests
cd client && npm test -- --run 2>&1 | grep "skipped"

# Count backend skipped tests
cd server && npm test 2>&1 | grep "skipped"

# Find all .skip or .xdescribe in frontend
grep -r "\.skip\|\.xdescribe\|xit(" client/src --include="*.test.jsx"

# Find all .skip or .xdescribe in backend
grep -r "\.skip\|\.xdescribe\|xit(" server/src --include="*.test.js"
```

---

## 🎯 Philosophy on Skipped Tests

### When to Skip
✅ **Good reasons to skip:**
1. **Feature not implemented** - UI exists but functionality coming later
2. **Infrastructure requirements** - Test needs external dependencies (database, Docker)
3. **Test framework limitations** - jsdom/Node.js can't simulate real browser behavior
4. **Flaky tests** - Timing/race conditions make tests unreliable
5. **Development-only tests** - Console logging, debugging helpers

### When NOT to Skip
❌ **Bad reasons to skip:**
1. "Test is failing and I don't know why" - Fix the test or the code
2. "Test takes too long" - Optimize the test or move to E2E suite
3. "I'll fix it later" - No, fix it now or delete it
4. "Test is redundant" - Delete it, don't skip it
5. "Prevents deployment" - Never ship with broken tests

### Golden Rule
**Skipped tests should be intentional, documented, and justified**

Every skipped test in this document has:
- ✅ A clear reason why it's skipped
- ✅ Documentation of what's being tested
- ✅ Verification that core functionality is covered elsewhere
- ✅ Conditions for when to unskip
- ✅ Confirmation of zero production impact

---

## 📚 Related Documentation

- [Testing README](README.md) - Test overview and quick commands
- [COMPONENT-TEST-COVERAGE.md](COMPONENT-TEST-COVERAGE.md) - Component coverage matrix
- [frontend-testing-guide.md](frontend-testing-guide.md) - React testing patterns
- [TEST-FIXES-OCT-2025.md](TEST-FIXES-OCT-2025.md) - Test debugging patterns
- [DB-MIGRATION-MANAGEMENT.MD](../database/DB-MIGRATION-MANAGEMENT.MD) - Database testing workflow
- [DATABASE-TESTING-GUIDE.md](../database/DATABASE-TESTING-GUIDE.md) - Database test procedures

---

**Last Updated:** October 29, 2025 (v2.2.0)
**Next Review:** January 29, 2026 (Quarterly)
**Owner:** Engineering Team
**Status:** ✅ All skipped tests justified and documented
