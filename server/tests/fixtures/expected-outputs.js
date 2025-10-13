/**
 * Expected test outputs for validation
 */

module.exports = {
  // Expected quality score structures
  excellentScore: {
    totalScore: 95,
    grade: 'A',
    breakdown: {
      overview: 20,
      installation: 15,
      usage: 20,
      api: 25,
      structure: 15,
    },
  },

  goodScore: {
    totalScore: 82,
    grade: 'B',
    breakdown: {
      overview: 18,
      installation: 12,
      usage: 18,
      api: 20,
      structure: 14,
    },
  },

  averageScore: {
    totalScore: 75,
    grade: 'C',
    breakdown: {
      overview: 15,
      installation: 10,
      usage: 15,
      api: 20,
      structure: 15,
    },
  },

  poorScore: {
    totalScore: 45,
    grade: 'F',
    breakdown: {
      overview: 5,
      installation: 0,
      usage: 10,
      api: 20,
      structure: 10,
    },
  },

  emptyScore: {
    totalScore: 0,
    grade: 'F',
    breakdown: {
      overview: 0,
      installation: 0,
      usage: 0,
      api: 0,
      structure: 0,
    },
  },

  // Expected documentation structures
  readmeStructure: {
    hasTitle: true,
    hasDescription: true,
    hasInstallation: true,
    hasUsage: true,
    hasAPI: true,
    hasExamples: true,
  },

  minimalReadmeStructure: {
    hasTitle: true,
    hasDescription: true,
    hasInstallation: false,
    hasUsage: false,
    hasAPI: false,
    hasExamples: false,
  },

  // Expected parsed code structure
  parsedFunctionStructure: {
    type: 'FunctionDeclaration',
    name: expect.any(String),
    params: expect.any(Array),
    async: expect.any(Boolean),
    start: expect.any(Number),
    end: expect.any(Number),
  },

  parsedClassStructure: {
    type: 'ClassDeclaration',
    name: expect.any(String),
    methods: expect.any(Array),
    constructor: expect.any(Object),
    start: expect.any(Number),
    end: expect.any(Number),
  },

  // Sample excellent documentation
  excellentDocumentation: `# MyProject

A comprehensive tool for managing tasks efficiently with a simple API.

## Installation

\`\`\`bash
npm install myproject
\`\`\`

## Usage

\`\`\`javascript
const myproject = require('myproject');

// Initialize the project
myproject.init({
  apiKey: 'your-api-key',
  debug: true
});

// Run the main functionality
await myproject.run();
\`\`\`

## API Reference

### init(options)

Initializes the project with configuration options.

**Parameters:**
- \`options\` (Object) - Configuration object
  - \`apiKey\` (string) - Your API key
  - \`debug\` (boolean) - Enable debug mode

**Returns:** \`void\`

**Example:**
\`\`\`javascript
myproject.init({ apiKey: 'abc123', debug: false });
\`\`\`

### run()

Executes the main functionality.

**Parameters:** None

**Returns:** \`Promise<void>\`

**Example:**
\`\`\`javascript
await myproject.run();
\`\`\`

## Features

- Fast and efficient
- Easy to use API
- Well documented
- Actively maintained

## License

MIT
`,

  // Sample poor documentation
  poorDocumentation: 'This is a project. It does things.',

  // API response structures
  generateAPIResponse: {
    documentation: expect.any(String),
    qualityScore: {
      totalScore: expect.any(Number),
      grade: expect.any(String),
      breakdown: expect.any(Object),
    },
  },

  errorAPIResponse: {
    error: expect.any(String),
  },
};
