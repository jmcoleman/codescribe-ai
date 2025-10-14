/**
 * CodeParser Test Suite
 *
 * Comprehensive test cases for the codeParser service
 * Tests AST parsing, extraction, complexity calculation, and error handling
 *
 * Run with: node server/src/services/__tests__/codeParser.test.js
 */

import { parseCode } from '../codeParser.js';

// ANSI color codes for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

// Test statistics
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

/**
 * Assert helper function
 */
function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`${colors.green}✓${colors.reset} ${message}`);
    return true;
  } else {
    failedTests++;
    console.log(`${colors.red}✗${colors.reset} ${message}`);
    return false;
  }
}

/**
 * Deep equality check for objects/arrays
 */
function deepEqual(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;

  if (typeof a === 'object') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;

    for (const key of keysA) {
      if (!keysB.includes(key)) return false;
      if (!deepEqual(a[key], b[key])) return false;
    }
    return true;
  }

  return false;
}

/**
 * Test runner
 */
async function runTest(testName, testFn) {
  console.log(`\n${colors.cyan}━━━ ${testName} ━━━${colors.reset}`);
  try {
    await testFn();
  } catch (error) {
    failedTests++;
    console.log(`${colors.red}✗ Test threw error: ${error.message}${colors.reset}`);
    console.log(error.stack);
  }
}

// ============================================================================
// TEST 1: Basic Function Extraction
// ============================================================================
async function test1_BasicFunctions() {
  const code = `
    // Regular function
    function regularFunc(a, b) {
      return a + b;
    }

    // Arrow function
    const arrowFunc = (x, y) => x * y;

    // Async function
    async function asyncFunc() {
      return await fetch('/api');
    }

    // Generator function
    function* generatorFunc() {
      yield 1;
      yield 2;
    }
  `;

  const result = await parseCode(code, 'javascript');

  assert(result.functions.length === 4, 'Should extract 4 functions');
  assert(result.functions.some(f => f.name === 'regularFunc'), 'Should find regularFunc');
  assert(result.functions.some(f => f.name === 'arrowFunc'), 'Should find arrowFunc');
  assert(result.functions.some(f => f.name === 'asyncFunc'), 'Should find asyncFunc');
  assert(result.functions.some(f => f.name === 'generatorFunc'), 'Should find generatorFunc');

  const asyncFn = result.functions.find(f => f.name === 'asyncFunc');
  assert(asyncFn.async === true, 'asyncFunc should be marked as async');

  const genFn = result.functions.find(f => f.name === 'generatorFunc');
  assert(genFn.generator === true, 'generatorFunc should be marked as generator');
}

// ============================================================================
// TEST 2: Variable Destructuring
// ============================================================================
async function test2_VariableDestructuring() {
  const code = `
    // Object destructuring
    const { foo, bar } = obj;

    // Array destructuring
    const [a, b, c] = arr;

    // Nested destructuring
    const { user: { name, email } } = data;

    // Rest operator
    const { x, ...rest } = props;

    // Array rest
    const [first, ...remaining] = list;

    // Default values
    const { timeout = 1000 } = options;
  `;

  const result = await parseCode(code, 'javascript');

  assert(result.variables.length >= 7, `Should extract at least 7 variables (got ${result.variables.length})`);
  assert(result.variables.includes('foo'), 'Should extract foo from object destructuring');
  assert(result.variables.includes('bar'), 'Should extract bar from object destructuring');
  assert(result.variables.includes('a'), 'Should extract a from array destructuring');
  assert(result.variables.includes('b'), 'Should extract b from array destructuring');
  assert(result.variables.includes('rest'), 'Should extract rest from rest operator');
  assert(result.variables.includes('timeout'), 'Should extract timeout from default value');
}

