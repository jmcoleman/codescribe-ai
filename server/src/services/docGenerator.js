import { parseCode } from './codeParser.js';
import { calculateQualityScore } from './qualityScorer.js';
import LLMService from './llm/llmService.js';

export class DocGeneratorService {
  constructor() {
    // Initialize LLM service (uses config from environment)
    this.llmService = new LLMService();
  }

  /**
   * Generate documentation for provided code
   * @param {string} code - Source code to document
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} Documentation result
   */
  async generateDocumentation(code, options = {}) {
    const {
      docType = 'README',
      language = 'javascript',
      streaming = false,
      onChunk = null,
      isDefaultCode = false,
      userTier = 'free'
    } = options;

    // Step 1: Parse code to understand structure
    const analysis = await parseCode(code, language);

    // Step 2: Build system prompt (cacheable) and user message
    const { systemPrompt, userMessage } = this.buildPromptWithCaching(code, analysis, docType, language);

    // Step 3: Generate documentation using LLM service with caching
    const llmOptions = {
      systemPrompt,
      enableCaching: isDefaultCode // Cache user message if it's default/example code
    };

    let result;
    if (streaming && onChunk) {
      result = await this.llmService.generateWithStreaming(
        userMessage,
        onChunk,
        llmOptions
      );
    } else {
      result = await this.llmService.generate(userMessage, llmOptions);
    }

    const documentation = result.text;

    // Step 4: Add tier-based attribution footer (works for both cached and non-cached responses)
    const attribution = this.buildAttribution(userTier);
    const documentationWithAttribution = documentation + attribution;

    // Step 5: Calculate quality score (includes input code health assessment)
    const qualityScore = calculateQualityScore(documentationWithAttribution, analysis, docType, code);

    return {
      documentation: documentationWithAttribution,
      qualityScore,
      analysis,
      metadata: {
        ...result.metadata,  // Include LLM provider metadata (provider, model, tokens, etc.)
        language,
        docType,
        generatedAt: new Date().toISOString(),
        codeLength: code.length,
        cacheEnabled: isDefaultCode
      }
    };
  }

  /**
   * Build tier-based attribution footer
   * @param {string} tier - User tier (free, pro, team, enterprise)
   * @returns {string} Attribution footer text
   */
  buildAttribution(tier) {
    const attributions = {
      free: `\n\n---\n*🟣 Generated with [CodeScribe AI](https://codescribeai.com) • **Free Tier***\n*Upgrade to [Pro](https://codescribeai.com/pricing) to remove this watermark and unlock advanced features*`,

      pro: `\n\n---\n*Generated with [CodeScribe AI](https://codescribeai.com) - AI-powered code documentation*`,

      team: `\n\n---\n*Generated with [CodeScribe AI](https://codescribeai.com)*`,

      enterprise: '' // No attribution for enterprise
    };

    // Use hasOwnProperty to check if tier exists (not just if value is truthy)
    // This allows empty string for enterprise tier
    return attributions.hasOwnProperty(tier) ? attributions[tier] : attributions.free;
  }

