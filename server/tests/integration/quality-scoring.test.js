/**
 * Integration tests for quality scoring workflow
 * Tests the full flow: code parsing -> documentation generation -> quality scoring
 */

const { parseCode } = require('../../src/services/codeParser');
const { calculateQualityScore } = require('../../src/services/qualityScorer');
const sampleCode = require('../fixtures/sample-code');
const expectedOutputs = require('../fixtures/expected-outputs');

describe('Quality Scoring Integration', () => {
  describe('End-to-end quality assessment', () => {
    it('should parse code and score documentation', async () => {
      // Step 1: Parse the code
      const codeAnalysis = await parseCode(sampleCode.classExample, 'javascript');

      expect(codeAnalysis.functions.length).toBeGreaterThan(0);
      expect(codeAnalysis.classes.length).toBeGreaterThan(0);

      // Step 2: Score documentation based on parsed code
      const documentation = expectedOutputs.excellentDocumentation;
      const qualityScore = calculateQualityScore(documentation, codeAnalysis);

      // Debug: Log what we got
      if (qualityScore.score <= 50 || qualityScore.grade === 'F') {
        console.log('DEBUG: Quality Score Details:');
        console.log('Score:', qualityScore.score);
        console.log('Grade:', qualityScore.grade);
        console.log('Breakdown:', JSON.stringify(qualityScore.breakdown, null, 2));
        console.log('Functions in code:', codeAnalysis.functions.map(f => f.name));
        console.log('Classes in code:', codeAnalysis.classes.map(c => c.name));
      }

      expect(qualityScore).toBeValidQualityScore();
      expect(qualityScore.score).toBeGreaterThan(50);
      expect(qualityScore.grade).toMatch(/A|B|C/);
    });

    it('should give lower scores for undocumented functions', async () => {
      // Parse code with multiple functions
      const codeAnalysis = await parseCode(
        sampleCode.multipleFunctions,
        'javascript'
      );

      // Documentation that only mentions one function
      const partialDoc = `# Math Utils

This library provides math functions.

## Usage

\`\`\`javascript
add(1, 2); // returns 3
\`\`\`

## API

### add(a, b)
Adds two numbers.
`;

      const qualityScore = calculateQualityScore(partialDoc, codeAnalysis);

      // Should have lower API documentation score
      expect(qualityScore.breakdown.apiDocs.coveragePercent).toBeLessThan(100);
      expect(qualityScore.breakdown.apiDocs.status).toMatch(/missing|partial/);
    });

    it('should handle empty code gracefully', async () => {
      const codeAnalysis = await parseCode(sampleCode.emptyCode, 'javascript');
      const documentation = '# Empty Project\n\nThis is an empty project.';

      const qualityScore = calculateQualityScore(documentation, codeAnalysis);

      // Should still work, but with low score
      expect(qualityScore).toBeValidQualityScore();
      expect(qualityScore.breakdown.apiDocs.points).toBeGreaterThan(0);
      // No functions to document = full credit
    });

    it('should recognize well-documented complex code', async () => {
      const complexCode = `
        class DataProcessor {
          constructor(config) {
            this.config = config;
          }

          async processData(input) {
            return this.transform(input);
          }

          transform(data) {
            return data.map(item => this.normalize(item));
          }

          normalize(item) {
            return { ...item, processed: true };
          }
        }

        export default DataProcessor;
      `;

      const codeAnalysis = await parseCode(complexCode, 'javascript');

      const goodDoc = `# DataProcessor

A utility class for processing and transforming data.

## Installation

\`\`\`bash
npm install data-processor
\`\`\`

## Usage

\`\`\`javascript
const processor = new DataProcessor({ mode: 'strict' });
const result = await processor.processData(myData);
\`\`\`

\`\`\`javascript
// Example with transformation
const transformed = processor.transform(rawData);
\`\`\`

\`\`\`javascript
// Normalize a single item
const normalized = processor.normalize(item);
\`\`\`

## API Reference

### constructor(config)
Creates a new DataProcessor instance.

**Parameters:**
- \`config\` (Object) - Configuration options

### processData(input)
Processes input data asynchronously.

**Parameters:**
- \`input\` (Array) - Data to process
**Returns:** \`Promise<Array>\`

### transform(data)
Transforms data items.

**Parameters:**
- \`data\` (Array) - Data array
**Returns:** \`Array\`

### normalize(item)
Normalizes a single data item.

**Parameters:**
- \`item\` (Object) - Item to normalize
**Returns:** \`Object\`

## Features

- Async processing
- Data transformation
- Item normalization
- Configurable behavior
`;

      const qualityScore = calculateQualityScore(goodDoc, codeAnalysis);

      // Debug: check what we're getting
      if (qualityScore.breakdown.apiDocs.coveragePercent <= 75) {
        console.log('DEBUG complex code test:');
        console.log('Classes:', codeAnalysis.classes.map(c => ({ name: c.name, methods: c.methods.map(m => m.name) })));
        console.log('Functions:', codeAnalysis.functions.map(f => f.name));
        console.log('API Coverage:', qualityScore.breakdown.apiDocs);
      }

      expect(qualityScore.score).toBeGreaterThanOrEqual(85);
      expect(qualityScore.grade).toMatch(/A|B/);
      expect(qualityScore.breakdown.overview.status).toBe('complete');
      expect(qualityScore.breakdown.installation.status).toBe('complete');
      expect(qualityScore.breakdown.examples.status).toBe('complete');
      expect(qualityScore.breakdown.apiDocs.coveragePercent).toBeGreaterThan(75);
    });

    it('should penalize poor documentation for complex code', async () => {
      const complexCode = sampleCode.classExample;
      const codeAnalysis = await parseCode(complexCode, 'javascript');

      const poorDoc = 'UserService - handles users.';
      const qualityScore = calculateQualityScore(poorDoc, codeAnalysis);

      expect(qualityScore.score).toBeLessThan(30);
      expect(qualityScore.grade).toBe('F');
      expect(qualityScore.summary.improvements.length).toBeGreaterThan(2);
    });

    it('should provide actionable suggestions', async () => {
      const code = sampleCode.simpleFunction;
      const codeAnalysis = await parseCode(code, 'javascript');

      const minimalDoc = '# Add Function';
      const qualityScore = calculateQualityScore(minimalDoc, codeAnalysis);

      expect(qualityScore.summary.topSuggestion).toBeTruthy();
      expect(typeof qualityScore.summary.topSuggestion).toBe('string');
      expect(qualityScore.summary.improvements).toContain('installation');
      expect(qualityScore.summary.improvements).toContain('examples');
    });

    it('should handle syntax errors in code parsing', async () => {
      // Code with syntax error - parser falls back to basic analysis
      // This test verifies error recovery without failing the test suite
      // The parser catches the error and returns basic analysis instead
      const codeAnalysis = await parseCode(sampleCode.syntaxError, 'javascript');

      // Should still return a valid structure (from fallback analysis)
      expect(codeAnalysis).toBeDefined();
      expect(codeAnalysis.language).toBe('javascript');
      // Fallback analysis should not throw errors

      // Documentation can still be scored even with syntax errors in code
      const documentation = '# Project\n\nSome documentation.';
      const qualityScore = calculateQualityScore(documentation, codeAnalysis);

      expect(qualityScore).toBeValidQualityScore();
      // This ensures the full workflow works even with malformed code
    });

    it('should reward comprehensive documentation of all functions', async () => {
      const codeAnalysis = await parseCode(
        sampleCode.multipleFunctions,
        'javascript'
      );

      const comprehensiveDoc = `# Math Utilities

A collection of basic math operations.

## Installation

\`\`\`bash
npm install math-utils
\`\`\`

## Usage

\`\`\`javascript
const { add, subtract, multiply, divide } = require('math-utils');

const sum = add(5, 3);        // 8
const diff = subtract(5, 3);   // 2
const product = multiply(5, 3); // 15
const quotient = divide(6, 3);  // 2
\`\`\`

## API

### add(a, b)
Adds two numbers.

**Parameters:**
- \`a\` (number) - First number
- \`b\` (number) - Second number
**Returns:** \`number\` - Sum of a and b

### subtract(a, b)
Subtracts b from a.

**Parameters:**
- \`a\` (number) - First number
- \`b\` (number) - Second number
**Returns:** \`number\` - Difference

### multiply(a, b)
Multiplies two numbers.

**Parameters:**
- \`a\` (number) - First number
- \`b\` (number) - Second number
**Returns:** \`number\` - Product

### divide(a, b)
Divides a by b.

**Parameters:**
- \`a\` (number) - Numerator
- \`b\` (number) - Denominator
**Returns:** \`number\` - Quotient
**Throws:** \`Error\` - If b is zero
`;

      const qualityScore = calculateQualityScore(comprehensiveDoc, codeAnalysis);

      expect(qualityScore.score).toBeGreaterThanOrEqual(90);
      expect(qualityScore.grade).toBe('A');
      expect(qualityScore.breakdown.apiDocs.coveragePercent).toBe(100);
      expect(qualityScore.summary.strengths.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('Different documentation types', () => {
    it('should score README documentation', async () => {
      const codeAnalysis = await parseCode(sampleCode.simpleFunction, 'javascript');
      const readmeDoc = expectedOutputs.excellentDocumentation;

      const qualityScore = calculateQualityScore(readmeDoc, codeAnalysis);

      expect(qualityScore.breakdown).toHaveProperty('overview');
      expect(qualityScore.breakdown).toHaveProperty('installation');
      expect(qualityScore.breakdown).toHaveProperty('examples');
    });

    it('should score JSDoc-style documentation', async () => {
      const jsdocDoc = `
/**
 * Adds two numbers together
 * @param {number} a - First number
 * @param {number} b - Second number
 * @returns {number} The sum of a and b
 * @example
 * add(2, 3); // returns 5
 */
function add(a, b) {
  return a + b;
}
      `;

      const codeAnalysis = await parseCode(jsdocDoc, 'javascript');
      const qualityScore = calculateQualityScore(jsdocDoc, codeAnalysis);

      // JSDoc in code counts as documentation
      expect(qualityScore.breakdown.apiDocs.points).toBeGreaterThan(0);
    });
  });
});