// ============================================================================
// TEST 3: Complex Exports and Imports
// ============================================================================
async function test3_ExportsImports() {
  const code = `
    // Named exports
    export const API_URL = 'https://api.example.com';
    export function helper() {}

    // Define variables before exporting
    const foo = 'foo';
    const bar = 'bar';
    const internalName = 'internal';

    // Export list
    export { foo, bar };

    // Aliased export
    export { internalName as externalName };

    // Default export
    export default class MainComponent {}

    // Re-export all
    export * from './utils';

    // Re-export namespace
    export * as helpers from './helpers';

    // Import default
    import React from 'react';

    // Import named
    import { useState, useEffect } from 'react';

    // Import namespace
    import * as utils from './utils';

    // Import aliased
    import { something as renamed } from './lib';

    // Side-effect import
    import './styles.css';
  `;

  const result = await parseCode(code, 'javascript');

  // Check exports
  assert(result.exports.length >= 7, `Should extract at least 7 exports (got ${result.exports.length})`);

  const aliasedExport = result.exports.find(e => e.name === 'externalName');
  assert(aliasedExport !== undefined, 'Should find aliased export');
  if (aliasedExport) {
    assert(aliasedExport.localName === 'internalName', 'Should track local name for aliased export');
  }

  const reExportAll = result.exports.find(e => e.type === 'all' && e.source === './utils');
  assert(reExportAll !== undefined, 'Should find re-export all');

  // Check imports
  assert(result.imports.length >= 5, `Should extract at least 5 imports (got ${result.imports.length})`);

  const defaultImport = result.imports.find(i => i.source === 'react' &&
    i.specifiers.some(s => s.type === 'default'));
  assert(defaultImport !== undefined, 'Should find default import');

  const namespaceImport = result.imports.find(i =>
    i.specifiers.some(s => s.type === 'namespace'));
  assert(namespaceImport !== undefined, 'Should find namespace import');

  const sideEffectImport = result.imports.find(i =>
    i.specifiers.some(s => s.type === 'side-effect'));
  assert(sideEffectImport !== undefined, 'Should find side-effect import');
}

// ============================================================================
// TEST 4: Class Analysis with Advanced Features
// ============================================================================
async function test4_ClassAnalysis() {
  const code = `
    class MyClass {
      // Public field
      publicField = 'value';

      // Private field
      #privateField = 'secret';

      // Static field
      static staticField = 'static';

      // Constructor
      constructor(name) {
        this.name = name;
      }

      // Regular method
      regularMethod(x, y) {
        return x + y;
      }

      // Async method
      async asyncMethod() {
        return await this.fetch();
      }

      // Generator method
      *generatorMethod() {
        yield 1;
        yield 2;
      }

      // Static method
      static staticMethod() {
        return 'static';
      }

      // Getter
      get value() {
        return this.#privateField;
      }

      // Setter
      set value(val) {
        this.#privateField = val;
      }

      // Computed property name
      [Symbol.iterator]() {
        return this.generatorMethod();
      }
    }
  `;

  const result = await parseCode(code, 'javascript');

  assert(result.classes.length === 1, 'Should extract 1 class');

  const myClass = result.classes[0];
  assert(myClass.name === 'MyClass', 'Should find class name');
  assert(myClass.methods.length >= 10, `Should extract at least 10 members (got ${myClass.methods.length})`);

  const asyncMethod = myClass.methods.find(m => m.name === 'asyncMethod');
  assert(asyncMethod !== undefined, 'Should find asyncMethod');
  assert(asyncMethod.async === true, 'asyncMethod should be marked as async');

  const genMethod = myClass.methods.find(m => m.name === 'generatorMethod');
  assert(genMethod !== undefined, 'Should find generatorMethod');
  assert(genMethod.generator === true, 'generatorMethod should be marked as generator');

  const staticMethod = myClass.methods.find(m => m.name === 'staticMethod');
  assert(staticMethod !== undefined, 'Should find staticMethod');
  assert(staticMethod.static === true, 'staticMethod should be marked as static');

  const getter = myClass.methods.find(m => m.kind === 'get');
  assert(getter !== undefined, 'Should find getter');

  const setter = myClass.methods.find(m => m.kind === 'set');
  assert(setter !== undefined, 'Should find setter');
}

// ============================================================================
// TEST 5: Cyclomatic Complexity Calculation
// ============================================================================
async function test5_CyclomaticComplexity() {
  const code = `
    function complexFunction(x, y, z) {
      // Base complexity: 1

      if (x > 0) {              // +1
        return x;
      } else if (x < 0) {       // +1
        return -x;
      }

      for (let i = 0; i < y; i++) {  // +1
        if (i % 2 === 0) {           // +1
          continue;
        }
      }

      while (z > 0) {           // +1
        z--;
      }

      const result = x > 0 ? y : z;  // +1 (ternary)

      switch (result) {         // +2 (2 cases)
        case 1:
          return 'one';
        case 2:
          return 'two';
        default:
          return 'other';
      }

      return (x && y) || z;     // +2 (logical operators)
    }
  `;

  const result = await parseCode(code, 'javascript');

  // Expected complexity: 1 + 2 (if/else-if) + 2 (for + if inside) + 1 (while) + 1 (ternary) + 2 (switch cases) + 2 (logical) = 11
  assert(result.cyclomaticComplexity >= 10,
    `Cyclomatic complexity should be >= 10 (got ${result.cyclomaticComplexity})`);

  assert(result.complexity === 'simple' || result.complexity === 'medium',
    `Overall complexity should be simple or medium (got ${result.complexity})`);
}

