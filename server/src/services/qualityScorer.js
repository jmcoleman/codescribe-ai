/**
 * Quality Scorer - Doc-Type Specific Scoring
 *
 * Each documentation type has industry-standard criteria appropriate for that format.
 *
 * README (100 pts):
 *   - Overview/Description (20) - Project summary
 *   - Installation/Setup (15) - Getting started instructions
 *   - Usage Examples (20) - Code examples
 *   - API Documentation (25) - Function/method coverage
 *   - Structure/Formatting (20) - Headers, formatting
 *
 * JSDOC (100 pts):
 *   - Function Coverage (30) - All functions documented
 *   - Parameter Documentation (25) - @param tags with types
 *   - Return Documentation (20) - @returns tags
 *   - Examples (15) - @example tags
 *   - Type Annotations (10) - Type information
 *
 * API (100 pts):
 *   - Endpoint Coverage (25) - All endpoints documented
 *   - Request Documentation (20) - Parameters, headers, body
 *   - Response Documentation (20) - Status codes, schemas
 *   - Examples (20) - Request/response examples
 *   - Error Documentation (15) - Error codes and handling
 *
 * OPENAPI (100 pts):
 *   - Structure Validity (20) - Valid OpenAPI structure (info, paths)
 *   - Endpoint Coverage (25) - All endpoints defined
 *   - Schema Definitions (20) - Request/response schemas
 *   - Parameter Documentation (15) - Path, query, header params
 *   - Examples & Descriptions (20) - Descriptions and examples
 *
 * ARCHITECTURE (100 pts):
 *   - System Overview (25) - High-level description
 *   - Component Documentation (25) - Components/modules described
 *   - Data Flow (20) - How data moves through system
 *   - Diagrams (15) - Mermaid or visual diagrams
 *   - Design Decisions (15) - Rationale and trade-offs
 */

export function calculateQualityScore(documentation, codeAnalysis, docType = 'README', inputCode = '') {
  // Assess input code quality (shows "before" state for comparison)
  const inputCodeHealth = inputCode ? assessInputCodeQuality(inputCode, codeAnalysis) : null;

  // Route to appropriate scorer based on doc type
  let result;
  switch (docType.toUpperCase()) {
    case 'JSDOC':
      result = scoreJSDoc(documentation, codeAnalysis);
      break;
    case 'API':
      result = scoreAPI(documentation, codeAnalysis);
      break;
    case 'OPENAPI':
      result = scoreOpenAPI(documentation, codeAnalysis);
      break;
    case 'ARCHITECTURE':
      result = scoreArchitecture(documentation, codeAnalysis);
      break;
    case 'README':
    default:
      result = scoreREADME(documentation, codeAnalysis);
      break;
  }

  // Calculate improvement delta if we have input code health
  const improvement = inputCodeHealth ? result.score - inputCodeHealth.score : null;

  return {
    ...result,
    docType,
    inputCodeHealth,
    improvement
  };
}

/**
 * Score README documentation
 * Criteria: Overview, Installation, Examples, API Docs, Structure
 */
