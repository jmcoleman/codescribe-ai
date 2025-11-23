# OpenAPI Advanced Features - Design & Planning Guide

**Epic 4.3 (Advanced)** - Future Enhancement
**Status:** Planning Phase
**Prerequisites:** Epic 4.2 (Multi-File Project Documentation)
**Estimated Duration:** 2-3 days

---

## Overview

CodeScribe AI's **Basic OPENAPI** support (v2.9.0) provides manual code-to-spec generation. The **Advanced OPENAPI** features transform this into an automated API discovery and documentation system that requires zero code annotations.

### Current State (v2.9.0 - Basic)
- User manually provides API code
- Selects "OPENAPI" doc type
- GPT-5.1 generates OpenAPI 3.0 YAML specification
- Works like other doc types (manual input)

### Future State (Epic 4.3 - Advanced)
- Point CodeScribe at GitHub repository
- Automatic API route discovery across entire codebase
- Schema generation from native type definitions
- No annotations or code changes required
- Works across multiple backend frameworks

---

## Key Capabilities

### 1. Auto-Detect and Parse API Routes

**Problem Solved:**
Traditional OpenAPI generators require manual annotations (`@swagger.route()`, JSDoc comments) which pollute code and require maintenance.

**CodeScribe Approach:**
Parse native framework syntax directly using AST analysis.

**Supported Frameworks:**

| Framework | Language | Detection Pattern | Example |
|-----------|----------|-------------------|---------|
| Express.js | JavaScript/TypeScript | `app.METHOD(path, ...)` | `app.get('/users/:id', handler)` |
| Flask | Python | `@app.route(path, methods=[...])` | `@app.route('/users/<int:id>', methods=['GET'])` |
| FastAPI | Python | `@app.METHOD(path)` | `@app.get("/users/{id}")` |
| Django REST | Python | `urlpatterns` + view classes | `path('users/<int:pk>/', UserDetailView)` |
| Nest.js | TypeScript | Decorators (`@Get()`, `@Post()`) | `@Get('users/:id')` |

**Technical Implementation:**
1. **File Discovery**: Use existing multi-file support (Epic 4.2) to scan backend directory
2. **Framework Detection**: Identify framework from package.json/requirements.txt
3. **AST Parsing**:
   - JavaScript/TypeScript: Extend existing Acorn parser
   - Python: Use `ast` module or equivalent parser
4. **Route Extraction**: Parse route definitions and extract:
   - HTTP method (GET, POST, PUT, DELETE, PATCH)
   - Path pattern with parameters
   - Handler function/controller reference
   - Middleware (auth, validation, etc.)

**Example Output:**
```yaml
paths:
  /users/{id}:
    get:
      summary: Get user by ID
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer
      responses:
        200:
          description: User found
        404:
          description: User not found
```

---

### 2. Auto-Generate Schema Definitions from Code

**Problem Solved:**
Manually writing OpenAPI schemas is time-consuming and error-prone. Schemas often diverge from actual code.

**CodeScribe Approach:**
Analyze native type definitions and data models to generate OpenAPI schemas automatically.

**Supported Type Systems:**

| Language | Type System | Example Source | OpenAPI Output |
|----------|-------------|----------------|----------------|
| TypeScript | Interfaces, Types | `interface User { id: number; name: string; }` | `User` schema with properties |
| Python | Dataclasses, Pydantic | `@dataclass class User: id: int; name: str` | `User` schema with types |
| Python | Type hints | `def get_user() -> User:` | Inferred from return type |
| JavaScript | JSDoc types | `/** @typedef {Object} User ... */` | Schema from JSDoc |

**Technical Implementation:**
1. **Type Discovery**: Scan for type definitions in codebase
2. **Dependency Tracking**: Follow imports to build complete type graph
3. **Schema Generation**:
   - Map native types to OpenAPI types (string, number, boolean, array, object)
   - Handle nested objects and arrays
   - Extract validation rules (required, min/max, enum, pattern)
   - Generate `$ref` references for reusable schemas
4. **Relationship Mapping**: Detect relationships (foreign keys, embedded objects)

**Example TypeScript Input:**
```typescript
interface User {
  id: number;
  email: string;
  roles: UserRole[];
  profile?: UserProfile;
  createdAt: Date;
}

enum UserRole {
  ADMIN = 'admin',
  USER = 'user'
}

interface UserProfile {
  firstName: string;
  lastName: string;
  avatar?: string;
}
```