  /**
   * Build prompt based on documentation type
   * @param {string} code - Source code
   * @param {Object} analysis - Code analysis data
   * @param {string} docType - Type of documentation
   * @param {string} language - Programming language
   * @returns {string} Formatted prompt
   */
  buildPrompt(code, analysis, docType, language) {
    // Format exports (handle both string arrays and object arrays)
    const exportsStr = analysis.exports.length > 0
      ? analysis.exports.map(e => typeof e === 'string' ? e : e.name).join(', ')
      : 'None';

    const baseContext = `
Language: ${language}
Functions detected: ${analysis.functions.length}
Classes detected: ${analysis.classes.length}
Exports: ${exportsStr}
Complexity: ${analysis.complexity || 'Unknown'}
`;

    const prompts = {
      README: `You are a technical documentation expert. Generate a comprehensive README.md for the following ${language} code.

${baseContext}

CRITICAL REQUIREMENTS - You MUST include ALL of these sections:

1. **Project Overview**: Clear description of what the code does and its purpose
2. **Features**: List key capabilities (bullet points) based on what you see in the code
3. **Installation/Setup** (REQUIRED - DO NOT SKIP): Always provide setup instructions
   - For JavaScript/Node.js: npm/yarn installation, dependencies
   - For Python: pip install, virtual environment setup
   - For Java: Maven/Gradle dependencies, build commands
   - For C#: NuGet packages, .NET SDK version
   - For Ruby: gem install, bundle commands
   - For Go: go get commands, module setup
   - Include how to run/use the code
4. **Usage**: Practical examples showing how to use the code (minimum 2 examples)
5. **API Documentation**: Document ALL exported functions/classes with:
   - You detected ${analysis.functions.length} function(s) and ${analysis.classes.length} class(es)
   - Document EVERY public function/method
   - Purpose and description
   - Parameters (with types and descriptions)
   - Return values (with type and description)
   - Example usage for each function
6. **Code Examples**: Include at least 2 working examples showing real-world usage

Code to document:
\`\`\`${language}
${code}
\`\`\`

QUALITY SCORING GUIDANCE:
Your documentation will be scored on 5 criteria (100 points total):
- Overview/Description (20 points): Clear project description
- Installation/Setup (15 points): Complete setup instructions - ALWAYS INCLUDE THIS
- Usage Examples (20 points): At least 2-3 code examples with explanations
- API Documentation (25 points): ALL ${analysis.functions.length} function(s) documented - missing any = lower score
- Structure/Formatting (20 points): Proper headers, code blocks, lists

To achieve a high score (90+), you MUST include all sections above with complete coverage of all functions/classes.

IMPORTANT MARKDOWN FORMATTING RULES:
- Use proper markdown lists with a blank line before the list
- Each list item must be on its own line
- Use "- " (dash space) for unordered lists
- Use "1. " (number period space) for ordered lists
- Example of correct list format:

## Features

- First feature here
- Second feature here
- Third feature here

MERMAID DIAGRAMS:
- Include Mermaid diagrams to visualize architecture, data flow, or component relationships
- Use proper Mermaid syntax with \`\`\`mermaid code blocks
- IMPORTANT: Use simple, valid Mermaid syntax (avoid special characters in node IDs)
- Example Mermaid diagram:

\`\`\`mermaid
flowchart TD
    A[User Input] --> B[Process Data]
    B --> C[Generate Output]
    C --> D[Return Result]
\`\`\`

Mermaid syntax rules (CRITICAL - Follow exactly):
- Use 'flowchart TD' or 'flowchart LR' (not 'graph')
- Node IDs: Single letter or simple word with NO special characters (e.g., A, B, C, Input, Process, Output)
- Arrow syntax: Use --> only (NOT ==> or ->> or any other arrow type)
- Format: NodeID[Label Text] --> NextNodeID[Next Label Text]

Examples of CORRECT syntax:
\`\`\`mermaid
flowchart TD
    A[User Input] --> B[Process Data]
    B --> C[Generate Output]
    C --> D[Return Result]
\`\`\`

Examples of WRONG syntax to AVOID:
- Using ==> instead of -->
- Node IDs with brackets: [Label] --> [Another Label]
- Special characters in node IDs: A[Price] ==> B[Calculate]
- Multiple word node IDs: Original_Price[Price]

Remember: Node ID is before the bracket, label is inside the bracket, arrow is always -->

Generate professional, clear documentation in Markdown format. Use proper formatting with headers, code blocks, bullet points, and Mermaid diagrams where helpful.`,

      JSDOC: `You are a code documentation expert. Add comprehensive JSDoc comments to the following ${language} code.

${baseContext}

Requirements for each function/class:
1. Description: What it does
2. @param tags: All parameters with types and descriptions
3. @returns tag: Return value type and description
4. @throws tag: Possible errors/exceptions
5. @example tag: At least one usage example

Code to document:
\`\`\`${language}
${code}
\`\`\`

IMPORTANT MARKDOWN FORMATTING RULES (for any markdown in JSDoc):
- Use proper markdown lists with a blank line before the list
- Each list item must be on its own line
- Use "- " (dash space) for unordered lists
- Use "1. " (number period space) for ordered lists
- Example of correct format:
  - First item here
  - Second item here
  - Third item here

Return the COMPLETE code with JSDoc comments added. Maintain all original code exactly as is, only add comments above declarations. Use proper JSDoc syntax.`,

      API: `You are an API documentation specialist. Generate comprehensive API documentation for the following ${language} code.

${baseContext}

CRITICAL REQUIREMENTS - You MUST include ALL of these sections:

1. **Overview Section**: Brief description of what this API does and its purpose

2. **Installation/Setup Section**: ALWAYS include setup instructions, even for code snippets
   - For Java/Spring Boot: Maven/Gradle dependencies, application.properties, database setup
   - For Node.js/Express: npm install commands, environment variables, database connection
   - For Python/Flask/Django: pip install, virtual environment, configuration
   - For Ruby/Sinatra/Rails: gem install, bundle, database migrations
   - For C#/ASP.NET: NuGet packages, appsettings.json, database context
   - Include how to run the application (e.g., mvn spring-boot:run, npm start, flask run)

3. **Complete Endpoint Documentation**: Document EVERY endpoint/function found in the code
   - You detected ${analysis.functions.length} function(s) and ${analysis.classes.length} class(es)
   - MUST document ALL of them - no exceptions
   - For each endpoint/function:
     * HTTP method and route (if applicable)
     * Purpose and description
     * Request parameters (query params, path params, body)
     * Request body schema (with example JSON)
     * Response format (with example JSON)
     * Status codes (200, 201, 400, 404, 500, etc.)
     * Error responses with examples
     * Authentication/authorization requirements

4. **Usage Examples**: Include at least 2-3 complete request/response examples using:
   - curl commands
   - Or code examples in the same language
   - Show both success and error scenarios

5. **Authentication & Security**: Document any auth requirements, API keys, JWT, etc.

Code to document:
\`\`\`${language}
${code}
\`\`\`

IMPORTANT: Even if this is just a code snippet, provide realistic setup instructions based on the framework/language patterns you detect. For example, if you see @RestController and @RequestMapping, provide Spring Boot setup instructions.

QUALITY SCORING GUIDANCE:
Your documentation will be scored on 5 criteria (100 points total):
- Overview/Description (20 points): Clear project description
- Installation/Setup (15 points): Complete setup instructions - DO NOT SKIP THIS
- Usage Examples (20 points): At least 2-3 code examples with explanations
- API Documentation (25 points): ALL functions/endpoints documented - missing any = lower score
- Structure/Formatting (20 points): Proper headers, code blocks, lists

To achieve a high score (90+), you MUST include all sections above with complete coverage.

IMPORTANT MARKDOWN FORMATTING RULES:
- Use proper markdown lists with a blank line before the list
- Each list item must be on its own line
- Use "- " (dash space) for unordered lists
- Use "1. " (number period space) for ordered lists
- Example of correct list format:

## Endpoints

- **POST /api/users** - Create a new user
- **GET /api/users/:id** - Retrieve user by ID
- **PUT /api/users/:id** - Update user information

MERMAID DIAGRAMS:
- Include Mermaid sequence diagrams to visualize API request/response flows
- Use proper Mermaid syntax with \`\`\`mermaid code blocks
- IMPORTANT: Use simple, valid Mermaid syntax (no special characters)
- Example for API flow:

\`\`\`mermaid
sequenceDiagram
    participant Client
    participant API
    participant DB as Database
    Client->>API: POST /api/users
    API->>DB: Insert user
    DB-->>API: User created
    API-->>Client: 201 Created
\`\`\`

Mermaid syntax rules (CRITICAL - Follow exactly):
- Use 'sequenceDiagram' (no version number, no colon)
- Participant names: Simple words with NO special characters
- Use 'as' for labels with spaces: participant DB as Database
- Arrow syntax: ->> for requests, -->> for responses (NO other arrow types)
- Format: ParticipantName->>OtherParticipant: Message text

Example of CORRECT syntax:
\`\`\`mermaid
sequenceDiagram
    participant C as Client
    participant A as API
    participant D as Database
    C->>A: POST /users
    A->>D: INSERT user
    D-->>A: Success
    A-->>C: 201 Created
\`\`\`

AVOID: Using ==> or other arrow types, special characters in participant names

Generate clear API documentation in Markdown format. Use tables for parameters and Mermaid diagrams for request flows where appropriate.`,

      ARCHITECTURE: `You are a software architect. Analyze the following ${language} code and generate an architectural overview.

${baseContext}

Requirements:
1. Architecture Overview: High-level system design
2. Component Breakdown: Key modules and their responsibilities
3. Data Flow: How information moves through the system
4. Dependencies: External libraries and internal modules
5. Design Patterns: Patterns used (if any)
6. Scalability Considerations: How the system could scale

Code to analyze:
\`\`\`${language}
${code}
\`\`\`

IMPORTANT MARKDOWN FORMATTING RULES:
- Use proper markdown lists with a blank line before the list
- Each list item must be on its own line
- Use "- " (dash space) for unordered lists
- Use "1. " (number period space) for ordered lists
- Example of correct list format:

## Key Components

- **API Gateway** - Routes requests to appropriate services
- **User Service** - Handles user authentication and profiles
- **Data Layer** - Manages database connections and queries

MERMAID DIAGRAMS:
- ALWAYS include Mermaid diagrams to visualize system architecture, component relationships, and data flow
- Use proper Mermaid syntax with \`\`\`mermaid code blocks
- IMPORTANT: Use simple, valid Mermaid syntax (no special characters in node IDs)
- Example architecture diagram:

\`\`\`mermaid
flowchart TD
    Client[Client Layer] --> API[API Gateway]
    API --> Auth[Auth Service]
    API --> Users[User Service]
    API --> Data[Data Service]
    Auth --> DB[(Database)]
    Users --> DB
    Data --> DB
\`\`\`

Mermaid syntax rules for architecture (CRITICAL - Follow exactly):
- Use 'flowchart TD' or 'flowchart LR' (NOT 'graph')
- Node IDs: Simple words with NO special characters (e.g., Client, API, DB, Auth, Users)
- Arrow syntax: Use --> only (NOT ==> or other arrow types)
- Format: NodeID[Label Text] --> NextNodeID[Next Label]
- Database shape: NodeID[(Database Name)]

Example of CORRECT syntax:
\`\`\`mermaid
flowchart TD
    Client[Client Layer] --> Gateway[API Gateway]
    Gateway --> Auth[Auth Service]
    Gateway --> Users[User Service]
    Auth --> DB[(Database)]
    Users --> DB
\`\`\`

Examples of WRONG syntax to AVOID:
- Using ==> instead of -->
- Node IDs with hyphens: API-Gateway[Gateway]
- Special characters: Auth_Service[Auth]
- Multiple arrows: ==> or ->>

Remember: Simple node IDs, --> arrows only, labels in square brackets

Generate architectural documentation in Markdown with comprehensive Mermaid diagrams showing system structure and interactions.`
    };

    return prompts[docType] || prompts.README;
  }