function scoreREADME(documentation, codeAnalysis) {
  let score = 0;
  const breakdown = {};

  // 1. Overview/Description (20 points)
  const hasOverviewSection = hasSection(documentation, [
    'overview', 'description', 'about', 'introduction', 'what is'
  ]);
  const hasDescriptionAfterTitle = /^#\s+.+\n\n[A-Z].{20,}/m.test(documentation);
  const hasOverview = hasOverviewSection || hasDescriptionAfterTitle;

  if (hasOverview) {
    score += 20;
    breakdown.overview = {
      present: true,
      points: 20,
      maxPoints: 20,
      status: 'complete'
    };
  } else {
    breakdown.overview = {
      present: false,
      points: 0,
      maxPoints: 20,
      status: 'missing',
      suggestion: 'Add an overview section describing what the code does'
    };
  }

  // 2. Installation/Setup Instructions (15 points)
  const hasInstallation = hasSection(documentation, [
    'installation', 'setup', 'getting started', 'install', 'requirements', 'prerequisites'
  ]);

  if (hasInstallation) {
    score += 15;
    breakdown.installation = {
      present: true,
      points: 15,
      maxPoints: 15,
      status: 'complete'
    };
  } else {
    breakdown.installation = {
      present: false,
      points: 0,
      maxPoints: 15,
      status: 'missing',
      suggestion: 'Add installation or setup instructions'
    };
  }

  // 3. Usage Examples (20 points)
  const exampleCount = countCodeBlocks(documentation);
  let examplePoints = 0;
  let exampleStatus = 'missing';
  let exampleSuggestion = 'Add usage examples with code blocks';

  if (exampleCount >= 3) {
    examplePoints = 20;
    exampleStatus = 'complete';
    exampleSuggestion = null;
  } else if (exampleCount === 2) {
    examplePoints = 15;
    exampleStatus = 'partial';
    exampleSuggestion = 'Add one more usage example';
  } else if (exampleCount === 1) {
    examplePoints = 10;
    exampleStatus = 'partial';
    exampleSuggestion = 'Add more usage examples (currently only 1)';
  }

  score += examplePoints;
  breakdown.examples = {
    present: exampleCount > 0,
    count: exampleCount,
    points: examplePoints,
    maxPoints: 20,
    status: exampleStatus,
    suggestion: exampleSuggestion
  };

  // 4. API Documentation (25 points)
  const { functionsCovered, totalFunctions } = countFunctionDocs(documentation, codeAnalysis);
  const coverageRatio = totalFunctions > 0 ? functionsCovered / totalFunctions : 1;
  const apiPoints = Math.round(25 * coverageRatio);
  score += apiPoints;

  let apiStatus = 'complete';
  let apiSuggestion = null;

  if (coverageRatio < 0.5) {
    apiStatus = 'missing';
    apiSuggestion = `Document all functions (currently ${functionsCovered}/${totalFunctions})`;
  } else if (coverageRatio < 1) {
    apiStatus = 'partial';
    apiSuggestion = `Document remaining functions (${functionsCovered}/${totalFunctions} covered)`;
  }

  breakdown.apiDocs = {
    present: apiPoints > 0,
    coverage: `${functionsCovered}/${totalFunctions}`,
    coveragePercent: Math.round(coverageRatio * 100),
    points: apiPoints,
    maxPoints: 25,
    status: apiStatus,
    suggestion: apiSuggestion
  };

  // 5. Structure/Formatting (20 points)
  const headerCount = countHeaders(documentation);
  const hasCodeBlocks = exampleCount > 0;
  const hasBulletPoints = documentation.includes('- ') || documentation.includes('* ');

  let structurePoints = 0;
  let structureStatus = 'missing';
  let structureSuggestion = 'Add section headers and formatting';

  if (headerCount >= 3 && hasCodeBlocks && hasBulletPoints) {
    structurePoints = 20;
    structureStatus = 'complete';
    structureSuggestion = null;
  } else if (headerCount >= 2) {
    structurePoints = 12;
    structureStatus = 'partial';
    structureSuggestion = 'Add more section headers for better organization';
  } else if (headerCount >= 1) {
    structurePoints = 8;
    structureStatus = 'partial';
    structureSuggestion = 'Improve structure with more headers and formatting';
  }

  score += structurePoints;
  breakdown.structure = {
    present: headerCount > 0,
    headers: headerCount,
    hasCodeBlocks,
    hasBulletPoints,
    points: structurePoints,
    maxPoints: 20,
    status: structureStatus,
    suggestion: structureSuggestion
  };

  return {
    score,
    grade: getGrade(score),
    breakdown,
    summary: generateSummary(score, breakdown)
  };
}

/**
 * Score JSDoc documentation
 * Criteria: Function Coverage, Parameters, Returns, Examples, Types
 *
 * Supports markdown-wrapped JSDoc output with:
 * - Overview section outside code block
 * - Annotated code inside fenced code block
 */
function scoreJSDoc(documentation, codeAnalysis) {
  let score = 0;
  const breakdown = {};

  // 1. Function Coverage (30 points) - Are all functions documented?
  const { functionsCovered, totalFunctions } = countFunctionDocs(documentation, codeAnalysis);
  const coverageRatio = totalFunctions > 0 ? functionsCovered / totalFunctions : 1;
  const coveragePoints = Math.round(30 * coverageRatio);
  score += coveragePoints;

  breakdown.functionCoverage = {
    present: coveragePoints > 0,
    coverage: `${functionsCovered}/${totalFunctions}`,
    coveragePercent: Math.round(coverageRatio * 100),
    points: coveragePoints,
    maxPoints: 30,
    status: coverageRatio >= 0.9 ? 'complete' : coverageRatio >= 0.5 ? 'partial' : 'missing',
    suggestion: coverageRatio < 1 ? `Document all functions (${functionsCovered}/${totalFunctions} covered)` : null
  };

  // 2. Parameter Documentation (25 points) - @param tags
  const paramCount = (documentation.match(/@param\s/g) || []).length;
  const expectedParams = countExpectedParams(codeAnalysis);
  const paramRatio = expectedParams > 0 ? Math.min(paramCount / expectedParams, 1) : 1;
  const paramPoints = Math.round(25 * paramRatio);
  score += paramPoints;

  breakdown.parameters = {
    present: paramCount > 0,
    count: paramCount,
    expected: expectedParams,
    points: paramPoints,
    maxPoints: 25,
    status: paramRatio >= 0.9 ? 'complete' : paramRatio >= 0.5 ? 'partial' : 'missing',
    suggestion: paramRatio < 0.9 ? 'Add @param tags for all function parameters' : null
  };

  // 3. Return Documentation (20 points) - @returns tags
  const returnsCount = (documentation.match(/@returns?\s/g) || []).length;
  const functionsWithReturns = countFunctionsWithReturns(codeAnalysis);
  const returnsRatio = functionsWithReturns > 0 ? Math.min(returnsCount / functionsWithReturns, 1) : 1;
  const returnsPoints = Math.round(20 * returnsRatio);
  score += returnsPoints;

  breakdown.returns = {
    present: returnsCount > 0,
    count: returnsCount,
    expected: functionsWithReturns,
    points: returnsPoints,
    maxPoints: 20,
    status: returnsRatio >= 0.9 ? 'complete' : returnsRatio >= 0.5 ? 'partial' : 'missing',
    suggestion: returnsRatio < 0.9 ? 'Add @returns tags for functions that return values' : null
  };

  // 4. Examples (15 points) - @example tags
  const exampleTags = (documentation.match(/@example/g) || []).length;
  const hasExamples = exampleTags > 0;
  let examplePoints = 0;

  if (exampleTags >= 2) {
    examplePoints = 15;
  } else if (hasExamples) {
    examplePoints = 10;
  }
  score += examplePoints;

  breakdown.examples = {
    present: hasExamples,
    exampleTags,
    points: examplePoints,
    maxPoints: 15,
    status: examplePoints >= 15 ? 'complete' : examplePoints > 0 ? 'partial' : 'missing',
    suggestion: !hasExamples ? 'Add @example tags showing usage' : null
  };

  // 5. Type Annotations (10 points) - {type} in @param/@returns
  const typedParams = (documentation.match(/@param\s+\{[^}]+\}/g) || []).length;
  const typedReturns = (documentation.match(/@returns?\s+\{[^}]+\}/g) || []).length;
  const typeRatio = paramCount > 0 ? typedParams / paramCount : (returnsCount > 0 ? typedReturns / returnsCount : 1);
  const typePoints = Math.round(10 * Math.min(typeRatio, 1));
  score += typePoints;

  breakdown.types = {
    present: typedParams > 0 || typedReturns > 0,
    typedParams,
    typedReturns,
    points: typePoints,
    maxPoints: 10,
    status: typeRatio >= 0.9 ? 'complete' : typeRatio >= 0.5 ? 'partial' : 'missing',
    suggestion: typeRatio < 0.9 ? 'Add type annotations {type} to @param and @returns' : null
  };

  return {
    score,
    grade: getGrade(score),
    breakdown,
    summary: generateSummary(score, breakdown)
  };
}

