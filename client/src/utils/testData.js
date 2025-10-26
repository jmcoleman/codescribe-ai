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

**This download button is working perfectly!**`;

/**
 * Sample code for the CodePanel
 * Demonstrates a simple "Hello, World!" example with documentation demo actions
 */
export const TEST_CODE = `// Simulate rendering a "Hello, World!" example
function hello(name) {
  return \`Hello, \${name}!\`;
}
console.log(hello('World'));

// Demo function with actions for documentation testing
function demoDocumentationFeatures() {
  const markdown = \`# Test Documentation

## Overview
This is test documentation to demonstrate the download button functionality.

## Features
- Download as Markdown (.md file)
- Copy to clipboard
- Quality scoring system

## Example Code

\\\`\\\`\\\`javascript
function hello(name) {
  return \\\`Hello, \\\${name}!\\\`;
}

const greeting = hello('World');
console.log(greeting); // Output: Hello, World!
\\\`\\\`\\\`

## Installation

\\\`\\\`\\\`bash
npm install test-package
\\\`\\\`\\\`

## Usage

This is a comprehensive example showing various markdown features including code blocks, headers, and lists.

### Nested Features
- Item 1
- Item 2
  - Nested item
  - Another nested item

**This download button is working perfectly!**\`;

  // Provide actions for documentation demo
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
    },
    score() {
      const wordCount = markdown.split(/\\s+/).length;
      const codeBlocks = (markdown.match(/\\\`\\\`\\\`/g) || []).length / 2;
      const score = Math.min(100, Math.round((wordCount / 50) + (codeBlocks * 10)));
      console.log(\`Quality Score: \${score}/100\`);
      return score;
    }
  };
}

// Example usage:
const docDemo = demoDocumentationFeatures();
docDemo.download(); // triggers file download
docDemo.copy();     // copies markdown
docDemo.score();    // logs quality score
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
  }
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