  /**
   * Build prompt with caching optimization - splits into system prompt and user message
   * @param {string} code - Source code
   * @param {Object} analysis - Code analysis data
   * @param {string} docType - Type of documentation
   * @param {string} language - Programming language
   * @returns {Object} { systemPrompt, userMessage }
   */
  buildPromptWithCaching(code, analysis, docType, language) {
    // Format exports (handle both string arrays and object arrays)
    const exportsStr = analysis.exports.length > 0
      ? analysis.exports.map(e => typeof e === 'string' ? e : e.name).join(', ')
      : 'None';

    const baseContext = `
Language: ${language}
Functions detected: ${analysis.functions.length}
Classes detected: ${analysis.classes.length}
Exports: ${exportsStr}
Complexity: ${analysis.complexity || 'Unknown'}
`;

    // System prompts: Instructions that don't change (cacheable)
    const systemPrompts = {
      README: `You are a technical documentation expert. Generate comprehensive README.md documentation for code.

Requirements:
1. Project Overview: Clear description of what the code does
2. Features: List key capabilities (bullet points)
3. Installation: Setup instructions if applicable
4. Usage: Practical examples showing how to use the code
5. API Documentation: Document all exported functions/classes with:
   - Purpose
   - Parameters (with types)
   - Return values
   - Example usage
6. Code Examples: Include at least 2 working examples

IMPORTANT MARKDOWN FORMATTING RULES:
- Use proper markdown lists with a blank line before the list
- Each list item must be on its own line
- Use "- " (dash space) for unordered lists
- Use "1. " (number period space) for ordered lists
- Example of correct list format:

## Features

- First feature here
- Second feature here
- Third feature here

MERMAID DIAGRAMS:
- Include Mermaid diagrams to visualize architecture, data flow, or component relationships
- Use proper Mermaid syntax with \`\`\`mermaid code blocks
- IMPORTANT: Use simple, valid Mermaid syntax (avoid special characters in node IDs)
- Example Mermaid diagram:

\`\`\`mermaid
flowchart TD
    A[User Input] --> B[Process Data]
    B --> C[Generate Output]
    C --> D[Return Result]
\`\`\`

Mermaid syntax rules (CRITICAL - Follow exactly):
- Use 'flowchart TD' or 'flowchart LR' (not 'graph')
- Node IDs: Single letter or simple word with NO special characters (e.g., A, B, C, Input, Process, Output)
- Arrow syntax: Use --> only (NOT ==> or ->> or any other arrow type)
- Format: NodeID[Label Text] --> NextNodeID[Next Label Text]

Examples of CORRECT syntax:
\`\`\`mermaid
flowchart TD
    A[User Input] --> B[Process Data]
    B --> C[Generate Output]
    C --> D[Return Result]
\`\`\`

Examples of WRONG syntax to AVOID:
- Using ==> instead of -->
- Node IDs with brackets: [Label] --> [Another Label]
- Special characters in node IDs: A[Price] ==> B[Calculate]
- Multiple word node IDs: Original_Price[Price]

Remember: Node ID is before the bracket, label is inside the bracket, arrow is always -->

Generate professional, clear documentation in Markdown format. Use proper formatting with headers, code blocks, bullet points, and Mermaid diagrams where helpful.`,

      JSDOC: `You are a code documentation expert. Add comprehensive JSDoc comments to code.

Requirements for each function/class:
1. Description: What it does
2. @param tags: All parameters with types and descriptions
3. @returns tag: Return value type and description
4. @throws tag: Possible errors/exceptions
5. @example tag: At least one usage example

IMPORTANT MARKDOWN FORMATTING RULES (for any markdown in JSDoc):
- Use proper markdown lists with a blank line before the list
- Each list item must be on its own line
- Use "- " (dash space) for unordered lists
- Use "1. " (number period space) for ordered lists
- Example of correct format:
  - First item here
  - Second item here
  - Third item here

Return the COMPLETE code with JSDoc comments added. Maintain all original code exactly as is, only add comments above declarations. Use proper JSDoc syntax.`,

      API: `You are an API documentation specialist. Generate comprehensive API documentation for code.

Requirements:
1. Endpoint/Function Overview: High-level description
2. For each public function/endpoint:
   - Name and signature
   - Purpose
   - Parameters: Name, type, required/optional, description
   - Return value: Type and description
   - Error responses: Possible errors and codes
   - Example request/response
3. Authentication: Requirements if any
4. Rate limiting: Mention if applicable

IMPORTANT MARKDOWN FORMATTING RULES:
- Use proper markdown lists with a blank line before the list
- Each list item must be on its own line
- Use "- " (dash space) for unordered lists
- Use "1. " (number period space) for ordered lists
- Example of correct list format:

## Endpoints

- **POST /api/users** - Create a new user
- **GET /api/users/:id** - Retrieve user by ID
- **PUT /api/users/:id** - Update user information

MERMAID DIAGRAMS:
- Include Mermaid sequence diagrams to visualize API request/response flows
- Use proper Mermaid syntax with \`\`\`mermaid code blocks
- IMPORTANT: Use simple, valid Mermaid syntax (no special characters)
- Example for API flow:

\`\`\`mermaid
sequenceDiagram
    participant Client
    participant API
    participant DB as Database
    Client->>API: POST /api/users
    API->>DB: Insert user
    DB-->>API: User created
    API-->>Client: 201 Created
\`\`\`

Mermaid syntax rules (CRITICAL - Follow exactly):
- Use 'sequenceDiagram' (no version number, no colon)
- Participant names: Simple words with NO special characters
- Use 'as' for labels with spaces: participant DB as Database
- Arrow syntax: ->> for requests, -->> for responses (NO other arrow types)
- Format: ParticipantName->>OtherParticipant: Message text

Example of CORRECT syntax:
\`\`\`mermaid
sequenceDiagram
    participant C as Client
    participant A as API
    participant D as Database
    C->>A: POST /users
    A->>D: INSERT user
    D-->>A: Success
    A-->>C: 201 Created
\`\`\`

AVOID: Using ==> or other arrow types, special characters in participant names

Generate clear API documentation in Markdown format. Use tables for parameters and Mermaid diagrams for request flows where appropriate.`,

      ARCHITECTURE: `You are a software architect. Analyze code and generate an architectural overview.

Requirements:
1. Architecture Overview: High-level system design
2. Component Breakdown: Key modules and their responsibilities
3. Data Flow: How information moves through the system
4. Dependencies: External libraries and internal modules
5. Design Patterns: Patterns used (if any)
6. Scalability Considerations: How the system could scale

IMPORTANT MARKDOWN FORMATTING RULES:
- Use proper markdown lists with a blank line before the list
- Each list item must be on its own line
- Use "- " (dash space) for unordered lists
- Use "1. " (number period space) for ordered lists
- Example of correct list format:

## Key Components

- **API Gateway** - Routes requests to appropriate services
- **User Service** - Handles user authentication and profiles
- **Data Layer** - Manages database connections and queries

MERMAID DIAGRAMS:
- ALWAYS include Mermaid diagrams to visualize system architecture, component relationships, and data flow
- Use proper Mermaid syntax with \`\`\`mermaid code blocks
- IMPORTANT: Use simple, valid Mermaid syntax (no special characters in node IDs)
- Example architecture diagram:

\`\`\`mermaid
flowchart TD
    Client[Client Layer] --> API[API Gateway]
    API --> Auth[Auth Service]
    API --> Users[User Service]
    API --> Data[Data Service]
    Auth --> DB[(Database)]
    Users --> DB
    Data --> DB
\`\`\`

Mermaid syntax rules for architecture (CRITICAL - Follow exactly):
- Use 'flowchart TD' or 'flowchart LR' (NOT 'graph')
- Node IDs: Simple words with NO special characters (e.g., Client, API, DB, Auth, Users)
- Arrow syntax: Use --> only (NOT ==> or other arrow types)
- Format: NodeID[Label Text] --> NextNodeID[Next Label]
- Database shape: NodeID[(Database Name)]

Example of CORRECT syntax:
\`\`\`mermaid
flowchart TD
    Client[Client Layer] --> Gateway[API Gateway]
    Gateway --> Auth[Auth Service]
    Gateway --> Users[User Service]
    Auth --> DB[(Database)]
    Users --> DB
\`\`\`

Examples of WRONG syntax to AVOID:
- Using ==> instead of -->
- Node IDs with hyphens: API-Gateway[Gateway]
- Special characters: Auth_Service[Auth]
- Multiple arrows: ==> or ->>

Remember: Simple node IDs, --> arrows only, labels in square brackets

Generate architectural documentation in Markdown with comprehensive Mermaid diagrams showing system structure and interactions.`
    };

    // User messages: Code + context (changes per request)
    const userMessages = {
      README: `Generate a comprehensive README.md for the following ${language} code.

${baseContext}

Code to document:
\`\`\`${language}
${code}
\`\`\``,

      JSDOC: `Add comprehensive JSDoc comments to the following ${language} code.

${baseContext}

Code to document:
\`\`\`${language}
${code}
\`\`\``,

      API: `Generate comprehensive API documentation for the following ${language} code.

${baseContext}

Code to document:
\`\`\`${language}
${code}
\`\`\``,

      ARCHITECTURE: `Analyze the following ${language} code and generate an architectural overview.

${baseContext}

Code to analyze:
\`\`\`${language}
${code}
\`\`\``
    };

    return {
      systemPrompt: systemPrompts[docType] || systemPrompts.README,
      userMessage: userMessages[docType] || userMessages.README
    };
  }
}

export default new DocGeneratorService();