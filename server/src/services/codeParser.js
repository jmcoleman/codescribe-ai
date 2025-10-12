import * as acorn from 'acorn';

/**
 * Parse code and extract structural information
 * @param {string} code - Source code to parse
 * @param {string} language - Programming language
 * @returns {Promise<Object>} Analysis results with functions, classes, exports, etc.
 */
export async function parseCode(code, language) {
  // Only use AST parsing for JavaScript/TypeScript
  if (language !== 'javascript' && language !== 'typescript') {
    return basicAnalysis(code, language);
  }

  try {
    // Parse with Acorn (JavaScript parser)
    const ast = acorn.parse(code, {
      ecmaVersion: 2022,        // Support latest ES features
      sourceType: 'module',     // Support import/export
      locations: true           // Track line numbers
    });

    // Initialize analysis object
    const analysis = {
      functions: [],
      classes: [],
      exports: [],
      imports: [],
      variables: [],
      complexity: 'medium',
      language
    };

    // Walk the AST and extract information
    walkAST(ast, analysis);

    // Calculate overall complexity
    analysis.complexity = calculateComplexity(analysis);

    return analysis;

  } catch (error) {
    console.error('Parse error:', error.message);
    // If AST parsing fails, fall back to basic analysis
    return basicAnalysis(code, language);
  }
}

/**
 * Walk the Abstract Syntax Tree and extract structural elements
 * @param {Object} node - AST node
 * @param {Object} analysis - Analysis object to populate
 */
function walkAST(node, analysis) {
  if (!node || typeof node !== 'object') return;

  // Process different node types
  switch (node.type) {
    case 'FunctionDeclaration':
      // Regular function declaration: function foo() {}
      analysis.functions.push({
        name: node.id?.name || 'anonymous',
        params: node.params.map(p => extractParamName(p)),
        async: node.async,
        generator: node.generator,
        line: node.loc?.start.line
      });
      break;

    case 'ArrowFunctionExpression':
    case 'FunctionExpression':
      // Arrow function or function expression: const foo = () => {}
      if (node.parent?.type === 'VariableDeclarator') {
        analysis.functions.push({
          name: node.parent.id.name,
          params: node.params.map(p => extractParamName(p)),
          async: node.async,
          type: node.type === 'ArrowFunctionExpression' ? 'arrow' : 'expression',
          line: node.loc?.start.line
        });
      }
      break;

    case 'ClassDeclaration':
      // Class declaration: class Foo {}
      analysis.classes.push({
        name: node.id?.name || 'anonymous',
        methods: extractClassMethods(node),
        line: node.loc?.start.line
      });
      break;

    case 'ExportNamedDeclaration':
      // Named exports: export { foo, bar }
      if (node.declaration) {
        const name = node.declaration.id?.name || 
                     node.declaration.declarations?.[0]?.id?.name;
        if (name) analysis.exports.push(name);
      }
      if (node.specifiers) {
        node.specifiers.forEach(spec => {
          analysis.exports.push(spec.exported.name);
        });
      }
      break;

    case 'ExportDefaultDeclaration':
      // Default export: export default Foo
      const defaultName = node.declaration?.id?.name || 
                          node.declaration?.name || 
                          'default';
      analysis.exports.push(defaultName);
      break;

    case 'ImportDeclaration':
      // Import statements: import { foo } from 'bar'
      analysis.imports.push({
        source: node.source.value,
        specifiers: node.specifiers.map(s => s.local.name)
      });
      break;

    case 'VariableDeclaration':
      // Variable declarations: const foo = 'bar'
      node.declarations.forEach(decl => {
        if (decl.id.name) {
          analysis.variables.push(decl.id.name);
        }
      });
      break;
  }

  // Recursively walk all child nodes
  for (const key in node) {
    if (key === 'parent' || key === 'loc') continue; // Skip these
    const child = node[key];
    
    if (Array.isArray(child)) {
      // Handle arrays of nodes
      child.forEach(c => {
        if (c && typeof c === 'object') {
          c.parent = node; // Track parent for context
          walkAST(c, analysis);
        }
      });
    } else if (child && typeof child === 'object') {
      // Handle single child nodes
      child.parent = node;
      walkAST(child, analysis);
    }
  }
}

/**
 * Extract parameter name from various parameter types
 * @param {Object} param - Parameter node
 * @returns {string} Parameter name
 */
function extractParamName(param) {
  if (param.type === 'Identifier') {
    return param.name;
  } else if (param.type === 'AssignmentPattern') {
    // Default parameter: foo = 'default'
    return extractParamName(param.left);
  } else if (param.type === 'RestElement') {
    // Rest parameter: ...args
    return '...' + extractParamName(param.argument);
  } else if (param.type === 'ObjectPattern') {
    // Destructured object: { foo, bar }
    return '{ destructured }';
  } else if (param.type === 'ArrayPattern') {
    // Destructured array: [foo, bar]
    return '[ destructured ]';
  }
  return 'unknown';
}

/**
 * Extract methods from a class node
 * @param {Object} classNode - Class AST node
 * @returns {Array} Array of method objects
 */
function extractClassMethods(classNode) {
  const methods = [];
  const body = classNode.body.body;

  body.forEach(node => {
    if (node.type === 'MethodDefinition') {
      methods.push({
        name: node.key.name,
        kind: node.kind,        // 'method', 'constructor', 'get', 'set'
        static: node.static,
        async: node.value.async,
        line: node.loc?.start.line
      });
    } else if (node.type === 'PropertyDefinition') {
      // Class fields (modern JavaScript)
      methods.push({
        name: node.key.name,
        kind: 'field',
        static: node.static,
        line: node.loc?.start.line
      });
    }
  });

  return methods;
}

