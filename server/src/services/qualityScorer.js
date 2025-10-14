export function calculateQualityScore(documentation, codeAnalysis) {
  let score = 0;
  const breakdown = {};

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
      status: 'complete'
    };
  } else {
    breakdown.overview = {
      present: false,
      points: 0,
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
      status: 'complete'
    };
  } else {
    breakdown.installation = { 
      present: false, 
      points: 0,
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
    status: structureStatus,
    suggestion: structureSuggestion
  };

  // Calculate grade
  const grade = getGrade(score);

  return {
    score,
    grade,
    breakdown,
    summary: generateSummary(score, breakdown)
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