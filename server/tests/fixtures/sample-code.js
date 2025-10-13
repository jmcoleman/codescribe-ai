/**
 * Sample code fixtures for testing
 * Used across unit, integration, and E2E tests
 */

module.exports = {
  // Simple function (low complexity)
  simpleFunction: `
function add(a, b) {
  return a + b;
}

module.exports = { add };
`,

  // Complex function with JSDoc
  complexFunction: `
/**
 * Calculates the factorial of a number recursively
 * @param {number} n - The number to calculate factorial for
 * @returns {number} The factorial result
 * @throws {Error} If n is negative
 * @example
 * factorial(5); // returns 120
 */
function factorial(n) {
  if (n < 0) throw new Error('Negative numbers not allowed');
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}

module.exports = { factorial };
`,

  // Multiple functions
  multipleFunctions: `
function add(a, b) {
  return a + b;
}

function subtract(a, b) {
  return a - b;
}

function multiply(a, b) {
  return a * b;
}

function divide(a, b) {
  if (b === 0) throw new Error('Division by zero');
  return a / b;
}

module.exports = { add, subtract, multiply, divide };
`,

  // Class with methods
  classExample: `
class UserService {
  constructor(db) {
    this.db = db;
  }

  async getUser(id) {
    if (!id) throw new Error('User ID required');
    return await this.db.users.findById(id);
  }

  async createUser(data) {
    if (!data.email) throw new Error('Email required');
    return await this.db.users.create(data);
  }

  async updateUser(id, data) {
    const user = await this.getUser(id);
    return await this.db.users.update(id, { ...user, ...data });
  }

  async deleteUser(id) {
    return await this.db.users.delete(id);
  }
}

module.exports = UserService;
`,

  // Express API routes
  expressRoutes: `
const express = require('express');
const router = express.Router();

/**
 * Get user by ID
 * @route GET /users/:id
 */
router.get('/users/:id', async (req, res) => {
  try {
    const user = await db.getUser(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Create new user
 * @route POST /users
 */
router.post('/users', async (req, res) => {
  try {
    const user = await db.createUser(req.body);
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
`,

  // Arrow functions
  arrowFunctions: `
const greet = (name) => {
  return \`Hello, \${name}!\`;
};

const sum = (numbers) => numbers.reduce((acc, num) => acc + num, 0);

const asyncFetch = async (url) => {
  const response = await fetch(url);
  return response.json();
};

module.exports = { greet, sum, asyncFetch };
`,

  // Edge cases
  emptyCode: '',

  whitespaceOnly: '   \n\n   \t\t\n   ',

  syntaxError: 'function broken( { return }',

  nonJavaScript: '<html><body>Not JavaScript</body></html>',

  onlyComments: `
// This is a comment
/* This is a block comment */
/**
 * This is a JSDoc comment
 */
`,

  hugeFunction: `
function processData(data) {
  ${Array(100)
    .fill(0)
    .map((_, i) => `const var${i} = data[${i}];`)
    .join('\n  ')}
  return data;
}
`,
};
