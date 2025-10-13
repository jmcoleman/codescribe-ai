# CodeScribe AI - Test Suite

This directory contains the test suite for CodeScribe AI backend services.

## Test Structure

```
tests/
├── integration/          # Integration tests (multiple services working together)
├── e2e/                 # End-to-end tests (full user flows)
├── fixtures/            # Reusable test data
└── helpers/             # Test utilities and mocks
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (development)
npm run test:watch

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Run with coverage report
npm run test:coverage

# Run in CI mode (no watch, with coverage)
npm run test:ci

# Debug tests in VSCode
npm run test:debug
```

## Test Fixtures

Reusable test data is located in `fixtures/`:

- **sample-code.js** - JavaScript code samples for parsing tests
- **sample-react-component.jsx** - React component samples
- **expected-outputs.js** - Expected test results and structures

## Test Helpers

Utilities and mocks are located in `helpers/`:

- **setup.js** - Global test setup (runs before all tests)
- **mockClaudeClient.js** - Mock Claude API client
- **testUtils.js** - Common test utilities and assertions

## Writing Tests

### Unit Tests

Place unit tests in `__tests__/` folders next to the code they test:

```javascript
// server/src/services/__tests__/myService.test.js
const { myFunction } = require('../myService');

describe('myService', () => {
  it('should do something', () => {
    const result = myFunction('input');
    expect(result).toBe('expected');
  });
});
```

### Integration Tests

Place integration tests in `tests/integration/`:

```javascript
// tests/integration/my-flow.test.js
const { serviceA } = require('../../src/services/serviceA');
const { serviceB } = require('../../src/services/serviceB');

describe('My Flow Integration', () => {
  it('should integrate A and B', async () => {
    const resultA = await serviceA.process('input');
    const resultB = await serviceB.process(resultA);
    expect(resultB).toMatchObject({ success: true });
  });
});
```

## Coverage Requirements

Minimum coverage targets:

| Metric | Service Layer | Routes/API | Overall |
|--------|---------------|------------|---------|
| Lines  | 90%          | 80%        | 80%     |
| Branches | 80%        | 70%        | 70%     |
| Functions | 85%       | 75%        | 75%     |

## Best Practices

1. **Test behavior, not implementation** - Focus on inputs/outputs
2. **Mock external dependencies** - Claude API, file system, network
3. **Use descriptive test names** - `it('should do X when Y')`
4. **Arrange-Act-Assert pattern** - Clear test structure
5. **Keep tests independent** - No shared state
6. **Use fixtures for test data** - Consistency across tests

## Custom Matchers

The test suite includes custom Jest matchers:

### `toBeValidQualityScore(received)`

Validates quality score structure:

```javascript
expect(qualityScore).toBeValidQualityScore();
// Checks for totalScore (0-100), grade (A-F), and breakdown
```

## Debugging Tests

### VSCode Launch Configuration

Add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/server/node_modules/.bin/jest",
  "args": ["--runInBand"],
  "cwd": "${workspaceFolder}/server",
  "console": "integratedTerminal"
}
```

### Command Line Debugging

```bash
npm run test:debug
```

Then open `chrome://inspect` in Chrome and click "Inspect".

## Troubleshooting

### Tests Timeout

Increase timeout in specific tests:

```javascript
it('should handle slow operation', async () => {
  // ...
}, 30000); // 30 second timeout
```

### Tests Fail in CI but Pass Locally

Check environment variables in `.github/workflows/test.yml`.

### Coverage Too Low

Generate coverage report to see what's missing:

```bash
npm run test:coverage
open coverage/lcov-report/index.html
```

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Test Design Document](../../docs/planning/09-Test-Design.md)
