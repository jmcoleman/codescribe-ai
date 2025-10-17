# Test Fixtures

**Location:** `client/src/__tests__/fixtures/`  
**Purpose:** Shared test data for integration and component tests


This directory contains test data and sample files used across the test suite.

## Files

### large-code-sample.js

**Purpose:** Test file for validating large code submission confirmation modal.

**Specifications:**
- 1,303 lines of JavaScript code
- ~29 KB file size
- Contains 150+ utility functions (array operations, string manipulation, date handling, DOM operations, etc.)

**Used by:**
- Manual testing of ConfirmationModal component
- Validating large code detection thresholds (1000+ lines or 50KB+)
- Testing file upload functionality with realistic large files

**Usage:**
For manual testing in the browser:
1. Start dev server: npm run dev
2. Navigate to http://localhost:5173
3. Click "Upload Files" button
4. Select client/src/__tests__/fixtures/large-code-sample.js
5. Verify confirmation modal appears with file stats


## Test Organization Context

This `fixtures/` directory exists under `client/src/__tests__/` because:
- **Not component-specific:** Fixtures are shared across multiple test files
- **Integration test support:** Used by App-level integration tests
- **Reusable test data:** Can be imported by any test that needs realistic sample files

### Related Test Directories
```
client/src/
├── __tests__/              ← You are here (integration tests + fixtures)
│   ├── App-FileUpload.test.jsx
│   └── fixtures/           ← Shared test data
├── components/__tests__/   ← Component unit tests
├── data/__tests__/         ← Data validation tests
└── utils/__tests__/        ← Utility function tests
```


## Adding New Fixtures

When adding new test fixtures:
1. Use descriptive filenames that indicate the fixture's purpose
2. Add documentation in this README
3. Keep fixtures realistic and representative of actual use cases
4. Consider file size impact on the repository
