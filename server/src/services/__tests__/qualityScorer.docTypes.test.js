/**
 * Unit tests for doc-type specific quality scoring
 *
 * Tests the scoring criteria for each documentation type:
 * - JSDOC: Function coverage, parameters, returns, examples, types
 * - API: Endpoints, requests, responses, examples, errors
 * - OPENAPI: Structure, endpoints, schemas, parameters, descriptions
 * - ARCHITECTURE: Overview, components, data flow, diagrams, decisions
 */

import { calculateQualityScore } from '../qualityScorer.js';

describe('Doc-Type Specific Quality Scoring', () => {
  // ==========================================================================
  // JSDOC SCORING TESTS (100 points total)
  // ==========================================================================
  describe('JSDOC Scoring', () => {
    const mockAnalysis = {
      functions: [
        { name: 'getUserById', params: ['userId'] },
        { name: 'createUser', params: ['userData'] },
        { name: 'updateUser', params: ['userId', 'updates'] },
      ],
      classes: [],
    };

    describe('Function Coverage (30 points)', () => {
      it('should award full points when all functions are documented', () => {
        const doc = `# JSDoc: api.js

## Annotated Source Code

\`\`\`javascript
/**
 * Gets a user by ID
 * @param {string} userId - The user ID
 * @returns {Promise<User>} The user object
 */
function getUserById(userId) {}

/**
 * Creates a new user
 * @param {object} userData - User data
 * @returns {Promise<User>} Created user
 */
function createUser(userData) {}

/**
 * Updates an existing user
 * @param {string} userId - User ID
 * @param {object} updates - Updates to apply
 * @returns {Promise<User>} Updated user
 */
function updateUser(userId, updates) {}
\`\`\``;

        const result = calculateQualityScore(doc, mockAnalysis, 'JSDOC');

        expect(result.breakdown.functionCoverage.points).toBe(30);
        expect(result.breakdown.functionCoverage.coveragePercent).toBe(100);
        expect(result.breakdown.functionCoverage.status).toBe('complete');
      });

      it('should award partial points for partial coverage', () => {
        const doc = `# JSDoc

\`\`\`javascript
/**
 * Gets a user by ID
 * @param {string} userId
 */
function getUserById(userId) {}
\`\`\``;

        const result = calculateQualityScore(doc, mockAnalysis, 'JSDOC');

        expect(result.breakdown.functionCoverage.coveragePercent).toBe(33);
        expect(result.breakdown.functionCoverage.points).toBe(10); // ~33% of 30
        expect(result.breakdown.functionCoverage.status).toBe('missing');
      });

      it('should award zero points when no functions are documented', () => {
        const doc = `# JSDoc

Some documentation without function names.`;

        const result = calculateQualityScore(doc, mockAnalysis, 'JSDOC');

        expect(result.breakdown.functionCoverage.coveragePercent).toBe(0);
        expect(result.breakdown.functionCoverage.points).toBe(0);
        expect(result.breakdown.functionCoverage.status).toBe('missing');
      });
    });

    describe('Parameter Documentation (25 points)', () => {
      it('should award full points when all params have @param tags', () => {
        const doc = `\`\`\`javascript
/**
 * @param {string} userId - User ID
 * @param {object} userData - User data
 * @param {string} anotherUserId - Another user ID
 * @param {object} updates - Updates object
 */
\`\`\``;

        const result = calculateQualityScore(doc, mockAnalysis, 'JSDOC');

        expect(result.breakdown.parameters.count).toBe(4);
        expect(result.breakdown.parameters.points).toBe(25);
        expect(result.breakdown.parameters.status).toBe('complete');
      });

      it('should award partial points for some @param tags', () => {
        const doc = `\`\`\`javascript
/**
 * @param {string} userId
 * @param {object} userData
 */
\`\`\``;

        const result = calculateQualityScore(doc, mockAnalysis, 'JSDOC');

        expect(result.breakdown.parameters.count).toBe(2);
        expect(result.breakdown.parameters.points).toBe(13); // 2/4 = 50% of 25
        expect(result.breakdown.parameters.status).toBe('partial');
      });

      it('should award zero points when no @param tags exist', () => {
        const doc = `\`\`\`javascript
/**
 * A function that does something
 */
function doSomething() {}
\`\`\``;

        const result = calculateQualityScore(doc, mockAnalysis, 'JSDOC');

        expect(result.breakdown.parameters.count).toBe(0);
        expect(result.breakdown.parameters.points).toBe(0);
        expect(result.breakdown.parameters.status).toBe('missing');
      });
    });

    describe('Return Documentation (20 points)', () => {
      it('should award full points for @returns tags', () => {
        const doc = `\`\`\`javascript
/**
 * @returns {User} The user object
 */
function getUserById() {}

/**
 * @returns {User} Created user
 */
function createUser() {}

/**
 * @returns {User} Updated user
 */
function updateUser() {}
\`\`\``;

        const result = calculateQualityScore(doc, mockAnalysis, 'JSDOC');

        expect(result.breakdown.returns.count).toBe(3);
        expect(result.breakdown.returns.points).toBe(20);
        expect(result.breakdown.returns.status).toBe('complete');
      });

      it('should handle @return (without s) tags', () => {
        const doc = `\`\`\`javascript
/**
 * @return {User} The user
 */
function getUser() {}
\`\`\``;

        const result = calculateQualityScore(doc, mockAnalysis, 'JSDOC');

        expect(result.breakdown.returns.count).toBe(1);
        expect(result.breakdown.returns.present).toBe(true);
      });

      it('should award partial points for some @returns tags', () => {
        const doc = `\`\`\`javascript
/**
 * @returns {User} The user
 */
function getUserById() {}
\`\`\``;

        const result = calculateQualityScore(doc, mockAnalysis, 'JSDOC');

        expect(result.breakdown.returns.count).toBe(1);
        expect(result.breakdown.returns.status).toBe('missing'); // 1/3 < 50%
      });
    });

    describe('Examples (15 points)', () => {
      it('should award full points for multiple @example tags', () => {
        const doc = `\`\`\`javascript
/**
 * @example
 * const user = await getUserById('123');
 *
 * @example
 * const newUser = await createUser({ name: 'John' });
 */
\`\`\``;

        const result = calculateQualityScore(doc, mockAnalysis, 'JSDOC');

        expect(result.breakdown.examples.exampleTags).toBe(2);
        expect(result.breakdown.examples.points).toBe(15);
        expect(result.breakdown.examples.status).toBe('complete');
      });

      it('should award partial points for one @example tag', () => {
        const doc = `\`\`\`javascript
/**
 * @example
 * const user = await getUserById('123');
 */
\`\`\``;

        const result = calculateQualityScore(doc, mockAnalysis, 'JSDOC');

        expect(result.breakdown.examples.exampleTags).toBe(1);
        expect(result.breakdown.examples.points).toBe(10);
        expect(result.breakdown.examples.status).toBe('partial');
      });

      it('should award zero points when no @example tags exist', () => {
        const doc = `\`\`\`javascript
/**
 * Gets a user
 * @param {string} id
 * @returns {User}
 */
\`\`\``;

        const result = calculateQualityScore(doc, mockAnalysis, 'JSDOC');

        expect(result.breakdown.examples.exampleTags).toBe(0);
        expect(result.breakdown.examples.points).toBe(0);
        expect(result.breakdown.examples.status).toBe('missing');
      });
    });

    describe('Type Annotations (10 points)', () => {
      it('should award full points for typed @param and @returns', () => {
        const doc = `\`\`\`javascript
/**
 * @param {string} userId - The user ID
 * @param {object} data - User data
 * @returns {Promise<User>} The user
 */
\`\`\``;

        const result = calculateQualityScore(doc, mockAnalysis, 'JSDOC');

        expect(result.breakdown.types.typedParams).toBe(2);
        expect(result.breakdown.types.typedReturns).toBe(1);
        expect(result.breakdown.types.points).toBe(10);
        expect(result.breakdown.types.status).toBe('complete');
      });

      it('should detect missing type annotations', () => {
        const doc = `\`\`\`javascript
/**
 * @param userId - The user ID
 * @param data - User data
 * @returns The user
 */
\`\`\``;

        const result = calculateQualityScore(doc, mockAnalysis, 'JSDOC');

        expect(result.breakdown.types.typedParams).toBe(0);
        expect(result.breakdown.types.typedReturns).toBe(0);
        expect(result.breakdown.types.points).toBe(0);
      });
    });

    describe('Complete JSDOC Scoring', () => {
      it('should score excellent JSDoc with A grade', () => {
        const doc = `# JSDoc: UserService.js

## Overview

JSDoc documentation for the user service module.

## Annotated Source Code

\`\`\`javascript
/**
 * @module UserService
 * @description User management functions
 */

/**
 * Retrieves a user by their ID
 * @async
 * @function getUserById
 * @param {string} userId - The unique user identifier
 * @returns {Promise<User>} The user object
 * @throws {Error} If user not found
 * @example
 * const user = await getUserById('abc123');
 * console.log(user.name);
 */
async function getUserById(userId) {
  return await db.users.find(userId);
}

/**
 * Creates a new user
 * @async
 * @function createUser
 * @param {object} userData - The user data
 * @param {string} userData.name - User's name
 * @param {string} userData.email - User's email
 * @returns {Promise<User>} The created user
 * @throws {ValidationError} If data is invalid
 * @example
 * const newUser = await createUser({ name: 'John', email: 'john@example.com' });
 */
async function createUser(userData) {
  return await db.users.create(userData);
}

/**
 * Updates an existing user
 * @async
 * @function updateUser
 * @param {string} userId - The user ID
 * @param {object} updates - Fields to update
 * @returns {Promise<User>} The updated user
 * @example
 * const updated = await updateUser('abc123', { name: 'Jane' });
 */
async function updateUser(userId, updates) {
  return await db.users.update(userId, updates);
}
\`\`\``;

        const result = calculateQualityScore(doc, mockAnalysis, 'JSDOC');

        expect(result.score).toBeGreaterThanOrEqual(90);
        expect(result.grade).toBe('A');
        expect(result.docType).toBe('JSDOC');
      });

      it('should score minimal JSDoc with F grade', () => {
        const doc = `# JSDoc

Some documentation.`;

        const result = calculateQualityScore(doc, mockAnalysis, 'JSDOC');

        expect(result.score).toBeLessThan(60);
        expect(result.grade).toBe('F');
      });
    });
  });

  // ==========================================================================
  // API SCORING TESTS (100 points total)
  // ==========================================================================
  describe('API Scoring', () => {
    const mockAnalysis = {
      functions: [
        { name: 'getUsers', params: [] },
        { name: 'createUser', params: ['data'] },
      ],
      classes: [],
    };

    describe('Endpoint Coverage (25 points)', () => {
      it('should award full points for multiple documented endpoints', () => {
        const doc = `# API Reference

## Endpoints

### GET /api/users
Retrieves all users.

### POST /api/users
Creates a new user.

### PUT /api/users/:id
Updates a user.

### DELETE /api/users/:id
Deletes a user.`;

        const result = calculateQualityScore(doc, mockAnalysis, 'API');

        expect(result.breakdown.endpoints.count).toBeGreaterThanOrEqual(3);
        expect(result.breakdown.endpoints.points).toBe(25);
        expect(result.breakdown.endpoints.status).toBe('complete');
      });

      it('should award partial points for few endpoints', () => {
        const doc = `## API

### GET /api/users
Gets users.`;

        const result = calculateQualityScore(doc, mockAnalysis, 'API');

        expect(result.breakdown.endpoints.count).toBe(1);
        expect(result.breakdown.endpoints.points).toBe(15);
        expect(result.breakdown.endpoints.status).toBe('partial');
      });

      it('should detect endpoints section without explicit HTTP methods', () => {
        const doc = `## API Reference

### Endpoints

This section describes available endpoints.`;

        const result = calculateQualityScore(doc, mockAnalysis, 'API');

        expect(result.breakdown.endpoints.present).toBe(true);
        expect(result.breakdown.endpoints.points).toBe(25);
      });
    });

    describe('Request Documentation (20 points)', () => {
      it('should award full points for complete request documentation', () => {
        const doc = `## API

### POST /api/users

#### Parameters
- **id** (path): User ID

#### Headers
- **Authorization**: Bearer token
- **Content-Type**: application/json

#### Request Body
\`\`\`json
{
  "name": "John",
  "email": "john@example.com"
}
\`\`\``;

        const result = calculateQualityScore(doc, mockAnalysis, 'API');

        expect(result.breakdown.requests.hasParams).toBe(true);
        expect(result.breakdown.requests.hasHeaders).toBe(true);
        expect(result.breakdown.requests.hasBody).toBe(true);
        expect(result.breakdown.requests.points).toBe(20);
        expect(result.breakdown.requests.status).toBe('complete');
      });

      it('should award partial points for params or body only', () => {
        const doc = `## API

### POST /api/users

#### Parameters
- **id**: User ID`;

        const result = calculateQualityScore(doc, mockAnalysis, 'API');

        expect(result.breakdown.requests.hasParams).toBe(true);
        expect(result.breakdown.requests.hasBody).toBe(false);
        expect(result.breakdown.requests.points).toBe(12);
        expect(result.breakdown.requests.status).toBe('partial');
      });

      it('should award partial points for headers only', () => {
        const doc = `## API

### GET /api/users

#### Headers
- **Authorization**: Bearer token`;

        const result = calculateQualityScore(doc, mockAnalysis, 'API');

        expect(result.breakdown.requests.hasHeaders).toBe(true);
        expect(result.breakdown.requests.points).toBe(8);
      });
    });

    describe('Response Documentation (20 points)', () => {
      it('should award full points for status codes and schemas', () => {
        const doc = `## API

### GET /api/users

#### Response

##### 200 OK
Returns the user list.

##### 401 Unauthorized
Authentication required.

##### Response Schema
\`\`\`json
{
  "users": []
}
\`\`\``;

        const result = calculateQualityScore(doc, mockAnalysis, 'API');

        expect(result.breakdown.responses.statusCodes).toBeGreaterThanOrEqual(2);
        expect(result.breakdown.responses.hasSchema).toBe(true);
        expect(result.breakdown.responses.points).toBe(20);
        expect(result.breakdown.responses.status).toBe('complete');
      });

      it('should award partial points for status codes only', () => {
        const doc = `## API

### GET /api/users

Returns 200 on success.`;

        const result = calculateQualityScore(doc, mockAnalysis, 'API');

        expect(result.breakdown.responses.statusCodes).toBe(1);
        expect(result.breakdown.responses.points).toBe(12);
        expect(result.breakdown.responses.status).toBe('partial');
      });
    });

    describe('Examples (20 points)', () => {
      it('should award full points for curl and response examples', () => {
        const doc = `## API

### GET /api/users

#### Example Request
\`\`\`bash
curl -X GET https://api.example.com/users \\
  -H "Authorization: Bearer token"
\`\`\`

#### Example Response
\`\`\`json
{
  "users": [
    { "id": "1", "name": "John" }
  ]
}
\`\`\`

#### Another Example
\`\`\`javascript
const response = await fetch('/api/users');
\`\`\``;

        const result = calculateQualityScore(doc, mockAnalysis, 'API');

        expect(result.breakdown.examples.codeBlocks).toBeGreaterThanOrEqual(3);
        expect(result.breakdown.examples.hasCurlExamples).toBe(true);
        expect(result.breakdown.examples.points).toBe(20);
        expect(result.breakdown.examples.status).toBe('complete');
      });

      it('should award partial points for some examples', () => {
        const doc = `## API

### GET /api/users

\`\`\`json
{ "users": [] }
\`\`\``;

        const result = calculateQualityScore(doc, mockAnalysis, 'API');

        expect(result.breakdown.examples.codeBlocks).toBe(1);
        expect(result.breakdown.examples.points).toBe(12);
        expect(result.breakdown.examples.status).toBe('partial');
      });
    });

    describe('Error Documentation (15 points)', () => {
      it('should award full points for error section with codes', () => {
        const doc = `## API

### Errors

This API uses standard HTTP error codes.

#### 400 Bad Request
Invalid request parameters.

#### 401 Unauthorized
Authentication required.

#### 404 Not Found
Resource not found.

#### 500 Internal Server Error
Server error occurred.`;

        const result = calculateQualityScore(doc, mockAnalysis, 'API');

        expect(result.breakdown.errors.hasErrorSection).toBe(true);
        expect(result.breakdown.errors.errorCodes).toBeGreaterThanOrEqual(2);
        expect(result.breakdown.errors.points).toBe(15);
        expect(result.breakdown.errors.status).toBe('complete');
      });

      it('should award partial points for error section without codes', () => {
        const doc = `## API

### Error Handling

Errors are returned in JSON format.`;

        const result = calculateQualityScore(doc, mockAnalysis, 'API');

        expect(result.breakdown.errors.hasErrorSection).toBe(true);
        expect(result.breakdown.errors.points).toBe(8);
        expect(result.breakdown.errors.status).toBe('partial');
      });
    });

    describe('Complete API Scoring', () => {
      it('should score excellent API docs with A grade', () => {
        const doc = `# API Documentation

## Overview

RESTful API for user management.

## Endpoints

### GET /api/users

Retrieves all users.

#### Query Parameters
- **limit** (number): Maximum results
- **offset** (number): Pagination offset

#### Headers
- **Authorization**: Bearer {token}

#### Response

##### 200 OK
\`\`\`json
{
  "users": [],
  "total": 0
}
\`\`\`

##### 401 Unauthorized
Authentication required.

#### Example Request
\`\`\`bash
curl -X GET https://api.example.com/users \\
  -H "Authorization: Bearer token"
\`\`\`

#### Example Response
\`\`\`json
{
  "users": [{ "id": "1", "name": "John" }],
  "total": 1
}
\`\`\`

### POST /api/users

Creates a new user.

#### Request Body
\`\`\`json
{
  "name": "string",
  "email": "string"
}
\`\`\`

### PUT /api/users/:id

Updates an existing user.

### DELETE /api/users/:id

Deletes a user.

## Error Handling

### Error Codes

- **400 Bad Request**: Invalid parameters
- **401 Unauthorized**: Missing or invalid token
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server error`;

        const result = calculateQualityScore(doc, mockAnalysis, 'API');

        expect(result.score).toBeGreaterThanOrEqual(85);
        expect(result.grade).toMatch(/A|B/);
        expect(result.docType).toBe('API');
      });

      it('should score minimal API docs with low grade', () => {
        const doc = `# API

Some API documentation.`;

        const result = calculateQualityScore(doc, mockAnalysis, 'API');

        expect(result.score).toBeLessThan(50);
        expect(result.grade).toBe('F');
      });
    });
  });

  // ==========================================================================
  // OPENAPI SCORING TESTS (100 points total)
  // ==========================================================================
  describe('OPENAPI Scoring', () => {
    const mockAnalysis = {
      functions: [],
      classes: [],
    };

    describe('Structure Validity (20 points)', () => {
      it('should award full points for valid OpenAPI 3.x structure', () => {
        const doc = `openapi: "3.0.0"
info:
  title: User API
  version: 1.0.0
paths:
  /users:
    get:
      summary: Get users`;

        const result = calculateQualityScore(doc, mockAnalysis, 'OPENAPI');

        expect(result.breakdown.structure.hasOpenAPIVersion).toBe(true);
        expect(result.breakdown.structure.hasInfo).toBe(true);
        expect(result.breakdown.structure.hasPaths).toBe(true);
        expect(result.breakdown.structure.points).toBe(20);
        expect(result.breakdown.structure.status).toBe('complete');
      });

      it('should detect Swagger 2.x format', () => {
        const doc = `swagger: "2.0"
info:
  title: User API
paths:
  /users:
    get:
      summary: Get users`;

        const result = calculateQualityScore(doc, mockAnalysis, 'OPENAPI');

        expect(result.breakdown.structure.hasOpenAPIVersion).toBe(true);
        expect(result.breakdown.structure.points).toBe(20);
      });

      it('should award partial points for paths without info', () => {
        const doc = `paths:
  /users:
    get:
      summary: Get users`;

        const result = calculateQualityScore(doc, mockAnalysis, 'OPENAPI');

        expect(result.breakdown.structure.hasPaths).toBe(true);
        expect(result.breakdown.structure.hasInfo).toBe(false);
        expect(result.breakdown.structure.points).toBe(8);
        expect(result.breakdown.structure.status).toBe('partial');
      });
    });

    describe('Endpoint Coverage (25 points)', () => {
      it('should award full points for multiple path definitions', () => {
        const doc = `paths:
  "/users":
    get:
      summary: Get users
    post:
      summary: Create user
    put:
      summary: Update user
  "/users/{id}":
    get:
      summary: Get user by ID
    put:
      summary: Update user
    delete:
      summary: Delete user
  "/users/{id}/profile":
    get:
      summary: Get profile`;

        const result = calculateQualityScore(doc, mockAnalysis, 'OPENAPI');

        expect(result.breakdown.endpoints.pathDefinitions).toBeGreaterThanOrEqual(3);
        expect(result.breakdown.endpoints.httpMethods).toBeGreaterThanOrEqual(3);
        expect(result.breakdown.endpoints.points).toBe(25);
        expect(result.breakdown.endpoints.status).toBe('complete');
      });

      it('should award partial points for few endpoints', () => {
        const doc = `paths:
  "/users":
    get:
      summary: Get users`;

        const result = calculateQualityScore(doc, mockAnalysis, 'OPENAPI');

        expect(result.breakdown.endpoints.pathDefinitions).toBe(1);
        expect(result.breakdown.endpoints.httpMethods).toBe(1);
        expect(result.breakdown.endpoints.points).toBe(15);
        expect(result.breakdown.endpoints.status).toBe('partial');
      });
    });

    describe('Schema Definitions (20 points)', () => {
      it('should award full points for components with schemas', () => {
        const doc = `components:
  schemas:
    User:
      type: object
      properties:
        id:
          type: string
        name:
          type: string
        email:
          type: string
    CreateUserRequest:
      type: object
      properties:
        name:
          type: string`;

        const result = calculateQualityScore(doc, mockAnalysis, 'OPENAPI');

        expect(result.breakdown.schemas.hasComponents).toBe(true);
        expect(result.breakdown.schemas.schemaCount).toBeGreaterThanOrEqual(3);
        expect(result.breakdown.schemas.points).toBe(20);
        expect(result.breakdown.schemas.status).toBe('complete');
      });

      it('should detect inline schemas', () => {
        const doc = `paths:
  /users:
    get:
      responses:
        200:
          schema:
            type: array
            items:
              type: object`;

        const result = calculateQualityScore(doc, mockAnalysis, 'OPENAPI');

        expect(result.breakdown.schemas.schemaCount).toBeGreaterThanOrEqual(1);
        expect(result.breakdown.schemas.points).toBeGreaterThan(0);
      });
    });

    describe('Parameter Documentation (15 points)', () => {
      it('should award full points for well-documented parameters', () => {
        const doc = `paths:
  /users/{id}:
    get:
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
        - name: include
          in: query
          required: false
          schema:
            type: string
        - name: Authorization
          in: header
          required: true`;

        const result = calculateQualityScore(doc, mockAnalysis, 'OPENAPI');

        expect(result.breakdown.parameters.hasParameters).toBe(true);
        expect(result.breakdown.parameters.paramTypes).toBeGreaterThanOrEqual(2);
        expect(result.breakdown.parameters.hasRequired).toBe(true);
        expect(result.breakdown.parameters.points).toBe(15);
        expect(result.breakdown.parameters.status).toBe('complete');
      });

      it('should award partial points for basic parameters', () => {
        const doc = `paths:
  /users/{id}:
    get:
      parameters:
        - name: id
          in: path`;

        const result = calculateQualityScore(doc, mockAnalysis, 'OPENAPI');

        expect(result.breakdown.parameters.hasParameters).toBe(true);
        expect(result.breakdown.parameters.paramTypes).toBe(1);
        expect(result.breakdown.parameters.points).toBe(10);
        expect(result.breakdown.parameters.status).toBe('partial');
      });
    });

    describe('Examples & Descriptions (20 points)', () => {
      it('should award full points for descriptions and examples', () => {
        const doc = `paths:
  /users:
    get:
      summary: Get all users
      description: Retrieves a list of all users in the system
    post:
      summary: Create a user
      description: Creates a new user with the provided data
      requestBody:
        content:
          application/json:
            example:
              name: John Doe
              email: john@example.com
  /users/{id}:
    get:
      summary: Get user by ID
      description: Retrieves a specific user by their unique identifier`;

        const result = calculateQualityScore(doc, mockAnalysis, 'OPENAPI');

        expect(result.breakdown.descriptions.descriptions).toBeGreaterThanOrEqual(3);
        expect(result.breakdown.descriptions.hasExamples).toBe(true);
        expect(result.breakdown.descriptions.points).toBe(20);
        expect(result.breakdown.descriptions.status).toBe('complete');
      });

      it('should award partial points for summaries only', () => {
        const doc = `paths:
  /users:
    get:
      summary: Get users
    post:
      summary: Create user`;

        const result = calculateQualityScore(doc, mockAnalysis, 'OPENAPI');

        expect(result.breakdown.descriptions.summaries).toBeGreaterThanOrEqual(2);
        expect(result.breakdown.descriptions.points).toBe(12);
        expect(result.breakdown.descriptions.status).toBe('partial');
      });
    });

    describe('Complete OPENAPI Scoring', () => {
      it('should score complete OpenAPI spec with A grade', () => {
        const doc = `openapi: "3.0.0"
info:
  title: User Management API
  version: 1.0.0
  description: API for managing users

paths:
  "/users":
    get:
      summary: Get all users
      description: Retrieves a paginated list of users
      parameters:
        - name: limit
          in: query
          required: false
          schema:
            type: integer
      responses:
        200:
          description: Successful response
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/User'
              example:
                - id: "1"
                  name: "John"
    post:
      summary: Create a user
      description: Creates a new user
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateUser'
  "/users/{id}":
    get:
      summary: Get user by ID
      description: Retrieves a user by their ID
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
    put:
      summary: Update user
      description: Updates an existing user
    delete:
      summary: Delete user
      description: Deletes a user

components:
  schemas:
    User:
      type: object
      properties:
        id:
          type: string
        name:
          type: string
        email:
          type: string
    CreateUser:
      type: object
      required:
        - name
        - email
      properties:
        name:
          type: string
        email:
          type: string`;

        const result = calculateQualityScore(doc, mockAnalysis, 'OPENAPI');

        expect(result.score).toBeGreaterThanOrEqual(85);
        expect(result.grade).toMatch(/A|B/);
        expect(result.docType).toBe('OPENAPI');
      });

      it('should score minimal OpenAPI spec with low grade', () => {
        const doc = `# OpenAPI Spec

paths:
  /users:
    get:
      summary: Get users`;

        const result = calculateQualityScore(doc, mockAnalysis, 'OPENAPI');

        expect(result.score).toBeLessThan(60);
      });
    });
  });

  // ==========================================================================
  // ARCHITECTURE SCORING TESTS (100 points total)
  // ==========================================================================
  describe('ARCHITECTURE Scoring', () => {
    const mockAnalysis = {
      functions: [],
      classes: [
        { name: 'UserService', methods: [] },
        { name: 'AuthController', methods: [] },
      ],
    };

    describe('System Overview (25 points)', () => {
      it('should award full points for comprehensive overview', () => {
        const doc = `# Architecture Overview

## Introduction

This document describes the high-level architecture of the system.

## Purpose

The system provides user management capabilities.

## Tech Stack

- Node.js
- Express
- PostgreSQL`;

        const result = calculateQualityScore(doc, mockAnalysis, 'ARCHITECTURE');

        expect(result.breakdown.overview.hasOverview).toBe(true);
        expect(result.breakdown.overview.hasHighLevel).toBe(true);
        expect(result.breakdown.overview.hasTechStack).toBe(true);
        expect(result.breakdown.overview.points).toBe(25);
        expect(result.breakdown.overview.status).toBe('complete');
      });

      it('should award partial points for basic overview', () => {
        const doc = `# System Overview

This document describes the system architecture.`;

        const result = calculateQualityScore(doc, mockAnalysis, 'ARCHITECTURE');

        expect(result.breakdown.overview.hasOverview).toBe(true);
        expect(result.breakdown.overview.points).toBe(15);
        expect(result.breakdown.overview.status).toBe('partial');
      });

      it('should award partial points for tech stack only', () => {
        const doc = `# Architecture

## Tech Stack

- React
- Node.js
- MongoDB`;

        const result = calculateQualityScore(doc, mockAnalysis, 'ARCHITECTURE');

        expect(result.breakdown.overview.hasTechStack).toBe(true);
        expect(result.breakdown.overview.points).toBe(10);
      });
    });

    describe('Component Documentation (25 points)', () => {
      it('should award full points for detailed component docs', () => {
        const doc = `# Architecture

## Components

### User Service Component

Handles user-related operations.

### Auth Service Component

Manages authentication.

### Database Layer

Handles data persistence.

## Module Structure

- services/
- controllers/
- models/`;

        const result = calculateQualityScore(doc, mockAnalysis, 'ARCHITECTURE');

        expect(result.breakdown.components.present).toBe(true);
        expect(result.breakdown.components.componentHeaders).toBeGreaterThanOrEqual(2);
        expect(result.breakdown.components.points).toBe(25);
        expect(result.breakdown.components.status).toBe('complete');
      });

      it('should detect component section without headers', () => {
        const doc = `# Architecture

## Component Overview

The system has several key components that work together.`;

        const result = calculateQualityScore(doc, mockAnalysis, 'ARCHITECTURE');

        expect(result.breakdown.components.present).toBe(true);
        expect(result.breakdown.components.points).toBe(15);
      });

      it('should detect dependency mentions', () => {
        const doc = `# Architecture

The API layer depends on the service layer.
It also relies on the database module.`;

        const result = calculateQualityScore(doc, mockAnalysis, 'ARCHITECTURE');

        expect(result.breakdown.components.hasDependencies).toBe(true);
        expect(result.breakdown.components.points).toBeGreaterThan(0);
      });
    });

    describe('Data Flow (20 points)', () => {
      it('should award full points for detailed data flow', () => {
        const doc = `# Architecture

## Data Flow

The data flows through the system as follows:

1. Client sends request to API
2. API validates and processes request
3. Service layer handles business logic
4. Database stores/retrieves data

The components interact through defined interfaces.
Request and response patterns are standardized.`;

        const result = calculateQualityScore(doc, mockAnalysis, 'ARCHITECTURE');

        expect(result.breakdown.dataFlow.hasDataFlow).toBe(true);
        expect(result.breakdown.dataFlow.hasInteraction).toBe(true);
        expect(result.breakdown.dataFlow.hasSteps).toBe(true);
        expect(result.breakdown.dataFlow.points).toBe(20);
        expect(result.breakdown.dataFlow.status).toBe('complete');
      });

      it('should award partial points for interaction descriptions', () => {
        const doc = `# Architecture

The client communicates with the server via REST API.
Components interact through message passing.`;

        const result = calculateQualityScore(doc, mockAnalysis, 'ARCHITECTURE');

        expect(result.breakdown.dataFlow.hasInteraction).toBe(true);
        expect(result.breakdown.dataFlow.points).toBe(12);
      });
    });

    describe('Diagrams (15 points)', () => {
      it('should award full points for Mermaid diagrams', () => {
        const doc = `# Architecture

## System Diagram

\`\`\`mermaid
flowchart TD
    Client[Client] --> API[API Server]
    API --> Service[Service Layer]
    Service --> DB[(Database)]
\`\`\``;

        const result = calculateQualityScore(doc, mockAnalysis, 'ARCHITECTURE');

        expect(result.breakdown.diagrams.hasMermaid).toBe(true);
        expect(result.breakdown.diagrams.points).toBe(15);
        expect(result.breakdown.diagrams.status).toBe('complete');
      });

      it('should award partial points for ASCII diagrams', () => {
        const doc = `# Architecture

## Diagram

┌─────────┐     ┌─────────┐
│ Client  │────▶│   API   │
└─────────┘     └─────────┘`;

        const result = calculateQualityScore(doc, mockAnalysis, 'ARCHITECTURE');

        expect(result.breakdown.diagrams.hasAsciiDiagram).toBe(true);
        expect(result.breakdown.diagrams.points).toBe(10);
        expect(result.breakdown.diagrams.status).toBe('partial');
      });

      it('should detect diagram section without actual diagram', () => {
        const doc = `# Architecture

## Diagrams

See attached diagram for system architecture.`;

        const result = calculateQualityScore(doc, mockAnalysis, 'ARCHITECTURE');

        expect(result.breakdown.diagrams.present).toBe(true);
        expect(result.breakdown.diagrams.points).toBe(10);
      });
    });

    describe('Design Decisions (15 points)', () => {
      it('should award full points for decisions with patterns', () => {
        const doc = `# Architecture

## Design Decisions

### Why Microservices?

We chose microservices for scalability.

### Design Patterns

- Repository pattern for data access
- Factory pattern for object creation

### Constraints

- Must support 10K concurrent users
- Latency under 100ms`;

        const result = calculateQualityScore(doc, mockAnalysis, 'ARCHITECTURE');

        expect(result.breakdown.decisions.hasDecisions).toBe(true);
        expect(result.breakdown.decisions.hasPatterns).toBe(true);
        expect(result.breakdown.decisions.hasConstraints).toBe(true);
        expect(result.breakdown.decisions.points).toBe(15);
        expect(result.breakdown.decisions.status).toBe('complete');
      });

      it('should award partial points for decisions only', () => {
        const doc = `# Architecture

## Rationale

We chose this approach because it provides better maintainability.`;

        const result = calculateQualityScore(doc, mockAnalysis, 'ARCHITECTURE');

        expect(result.breakdown.decisions.hasDecisions).toBe(true);
        expect(result.breakdown.decisions.points).toBe(10);
      });

      it('should detect pattern mentions', () => {
        const doc = `# Architecture

We use the MVC pattern for separation of concerns.
Best practices are followed throughout.`;

        const result = calculateQualityScore(doc, mockAnalysis, 'ARCHITECTURE');

        expect(result.breakdown.decisions.hasPatterns).toBe(true);
        expect(result.breakdown.decisions.points).toBeGreaterThan(0);
      });
    });

    describe('Complete ARCHITECTURE Scoring', () => {
      it('should score comprehensive architecture docs with A grade', () => {
        const doc = `# System Architecture

## Overview

This document provides a high-level overview of the system architecture.

## Purpose

The system enables user management with enterprise-grade security.

## Tech Stack

- Backend: Node.js with Express
- Database: PostgreSQL
- Cache: Redis

## Components

### API Layer

Handles HTTP requests and response formatting.

### Service Layer

Contains business logic and orchestration.

### Data Access Layer

Manages database operations.

## Data Flow

The request flows through:

1. API Gateway receives request
2. Authentication middleware validates
3. Controller routes to service
4. Service processes business logic
5. Repository handles data access
6. Response returned to client

Components interact via defined interfaces.
Request and response patterns are standardized.

## System Diagram

\`\`\`mermaid
flowchart TD
    Client[Client] --> Gateway[API Gateway]
    Gateway --> Auth[Auth Service]
    Gateway --> API[API Server]
    API --> Service[Service Layer]
    Service --> DB[(Database)]
    Service --> Cache[(Redis)]
\`\`\`

## Design Decisions

### Microservices Architecture

Chosen for scalability and independent deployment.

### Design Patterns

- Repository pattern for data abstraction
- Factory pattern for service creation
- Observer pattern for events

### Constraints and Assumptions

- System must handle 10K concurrent users
- 99.9% uptime SLA required
- Data retention for 7 years`;

        const result = calculateQualityScore(doc, mockAnalysis, 'ARCHITECTURE');

        expect(result.score).toBeGreaterThanOrEqual(90);
        expect(result.grade).toBe('A');
        expect(result.docType).toBe('ARCHITECTURE');
      });

      it('should score minimal architecture docs with low grade', () => {
        const doc = `# Architecture

This is the system architecture.`;

        const result = calculateQualityScore(doc, mockAnalysis, 'ARCHITECTURE');

        expect(result.score).toBeLessThan(50);
        expect(result.grade).toBe('F');
      });
    });
  });

  // ==========================================================================
  // DOC TYPE ROUTING TESTS
  // ==========================================================================
  describe('Doc Type Routing', () => {
    const mockAnalysis = { functions: [], classes: [] };

    it('should route to README scorer by default', () => {
      const doc = '# README\n\nContent.';
      const result = calculateQualityScore(doc, mockAnalysis);

      expect(result.breakdown).toHaveProperty('overview');
      expect(result.breakdown).toHaveProperty('installation');
      expect(result.breakdown).toHaveProperty('examples');
      expect(result.breakdown).toHaveProperty('apiDocs');
      expect(result.breakdown).toHaveProperty('structure');
    });

    it('should route to JSDOC scorer', () => {
      const doc = '# JSDoc\n\n@param test';
      const result = calculateQualityScore(doc, mockAnalysis, 'JSDOC');

      expect(result.breakdown).toHaveProperty('functionCoverage');
      expect(result.breakdown).toHaveProperty('parameters');
      expect(result.breakdown).toHaveProperty('returns');
      expect(result.breakdown).toHaveProperty('examples');
      expect(result.breakdown).toHaveProperty('types');
      expect(result.docType).toBe('JSDOC');
    });

    it('should route to API scorer', () => {
      const doc = '# API\n\nGET /users';
      const result = calculateQualityScore(doc, mockAnalysis, 'API');

      expect(result.breakdown).toHaveProperty('endpoints');
      expect(result.breakdown).toHaveProperty('requests');
      expect(result.breakdown).toHaveProperty('responses');
      expect(result.breakdown).toHaveProperty('examples');
      expect(result.breakdown).toHaveProperty('errors');
      expect(result.docType).toBe('API');
    });

    it('should route to OPENAPI scorer', () => {
      const doc = 'openapi: "3.0.0"\npaths:';
      const result = calculateQualityScore(doc, mockAnalysis, 'OPENAPI');

      expect(result.breakdown).toHaveProperty('structure');
      expect(result.breakdown).toHaveProperty('endpoints');
      expect(result.breakdown).toHaveProperty('schemas');
      expect(result.breakdown).toHaveProperty('parameters');
      expect(result.breakdown).toHaveProperty('descriptions');
      expect(result.docType).toBe('OPENAPI');
    });

    it('should route to ARCHITECTURE scorer', () => {
      const doc = '# Architecture Overview';
      const result = calculateQualityScore(doc, mockAnalysis, 'ARCHITECTURE');

      expect(result.breakdown).toHaveProperty('overview');
      expect(result.breakdown).toHaveProperty('components');
      expect(result.breakdown).toHaveProperty('dataFlow');
      expect(result.breakdown).toHaveProperty('diagrams');
      expect(result.breakdown).toHaveProperty('decisions');
      expect(result.docType).toBe('ARCHITECTURE');
    });

    it('should be case-insensitive for docType', () => {
      const doc = '# Test';

      const result1 = calculateQualityScore(doc, mockAnalysis, 'jsdoc');
      expect(result1.docType).toBe('jsdoc');
      expect(result1.breakdown).toHaveProperty('functionCoverage');

      const result2 = calculateQualityScore(doc, mockAnalysis, 'JsDoc');
      expect(result2.breakdown).toHaveProperty('functionCoverage');
    });
  });

  // ==========================================================================
  // EDGE CASES
  // ==========================================================================
  describe('Edge Cases', () => {
    const emptyAnalysis = { functions: [], classes: [] };

    it('should handle empty documentation for all doc types', () => {
      const docTypes = ['README', 'JSDOC', 'API', 'OPENAPI', 'ARCHITECTURE'];

      docTypes.forEach(docType => {
        expect(() => {
          calculateQualityScore('', emptyAnalysis, docType);
        }).not.toThrow();
      });
    });

    it('should handle empty code analysis object', () => {
      // Empty analysis object should work
      expect(() => {
        calculateQualityScore('# Test', {}, 'JSDOC');
      }).not.toThrow();

      expect(() => {
        calculateQualityScore('# Test', { functions: null, classes: null }, 'API');
      }).not.toThrow();
    });

    it('should include docType in result', () => {
      const docTypes = ['README', 'JSDOC', 'API', 'OPENAPI', 'ARCHITECTURE'];

      docTypes.forEach(docType => {
        const result = calculateQualityScore('# Test', emptyAnalysis, docType);
        expect(result.docType).toBe(docType);
      });
    });

    it('should always return valid structure', () => {
      const docTypes = ['README', 'JSDOC', 'API', 'OPENAPI', 'ARCHITECTURE'];

      docTypes.forEach(docType => {
        const result = calculateQualityScore('# Test', emptyAnalysis, docType);

        expect(result).toHaveProperty('score');
        expect(result).toHaveProperty('grade');
        expect(result).toHaveProperty('breakdown');
        expect(result).toHaveProperty('summary');
        expect(typeof result.score).toBe('number');
        expect(['A', 'B', 'C', 'D', 'F']).toContain(result.grade);
      });
    });
  });
});