// ============================================================================
// TEST 6: Comprehensive Metrics
// ============================================================================
async function test6_ComprehensiveMetrics() {
  const code = `
    // This is a comment
    /* Multi-line
       comment */

    function foo(a, b, c) {
      return a + b + c;
    }

    class Bar {
      method1() {}
      method2() {}
    }

    export { foo, Bar };
    import React from 'react';

    const x = 10;
    const y = 20;
  `;

  const result = await parseCode(code, 'javascript');

  assert(result.metrics !== undefined, 'Should have metrics object');
  assert(result.metrics.totalLines > 0, 'Should count total lines');
  assert(result.metrics.codeLines > 0, 'Should count code lines');
  assert(result.metrics.commentLines >= 2, 'Should count comment lines');
  assert(result.metrics.blankLines >= 0, 'Should count blank lines');
  assert(result.metrics.commentRatio !== undefined, 'Should calculate comment ratio');
  assert(result.metrics.totalFunctions >= 1, 'Should count at least 1 function');
  assert(result.metrics.totalClasses === 1, 'Should count classes');
  assert(result.metrics.totalExports >= 2, 'Should count exports');
  assert(result.metrics.totalImports >= 1, 'Should count imports');
  assert(result.metrics.totalVariables >= 2, 'Should count variables');
  assert(result.metrics.cyclomaticComplexity >= 1, 'Should calculate cyclomatic complexity');
  assert(result.metrics.maintainabilityIndex !== undefined, 'Should calculate maintainability index');
}

// ============================================================================
// TEST 7: Arrow Functions in Various Contexts
// ============================================================================
async function test7_ArrowFunctionsContexts() {
  const code = `
    // Variable assignment
    const func1 = () => {};

    // Object property
    const obj = {
      method: () => {},
      nested: {
        deep: () => {}
      }
    };

    // Direct assignment
    obj.handler = () => {};

    // Array of functions
    const handlers = [
      () => {},
      (x) => x * 2,
      async (y) => y + 1
    ];

    // Function argument (callback)
    array.map((item) => item.name);

    // Single parameter arrow function
    const single = x => x * 2;
  `;

  const result = await parseCode(code, 'javascript');

  assert(result.functions.length >= 4,
    `Should extract at least 4 named arrow functions (got ${result.functions.length})`);

  assert(result.functions.some(f => f.name === 'func1'), 'Should find func1');
  assert(result.functions.some(f => f.name === 'method'), 'Should find method in object');
  assert(result.functions.some(f => f.name === 'handler'), 'Should find handler assignment');
  assert(result.functions.some(f => f.type === 'arrow'), 'Should mark functions as arrow type');
}

// ============================================================================
// TEST 8: Error Handling and Fallback
// ============================================================================
async function test8_ErrorHandling() {
  // Suppress console.error during error handling tests to prevent CI/CD failures
  const originalError = console.error;
  console.error = jest.fn();

  try {
    // Test 1: Syntax error - should fall back to basic analysis
    const invalidCode = `
      function broken() {
        return x +;  // Syntax error
      }
    `;

    const result1 = await parseCode(invalidCode, 'javascript');
    assert(result1 !== undefined, 'Should return result even with syntax error');
    assert(result1.language === 'javascript', 'Should preserve language in fallback');
    // Verify console.error was called for error reporting
    assert(console.error.mock.calls.length > 0, 'Should log parse error');

    // Test 2: Python code - should use basic analysis
    const pythonCode = `
def hello(name):
    return f"Hello, {name}!"

class MyClass:
    def method(self):
        pass
    `;

    const result2 = await parseCode(pythonCode, 'python');
    assert(result2 !== undefined, 'Should handle Python code');
    assert(result2.language === 'python', 'Should identify as Python');
    assert(result2.functions.length >= 1, 'Should find Python functions with regex');
    assert(result2.classes.length >= 1, 'Should find Python classes with regex');
  } finally {
    // Restore original console.error
    console.error = originalError;
  }
}

