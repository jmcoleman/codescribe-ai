# Test Design Document - CodeScribe AI

**Project:** CodeScribe AI
**Document Version:** 1.0
**Last Updated:** October 13, 2025
**Status:** Active

---

## Table of Contents

1. [Overview](#overview)
2. [Testing Strategy](#testing-strategy)
3. [Test Levels](#test-levels)
4. [Test Infrastructure](#test-infrastructure)
5. [Unit Tests Specification](#unit-tests-specification)
6. [Integration Tests Specification](#integration-tests-specification)
7. [Test Data & Fixtures](#test-data--fixtures)
8. [Coverage Requirements](#coverage-requirements)
9. [Running Tests](#running-tests)

---

## Overview

### Purpose

This document defines the comprehensive testing strategy for CodeScribe AI, ensuring code quality, reliability, and maintainability across all layers of the application.

### Testing Goals

- **Quality Assurance**: Catch bugs before production
- **Regression Prevention**: Ensure new changes don't break existing functionality
- **Documentation**: Tests serve as living documentation
- **Refactoring Safety**: Enable confident code changes
- **Fast Feedback**: Quick test execution for rapid development

### Testing Philosophy

- **Test Pyramid**: More unit tests, fewer integration tests, minimal E2E tests
- **Fast & Reliable**: Tests should run quickly and consistently
- **Isolated**: Each test should be independent
- **Readable**: Tests should be easy to understand
- **Maintainable**: Tests should be easy to update

---

## Testing Strategy

### Test Pyramid

```
           /\
          /  \
         / E2E \      5-10% - Full user flows
        /______\
       /        \
      /Integration\ 20-30% - Service interactions
     /____________\
    /              \
   /   Unit Tests   \  60-70% - Individual functions
  /__________________\
```

### Coverage by Layer

| Layer | Unit | Integration | E2E | Total Coverage |
|-------|------|-------------|-----|----------------|
| Services | 90% | 20% | - | 90%+ |
| API Routes | 80% | 30% | 10% | 85%+ |
| Utils | 95% | - | - | 95%+ |
| Overall | - | - | - | 80%+ |

---

## Test Levels

### 1. Unit Tests

**Purpose**: Test individual functions/classes in isolation

**Characteristics**:
- Fast execution (< 1ms per test)
- No external dependencies
- Mocked dependencies
- Test single responsibility

**Location**: `src/**/__tests__/*.test.js` (co-located with source)

**Examples**:
- `qualityScorer.test.js` - Quality scoring algorithm (18 tests) ✅
- `codeParser.test.js` - Code parsing logic (71 tests) ✅
- `claudeClient.test.js` - API client methods (24 tests) ✅
- `docGenerator.test.js` - Documentation generation (33 tests) ✅

---

### 2. Integration Tests

**Purpose**: Test interaction between multiple components

**Characteristics**:
- Moderate execution time (< 100ms per test)
- Real implementations where possible
- Mock only external services (Claude API)
- Test data flow between services

**Location**: `tests/integration/*.test.js`

**Examples**:
- `quality-scoring.test.js` - Parser + Quality Scorer (10 tests) ✅

---

## Test Infrastructure

### Testing Framework

**Jest** - Chosen for:
- Zero configuration
- Built-in mocking
- Coverage reporting
- Fast execution
- Watch mode

### Test Structure

```javascript
describe('Service/Component Name', () => {
  describe('methodName', () => {
    beforeEach(() => {
      // Setup
    });

    afterEach(() => {
      // Cleanup
    });

    it('should do something specific', () => {
      // Arrange
      const input = 'test';

      // Act
      const result = method(input);

      // Assert
      expect(result).toBe(expected);
    });
  });
});
```

---

## Unit Tests Specification

### 1. qualityScorer.test.js ✅

**Status**: Complete (18 test cases)

**Coverage**:
- Score excellent/poor/empty documentation
- Detect overview and installation sections
- Count code blocks and headers
- Score API documentation coverage
- Assign letter grades
- Provide suggestions
- Handle edge cases

### 2. codeParser.test.js ✅

**Status**: Complete (71 test cases)

**Coverage**:
- Function/variable/class extraction
- Exports and imports
- Cyclomatic complexity
- Comprehensive metrics
- Error handling
- Edge cases

### 3. claudeClient.test.js ✅

**Status**: Complete (24 test cases)

**Coverage**:
- API initialization
- Standard generation with retries
- Streaming generation
- Error handling (rate limits, network, auth)
- Exponential backoff
- Edge cases (long prompts, concurrent requests)

### 4. docGenerator.test.js ✅

**Status**: Complete (33 test cases)

**Coverage**:
- README/JSDoc/API/Architecture generation
- Prompt building for all doc types
- Code analysis integration
- Streaming support
- Error propagation
- Edge cases (empty code, large files)

---

## Integration Tests Specification

### 1. quality-scoring.test.js ✅

**Status**: Complete (10 test cases)

**Coverage**:
- Parse code and score documentation
- Handle varying documentation quality
- Provide actionable suggestions
- Handle syntax errors
- Score different doc types

---

## Test Data & Fixtures

### Location: `tests/fixtures/`

**Files**:
- `sample-code.js` - Reusable JavaScript code samples ✅
- `sample-react-component.jsx` - React component samples ✅
- `expected-outputs.js` - Expected test results ✅

### Mock Helpers: `tests/helpers/`

**Files**:
- `setup.js` - Global test setup and custom matchers ✅
- `mockClaudeClient.js` - Mock Claude API client ✅
- `testUtils.js` - Common test utilities ✅

---

## Coverage Requirements

### Overall Coverage Targets

| Metric | Target | Minimum |
|--------|--------|---------|
| Lines | 85% | 80% |
| Branches | 75% | 70% |
| Functions | 80% | 75% |
| Statements | 85% | 80% |

### Service Layer (Higher Standards)

| Metric | Target | Minimum |
|--------|--------|---------|
| Lines | 95% | 90% |
| Branches | 85% | 80% |
| Functions | 90% | 85% |
| Statements | 95% | 90% |

---

## Running Tests

### Quick Start

```bash
# Navigate to server directory
cd server

# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run specific test
npm test -- qualityScorer.test.js
```

### Test Commands

| Command | Description |
|---------|-------------|
| `npm test` | Run all tests |
| `npm run test:watch` | Watch mode |
| `npm run test:coverage` | Generate coverage |
| `npm run test:unit` | Unit tests only |
| `npm run test:integration` | Integration tests only |
| `npm run test:verbose` | Verbose output |
| `npm run test:debug` | Debug mode |

---

## Test Metrics

### Current Status (Phase 1 Complete)

| Component | Tests | Status |
|-----------|-------|--------|
| qualityScorer | 18 | ✅ Complete |
| codeParser | 71 | ✅ Complete |
| claudeClient | 24 | ✅ Complete |
| docGenerator | 33 | ✅ Complete |
| quality-scoring | 10 | ✅ Complete |
| **TOTAL** | **156** | ✅ **All Passing** |

---

## Next Steps

### Short-term (Week 1)
- Add API route integration tests
- Generate and review coverage report
- Set up pre-commit hooks
- Configure Codecov integration

### Long-term (Week 2+)
- Add E2E tests for critical flows
- Add frontend tests (React components)
- Add performance tests
- Monitor coverage trends

---

## References

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
- [Test Implementation Summary](TEST-IMPLEMENTATION-SUMMARY.md)

---

**Document Owner**: Development Team
**Last Updated**: October 13, 2025
**Status**: ✅ Phase 1 Complete - 156 tests implemented and passing
