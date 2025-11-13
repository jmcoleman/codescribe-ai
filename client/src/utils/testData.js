/**
 * Test data utilities for development and testing
 * Provides sample documentation and quality scores for UI testing
 */

/**
 * Sample test documentation in Markdown format
 * Used for testing download, copy, and quality score features without API calls
 */
export const TEST_DOCUMENTATION = `# Test Documentation

## Overview
This is test documentation to demonstrate the download button functionality.

## Features
- Download as Markdown (.md file)
- Copy to clipboard
- Quality scoring system

## Example Code

\`\`\`javascript
function hello(name) {
  return \`Hello, \${name}!\`;
}

const greeting = hello('World');
console.log(greeting); // Output: Hello, World!
\`\`\`

## Installation

\`\`\`bash
npm install test-package
\`\`\`

## Usage

This is a comprehensive example showing various markdown features including code blocks, headers, and lists.

### Nested Features
- Item 1
- Item 2
  - Nested item
  - Another nested item

**This download button is working perfectly!**


---

*Generated with [CodeScribe AI](https://codescribeai.com) - AI-powered code documentation*`;

/**
 * Sample code for the CodePanel
 * Demonstrates a simple "Hello, World!" example with documentation demo actions
 */
export const TEST_CODE = `// "Hello, World!" example
function hello(name) {
  return \`Hello, \${name}!\`;
}
console.log(hello('World'));

// Demonstrate download functionality of generated docs
function demoDocumentationFeatures() {
  const markdown = \`
    # Test Documentation
    ## Overview
    Content of example document is provided here....
  \`;

  // actions
  return {
    download() {
      const blob = new Blob([markdown], { type: 'text/markdown' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'Test_Documentation.md';
      link.click();
    },
    copy() {
      navigator.clipboard.writeText(markdown);
      console.log('Markdown copied to clipboard!');
    }
  };
}

// Example usage:
const docDemo = demoDocumentationFeatures();
docDemo.download(); // triggers file download
docDemo.copy();     // copies markdown
`;

/**
 * Sample quality score data
 * Matches the structure returned by the backend quality scoring system
 */
export const TEST_QUALITY_SCORE = {
  score: 85,
  grade: 'B',
  docType: 'README',
  breakdown: {
    overview: {
      score: 18,
      max: 20,
      suggestion: 'Clear and comprehensive overview provided'
    },
    installation: {
      score: 12,
      max: 15,
      suggestion: 'Add more installation options or troubleshooting steps'
    },
    examples: {
      score: 16,
      max: 20,
      suggestion: 'Examples are good, could add more real-world scenarios'
    },
    apiDocs: {
      score: 20,
      max: 25,
      suggestion: 'Excellent API documentation coverage'
    },
    structure: {
      score: 19,
      max: 20,
      suggestion: 'Well-structured and formatted'
    }
  },
  summary: {
    strengths: ['overview', 'apiDocs', 'structure'],
    improvements: ['installation', 'examples']
  },
  inputCodeHealth: {
    score: 45,
    grade: 'F',
    breakdown: {
      comments: {
        points: 5,
        maxPoints: 20,
        issues: [
          'Only 2 out of 10 functions have comments',
          'No file-level documentation found',
          'Complex logic lacks inline explanations'
        ],
        features: [
          'Found JSDoc comment on hello() function',
          'Found inline comment explaining regex pattern'
        ]
      },
      naming: {
        points: 15,
        maxPoints: 20,
        issues: [
          'Variable "x" uses single-letter name',
          'Function "doStuff" is too vague'
        ],
        features: [
          'Most function names are descriptive',
          'Constants use UPPER_CASE convention',
          'Classes follow PascalCase naming'
        ]
      },
      existingDocs: {
        points: 0,
        maxPoints: 20,
        issues: [
          'No README.md file found',
          'No API documentation detected',
          'No usage examples in comments'
        ],
        features: []
      },
      codeStructure: {
        points: 25,
        maxPoints: 40,
        issues: [
          'Inconsistent indentation (tabs mixed with spaces)',
          'Missing semicolons in 12 locations',
          'Long functions detected (avg 45 lines)'
        ],
        features: [
          'Consistent use of ES6 arrow functions',
          'Proper module exports/imports',
          'Logical file organization'
        ]
      }
    }
  },
  improvement: 40
};

/**
 * Creates a test data loader function
 * @param {Function} setDocumentation - State setter for documentation
 * @param {Function} setQualityScore - State setter for quality score
 * @param {Function} [setCode] - Optional state setter for code
 * @returns {Function} Function that loads test data into the provided setters
 */
export const createTestDataLoader = (setDocumentation, setQualityScore, setCode) => {
  /**
   * Load test data with optional code loading
   * @param {Object} [options] - Configuration options
   * @param {boolean} [options.includeCode=false] - Whether to also load code into CodePanel
   */
  return (options = {}) => {
    const { includeCode = false } = options;

    setDocumentation(TEST_DOCUMENTATION);
    setQualityScore(TEST_QUALITY_SCORE);

    if (includeCode && setCode) {
      setCode(TEST_CODE);
    }
  };
};

/**
 * Exposes test data loader to window object for console access
 * @param {Function} loaderFunction - The test data loader function
 * @returns {Function} Cleanup function to remove the window property
 */
export const exposeTestDataLoader = (loaderFunction) => {
  window.loadTestDoc = loaderFunction;

  // Return cleanup function
  return () => {
    delete window.loadTestDoc;
  };
};

/**
 * Creates a skeleton loader test helper function
 * @param {Function} setDocumentation - Set documentation state
 * @param {Function} setQualityScore - Set quality score state
 * @param {Function} setTestSkeletonMode - Set test skeleton mode state
 * @returns {Function} Test helper function
 */
export const createSkeletonTestHelper = (setDocumentation, setQualityScore, setTestSkeletonMode) => {
  let isSkeletonShowing = false;

  return () => {
    if (!isSkeletonShowing) {
      // Show skeleton
      setDocumentation('');
      setQualityScore(null);
      setTestSkeletonMode(true);
      isSkeletonShowing = true;
      console.log('✨ Skeleton loader visible. Type loadSkeleton() to toggle off.');
    } else {
      // Hide skeleton
      setTestSkeletonMode(false);
      isSkeletonShowing = false;
      console.log('👍 Skeleton loader hidden.');
    }
  };
};

/**
 * Exposes skeleton test helper to window object for console access
 * @param {Function} helperFunction - The skeleton test helper function
 * @returns {Function} Cleanup function to remove the window property
 */
export const exposeSkeletonTestHelper = (helperFunction) => {
  window.loadSkeleton = helperFunction;

  // Return cleanup function
  return () => {
    delete window.loadSkeleton;
  };
};