/**
 * Calculate code complexity based on analysis
 * @param {Object} analysis - Code analysis object
 * @returns {string} Complexity level: 'simple', 'medium', 'complex'
 */
function calculateComplexity(analysis) {
  const score = 
    analysis.functions.length * 2 +      // Functions add 2 points each
    analysis.classes.length * 3 +        // Classes add 3 points each
    analysis.exports.length +            // Exports add 1 point each
    analysis.imports.length * 0.5;       // Imports add 0.5 points each

  if (score < 10) return 'simple';
  if (score < 30) return 'medium';
  return 'complex';
}

/**
 * Basic analysis for unsupported languages or failed AST parsing
 * Uses regex pattern matching instead of AST
 * @param {string} code - Source code
 * @param {string} language - Programming language
 * @returns {Object} Basic analysis results
 */
function basicAnalysis(code, language) {
  const lines = code.split('\n');
  
  return {
    language,
    lines: lines.length,
    characters: code.length,
    
    // Detect functions with regex (works for JS, Python, etc.)
    functions: detectFunctions(code, language),
    
    // Detect classes with regex
    classes: detectClasses(code, language),
    
    // Detect exports
    exports: extractBasicExports(code, language),
    
    // Detect imports
    imports: extractBasicImports(code, language),
    
    // Empty for basic analysis
    variables: [],
    
    // Simple complexity based on line count
    complexity: lines.length > 100 ? 'complex' : 
                lines.length > 30 ? 'medium' : 'simple'
  };
}

/**
 * Detect functions using regex patterns
 * @param {string} code - Source code
 * @param {string} language - Programming language
 * @returns {Array} Array of detected functions
 */
function detectFunctions(code, language) {
  const functions = [];
  
  if (language === 'javascript' || language === 'typescript') {
    // JavaScript/TypeScript patterns
    const patterns = [
      /function\s+(\w+)\s*\(/g,           // function foo()
      /const\s+(\w+)\s*=\s*\(/g,          // const foo = (
      /const\s+(\w+)\s*=\s*async\s*\(/g,  // const foo = async (
      /(\w+)\s*:\s*function\s*\(/g,       // foo: function(
      /async\s+function\s+(\w+)\s*\(/g    // async function foo()
    ];
    
    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(code)) !== null) {
        functions.push({ name: match[1], params: [] });
      }
    });
    
  } else if (language === 'python') {
    // Python patterns
    const pattern = /def\s+(\w+)\s*\(/g;
    let match;
    while ((match = pattern.exec(code)) !== null) {
      functions.push({ name: match[1], params: [] });
    }
  }
  
  return functions;
}

/**
 * Detect classes using regex patterns
 * @param {string} code - Source code
 * @param {string} language - Programming language
 * @returns {Array} Array of detected classes
 */
function detectClasses(code, language) {
  const classes = [];
  
  if (language === 'javascript' || language === 'typescript') {
    // JavaScript/TypeScript: class Foo
    const pattern = /class\s+(\w+)/g;
    let match;
    while ((match = pattern.exec(code)) !== null) {
      classes.push({ name: match[1], methods: [] });
    }
  } else if (language === 'python') {
    // Python: class Foo:
    const pattern = /class\s+(\w+)\s*:/g;
    let match;
    while ((match = pattern.exec(code)) !== null) {
      classes.push({ name: match[1], methods: [] });
    }
  }
  
  return classes;
}

/**
 * Extract exports using regex (fallback method)
 * @param {string} code - Source code
 * @param {string} language - Programming language
 * @returns {Array} Array of exported identifiers
 */
function extractBasicExports(code, language) {
  const exports = [];
  
  if (language === 'javascript' || language === 'typescript') {
    // Match various export patterns
    const patterns = [
      /export\s+default\s+(\w+)/g,                          // export default Foo
      /export\s+(?:function|class|const|let|var)\s+(\w+)/g, // export function foo
      /export\s*{([^}]+)}/g                                 // export { foo, bar }
    ];
    
    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(code)) !== null) {
        if (pattern.source.includes('{')) {
          // Handle export { foo, bar }
          const names = match[1].split(',').map(n => n.trim().split(/\s+as\s+/)[0]);
          exports.push(...names);
        } else {
          exports.push(match[1]);
        }
      }
    });
  }
  
  return exports;
}

/**
 * Extract imports using regex (fallback method)
 * @param {string} code - Source code
 * @param {string} language - Programming language
 * @returns {Array} Array of import objects
 */
function extractBasicImports(code, language) {
  const imports = [];
  
  if (language === 'javascript' || language === 'typescript') {
    // Match: import foo from 'bar' or import { foo } from 'bar'
    const pattern = /import\s+(?:(\w+)|{([^}]+)})\s+from\s+['"]([^'"]+)['"]/g;
    let match;
    while ((match = pattern.exec(code)) !== null) {
      imports.push({
        source: match[3],
        specifiers: match[1] ? [match[1]] : match[2].split(',').map(s => s.trim())
      });
    }
  } else if (language === 'python') {
    // Match: import foo or from foo import bar
    const patterns = [
      /import\s+([\w.]+)/g,                  // import foo
      /from\s+([\w.]+)\s+import\s+(.+)/g     // from foo import bar
    ];
    
    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(code)) !== null) {
        imports.push({
          source: match[1],
          specifiers: match[2] ? match[2].split(',').map(s => s.trim()) : []
        });
      }
    });
  }
  
  return imports;
}

// Export as default
export default { parseCode };