**Generated OpenAPI Schema:**
```yaml
components:
  schemas:
    User:
      type: object
      required:
        - id
        - email
        - roles
        - createdAt
      properties:
        id:
          type: integer
        email:
          type: string
          format: email
        roles:
          type: array
          items:
            $ref: '#/components/schemas/UserRole'
        profile:
          $ref: '#/components/schemas/UserProfile'
        createdAt:
          type: string
          format: date-time

    UserRole:
      type: string
      enum:
        - admin
        - user

    UserProfile:
      type: object
      required:
        - firstName
        - lastName
      properties:
        firstName:
          type: string
        lastName:
          type: string
        avatar:
          type: string
          format: uri
```

---

### 3. Security and Authentication Documentation

**Problem Solved:**
Security requirements are often poorly documented or missing from API specs.

**CodeScribe Approach:**
Detect authentication and authorization patterns in middleware and decorators.

**Detection Patterns:**

| Auth Type | Framework | Detection | OpenAPI Output |
|-----------|-----------|-----------|----------------|
| JWT Bearer | Express | `passport.authenticate('jwt')` | `securitySchemes: { bearerAuth: ... }` |
| JWT Bearer | FastAPI | `Depends(get_current_user)` | Same as above |
| API Key | Express | `apiKeyAuth` middleware | `securitySchemes: { apiKey: ... }` |
| OAuth 2.0 | Any | OAuth middleware/config | `securitySchemes: { oauth2: ... }` |
| Basic Auth | Any | `passport.authenticate('basic')` | `securitySchemes: { basicAuth: ... }` |

**Technical Implementation:**
1. **Middleware Detection**: Identify auth middleware in route definitions
2. **Strategy Analysis**: Determine auth type from middleware/decorator names
3. **Scope Extraction**: Parse authorization rules (roles, permissions, scopes)
4. **Security Application**: Map which endpoints require which auth types

**Example Express Input:**
```javascript
// Middleware
const requireAuth = passport.authenticate('jwt', { session: false });
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).send();
  next();
};

// Routes
app.get('/users', requireAuth, getUsers);
app.post('/users', requireAuth, requireAdmin, createUser);
app.get('/public/health', healthCheck); // No auth
```

**Generated OpenAPI Security:**
```yaml
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

security:
  - bearerAuth: []

paths:
  /users:
    get:
      summary: List users
      security:
        - bearerAuth: []
      responses:
        200:
          description: Success
        401:
          description: Unauthorized

  /users:
    post:
      summary: Create user (Admin only)
      security:
        - bearerAuth: []
      responses:
        201:
          description: User created
        401:
          description: Unauthorized
        403:
          description: Forbidden (requires admin role)

  /public/health:
    get:
      summary: Health check
      security: []  # No auth required
      responses:
        200:
          description: Healthy
```

---

### 4. Request/Response Examples Generation

**Problem Solved:**
API specs without examples are harder to use. Manual examples become stale.

**CodeScribe Approach:**
Generate realistic examples based on type definitions and validation rules.

**Generation Strategy:**
1. **Type-Based Examples**: Use type information to create valid samples
2. **Validation-Aware**: Respect min/max, enum, pattern constraints
3. **Realistic Data**: Use faker.js-style generation for names, emails, dates
4. **Nested Objects**: Recursively generate examples for complex types

**Example Schema:**
```yaml
User:
  type: object
  properties:
    id:
      type: integer
      minimum: 1
    email:
      type: string
      format: email
    role:
      type: string
      enum: [admin, user]
    createdAt:
      type: string
      format: date-time
```

**Generated Example:**
```yaml
paths:
  /users:
    post:
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/User'
            example:
              email: "john.doe@example.com"
              role: "user"

      responses:
        201:
          description: User created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
              example:
                id: 42
                email: "john.doe@example.com"
                role: "user"
                createdAt: "2025-11-23T14:30:00Z"
```

---

## Integration with Existing Features

### Multi-File Support (Epic 4.2)
**Required for:** Analyzing entire backend codebase
**Usage:** Scan all route files, controller files, model files simultaneously

### GitHub Integration (v2.7.9)
**Required for:** Repository-level API discovery
**Usage:**
1. User provides GitHub repo URL
2. CodeScribe fetches backend files
3. Runs advanced OPENAPI analysis
4. Generates complete API specification

**Example Workflow:**
```
User: "Generate OpenAPI spec for https://github.com/company/api-server"

CodeScribe:
1. Fetches repo structure
2. Detects Express.js (from package.json)
3. Scans /routes directory
4. Parses /models directory for schemas
5. Identifies JWT middleware
6. Generates complete OpenAPI 3.0 spec with:
   - 47 endpoints across 8 route files
   - 23 schema definitions from TypeScript interfaces
   - JWT Bearer auth configuration
   - Request/response examples for all endpoints
```