// ============================================================================
// TEST 9: Parameter Extraction (Destructuring, Defaults, Rest)
// ============================================================================
async function test9_ParameterExtraction() {
  const code = `
    // Simple parameters
    function simple(a, b, c) {}

    // Default parameters
    function withDefaults(x = 10, y = 20) {}

    // Rest parameters
    function withRest(first, ...rest) {}

    // Destructured object parameter
    function destructured({ name, age }) {}

    // Destructured array parameter
    function arrayParam([first, second]) {}

    // Complex mix
    function complex({ x = 5, y }, z = 10, ...rest) {}
  `;

  const result = await parseCode(code, 'javascript');

  const simpleFn = result.functions.find(f => f.name === 'simple');
  assert(simpleFn.params.length === 3, 'Simple function should have 3 params');
  assert(deepEqual(simpleFn.params, ['a', 'b', 'c']), 'Should extract simple param names');

  const restFn = result.functions.find(f => f.name === 'withRest');
  assert(restFn.params.some(p => p.startsWith('...')), 'Should detect rest parameter');

  const destructuredFn = result.functions.find(f => f.name === 'destructured');
  assert(destructuredFn.params.some(p => p.includes('destructured')),
    'Should indicate destructured parameters');
}

// ============================================================================
// TEST 10: Edge Cases and Special Scenarios
// ============================================================================
async function test10_EdgeCases() {
  // Test 1: Empty code
  const result1 = await parseCode('', 'javascript');
  assert(result1.functions.length === 0, 'Empty code should have no functions');
  assert(result1.classes.length === 0, 'Empty code should have no classes');

  // Test 2: Only comments
  const result2 = await parseCode('// Just a comment\n/* Another comment */', 'javascript');
  assert(result2.metrics.commentLines >= 1, 'Should count comment-only lines');

  // Test 3: Anonymous function expression
  const code3 = `const foo = function() { return 42; };`;
  const result3 = await parseCode(code3, 'javascript');
  assert(result3.functions.length === 1, 'Should extract anonymous function expression');
  assert(result3.functions[0].name === 'foo', 'Should use variable name for anonymous function');

  // Test 4: Immediately Invoked Function Expression (IIFE)
  const code4 = `(function() { console.log('IIFE'); })();`;
  const result4 = await parseCode(code4, 'javascript');
  assert(result4.functions.length >= 1, 'Should detect IIFE');

  // Test 5: Export with declaration
  const code5 = `export const myFunc = () => 'hello';`;
  const result5 = await parseCode(code5, 'javascript');
  assert(result5.exports.length >= 1, 'Should extract export');
  assert(result5.functions.length >= 1, 'Should extract function from export');
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================
async function runAllTests() {
  console.log(`${colors.blue}╔═══════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.blue}║     CodeParser Test Suite                    ║${colors.reset}`);
  console.log(`${colors.blue}╚═══════════════════════════════════════════════╝${colors.reset}`);
  console.log();

  const startTime = Date.now();

  await runTest('Test 1: Basic Function Extraction', test1_BasicFunctions);
  await runTest('Test 2: Variable Destructuring', test2_VariableDestructuring);
  await runTest('Test 3: Complex Exports and Imports', test3_ExportsImports);
  await runTest('Test 4: Class Analysis with Advanced Features', test4_ClassAnalysis);
  await runTest('Test 5: Cyclomatic Complexity Calculation', test5_CyclomaticComplexity);
  await runTest('Test 6: Comprehensive Metrics', test6_ComprehensiveMetrics);
  await runTest('Test 7: Arrow Functions in Various Contexts', test7_ArrowFunctionsContexts);
  await runTest('Test 8: Error Handling and Fallback', test8_ErrorHandling);
  await runTest('Test 9: Parameter Extraction', test9_ParameterExtraction);
  await runTest('Test 10: Edge Cases and Special Scenarios', test10_EdgeCases);

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  // Print summary
  console.log();
  console.log(`${colors.blue}╔═══════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.blue}║     Test Summary                              ║${colors.reset}`);
  console.log(`${colors.blue}╚═══════════════════════════════════════════════╝${colors.reset}`);
  console.log();
  console.log(`  Total Tests:   ${totalTests}`);
  console.log(`  ${colors.green}Passed:        ${passedTests}${colors.reset}`);
  console.log(`  ${colors.red}Failed:        ${failedTests}${colors.reset}`);
  console.log(`  Duration:      ${duration}s`);
  console.log();

  if (failedTests === 0) {
    console.log(`${colors.green}✓ All tests passed!${colors.reset}`);
  } else {
    const passRate = ((passedTests / totalTests) * 100).toFixed(1);
    console.log(`${colors.yellow}⚠ ${failedTests} test(s) failed (${passRate}% pass rate)${colors.reset}`);
  }
}

// Jest test suite wrapper
describe('CodeParser Service', () => {
  it('should pass all custom test suite assertions', async () => {
    // Run the custom test suite
    await runAllTests();

    // Assert that all tests passed
    expect(failedTests).toBe(0);
    expect(passedTests).toBeGreaterThan(0);
  }, 30000); // 30 second timeout for comprehensive tests
});
