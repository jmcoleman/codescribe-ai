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
    const qualityScore = calculateQualityScore(documentation, analysis);

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
    const baseContext = `
Language: ${language}
Functions detected: ${analysis.functions.length}
Classes detected: ${analysis.classes.length}
Exports: ${analysis.exports.join(', ') || 'None'}
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

Generate professional, clear documentation in Markdown format. Use proper formatting with headers, code blocks, and bullet points.`,

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

Generate clear API documentation in Markdown format. Use tables for parameters where appropriate.`,

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

Generate architectural documentation in Markdown. Include a text-based diagram if helpful.`
    };

    return prompts[docType] || prompts.README;
  }
}

export default new DocGeneratorService();