/**
 * Score API documentation
 * Criteria: Endpoint Coverage, Request Docs, Response Docs, Examples, Error Docs
 */
function scoreAPI(documentation, codeAnalysis) {
  let score = 0;
  const breakdown = {};
  const lowerDoc = documentation.toLowerCase();

  // 1. Endpoint Coverage (25 points) - Are endpoints documented?
  const endpointPatterns = /(?:GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s+[\/\w\-\:\{\}]+/gi;
  const endpoints = (documentation.match(endpointPatterns) || []).length;
  const hasEndpointSection = hasSection(documentation, ['endpoints', 'routes', 'api reference', 'resources']);

  let endpointPoints = 0;
  if (endpoints >= 3 || hasEndpointSection) {
    endpointPoints = 25;
  } else if (endpoints >= 1) {
    endpointPoints = 15;
  }
  score += endpointPoints;

  breakdown.endpoints = {
    present: endpoints > 0 || hasEndpointSection,
    count: endpoints,
    points: endpointPoints,
    maxPoints: 25,
    status: endpointPoints >= 25 ? 'complete' : endpointPoints > 0 ? 'partial' : 'missing',
    suggestion: endpointPoints < 25 ? 'Document all API endpoints with HTTP methods' : null
  };

  // 2. Request Documentation (20 points) - Parameters, headers, body
  const hasParams = lowerDoc.includes('parameter') || lowerDoc.includes('query') || lowerDoc.includes('path param');
  const hasHeaders = lowerDoc.includes('header') || lowerDoc.includes('authorization') || lowerDoc.includes('content-type');
  const hasBody = lowerDoc.includes('request body') || lowerDoc.includes('payload') || lowerDoc.includes('json body');

  let requestPoints = 0;
  if (hasParams && hasHeaders && hasBody) {
    requestPoints = 20;
  } else if (hasParams || hasBody) {
    requestPoints = 12;
  } else if (hasHeaders) {
    requestPoints = 8;
  }
  score += requestPoints;

  breakdown.requests = {
    present: hasParams || hasHeaders || hasBody,
    hasParams,
    hasHeaders,
    hasBody,
    points: requestPoints,
    maxPoints: 20,
    status: requestPoints >= 20 ? 'complete' : requestPoints > 0 ? 'partial' : 'missing',
    suggestion: requestPoints < 20 ? 'Document request parameters, headers, and body format' : null
  };

  // 3. Response Documentation (20 points) - Status codes, response schemas
  const statusCodes = (documentation.match(/\b[1-5]\d{2}\b/g) || []).length;
  const hasResponseSection = hasSection(documentation, ['response', 'returns', 'output']);
  const hasSchema = lowerDoc.includes('schema') || lowerDoc.includes('response body') || documentation.includes('```json');

  let responsePoints = 0;
  if (statusCodes >= 2 && (hasResponseSection || hasSchema)) {
    responsePoints = 20;
  } else if (statusCodes >= 1 || hasResponseSection) {
    responsePoints = 12;
  }
  score += responsePoints;

  breakdown.responses = {
    present: statusCodes > 0 || hasResponseSection,
    statusCodes,
    hasSchema,
    points: responsePoints,
    maxPoints: 20,
    status: responsePoints >= 20 ? 'complete' : responsePoints > 0 ? 'partial' : 'missing',
    suggestion: responsePoints < 20 ? 'Document response status codes and schemas' : null
  };

  // 4. Examples (20 points) - Request/response examples
  const codeBlocks = countCodeBlocks(documentation);
  const hasCurlExamples = lowerDoc.includes('curl') || lowerDoc.includes('example request');
  const hasResponseExamples = lowerDoc.includes('example response') || (codeBlocks >= 2 && documentation.includes('```json'));

  let examplePoints = 0;
  if (codeBlocks >= 3 || (hasCurlExamples && hasResponseExamples)) {
    examplePoints = 20;
  } else if (codeBlocks >= 1) {
    examplePoints = 12;
  }
  score += examplePoints;

  breakdown.examples = {
    present: codeBlocks > 0,
    codeBlocks,
    hasCurlExamples,
    hasResponseExamples,
    points: examplePoints,
    maxPoints: 20,
    status: examplePoints >= 20 ? 'complete' : examplePoints > 0 ? 'partial' : 'missing',
    suggestion: examplePoints < 20 ? 'Add request and response examples' : null
  };

  // 5. Error Documentation (15 points) - Error codes and handling
  const hasErrorSection = hasSection(documentation, ['error', 'errors', 'error handling', 'error codes']);
  const errorCodes = (documentation.match(/\b4\d{2}\b|\b5\d{2}\b/g) || []).length;
  const hasErrorDescriptions = lowerDoc.includes('error message') || lowerDoc.includes('error response');

  let errorPoints = 0;
  if (hasErrorSection && errorCodes >= 2) {
    errorPoints = 15;
  } else if (hasErrorSection || errorCodes >= 1) {
    errorPoints = 8;
  }
  score += errorPoints;

  breakdown.errors = {
    present: hasErrorSection || errorCodes > 0,
    hasErrorSection,
    errorCodes,
    points: errorPoints,
    maxPoints: 15,
    status: errorPoints >= 15 ? 'complete' : errorPoints > 0 ? 'partial' : 'missing',
    suggestion: errorPoints < 15 ? 'Document error codes and error handling' : null
  };

  return {
    score,
    grade: getGrade(score),
    breakdown,
    summary: generateSummary(score, breakdown)
  };
}

/**
 * Score OpenAPI/Swagger documentation
 * Criteria: Structure, Endpoints, Schemas, Parameters, Examples
 */
function scoreOpenAPI(documentation, codeAnalysis) {
  let score = 0;
  const breakdown = {};
  const lowerDoc = documentation.toLowerCase();

  // 1. Structure Validity (20 points) - Valid OpenAPI structure
  const hasOpenAPIVersion = /openapi:\s*["']?3\.\d/i.test(documentation) || /swagger:\s*["']?2\.\d/i.test(documentation);
  const hasInfo = /info:/i.test(documentation) && /title:/i.test(documentation);
  const hasPaths = /paths:/i.test(documentation);

  let structurePoints = 0;
  if (hasOpenAPIVersion && hasInfo && hasPaths) {
    structurePoints = 20;
  } else if (hasPaths && (hasInfo || hasOpenAPIVersion)) {
    structurePoints = 12;
  } else if (hasPaths) {
    structurePoints = 8;
  }
  score += structurePoints;

  breakdown.structure = {
    present: hasPaths,
    hasOpenAPIVersion,
    hasInfo,
    hasPaths,
    points: structurePoints,
    maxPoints: 20,
    status: structurePoints >= 20 ? 'complete' : structurePoints > 0 ? 'partial' : 'missing',
    suggestion: structurePoints < 20 ? 'Include openapi version, info section, and paths' : null
  };

  // 2. Endpoint Coverage (25 points) - All endpoints defined
  const pathDefinitions = (documentation.match(/^\s*['"]?\/[^'":\n]+['"]?:/gm) || []).length;
  const httpMethods = (documentation.match(/\b(get|post|put|patch|delete|head|options):/gi) || []).length;

  let endpointPoints = 0;
  if (pathDefinitions >= 3 && httpMethods >= 3) {
    endpointPoints = 25;
  } else if (pathDefinitions >= 1 && httpMethods >= 1) {
    endpointPoints = 15;
  } else if (pathDefinitions >= 1 || httpMethods >= 1) {
    endpointPoints = 8;
  }
  score += endpointPoints;

  breakdown.endpoints = {
    present: pathDefinitions > 0,
    pathDefinitions,
    httpMethods,
    points: endpointPoints,
    maxPoints: 25,
    status: endpointPoints >= 25 ? 'complete' : endpointPoints > 0 ? 'partial' : 'missing',
    suggestion: endpointPoints < 25 ? 'Define all API endpoints with HTTP methods' : null
  };

  // 3. Schema Definitions (20 points) - Request/response schemas
  const hasComponents = /components:/i.test(documentation) || /definitions:/i.test(documentation);
  const hasSchemas = /schemas:/i.test(documentation) || /schema:/gi.test(documentation);
  const schemaCount = (documentation.match(/type:\s*(object|array|string|integer|number|boolean)/gi) || []).length;

  let schemaPoints = 0;
  if (hasComponents && schemaCount >= 3) {
    schemaPoints = 20;
  } else if (hasSchemas && schemaCount >= 1) {
    schemaPoints = 12;
  } else if (schemaCount >= 1) {
    schemaPoints = 6;
  }
  score += schemaPoints;

  breakdown.schemas = {
    present: hasSchemas || schemaCount > 0,
    hasComponents,
    schemaCount,
    points: schemaPoints,
    maxPoints: 20,
    status: schemaPoints >= 20 ? 'complete' : schemaPoints > 0 ? 'partial' : 'missing',
    suggestion: schemaPoints < 20 ? 'Define request/response schemas in components section' : null
  };

  // 4. Parameter Documentation (15 points) - Path, query, header params
  const hasParameters = /parameters:/i.test(documentation);
  const paramTypes = (documentation.match(/in:\s*(path|query|header|body|cookie)/gi) || []).length;
  const hasRequired = /required:\s*(true|false)/gi.test(documentation);

  let paramPoints = 0;
  if (hasParameters && paramTypes >= 2 && hasRequired) {
    paramPoints = 15;
  } else if (hasParameters && paramTypes >= 1) {
    paramPoints = 10;
  } else if (paramTypes >= 1) {
    paramPoints = 5;
  }
  score += paramPoints;

  breakdown.parameters = {
    present: hasParameters || paramTypes > 0,
    hasParameters,
    paramTypes,
    hasRequired,
    points: paramPoints,
    maxPoints: 15,
    status: paramPoints >= 15 ? 'complete' : paramPoints > 0 ? 'partial' : 'missing',
    suggestion: paramPoints < 15 ? 'Document path, query, and header parameters' : null
  };

  // 5. Examples & Descriptions (20 points) - Descriptions and examples
  const hasDescriptions = (documentation.match(/description:/gi) || []).length;
  const hasSummary = (documentation.match(/summary:/gi) || []).length;
  const hasExamples = /example:/i.test(documentation) || /examples:/i.test(documentation);

  let examplePoints = 0;
  if (hasDescriptions >= 3 && hasExamples) {
    examplePoints = 20;
  } else if (hasDescriptions >= 2 || hasSummary >= 2) {
    examplePoints = 12;
  } else if (hasDescriptions >= 1 || hasSummary >= 1) {
    examplePoints = 6;
  }
  score += examplePoints;

  breakdown.descriptions = {
    present: hasDescriptions > 0 || hasSummary > 0,
    descriptions: hasDescriptions,
    summaries: hasSummary,
    hasExamples,
    points: examplePoints,
    maxPoints: 20,
    status: examplePoints >= 20 ? 'complete' : examplePoints > 0 ? 'partial' : 'missing',
    suggestion: examplePoints < 20 ? 'Add descriptions and examples for endpoints' : null
  };

  return {
    score,
    grade: getGrade(score),
    breakdown,
    summary: generateSummary(score, breakdown)
  };
}

/**
 * Score Architecture documentation
 * Criteria: System Overview, Components, Data Flow, Diagrams, Design Decisions
 */
function scoreArchitecture(documentation, codeAnalysis) {
  let score = 0;
  const breakdown = {};
  const lowerDoc = documentation.toLowerCase();

  // 1. System Overview (25 points) - High-level description
  const hasOverview = hasSection(documentation, [
    'overview', 'introduction', 'system overview', 'architecture overview', 'about'
  ]);
  const hasHighLevel = lowerDoc.includes('high-level') || lowerDoc.includes('high level') ||
                       lowerDoc.includes('purpose') || lowerDoc.includes('goal');
  const hasTechStack = hasSection(documentation, ['tech stack', 'technology', 'stack', 'built with']);

  let overviewPoints = 0;
  if (hasOverview && (hasHighLevel || hasTechStack)) {
    overviewPoints = 25;
  } else if (hasOverview) {
    overviewPoints = 15;
  } else if (hasTechStack) {
    overviewPoints = 10;
  }
  score += overviewPoints;

  breakdown.overview = {
    present: hasOverview || hasTechStack,
    hasOverview,
    hasHighLevel,
    hasTechStack,
    points: overviewPoints,
    maxPoints: 25,
    status: overviewPoints >= 25 ? 'complete' : overviewPoints > 0 ? 'partial' : 'missing',
    suggestion: overviewPoints < 25 ? 'Add system overview with purpose and tech stack' : null
  };

  // 2. Component Documentation (25 points) - Components/modules described
  const hasComponents = hasSection(documentation, [
    'component', 'module', 'service', 'layer', 'package', 'structure'
  ]);
  const componentHeaders = (documentation.match(/^##?\s+.*(component|module|service|layer)/gim) || []).length;
  const hasDependencies = lowerDoc.includes('dependenc') || lowerDoc.includes('relies on') || lowerDoc.includes('uses');

  let componentPoints = 0;
  if (hasComponents && componentHeaders >= 2) {
    componentPoints = 25;
  } else if (hasComponents || componentHeaders >= 1) {
    componentPoints = 15;
  } else if (hasDependencies) {
    componentPoints = 8;
  }
  score += componentPoints;

  breakdown.components = {
    present: hasComponents,
    componentHeaders,
    hasDependencies,
    points: componentPoints,
    maxPoints: 25,
    status: componentPoints >= 25 ? 'complete' : componentPoints > 0 ? 'partial' : 'missing',
    suggestion: componentPoints < 25 ? 'Document system components and their responsibilities' : null
  };

  // 3. Data Flow (20 points) - How data moves through system
  const hasDataFlow = hasSection(documentation, [
    'data flow', 'flow', 'sequence', 'process', 'workflow', 'pipeline'
  ]);
  const hasInteraction = lowerDoc.includes('interact') || lowerDoc.includes('communicat') ||
                         lowerDoc.includes('request') || lowerDoc.includes('response');
  const hasSteps = (documentation.match(/^\s*\d+\./gm) || []).length >= 3 ||
                   (documentation.match(/^-\s+/gm) || []).length >= 3;

  let flowPoints = 0;
  if (hasDataFlow && (hasInteraction || hasSteps)) {
    flowPoints = 20;
  } else if (hasDataFlow || hasInteraction) {
    flowPoints = 12;
  } else if (hasSteps) {
    flowPoints = 6;
  }
  score += flowPoints;

  breakdown.dataFlow = {
    present: hasDataFlow || hasInteraction,
    hasDataFlow,
    hasInteraction,
    hasSteps,
    points: flowPoints,
    maxPoints: 20,
    status: flowPoints >= 20 ? 'complete' : flowPoints > 0 ? 'partial' : 'missing',
    suggestion: flowPoints < 20 ? 'Describe how data flows through the system' : null
  };

  // 4. Diagrams (15 points) - Mermaid or visual diagrams
  const hasMermaid = documentation.includes('```mermaid');
  const hasAsciiDiagram = /[│├└┌┐┬┴┼─|+\-\\\/]{5,}/m.test(documentation);
  const hasDiagramSection = hasSection(documentation, ['diagram', 'visual', 'chart', 'graph']);

  let diagramPoints = 0;
  if (hasMermaid) {
    diagramPoints = 15;
  } else if (hasAsciiDiagram || hasDiagramSection) {
    diagramPoints = 10;
  }
  score += diagramPoints;

  breakdown.diagrams = {
    present: hasMermaid || hasAsciiDiagram || hasDiagramSection,
    hasMermaid,
    hasAsciiDiagram,
    points: diagramPoints,
    maxPoints: 15,
    status: diagramPoints >= 15 ? 'complete' : diagramPoints > 0 ? 'partial' : 'missing',
    suggestion: diagramPoints < 15 ? 'Add architectural diagrams (Mermaid recommended)' : null
  };

  // 5. Design Decisions (15 points) - Rationale and trade-offs
  const hasDecisions = hasSection(documentation, [
    'decision', 'rationale', 'why', 'trade-off', 'tradeoff', 'consideration', 'choice'
  ]);
  const hasPatterns = lowerDoc.includes('pattern') || lowerDoc.includes('principle') ||
                      lowerDoc.includes('best practice');
  const hasConstraints = lowerDoc.includes('constraint') || lowerDoc.includes('limitation') ||
                         lowerDoc.includes('assumption');

  let decisionPoints = 0;
  if (hasDecisions && (hasPatterns || hasConstraints)) {
    decisionPoints = 15;
  } else if (hasDecisions) {
    decisionPoints = 10;
  } else if (hasPatterns || hasConstraints) {
    decisionPoints = 5;
  }
  score += decisionPoints;

  breakdown.decisions = {
    present: hasDecisions || hasPatterns,
    hasDecisions,
    hasPatterns,
    hasConstraints,
    points: decisionPoints,
    maxPoints: 15,
    status: decisionPoints >= 15 ? 'complete' : decisionPoints > 0 ? 'partial' : 'missing',
    suggestion: decisionPoints < 15 ? 'Document design decisions and their rationale' : null
  };

  return {
    score,
    grade: getGrade(score),
    breakdown,
    summary: generateSummary(score, breakdown)
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if documentation has a section
 */
function hasSection(doc, keywords) {
  const lowerDoc = doc.toLowerCase();
  return keywords.some(keyword => {
    const keywordLower = keyword.toLowerCase();
    return lowerDoc.includes(keywordLower) ||
           lowerDoc.includes(`# ${keywordLower}`) ||
           lowerDoc.includes(`## ${keywordLower}`);
  });
}

/**
 * Count code blocks in documentation
 */
function countCodeBlocks(doc) {
  const matches = doc.match(/```/g);
  return matches ? Math.floor(matches.length / 2) : 0;
}

/**
 * Count markdown headers
 */
function countHeaders(doc) {
  const matches = doc.match(/^#{1,6}\s+.+$/gm);
  return matches ? matches.length : 0;
}

/**
 * Count how many functions are documented
 */
function countFunctionDocs(doc, analysis) {
  const lowerDoc = doc.toLowerCase();
  let count = 0;
  let totalToDocument = 0;

  // Check standalone functions
  if (analysis.functions && analysis.functions.length > 0) {
    analysis.functions.forEach(func => {
      const funcName = func.name.toLowerCase();
      if (funcName !== 'anonymous' && funcName !== '') {
        totalToDocument++;
        if (lowerDoc.includes(funcName)) {
          count++;
        }
      }
    });
  }

  // Check class methods
  if (analysis.classes && analysis.classes.length > 0) {
    analysis.classes.forEach(cls => {
      if (cls.methods && cls.methods.length > 0) {
        cls.methods.forEach(method => {
          const methodName = method.name.toLowerCase();
          totalToDocument++;
          if (lowerDoc.includes(methodName)) {
            count++;
          }
        });
      }
    });
  }

  if (totalToDocument === 0) {
    return { functionsCovered: 1, totalFunctions: 1 };
  }

  return { functionsCovered: count, totalFunctions: totalToDocument };
}

/**
 * Count expected parameters from code analysis
 */
function countExpectedParams(analysis) {
  let total = 0;

  if (analysis.functions) {
    analysis.functions.forEach(func => {
      if (func.params) {
        total += func.params.length;
      }
    });
  }

  if (analysis.classes) {
    analysis.classes.forEach(cls => {
      if (cls.methods) {
        cls.methods.forEach(method => {
          if (method.params) {
            total += method.params.length;
          }
        });
      }
    });
  }

  return total;
}

/**
 * Count functions that likely return values
 */
function countFunctionsWithReturns(analysis) {
  let count = 0;

  if (analysis.functions) {
    // Assume most functions return something unless they're clearly void
    count += analysis.functions.filter(f => f.name !== 'anonymous').length;
  }

  if (analysis.classes) {
    analysis.classes.forEach(cls => {
      if (cls.methods) {
        // Exclude constructors
        count += cls.methods.filter(m => m.name !== 'constructor').length;
      }
    });
  }

  return Math.max(count, 1);
}

/**
 * Convert score to letter grade
 */
function getGrade(score) {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

/**
 * Generate human-readable summary
 */
function generateSummary(score, breakdown) {
  const complete = [];
  const missing = [];

  for (const [key, value] of Object.entries(breakdown)) {
    if (value.status === 'complete') {
      complete.push(key);
    } else if (value.status === 'missing') {
      missing.push(key);
    }
  }

  return {
    strengths: complete,
    improvements: missing,
    topSuggestion: getTopSuggestion(breakdown)
  };
}

/**
 * Get the most impactful suggestion
 */
function getTopSuggestion(breakdown) {
  const suggestions = Object.values(breakdown)
    .filter(item => item.suggestion)
    .sort((a, b) => (b.maxPoints - b.points) - (a.maxPoints - a.points));

  return suggestions[0]?.suggestion || 'Documentation looks good!';
}

/**
 * Assess input code quality to show "before" state
 */
function assessInputCodeQuality(inputCode, codeAnalysis) {
  let score = 0;
  const breakdown = {};

  // 1. Comments (20 points)
  const commentLines = countComments(inputCode);
  const codeLines = inputCode.split('\n').filter(line => line.trim().length > 0).length;
  const commentRatio = codeLines > 0 ? commentLines / codeLines : 0;

  let commentPoints = 0;
  if (commentRatio >= 0.15) {
    commentPoints = 20;
  } else if (commentRatio >= 0.08) {
    commentPoints = 15;
  } else if (commentRatio >= 0.03) {
    commentPoints = 8;
  }

  score += commentPoints;
  breakdown.comments = {
    present: commentLines > 0,
    count: commentLines,
    ratio: Math.round(commentRatio * 100),
    points: commentPoints,
    maxPoints: 20,
    status: commentPoints >= 15 ? 'complete' : commentPoints > 0 ? 'partial' : 'missing'
  };

  // 2. Naming Quality (20 points)
  const namingScore = assessNamingQuality(inputCode, codeAnalysis);
  score += namingScore.points;
  breakdown.naming = namingScore;

  // 3. Existing Documentation (25 points)
  const docScore = assessExistingDocs(inputCode);
  score += docScore.points;
  breakdown.existingDocs = docScore;

  // 4. Code Structure (35 points)
  const structureScore = assessCodeStructure(inputCode);
  score += structureScore.points;
  breakdown.codeStructure = structureScore;

  const grade = getGrade(score);

  return {
    score,
    grade,
    breakdown,
    summary: `Input code quality: ${grade} (${score}/100)`
  };
}

/**
 * Count comment lines in code
 */
function countComments(code) {
  const singleLineComments = (code.match(/\/\/.+$/gm) || []).length;
  const multiLineComments = (code.match(/\/\*[\s\S]*?\*\//g) || []).length;
  const pythonComments = (code.match(/#.+$/gm) || []).length;
  const docStrings = (code.match(/""".+?"""/gs) || []).length + (code.match(/'''.+?'''/gs) || []).length;

  return singleLineComments + multiLineComments + pythonComments + docStrings;
}

/**
 * Assess naming quality based on identifier length and descriptiveness
 */
function assessNamingQuality(code, analysis) {
  const identifiers = [];

  if (analysis.functions) {
    analysis.functions.forEach(fn => {
      if (fn.name && fn.name !== 'anonymous') {
        identifiers.push(fn.name);
      }
    });
  }

  if (analysis.classes) {
    analysis.classes.forEach(cls => {
      if (cls.name) {
        identifiers.push(cls.name);
      }
    });
  }

  let points = 20;
  const issues = [];

  const singleLetterNames = identifiers.filter(name => name.length === 1).length;
  if (singleLetterNames > 2) {
    points -= 8;
    issues.push('Too many single-letter names');
  }

  const shortIdentifiers = identifiers.filter(name =>
    name.length <= 3 && !['id', 'key', 'url', 'api', 'db'].includes(name.toLowerCase())
  ).length;

  if (shortIdentifiers > identifiers.length * 0.3) {
    points -= 7;
    issues.push('Many cryptic abbreviations');
  }

  const descriptiveNames = identifiers.filter(name => name.length >= 8).length;
  const descriptiveRatio = identifiers.length > 0 ? descriptiveNames / identifiers.length : 0;

  if (descriptiveRatio < 0.3) {
    points -= 5;
    issues.push('Few descriptive names');
  }

  points = Math.max(0, points);

  return {
    points,
    maxPoints: 20,
    identifiers: identifiers.length,
    descriptiveRatio: Math.round(descriptiveRatio * 100),
    issues,
    status: points >= 15 ? 'complete' : points >= 8 ? 'partial' : 'missing'
  };
}

/**
 * Assess existing documentation (JSDoc, docstrings, etc.)
 */
function assessExistingDocs(code) {
  let points = 0;
  const features = [];

  const jsDocBlocks = (code.match(/\/\*\*[\s\S]*?\*\//g) || []).length;
  if (jsDocBlocks > 0) {
    points += 10;
    features.push(`${jsDocBlocks} JSDoc blocks`);
  }

  const docstrings = (code.match(/""".+?"""/gs) || []).length + (code.match(/'''.+?'''/gs) || []).length;
  if (docstrings > 0) {
    points += 10;
    features.push(`${docstrings} docstrings`);
  }

  const paramTags = (code.match(/@param/g) || []).length;
  const returnTags = (code.match(/@returns?/g) || []).length;
  if (paramTags + returnTags >= 3) {
    points += 10;
    features.push('Parameter documentation');
  } else if (paramTags + returnTags > 0) {
    points += 5;
    features.push('Some parameter docs');
  }

  const todoComments = (code.match(/\/\/\s*(TODO|FIXME|NOTE)/gi) || []).length;
  if (todoComments > 0) {
    points += 5;
    features.push('Code annotations');
  }

  return {
    points: Math.min(points, 25),
    maxPoints: 25,
    features,
    status: points >= 20 ? 'complete' : points >= 10 ? 'partial' : 'missing'
  };
}

/**
 * Assess code structure and formatting
 */
function assessCodeStructure(code) {
  let points = 35;
  const issues = [];

  const lines = code.split('\n');
  const indentedLines = lines.filter(line => line.match(/^\s+/));
  const hasConsistentIndent = indentedLines.length > lines.length * 0.3;

  if (!hasConsistentIndent) {
    points -= 10;
    issues.push('Inconsistent indentation');
  }

  const noSpaceAroundOperators = (code.match(/[a-zA-Z0-9][=+\-*/%][a-zA-Z0-9]/g) || []).length;
  if (noSpaceAroundOperators > 5) {
    points -= 8;
    issues.push('Poor spacing around operators');
  }

  const singleLineFunctions = (code.match(/function\s+\w+\([^)]*\)\{[^}]+\}/g) || []).length;
  if (singleLineFunctions > 2) {
    points -= 7;
    issues.push('Functions crammed on single lines');
  }

  const consecutiveBlankLines = (code.match(/\n\s*\n\s*\n/g) || []).length;
  const hasBlankLines = code.includes('\n\n');

  if (!hasBlankLines) {
    points -= 5;
    issues.push('No blank lines between sections');
  } else if (consecutiveBlankLines > 3) {
    points -= 3;
    issues.push('Too many consecutive blank lines');
  }

  const longLines = lines.filter(line => line.length > 120).length;
  if (longLines > lines.length * 0.1) {
    points -= 5;
    issues.push('Many overly long lines');
  }

  points = Math.max(0, points);

  return {
    points,
    maxPoints: 35,
    issues,
    status: points >= 28 ? 'complete' : points >= 18 ? 'partial' : 'missing'
  };
}
