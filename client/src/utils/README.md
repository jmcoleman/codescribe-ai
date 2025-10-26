# Test Data Utilities

Developer utilities for loading test data into CodeScribe AI components during development and testing.

## Overview

The `testData.js` module provides pre-configured test data for:
- Documentation content (Markdown)
- Quality scores with detailed breakdowns
- Sample code with demo functions

This is useful for:
- Manual UI testing without API calls
- Demonstrating features (download, copy, quality scoring)
- E2E testing scenarios
- Development workflow optimization

## Exports

### Constants

#### `TEST_DOCUMENTATION`
Sample markdown documentation string demonstrating various markdown features:
- Headers and subheaders
- Code blocks (JavaScript and Bash)
- Lists (ordered and nested)
- Installation instructions
- Usage examples

#### `TEST_QUALITY_SCORE`
Sample quality score object matching the backend structure:
```javascript
{
  score: 85,
  grade: 'B',
  docType: 'README',
  breakdown: {
    overview: { score, max, suggestion },
    installation: { score, max, suggestion },
    examples: { score, max, suggestion },
    apiDocs: { score, max, suggestion },
    structure: { score, max, suggestion }
  },
  summary: {
    strengths: ['overview', 'apiDocs', 'structure'],
    improvements: ['installation', 'examples']
  }
}
```

#### `TEST_CODE`
Sample JavaScript code demonstrating:
- Simple "Hello, World!" function
- `demoDocumentationFeatures()` function with actions:
  - `download()` - Triggers markdown download
  - `copy()` - Copies markdown to clipboard
  - `score()` - Calculates and logs quality score
- Example usage patterns

### Functions

#### `createTestDataLoader(setDocumentation, setQualityScore, setCode)`

Creates a test data loader function.

**Parameters:**
- `setDocumentation` (Function) - State setter for documentation
- `setQualityScore` (Function) - State setter for quality score
- `setCode` (Function, optional) - State setter for code panel

**Returns:** Function that accepts an options object

**Options:**
- `includeCode` (boolean, default: false) - Whether to load code into CodePanel

**Example:**
```javascript
const loader = createTestDataLoader(setDoc, setScore, setCode);

// Load only doc and quality score
loader();

// Load doc, quality score, AND code
loader({ includeCode: true });
```

#### `exposeTestDataLoader(loaderFunction)`

Exposes the test data loader to the browser's `window` object for console access.

**Parameters:**
- `loaderFunction` (Function) - The loader function to expose

**Returns:** Cleanup function that removes the window property

**Example:**
```javascript
useEffect(() => {
  const loader = createTestDataLoader(setDoc, setScore, setCode);
  const cleanup = exposeTestDataLoader(loader);
  return cleanup; // Cleanup on unmount
}, []);
```

## Usage

### In the Browser Console

Once the app is running, open the browser console and use:

```javascript
// Load documentation and quality score only
window.loadTestDoc();

// Load documentation, quality score, AND code panel
window.loadTestDoc({ includeCode: true });
```

### In Component Code

```javascript
import {
  TEST_DOCUMENTATION,
  TEST_QUALITY_SCORE,
  TEST_CODE,
  createTestDataLoader
} from './utils/testData';

// Use constants directly
setDocumentation(TEST_DOCUMENTATION);
setQualityScore(TEST_QUALITY_SCORE);
setCode(TEST_CODE);

// Or use the loader
const loader = createTestDataLoader(setDoc, setScore, setCode);
loader({ includeCode: true });
```

### In Tests

```javascript
import {
  TEST_DOCUMENTATION,
  TEST_QUALITY_SCORE,
  TEST_CODE
} from '@/utils/testData';

it('should render documentation', () => {
  render(<DocPanel documentation={TEST_DOCUMENTATION} />);
  expect(screen.getByText(/Test Documentation/i)).toBeInTheDocument();
});
```

## Implementation in App.jsx

The test data loader is automatically exposed in `App.jsx`:

```javascript
useEffect(() => {
  const loadTestDoc = createTestDataLoader(setDocumentation, setQualityScore, setCode);
  const cleanup = exposeTestDataLoader(loadTestDoc);
  return cleanup;
}, [setDocumentation, setQualityScore, setCode]);
```

## Demo Code Actions

The `TEST_CODE` includes a `demoDocumentationFeatures()` function with three action methods:

### `download()`
Creates a Blob from the markdown and triggers a file download as `Test_Documentation.md`.

### `copy()`
Copies the markdown to the clipboard and logs a confirmation message.

### `score()`
Calculates a simple quality score based on:
- Word count (1 point per 50 words)
- Code blocks (10 points each)
- Caps at 100 points

**Example Usage in Console:**
```javascript
// After running the code in CodePanel
const docDemo = demoDocumentationFeatures();
docDemo.download(); // Downloads markdown file
docDemo.copy();     // Copies to clipboard
docDemo.score();    // Logs: "Quality Score: 85/100"
```

## Test Coverage

Comprehensive test suite at `src/utils/__tests__/testData.test.js`:
-  24 tests covering all exports
-  Validates data structure and content
-  Tests loader with and without code option
-  Tests window exposure and cleanup
-  Edge cases (undefined parameters, missing setters)

Run tests:
```bash
npm test -- src/utils/__tests__/testData.test.js --run
```

## Benefits

1. **No API Calls Required** - Test UI features without backend
2. **Consistent Test Data** - Same data across all developers and environments
3. **Fast Development** - Quickly populate UI with realistic content
4. **Demo-Ready** - Built-in demo functions for showcasing features
5. **Well-Tested** - 100% test coverage with comprehensive test suite

## Related Files

- [testData.js](./testData.js) - Main implementation
- [testData.test.js](./__tests__/testData.test.js) - Test suite
- [App.jsx](../App.jsx) - Integration example

---

**Last Updated:** October 26, 2025
**Version:** 1.0.0