### Existing AST Parser (codeParser.js)
**Extension Required:** Currently supports function/class extraction
**New Capabilities Needed:**
- Route definition parsing (Express, Flask, FastAPI)
- Type extraction (TypeScript interfaces, Python dataclasses)
- Middleware/decorator analysis
- Import/dependency tracking

### LLM Provider System (v2.7.8)
**Usage:** Use GPT-5.1 for:
- Understanding complex route patterns
- Generating human-readable descriptions
- Inferring API semantics from code context
- Filling gaps where static analysis falls short

---

## Technical Architecture

### Parser Extension Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                    OpenAPI Advanced Parser                   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  1. Framework Detection                                      │
│     ├─ package.json/requirements.txt analysis                │
│     └─ Heuristic matching (import statements, decorators)    │
│                                                               │
│  2. Route Discovery                                          │
│     ├─ Express: app.METHOD() calls                           │
│     ├─ Flask: @app.route() decorators                        │
│     └─ FastAPI: @app.METHOD() decorators                     │
│                                                               │
│  3. Schema Extraction                                        │
│     ├─ TypeScript: interface/type parsing                    │
│     ├─ Python: dataclass/Pydantic model parsing              │
│     └─ JSDoc: @typedef parsing                               │
│                                                               │
│  4. Security Analysis                                        │
│     ├─ Middleware detection (requireAuth, etc.)              │
│     ├─ Decorator analysis (@RequireAuth, Depends(), etc.)    │
│     └─ Strategy identification (JWT, API Key, OAuth)         │
│                                                               │
│  5. Example Generation                                       │
│     ├─ Type-based generation (faker.js integration)          │
│     └─ Validation-aware samples                              │
│                                                               │
│  6. LLM Enhancement                                          │
│     ├─ Generate endpoint descriptions                        │
│     ├─ Infer parameter purposes                              │
│     └─ Fill documentation gaps                               │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                            ↓
                   OpenAPI 3.0 YAML Spec
