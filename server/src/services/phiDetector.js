/**
 * PHI Detection Service
 * Scans code for potential Protected Health Information (PHI)
 * Returns detection results with confidence scoring
 */

/**
 * Detect potential PHI in code
 * @param {string} code - Code to scan for PHI
 * @returns {Object} Detection results with confidence scoring
 */
export function detectPHI(code) {
  if (!code || typeof code !== 'string') {
    return {
      containsPHI: false,
      confidence: 'none',
      findings: {},
      score: 0,
      suggestions: [],
    };
  }

  const patterns = {
    ssn: {
      regex: /\b\d{3}-\d{2}-\d{4}\b/g,
      weight: 10,
      description: 'Social Security Number',
    },
    mrn: {
      regex: /\b(MRN|medical record|patient id|patient identifier)[:=\s]+[\w-]+/gi,
      weight: 8,
      description: 'Medical Record Number',
    },
    icd10: {
      regex: /\b[A-Z]\d{2}\.\d{1,3}\b/g,
      weight: 7,
      description: 'ICD-10 Diagnosis Code',
    },
    dob: {
      regex: /\b(DOB|date of birth|birthdate)[:=\s]+[\d\/\-]+/gi,
      weight: 6,
      description: 'Date of Birth',
    },
    npi: {
      regex: /\b(NPI|provider id|provider identifier)[:=\s]+\d{10}\b/gi,
      weight: 5,
      description: 'National Provider Identifier (NPI)',
    },
    phone: {
      regex: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
      weight: 3,
      description: 'Phone Number',
    },
    email: {
      regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.(com|org|net|gov|edu|healthcare|health)\b/g,
      weight: 2,
      description: 'Email Address',
    },
    healthKeywords: {
      regex: /\b(diagnosis|prescription|treatment|medication|patient name|patient data|health record|medical history|insurance|covered entity|HIPAA|PHI|ePHI|protected health information)\b/gi,
      weight: 2,
      description: 'Healthcare-related keywords',
    },
  };

  const findings = {};
  let score = 0;

  // Scan for each pattern
  for (const [type, config] of Object.entries(patterns)) {
    const matches = code.match(config.regex);
    if (matches && matches.length > 0) {
      // Deduplicate matches
      const uniqueMatches = [...new Set(matches)];

      findings[type] = {
        count: uniqueMatches.length,
        weight: config.weight,
        description: config.description,
        samples: uniqueMatches, // Return ALL unique matches (removed slice limit)
      };
      score += uniqueMatches.length * config.weight;
    }
  }

  // Adjust score based on context
  const lowerCode = code.toLowerCase();
  if (
    lowerCode.includes('test') ||
    lowerCode.includes('example') ||
    lowerCode.includes('mock') ||
    lowerCode.includes('dummy') ||
    lowerCode.includes('sample') ||
    lowerCode.includes('fixture')
  ) {
    score *= 0.5; // Reduce score by 50% if clearly test data
  }

  // Round score to integer
  score = Math.round(score);

  // Determine confidence level
  let confidence;
  if (score >= 16) {
    confidence = 'high';
  } else if (score >= 6) {
    confidence = 'medium';
  } else if (score >= 1) {
    confidence = 'low';
  } else {
    confidence = 'none';
  }

  // Generate sanitization suggestions
  const suggestions = getSanitizationSuggestions(findings);

  return {
    containsPHI: score > 0,
    confidence,
    findings,
    score,
    suggestions,
  };
}

/**
 * Get sanitization suggestions based on PHI findings
 * @param {Object} findings - PHI findings from detectPHI
 * @returns {Array} Array of suggestion objects
 */
export function getSanitizationSuggestions(findings) {
  const suggestions = [];

  if (findings.ssn) {
    suggestions.push({
      type: 'ssn',
      title: 'Social Security Numbers',
      message: 'Replace SSNs with placeholder: XXX-XX-XXXX',
      examples: findings.ssn.samples,
      priority: 'high',
    });
  }

  if (findings.mrn) {
    suggestions.push({
      type: 'mrn',
      title: 'Medical Record Numbers',
      message: 'Replace MRNs with generic identifiers: MRN: PATIENT_001',
      examples: findings.mrn.samples,
      priority: 'high',
    });
  }

  if (findings.icd10) {
    suggestions.push({
      type: 'icd10',
      title: 'ICD-10 Diagnosis Codes',
      message: 'Replace with generic codes or remove diagnosis codes',
      examples: findings.icd10.samples,
      priority: 'high',
    });
  }

  if (findings.dob) {
    suggestions.push({
      type: 'dob',
      title: 'Dates of Birth',
      message: 'Replace dates of birth with YYYY-MM-DD format or remove',
      examples: findings.dob.samples,
      priority: 'medium',
    });
  }

  if (findings.npi) {
    suggestions.push({
      type: 'npi',
      title: 'Provider Identifiers',
      message: 'Replace NPI with placeholder: NPI: 1234567890',
      examples: findings.npi.samples,
      priority: 'medium',
    });
  }

  if (findings.email) {
    suggestions.push({
      type: 'email',
      title: 'Email Addresses',
      message: 'Replace emails with example.com domain: user@example.com',
      examples: findings.email.samples,
      priority: 'low',
    });
  }

  if (findings.phone) {
    suggestions.push({
      type: 'phone',
      title: 'Phone Numbers',
      message: 'Replace phone numbers with: (555) 555-5555',
      examples: findings.phone.samples,
      priority: 'low',
    });
  }

  if (findings.healthKeywords) {
    suggestions.push({
      type: 'healthKeywords',
      title: 'Healthcare Keywords',
      message: 'Review healthcare-related terms and ensure no real patient data is referenced',
      examples: findings.healthKeywords.samples,
      priority: 'info',
    });
  }

  return suggestions;
}

/**
 * Format PHI findings for display
 * @param {Object} findings - PHI findings from detectPHI
 * @returns {string} Human-readable findings summary
 */
export function formatFindings(findings) {
  const items = Object.entries(findings)
    .filter(([type]) => type !== 'healthKeywords') // Exclude keywords from summary
    .map(([type, data]) => `${data.count} ${data.description}${data.count > 1 ? 's' : ''}`)
    .join(', ');

  return items || 'No specific PHI patterns detected';
}

/**
 * Get risk level based on PHI score
 * @param {number} score - PHI confidence score (0-100)
 * @returns {string} Risk level: 'none', 'low', 'medium', 'high'
 */
export function getRiskLevel(score) {
  if (score >= 16) return 'high';
  if (score >= 6) return 'medium';
  if (score >= 1) return 'low';
  return 'none';
}

export default {
  detectPHI,
  getSanitizationSuggestions,
  formatFindings,
  getRiskLevel,
};
