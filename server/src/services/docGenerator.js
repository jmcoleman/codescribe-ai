import claudeClient from './claudeClient.js';
import { parseCode } from './codeParser.js';
import { calculateQualityScore } from './qualityScorer.js';

export class DocGeneratorService {
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
      onChunk = null
    } = options;

    // Step 1: Parse code to understand structure
    const analysis = await parseCode(code, language);

    // Step 2: Build context-aware prompt
    const prompt = this.buildPrompt(code, analysis, docType, language);

    // Step 3: Generate documentation using Claude
    let documentation;
    if (streaming && onChunk) {
      documentation = await claudeClient.generateWithStreaming(
        prompt, 
        onChunk
      );
    } else {
      documentation = await claudeClient.generate(prompt);
    }

    // Step 4: Calculate quality score
    const qualityScore = calculateQualityScore(documentation, analysis, docType);

    return {
      documentation,
      qualityScore,
      analysis,
      metadata: {
        language,
        docType,
        generatedAt: new Date().toISOString(),
        codeLength: code.length
      }
    };
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

Code to document:
\`\`\`${language}
${code}
\`\`\`

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

Code to document:
\`\`\`${language}
${code}
\`\`\`

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
}

export default new DocGeneratorService();