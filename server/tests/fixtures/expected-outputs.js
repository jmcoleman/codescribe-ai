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

  // Sample excellent documentation (matches classExample code)
  excellentDocumentation: `# UserService

A comprehensive service class for managing user data with async database operations.

## Installation

\`\`\`bash
npm install user-service
\`\`\`

## Usage

\`\`\`javascript
const UserService = require('user-service');

// Initialize with database connection
const userService = new UserService(db);

// Fetch a user by ID
const user = await userService.getUser('user-123');

// Create a new user
const newUser = await userService.createUser({
  email: 'user@example.com',
  name: 'John Doe'
});
\`\`\`

## API Reference

### constructor(db)

Creates a new UserService instance with a database connection.

**Parameters:**
- \`db\` (Object) - Database connection object

**Returns:** \`UserService\`

**Example:**
\`\`\`javascript
const userService = new UserService(database);
\`\`\`

### getUser(id)

Retrieves a user by their ID from the database.

**Parameters:**
- \`id\` (string) - User ID to fetch

**Returns:** \`Promise<Object>\` - User object

**Throws:** Error if user ID is not provided

**Example:**
\`\`\`javascript
const user = await userService.getUser('user-123');
\`\`\`

### createUser(data)

Creates a new user in the database.

**Parameters:**
- \`data\` (Object) - User data
  - \`email\` (string) - Required user email
  - other user properties

**Returns:** \`Promise<Object>\` - Created user object

**Throws:** Error if email is not provided

**Example:**
\`\`\`javascript
const user = await userService.createUser({ email: 'test@example.com' });
\`\`\`

### updateUser(id, data)

Updates an existing user's information.

**Parameters:**
- \`id\` (string) - User ID to update
- \`data\` (Object) - Updated user data

**Returns:** \`Promise<Object>\` - Updated user object

**Example:**
\`\`\`javascript
const updated = await userService.updateUser('user-123', { name: 'Jane' });
\`\`\`

### deleteUser(id)

Deletes a user from the database.

**Parameters:**
- \`id\` (string) - User ID to delete

**Returns:** \`Promise<void>\`

**Example:**
\`\`\`javascript
await userService.deleteUser('user-123');
\`\`\`

## Features

- Async/await database operations
- Error handling for missing required fields
- CRUD operations for user management
- Promise-based API
- Well documented methods

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
