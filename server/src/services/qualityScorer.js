export function calculateQualityScore(documentation, codeAnalysis, docType = 'README', inputCode = '') {
  let score = 0;
  const breakdown = {};

  // Assess input code quality (shows "before" state for comparison)
  const inputCodeHealth = inputCode ? assessInputCodeQuality(inputCode, codeAnalysis) : null;

  // 1. Overview/Description (20 points)
  // Check for explicit overview section OR description after title
  const hasOverviewSection = hasSection(documentation, [
    'overview', 'description', 'about', 'introduction', 'what is'
  ]);

  // Also accept a paragraph right after the title (common pattern)
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
    'installation', 'setup', 'getting started', 'install', 'requirements'
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

  const coverageRatio = totalFunctions > 0
    ? functionsCovered / totalFunctions
    : 1;
  
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

  // Calculate grade
  const grade = getGrade(score);

  // Calculate improvement delta if we have input code health
  const improvement = inputCodeHealth ? score - inputCodeHealth.score : null;

  return {
    score,
    grade,
    breakdown,
    summary: generateSummary(score, breakdown),
    docType,
    // New: Input code health score for before/after comparison
    inputCodeHealth,
    improvement
  };
}

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
  return matches ? matches.length / 2 : 0;
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
      // Skip anonymous functions - they don't need documentation mentions
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
          // Skip constructors and special methods like getters/setters for basic count
          // They still count toward total, just use a simpler check
          totalToDocument++;
          if (lowerDoc.includes(methodName)) {
            count++;
          }
        });
      }
    });
  }

  // If nothing to document, give full credit
  if (totalToDocument === 0) {
    return { functionsCovered: 1, totalFunctions: 1 };
  }

  return { functionsCovered: count, totalFunctions: totalToDocument };
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
    .sort((a, b) => (b.points || 0) - (a.points || 0));

  return suggestions[0]?.suggestion || 'Documentation looks good!';
}

/**
 * Assess input code quality to show "before" state
 * This demonstrates the value of CodeScribe AI by showing the improvement
 *
 * @param {string} inputCode - The raw input code
 * @param {object} codeAnalysis - Parsed code structure
 * @returns {object} Input code health score and breakdown
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
    commentPoints = 20; // 15%+ comments is excellent
  } else if (commentRatio >= 0.08) {
    commentPoints = 15; // 8-15% is good
  } else if (commentRatio >= 0.03) {
    commentPoints = 8; // 3-8% is minimal
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

  // Extract function names
  if (analysis.functions) {
    analysis.functions.forEach(fn => {
      if (fn.name && fn.name !== 'anonymous') {
        identifiers.push(fn.name);
      }
    });
  }

  // Extract class names
  if (analysis.classes) {
    analysis.classes.forEach(cls => {
      if (cls.name) {
        identifiers.push(cls.name);
      }
    });
  }

  // Also check for short variable names in code (single letters, abbreviations)
  const shortNames = code.match(/\b[a-z]\b|\b[a-z]{2}\b/gi) || [];

  let points = 20;
  const issues = [];

  // Penalize single-letter identifiers (except common ones like i, j, x, y in loops)
  const singleLetterNames = identifiers.filter(name => name.length === 1).length;
  if (singleLetterNames > 2) {
    points -= 8;
    issues.push('Too many single-letter names');
  }

  // Penalize very short names (2-3 chars) that aren't common abbreviations
  const shortIdentifiers = identifiers.filter(name =>
    name.length <= 3 && !['id', 'key', 'url', 'api', 'db'].includes(name.toLowerCase())
  ).length;

  if (shortIdentifiers > identifiers.length * 0.3) {
    points -= 7;
    issues.push('Many cryptic abbreviations');
  }

  // Reward descriptive names (8+ characters)
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

  // Check for JSDoc comments
  const jsDocBlocks = (code.match(/\/\*\*[\s\S]*?\*\//g) || []).length;
  if (jsDocBlocks > 0) {
    points += 10;
    features.push(`${jsDocBlocks} JSDoc blocks`);
  }

  // Check for Python docstrings
  const docstrings = (code.match(/""".+?"""/gs) || []).length + (code.match(/'''.+?'''/gs) || []).length;
  if (docstrings > 0) {
    points += 10;
    features.push(`${docstrings} docstrings`);
  }

  // Check for @param, @returns tags
  const paramTags = (code.match(/@param/g) || []).length;
  const returnTags = (code.match(/@returns?/g) || []).length;
  if (paramTags + returnTags >= 3) {
    points += 10;
    features.push('Parameter documentation');
  } else if (paramTags + returnTags > 0) {
    points += 5;
    features.push('Some parameter docs');
  }

  // Check for TODO/FIXME comments (shows thoughtfulness)
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

  // Check indentation consistency
  const lines = code.split('\n');
  const indentedLines = lines.filter(line => line.match(/^\s+/));
  const hasConsistentIndent = indentedLines.length > lines.length * 0.3;

  if (!hasConsistentIndent) {
    points -= 10;
    issues.push('Inconsistent indentation');
  }

  // Check for proper spacing around operators
  const noSpaceAroundOperators = (code.match(/[a-zA-Z0-9][=+\-*/%][a-zA-Z0-9]/g) || []).length;
  if (noSpaceAroundOperators > 5) {
    points -= 8;
    issues.push('Poor spacing around operators');
  }

  // Check for single-line functions/classes (code smell)
  const singleLineFunctions = (code.match(/function\s+\w+\([^)]*\)\{[^}]+\}/g) || []).length;
  if (singleLineFunctions > 2) {
    points -= 7;
    issues.push('Functions crammed on single lines');
  }

  // Check for proper blank line usage
  const consecutiveBlankLines = (code.match(/\n\s*\n\s*\n/g) || []).length;
  const hasBlankLines = code.includes('\n\n');

  if (!hasBlankLines) {
    points -= 5;
    issues.push('No blank lines between sections');
  } else if (consecutiveBlankLines > 3) {
    points -= 3;
    issues.push('Too many consecutive blank lines');
  }

  // Check for line length (>120 chars is hard to read)
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