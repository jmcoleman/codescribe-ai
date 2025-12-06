import { parseCode } from './codeParser.js';
import { calculateQualityScore } from './qualityScorer.js';
import LLMService from './llm/llmService.js';
import {
  loadSystemPrompts,
  loadUserMessageTemplates,
  processTemplate,
  getPromptVersion
} from '../prompts/promptLoader.js';
import { getDocTypeConfig, getSupportedDocTypes } from '../prompts/docTypeConfig.js';

/**
 * Fix Mermaid diagram syntax by adding quotes around labels with special characters
 * @param {string} mermaidCode - The Mermaid diagram code
 * @returns {string} Fixed Mermaid code
 */
function fixMermaidSyntax(mermaidCode) {
  const lines = mermaidCode.split('\n');
  const fixedLines = lines.map(line => {
    // Skip the diagram type line (flowchart, graph, etc.)
    if (line.trim().match(/^(flowchart|graph|sequenceDiagram|classDiagram|stateDiagram|erDiagram|gantt|pie|journey)/)) {
      return line;
    }

    // Match node definitions like: NodeId[Label] or NodeId --> OtherNode[Label]
    // This regex finds labels in square brackets that aren't already quoted
    return line.replace(/\[([^\]"]+)\]/g, (match, label) => {
      // If label already has quotes, leave it alone
      if (label.startsWith('"') && label.endsWith('"')) {
        return match;
      }

      // Check if label has special characters that need quoting
      // Common special chars in API paths and labels: / : - ( ) { } < > = + & | ! @ # $ % ^
      if (/[/:(){}[\]<>=+&|!@#$%^-]/.test(label)) {
        return `["${label}"]`;
      }

      return match;
    });
  });

  return fixedLines.join('\n');
}

/**
 * Process documentation to fix Mermaid diagram syntax
 * Finds all Mermaid code blocks and applies fixes
 * @param {string} documentation - The generated documentation
 * @returns {string} Documentation with fixed Mermaid diagrams
 */
function fixMermaidDiagrams(documentation) {
  // Match Mermaid code blocks: ```mermaid ... ```
  return documentation.replace(/```mermaid\n([\s\S]*?)```/g, (match, mermaidCode) => {
    const fixedCode = fixMermaidSyntax(mermaidCode);
    return `\`\`\`mermaid\n${fixedCode}\`\`\``;
  });
}

export class DocGeneratorService {
  constructor() {
    // Initialize LLM service (uses config from environment)
    this.llmService = new LLMService();

    // Prompts will be loaded asynchronously on first use
    this.systemPrompts = null;
    this.userMessageTemplates = null;
    this.promptVersion = getPromptVersion();
    this._initialized = false;
    this._initPromise = null;
  }

  /**
   * Initialize prompts (called automatically on first use)
   * Loads all prompts in parallel for better performance
   * @returns {Promise<void>}
   */
  async _ensureInitialized() {
    if (this._initialized) return;

    // Prevent multiple concurrent initializations
    if (this._initPromise) {
      await this._initPromise;
      return;
    }

    this._initPromise = (async () => {
      // Load both system prompts and user templates in parallel
      const [systemPrompts, userTemplates] = await Promise.all([
        loadSystemPrompts(),
        loadUserMessageTemplates()
      ]);

      this.systemPrompts = systemPrompts;
      this.userMessageTemplates = userTemplates;
      this._initialized = true;
    })();

    await this._initPromise;
  }

  /**
   * Generate documentation for provided code
   * @param {string} code - Source code to document
   * @param {Object} options - Generation options
   * @param {string} options.docType - Documentation type (README, JSDOC, API, etc.)
   * @param {string} options.language - Programming language
   * @param {boolean} options.streaming - Enable streaming mode
   * @param {Function} options.onChunk - Callback for streaming chunks
   * @param {boolean} options.isDefaultCode - Whether this is example/default code (for caching)
   * @param {string} options.userTier - User tier (free, pro, etc.)
   * @param {string} options.filename - Source filename
   * @param {Object} options.trialInfo - Trial information (for watermarking)
   * @param {boolean} options.trialInfo.isOnTrial - Whether user is on trial
   * @param {string} options.trialInfo.trialEndsAt - Trial end date (ISO string)
   * @returns {Promise<Object>} Documentation result
   */
  async generateDocumentation(code, options = {}) {
    // Ensure prompts are loaded (lazy initialization)
    await this._ensureInitialized();

    const {
      docType = 'README',
      language = 'javascript',
      streaming = false,
      onChunk = null,
      isDefaultCode = false,
      userTier = 'free',
      filename = 'untitled',
      trialInfo = null
    } = options;

    // Step 1: Parse code to understand structure
    const analysis = await parseCode(code, language);

    // Step 2: Build system prompt (cacheable) and user message
    const { systemPrompt, userMessage } = this.buildPromptWithCaching(code, analysis, docType, language, filename);

    // Step 3: Get doc type-specific LLM configuration
    const docTypeConfig = getDocTypeConfig(docType);

    // Debug logging for provider override
    console.log(`[DocGenerator] Doc type: ${docType}, Provider override: ${docTypeConfig.provider}, Model override: ${docTypeConfig.model}`);

    // Step 4: Generate documentation using LLM service with doc type config
    const llmOptions = {
      systemPrompt,
      enableCaching: isDefaultCode, // Cache user message if it's default/example code
      // Apply doc type-specific provider/model/temperature
      provider: docTypeConfig.provider,
      model: docTypeConfig.model,
      temperature: docTypeConfig.temperature,
      maxTokens: docTypeConfig.maxTokens
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

    let documentation = result.text;

    // Step 4: Fix Mermaid diagram syntax (add quotes to labels with special characters)
    documentation = fixMermaidDiagrams(documentation);

    // Step 5: Add tier-based attribution footer (works for both cached and non-cached responses)
    // If user is on trial, show trial watermark with expiry date
    const attribution = this.buildAttribution(userTier, trialInfo);
    // Trim leading and trailing whitespace for clean output
    const documentationWithAttribution = this.insertAttribution(documentation.trim(), attribution, docType);

    // Step 6: Calculate quality score (includes input code health assessment)
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
        cacheEnabled: isDefaultCode,
        promptVersion: this.promptVersion,  // Track prompt version for A/B testing and rollbacks
        // Include doc type config for debugging/analytics
        docTypeConfig: {
          provider: docTypeConfig.provider,
          model: docTypeConfig.model,
          temperature: docTypeConfig.temperature
        }
      }
    };
  }

  /**
   * Build tier-based attribution footer
   * @param {string} tier - User tier (free, pro, team, enterprise)
   * @param {Object|null} trialInfo - Trial information (optional)
   * @param {boolean} trialInfo.isOnTrial - Whether user is on trial
   * @param {string} trialInfo.trialEndsAt - Trial end date (ISO string)
   * @returns {string} Attribution footer text
   */
  buildAttribution(tier, trialInfo = null) {
    // Trial attribution takes precedence - shows trial status with expiry date
    if (trialInfo?.isOnTrial && trialInfo?.trialEndsAt) {
      const expiryDate = new Date(trialInfo.trialEndsAt);
      const formattedDate = expiryDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      return `\n\n---\n*🔶 Trial Access - Generated with [CodeScribe AI](https://codescribeai.com)*  \n*Trial expires: ${formattedDate} | [Upgrade to Pro](https://codescribeai.com/pricing) to remove this watermark*`;
    }

    const attributions = {
      free: `\n\n---\n*🟣 Generated with [CodeScribe AI](https://codescribeai.com) • Free Tier*  \n*Upgrade to [Pro](https://codescribeai.com/pricing) to remove this watermark and unlock advanced features*`,

      starter: `\n\n---\n*Generated with [CodeScribe AI](https://codescribeai.com) - AI-powered code documentation*`,

      pro: `\n\n---\n*Generated with [CodeScribe AI](https://codescribeai.com) - AI-powered code documentation*`,

      team: `\n\n---\n*Generated with [CodeScribe AI](https://codescribeai.com)*`,

      enterprise: '' // No attribution for enterprise
    };

    // Use hasOwnProperty to check if tier exists (not just if value is truthy)
    // This allows empty string for enterprise tier
    return attributions.hasOwnProperty(tier) ? attributions[tier] : attributions.free;
  }

  /**
   * Insert attribution footer, handling special cases like code blocks
   * @param {string} documentation - Generated documentation
   * @param {string} attribution - Attribution footer
   * @param {string} docType - Documentation type
   * @returns {string} Documentation with attribution properly inserted
   */
  insertAttribution(documentation, attribution, docType) {
    // Skip attribution if empty (enterprise tier)
    if (!attribution) {
      return documentation;
    }

    // Count all code fences to detect unclosed code blocks
    const allFences = documentation.match(/```/g) || [];
    const totalFenceCount = allFences.length;
    const hasUnclosedCodeBlock = totalFenceCount % 2 === 1;

    // If there's an unclosed code block, close it before adding attribution
    if (hasUnclosedCodeBlock) {
      return documentation.trimEnd() + '\n```' + attribution;
    }

    // OPENAPI docs end with YAML code blocks - insert attribution OUTSIDE the code block
    if (docType === 'OPENAPI') {
      // Find the last closing code fence (```) in the document
      const lastCodeFenceIndex = documentation.lastIndexOf('```');
      if (lastCodeFenceIndex !== -1) {
        // Find where this fence line ends
        const fenceEnd = documentation.indexOf('\n', lastCodeFenceIndex);
        if (fenceEnd !== -1) {
          // Insert attribution after the closing fence
          const beforeAttribution = documentation.slice(0, fenceEnd + 1).trimEnd();
          const afterFence = documentation.slice(fenceEnd + 1).trim();
          if (afterFence) {
            // There's trailing content - put attribution between fence and trailing content
            return beforeAttribution + attribution + '\n\n' + afterFence;
          }
          return beforeAttribution + attribution;
        }
        // No newline after fence - just append attribution
        return documentation + attribution;
      }
    }

    // Default: Append attribution at the end
    return documentation + attribution;
  }

  /**
   * Build prompt with caching optimization - splits into system prompt and user message
   * Uses prompts loaded from external files for easier A/B testing and non-dev editing
   * @param {string} code - Source code
   * @param {Object} analysis - Code analysis data
   * @param {string} docType - Type of documentation
   * @param {string} language - Programming language
   * @param {string} filename - Original filename for title formatting
   * @returns {Object} { systemPrompt, userMessage }
   */
  buildPromptWithCaching(code, analysis, docType, language, filename = 'untitled') {
    // Validate docType - default to README if invalid (for backwards compatibility)
    const validDocTypes = getSupportedDocTypes();
    const normalizedDocType = validDocTypes.includes(docType) ? docType : 'README';

    // Format exports (handle both string arrays and object arrays)
    const exportsStr = analysis.exports.length > 0
      ? analysis.exports.map(e => typeof e === 'string' ? e : e.name).join(', ')
      : 'None';

    // Build base context for user message
    const baseContext = `
Language: ${language}
Functions detected: ${analysis.functions.length}
Classes detected: ${analysis.classes.length}
Exports: ${exportsStr}
Complexity: ${analysis.complexity || 'Unknown'}
`;

    // Get system prompt (cached, loaded from external file)
    const systemPrompt = this.systemPrompts[normalizedDocType];

    // Get user message template and process it
    const userMessageTemplate = this.userMessageTemplates[normalizedDocType];
    const userMessage = processTemplate(userMessageTemplate, {
      language,
      baseContext,
      code,
      filename
    });

    return {
      systemPrompt,
      userMessage
    };
  }
}

export default new DocGeneratorService();