/**
 * Unit tests for qualityScorer service
 */

const { calculateQualityScore } = require('../qualityScorer');
const expectedOutputs = require('../../../tests/fixtures/expected-outputs');

describe('qualityScorer', () => {
  describe('calculateQualityScore', () => {
    it('should score excellent documentation with A grade', () => {
      const documentation = `# MyProject

A comprehensive tool for managing tasks efficiently with a simple API.

## Overview

This project provides a powerful task management system.

## Installation

\`\`\`bash
npm install myproject
\`\`\`

## Usage

\`\`\`javascript
const myproject = require('myproject');
myproject.init();
await myproject.run();
\`\`\`

\`\`\`javascript
// Another example
myproject.stop();
\`\`\`

## API Reference

### init(options)
Initializes the project.

### run()
Executes the main functionality.

### stop()
Stops execution.

## Features

- Easy to use
- Fast performance
`;

      const codeAnalysis = {
        functions: [
          { name: 'init', params: ['options'] },
          { name: 'run', params: [] },
          { name: 'stop', params: [] },
        ],
      };

      const result = calculateQualityScore(documentation, codeAnalysis);

      expect(result.score).toBeGreaterThanOrEqual(85);
      expect(result.grade).toMatch(/A|B/);
      expect(result.breakdown).toHaveProperty('overview');
      expect(result.breakdown).toHaveProperty('installation');
      expect(result.breakdown).toHaveProperty('examples');
      expect(result.breakdown).toHaveProperty('apiDocs');
      expect(result.breakdown).toHaveProperty('structure');
      expect(result.summary).toHaveProperty('strengths');
      expect(result.summary).toHaveProperty('improvements');
    });

    it('should score poor documentation with F grade', () => {
      const documentation = 'This is a project.';
      const codeAnalysis = {
        functions: [
          { name: 'foo', params: [] },
          { name: 'bar', params: [] },
        ],
      };

      const result = calculateQualityScore(documentation, codeAnalysis);

      expect(result.score).toBeLessThan(30);
      expect(result.grade).toBe('F');
      expect(result.breakdown.overview.status).toBe('missing');
      expect(result.breakdown.installation.status).toBe('missing');
      expect(result.breakdown.examples.count).toBe(0);
    });

    it('should handle empty documentation', () => {
      const result = calculateQualityScore('', { functions: [] });

      // Empty docs get 25 points for API (no functions to document)
      expect(result.score).toBe(25);
      expect(result.grade).toBe('F');
      expect(result.breakdown.overview.points).toBe(0);
      expect(result.breakdown.installation.points).toBe(0);
      expect(result.breakdown.examples.points).toBe(0);
      expect(result.breakdown.structure.points).toBe(0);
      expect(result.breakdown.apiDocs.points).toBe(25); // Full credit when no functions
    });

    it('should detect overview section', () => {
      const withOverview = `# MyProject\n\nThis is an overview of what this project does.`;
      const result = calculateQualityScore(withOverview, { functions: [] });

      expect(result.breakdown.overview.present).toBe(true);
      expect(result.breakdown.overview.points).toBe(20);
      expect(result.breakdown.overview.status).toBe('complete');
    });

    it('should detect installation section', () => {
      const withInstallation = `## Installation\n\n\`\`\`bash\nnpm install\n\`\`\``;
      const result = calculateQualityScore(withInstallation, { functions: [] });

      expect(result.breakdown.installation.present).toBe(true);
      expect(result.breakdown.installation.points).toBe(15);
      expect(result.breakdown.installation.status).toBe('complete');
    });

    it('should count code blocks correctly', () => {
      const oneBlock = '```javascript\nconst x = 1;\n```';
      const result1 = calculateQualityScore(oneBlock, { functions: [] });
      expect(result1.breakdown.examples.count).toBe(1);
      expect(result1.breakdown.examples.points).toBe(10);
      expect(result1.breakdown.examples.status).toBe('partial');

      const twoBlocks = '```js\nconst x = 1;\n```\n\n```js\nconst y = 2;\n```';
      const result2 = calculateQualityScore(twoBlocks, { functions: [] });
      expect(result2.breakdown.examples.count).toBe(2);
      expect(result2.breakdown.examples.points).toBe(15);

      const threeBlocks =
        '```js\nconst x = 1;\n```\n\n```js\nconst y = 2;\n```\n\n```js\nconst z = 3;\n```';
      const result3 = calculateQualityScore(threeBlocks, { functions: [] });
      expect(result3.breakdown.examples.count).toBe(3);
      expect(result3.breakdown.examples.points).toBe(20);
      expect(result3.breakdown.examples.status).toBe('complete');
    });

    it('should score API documentation coverage', () => {
      const codeAnalysis = {
        functions: [
          { name: 'init', params: [] },
          { name: 'run', params: [] },
          { name: 'stop', params: [] },
          { name: 'reset', params: [] },
        ],
      };

      // No functions documented
      const noApi = '# Project\n\nSome text.';
      const result1 = calculateQualityScore(noApi, codeAnalysis);
      expect(result1.breakdown.apiDocs.coveragePercent).toBe(0);
      expect(result1.breakdown.apiDocs.points).toBe(0);

      // 50% coverage (2 out of 4)
      const halfApi = '# API\n\n### init()\nInitializes.\n\n### run()\nRuns.';
      const result2 = calculateQualityScore(halfApi, codeAnalysis);
      expect(result2.breakdown.apiDocs.coveragePercent).toBe(50);
      expect(result2.breakdown.apiDocs.points).toBe(13); // ~50% of 25

      // 100% coverage
      const fullApi =
        '# API\n\n### init()\n### run()\n### stop()\n### reset()';
      const result3 = calculateQualityScore(fullApi, codeAnalysis);
      expect(result3.breakdown.apiDocs.coveragePercent).toBe(100);
      expect(result3.breakdown.apiDocs.points).toBe(25);
    });

    it('should give full API credit when no functions exist', () => {
      const documentation = '# Project\n\nNo functions here.';
      const codeAnalysis = { functions: [] };

      const result = calculateQualityScore(documentation, codeAnalysis);

      expect(result.breakdown.apiDocs.points).toBe(25);
      expect(result.breakdown.apiDocs.coveragePercent).toBe(100);
    });

    it('should count markdown headers', () => {
      const oneHeader = '# Title';
      const result1 = calculateQualityScore(oneHeader, { functions: [] });
      expect(result1.breakdown.structure.headers).toBe(1);
      expect(result1.breakdown.structure.points).toBe(8);

      const twoHeaders = '# Title\n\n## Section';
      const result2 = calculateQualityScore(twoHeaders, { functions: [] });
      expect(result2.breakdown.structure.headers).toBe(2);
      expect(result2.breakdown.structure.points).toBe(12);

      const threeHeaders = '# Title\n\n## Section 1\n\n## Section 2';
      const result3 = calculateQualityScore(threeHeaders, { functions: [] });
      expect(result3.breakdown.structure.headers).toBe(3);
    });

    it('should detect bullet points in structure', () => {
      const withBullets = '# Title\n\n- Item 1\n- Item 2';
      const result = calculateQualityScore(withBullets, { functions: [] });

      expect(result.breakdown.structure.hasBulletPoints).toBe(true);
    });

    it('should award full structure points for well-formatted docs', () => {
      const wellFormatted = `# Title

## Section 1

Some text here.

## Section 2

- Bullet point 1
- Bullet point 2

\`\`\`javascript
const code = true;
\`\`\`
`;

      const result = calculateQualityScore(wellFormatted, { functions: [] });

      expect(result.breakdown.structure.headers).toBeGreaterThanOrEqual(3);
      expect(result.breakdown.structure.hasCodeBlocks).toBe(true);
      expect(result.breakdown.structure.hasBulletPoints).toBe(true);
      expect(result.breakdown.structure.points).toBe(20);
      expect(result.breakdown.structure.status).toBe('complete');
    });

    it('should assign correct letter grades', () => {
      // Test different score ranges
      const testCases = [
        { score: 95, expectedGrade: 'A' },
        { score: 90, expectedGrade: 'A' },
        { score: 85, expectedGrade: 'B' },
        { score: 80, expectedGrade: 'B' },
        { score: 75, expectedGrade: 'C' },
        { score: 70, expectedGrade: 'C' },
        { score: 65, expectedGrade: 'D' },
        { score: 60, expectedGrade: 'D' },
        { score: 50, expectedGrade: 'F' },
        { score: 0, expectedGrade: 'F' },
      ];

      testCases.forEach(({ score, expectedGrade }) => {
        // Create documentation that will score exactly the target score
        let documentation = '';

        if (score >= 90) {
          documentation = `# Title

## Overview
Comprehensive description.

## Installation
\`\`\`bash
npm install
\`\`\`

## Usage
\`\`\`javascript
example1();
\`\`\`

\`\`\`javascript
example2();
\`\`\`

\`\`\`javascript
example3();
\`\`\`

## API

### func1()
### func2()

- Feature 1
- Feature 2
`;
        } else if (score >= 80) {
          documentation = `# Title

## Overview
Good description.

## Installation
\`\`\`bash
npm install
\`\`\`

## Usage
\`\`\`javascript
example();
\`\`\`

\`\`\`javascript
example2();
\`\`\`

### func1()
`;
        } else if (score >= 70) {
          documentation = `# Title

## Overview
Description here.

## Installation
Setup instructions.

\`\`\`javascript
example();
\`\`\`

### func1()
`;
        } else if (score >= 60) {
          documentation = `# Title

Overview section.

## Installation
Instructions.

### func1()
`;
        } else {
          documentation = '# Title\n\nMinimal content.';
        }

        const result = calculateQualityScore(documentation, {
          functions: [{ name: 'func1' }, { name: 'func2' }],
        });

        // Grade should match expected
        expect(result.grade).toBe(expectedGrade);
      });
    });

    it('should provide helpful suggestions', () => {
      const minimal = '# Title';
      const result = calculateQualityScore(minimal, {
        functions: [{ name: 'test' }],
      });

      expect(result.summary.topSuggestion).toBeTruthy();
      expect(typeof result.summary.topSuggestion).toBe('string');

      // Should have improvements
      expect(result.summary.improvements.length).toBeGreaterThan(0);
    });

    it('should handle missing codeAnalysis gracefully', () => {
      const documentation = '# Title\n\nSome content.';

      expect(() => {
        calculateQualityScore(documentation, {});
      }).not.toThrow();

      expect(() => {
        calculateQualityScore(documentation, { functions: null });
      }).not.toThrow();
    });

    it('should be case-insensitive for section detection', () => {
      const upperCase = '# OVERVIEW\n\nThis is the overview.';
      const result1 = calculateQualityScore(upperCase, { functions: [] });
      expect(result1.breakdown.overview.present).toBe(true);

      const mixedCase = '# InStAlLaTiOn\n\nSetup steps.';
      const result2 = calculateQualityScore(mixedCase, { functions: [] });
      expect(result2.breakdown.installation.present).toBe(true);
    });

    it('should detect alternative section names', () => {
      // "Getting Started" instead of "Installation"
      const altInstall = '## Getting Started\n\nRun npm install.';
      const result1 = calculateQualityScore(altInstall, { functions: [] });
      expect(result1.breakdown.installation.present).toBe(true);

      // "About" instead of "Overview"
      const altOverview = '## About\n\nThis project does X.';
      const result2 = calculateQualityScore(altOverview, { functions: [] });
      expect(result2.breakdown.overview.present).toBe(true);
    });

    it('should return valid quality score structure', () => {
      const documentation = '# Title\n\nContent.';
      const result = calculateQualityScore(documentation, { functions: [] });

      expect(result).toBeValidQualityScore();
    });
  });
});