```

### File Structure

```
server/src/services/
├── openapi/
│   ├── advancedParser.js       # Orchestrates multi-file analysis
│   ├── frameworkDetector.js    # Identifies backend framework
│   ├── routeDiscovery.js       # Extracts API routes
│   │   ├── expressParser.js
│   │   ├── flaskParser.js
│   │   └── fastapiParser.js
│   ├── schemaGenerator.js      # Converts types to OpenAPI schemas
│   │   ├── typescriptExtractor.js
│   │   └── pythonExtractor.js
│   ├── securityAnalyzer.js     # Auth/authz documentation
│   └── exampleGenerator.js     # Request/response examples
├── docGenerator.js             # Updated to use advancedParser
└── codeParser.js               # Extended for OpenAPI needs
```

---

## Competitive Advantage

### vs. Traditional Swagger/OpenAPI Generators

| Feature | Traditional Tools | CodeScribe Advanced |
|---------|------------------|---------------------|
| **Annotations Required** | ✅ Yes (lots of code pollution) | ❌ No (zero annotations) |
| **Code Changes Needed** | ✅ Yes | ❌ No (read-only analysis) |
| **Works on Legacy Code** | ❌ No | ✅ Yes |
| **Multi-Framework** | ❌ Usually framework-specific | ✅ Express, Flask, FastAPI, etc. |
| **Works on Third-Party Repos** | ❌ No (need write access) | ✅ Yes (read-only via GitHub) |
| **AI-Enhanced Descriptions** | ❌ No | ✅ Yes |
| **Maintenance Required** | ✅ High (sync annotations with code) | ❌ Low (regenerate on demand) |

### Unique Use Cases

1. **Legacy API Documentation**: Document APIs that predate OpenAPI
2. **Code Archaeology**: Analyze inherited/acquired codebases
3. **Competitive Analysis**: Study open-source API implementations
4. **Audit/Security Review**: Understand API attack surface without running code
5. **Migration Planning**: Document before refactoring/rewriting
6. **Zero-Touch Documentation**: Generate specs without touching production code

---

## Implementation Phases

### Phase 1: Single Framework MVP (Express.js)
**Duration:** 1 day
**Scope:**
- Express route detection (`app.get()`, `app.post()`, etc.)
- Basic TypeScript interface parsing
- JWT middleware detection
- Simple example generation

**Deliverable:** Working demo that generates OpenAPI spec from Express/TypeScript repo

### Phase 2: Multi-Framework Support
**Duration:** 1 day
**Scope:**
- Add Flask parser
- Add FastAPI parser
- Framework auto-detection
- Python type hint support

**Deliverable:** Supports 3 major backend frameworks

### Phase 3: Advanced Features
**Duration:** 0.5-1 day
**Scope:**
- Nested schema support
- Complex authentication patterns
- LLM-enhanced descriptions
- Quality scoring for API specs

**Deliverable:** Production-ready advanced OPENAPI features

---

## Quality Scoring Enhancements

Extend existing quality scoring (0-100 scale) with API-specific criteria:

### API Documentation Quality Criteria

1. **Endpoint Coverage** (20 points)
   - All routes documented
   - HTTP methods specified
   - Path parameters described

2. **Schema Completeness** (25 points)
   - Request/response schemas defined
   - Required fields marked
   - Data types and formats specified
   - Nested objects properly referenced

3. **Security Documentation** (20 points)
   - Auth requirements documented
   - Security schemes defined
   - Endpoint-level security specified
   - Error responses for auth failures

4. **Examples & Usage** (20 points)
   - Request examples provided
   - Response examples for success cases
   - Error response examples
   - Realistic data in examples

5. **API Metadata** (15 points)
   - OpenAPI version specified
   - API title and description
   - Contact information
   - License information
   - Version numbering

---

## Future Enhancements (Beyond Epic 4.3)

1. **GraphQL Support**: Extend to GraphQL schema generation
2. **WebSocket Documentation**: Document WebSocket APIs
3. **API Versioning Detection**: Track API versions across branches
4. **Breaking Change Detection**: Compare specs to identify breaking changes
5. **Postman Collection Export**: Generate Postman collections from OpenAPI specs
6. **Mock Server Generation**: Spin up mock servers from specs
7. **Client SDK Generation**: Generate API clients (TypeScript, Python, etc.)

---

## Dependencies

### Required Epics
- **Epic 4.2**: Multi-File Project Documentation (analyze entire codebase)

### Recommended Epics
- **Epic 5.1**: CLI Tool (command-line OpenAPI generation)
- **Epic 5.2**: MCP Server (IDE-integrated OpenAPI generation)

### Package Dependencies
```json
{
  "@typescript-eslint/parser": "^6.0.0",  // TypeScript AST parsing
  "acorn": "^8.10.0",                     // JavaScript AST (existing)
  "acorn-walk": "^8.3.0",                 // AST traversal (existing)
  "@faker-js/faker": "^8.0.0",            // Example data generation
  "js-yaml": "^4.1.0",                    // YAML generation
  "python-ast": "^1.0.0"                  // Python AST parsing (if using Node)
}
```

---

## Success Metrics

### Functional Metrics
- **Routes Detected**: 95%+ accuracy on Express/Flask/FastAPI
- **Schema Generation**: 90%+ type coverage
- **Security Detection**: 100% of common auth patterns
- **Example Quality**: 100% valid examples (pass schema validation)

### Business Metrics
- **Time Savings**: 10x faster than manual OpenAPI authoring
- **Adoption**: 50%+ of Pro+ users use advanced OPENAPI features
- **Differentiation**: Unique feature vs. competitors

### User Feedback Goals
- "Saved us weeks of documentation work"
- "Works on our legacy APIs without code changes"
- "Better than Swagger for brownfield projects"

---

## Resources & References

### OpenAPI Specification
- [OpenAPI 3.0 Spec](https://swagger.io/specification/)
- [OpenAPI Examples](https://github.com/OAI/OpenAPI-Specification/tree/main/examples)

### Framework Documentation
- [Express.js Routing](https://expressjs.com/en/guide/routing.html)
- [Flask Views](https://flask.palletsprojects.com/en/latest/views/)
- [FastAPI Path Operations](https://fastapi.tiangolo.com/tutorial/path-params/)

### Type Systems
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Python Type Hints](https://docs.python.org/3/library/typing.html)
- [Pydantic Models](https://docs.pydantic.dev/latest/)

### AST Parsing
- [Acorn Documentation](https://github.com/acornjs/acorn)
- [TypeScript Compiler API](https://github.com/Microsoft/TypeScript/wiki/Using-the-Compiler-API)
- [Python AST Module](https://docs.python.org/3/library/ast.html)

---

**Last Updated:** November 23, 2025
**Status:** Planning Phase
**Next Action:** Complete Epic 4.2 (Multi-File Support) before starting implementation
