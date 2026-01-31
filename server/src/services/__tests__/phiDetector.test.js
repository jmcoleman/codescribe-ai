/**
 * PHI Detector Service Tests
 * Tests for Protected Health Information detection patterns
 */

import {
  detectPHI,
  getSanitizationSuggestions,
  formatFindings,
  getRiskLevel,
} from '../phiDetector.js';

describe('PHI Detector Service', () => {
  describe('detectPHI()', () => {
    it('should detect SSN patterns', () => {
      const code = 'const ssn = "123-45-6789";';
      const result = detectPHI(code);

      expect(result.containsPHI).toBe(true);
      expect(result.findings.ssn).toBeDefined();
      expect(result.findings.ssn.count).toBe(1);
      expect(result.score).toBeGreaterThan(0);
    });

    it('should detect MRN patterns', () => {
      const code = 'MRN: ABC123456\nmedical record: DEF789';
      const result = detectPHI(code);

      expect(result.containsPHI).toBe(true);
      expect(result.findings.mrn).toBeDefined();
      expect(result.findings.mrn.count).toBe(2);
    });

    it('should detect ICD-10 codes', () => {
      const code = 'diagnosis: E11.9, F41.1, M79.3';
      const result = detectPHI(code);

      expect(result.containsPHI).toBe(true);
      expect(result.findings.icd10).toBeDefined();
      expect(result.findings.icd10.count).toBe(3);
    });

    it('should detect DOB patterns', () => {
      const code = 'DOB: 01/15/1990\ndate of birth: 12-25-1985';
      const result = detectPHI(code);

      expect(result.containsPHI).toBe(true);
      expect(result.findings.dob).toBeDefined();
      expect(result.findings.dob.count).toBe(2);
    });

    it('should detect NPI patterns', () => {
      const code = 'NPI: 1234567890\nprovider id: 9876543210';
      const result = detectPHI(code);

      expect(result.containsPHI).toBe(true);
      expect(result.findings.npi).toBeDefined();
      expect(result.findings.npi.count).toBe(2);
    });

    it('should detect phone numbers', () => {
      const code = 'Contact: 555-123-4567 or 555.987.6543 or 5554445555';
      const result = detectPHI(code);

      expect(result.containsPHI).toBe(true);
      expect(result.findings.phone).toBeDefined();
      expect(result.findings.phone.count).toBe(3);
    });

    it('should detect email addresses', () => {
      const code = 'Email: patient@hospital.com or doctor@healthcare.org';
      const result = detectPHI(code);

      expect(result.containsPHI).toBe(true);
      expect(result.findings.email).toBeDefined();
      expect(result.findings.email.count).toBe(2);
    });

    it('should detect healthcare keywords', () => {
      const code =
        'const patient = { diagnosis: "...", prescription: "...", treatment: "..." }';
      const result = detectPHI(code);

      expect(result.containsPHI).toBe(true);
      expect(result.findings.healthKeywords).toBeDefined();
      expect(result.findings.healthKeywords.count).toBeGreaterThan(0);
    });

    it('should return no PHI for clean code', () => {
      const code = 'function add(a, b) { return a + b; }';
      const result = detectPHI(code);

      expect(result.containsPHI).toBe(false);
      expect(result.score).toBe(0);
      expect(result.confidence).toBe('none');
      expect(Object.keys(result.findings)).toHaveLength(0);
    });

    it('should reduce score for test/example code', () => {
      const codeWithoutMarker = 'const ssn = "123-45-6789";';
      const codeWithMarker = 'const ssn = "123-45-6789"; // test data';

      const resultWithout = detectPHI(codeWithoutMarker);
      const resultWith = detectPHI(codeWithMarker);

      expect(resultWith.score).toBeLessThan(resultWithout.score);
    });

    it('should handle multiple PHI types', () => {
      const code = `
        const patient = {
          ssn: "123-45-6789",
          mrn: "MRN: ABC123",
          dob: "DOB: 01/15/1990",
          phone: "555-123-4567",
          email: "patient@hospital.com"
        };
      `;
      const result = detectPHI(code);

      expect(result.containsPHI).toBe(true);
      expect(result.findings.ssn).toBeDefined();
      expect(result.findings.mrn).toBeDefined();
      expect(result.findings.dob).toBeDefined();
      expect(result.findings.phone).toBeDefined();
      expect(result.findings.email).toBeDefined();
      expect(result.score).toBeGreaterThan(20);
    });

    it('should deduplicate matches', () => {
      const code = `
        const ssn1 = "123-45-6789";
        const ssn2 = "123-45-6789";
        const ssn3 = "123-45-6789";
      `;
      const result = detectPHI(code);

      expect(result.findings.ssn.count).toBe(1); // Same SSN repeated
    });

    it('should return all unique samples (no limit)', () => {
      const code = `
        const ssn1 = "111-11-1111";
        const ssn2 = "222-22-2222";
        const ssn3 = "333-33-3333";
        const ssn4 = "444-44-4444";
        const ssn5 = "555-55-5555";
      `;
      const result = detectPHI(code);

      // Should return all 5 unique samples (not limited to 3)
      expect(result.findings.ssn.samples).toHaveLength(5);
    });

    it('should handle empty/null input', () => {
      expect(detectPHI('')).toEqual({
        containsPHI: false,
        confidence: 'none',
        findings: {},
        score: 0,
        suggestions: [],
      });

      expect(detectPHI(null)).toEqual({
        containsPHI: false,
        confidence: 'none',
        findings: {},
        score: 0,
        suggestions: [],
      });

      expect(detectPHI(undefined)).toEqual({
        containsPHI: false,
        confidence: 'none',
        findings: {},
        score: 0,
        suggestions: [],
      });
    });

    it('should handle non-string input', () => {
      const result = detectPHI(12345);

      expect(result.containsPHI).toBe(false);
      expect(result.score).toBe(0);
    });
  });

  describe('Confidence Scoring', () => {
    it('should return high confidence for score >= 16', () => {
      const code = `
        const ssn = "123-45-6789"; // 10 points
        const mrn = "MRN: ABC123"; // 8 points
      `;
      const result = detectPHI(code);

      expect(result.score).toBeGreaterThanOrEqual(16);
      expect(result.confidence).toBe('high');
    });

    it('should return medium confidence for score 6-15', () => {
      const code = 'const mrn = "MRN: ABC123";'; // 8 points
      const result = detectPHI(code);

      expect(result.score).toBeGreaterThanOrEqual(6);
      expect(result.score).toBeLessThan(16);
      expect(result.confidence).toBe('medium');
    });

    it('should return low confidence for score 1-5', () => {
      const code = 'const phone = "555-123-4567";'; // 3 points
      const result = detectPHI(code);

      expect(result.score).toBeGreaterThanOrEqual(1);
      expect(result.score).toBeLessThan(6);
      expect(result.confidence).toBe('low');
    });

    it('should return none confidence for score 0', () => {
      const code = 'function test() {}';
      const result = detectPHI(code);

      expect(result.score).toBe(0);
      expect(result.confidence).toBe('none');
    });
  });

  describe('getSanitizationSuggestions()', () => {
    it('should suggest sanitization for SSN', () => {
      const findings = {
        ssn: {
          count: 1,
          description: 'Social Security Number',
          samples: ['123-45-6789'],
        },
      };

      const suggestions = getSanitizationSuggestions(findings);

      expect(suggestions).toHaveLength(1);
      expect(suggestions[0].type).toBe('ssn');
      expect(suggestions[0].title).toBe('Social Security Numbers');
      expect(suggestions[0].priority).toBe('high');
    });

    it('should suggest sanitization for multiple PHI types', () => {
      const findings = {
        ssn: { count: 1, description: 'SSN', samples: ['123-45-6789'] },
        mrn: { count: 1, description: 'MRN', samples: ['MRN: ABC123'] },
        email: { count: 1, description: 'Email', samples: ['test@example.com'] },
      };

      const suggestions = getSanitizationSuggestions(findings);

      expect(suggestions.length).toBeGreaterThanOrEqual(3);
      expect(suggestions.find((s) => s.type === 'ssn')).toBeDefined();
      expect(suggestions.find((s) => s.type === 'mrn')).toBeDefined();
      expect(suggestions.find((s) => s.type === 'email')).toBeDefined();
    });

    it('should return empty array for no findings', () => {
      const suggestions = getSanitizationSuggestions({});

      expect(suggestions).toEqual([]);
    });

    it('should prioritize suggestions correctly', () => {
      const findings = {
        ssn: { count: 1, description: 'SSN', samples: ['123-45-6789'] },
        email: { count: 1, description: 'Email', samples: ['test@example.com'] },
      };

      const suggestions = getSanitizationSuggestions(findings);

      const ssnSuggestion = suggestions.find((s) => s.type === 'ssn');
      const emailSuggestion = suggestions.find((s) => s.type === 'email');

      expect(ssnSuggestion.priority).toBe('high');
      expect(emailSuggestion.priority).toBe('low');
    });
  });

  describe('formatFindings()', () => {
    it('should format single finding', () => {
      const findings = {
        ssn: { count: 1, description: 'Social Security Number' },
      };

      const formatted = formatFindings(findings);

      expect(formatted).toBe('1 Social Security Number');
    });

    it('should format multiple findings', () => {
      const findings = {
        ssn: { count: 2, description: 'Social Security Number' },
        phone: { count: 1, description: 'Phone Number' },
      };

      const formatted = formatFindings(findings);

      expect(formatted).toContain('2 Social Security Numbers');
      expect(formatted).toContain('1 Phone Number');
    });

    it('should exclude healthKeywords from summary', () => {
      const findings = {
        ssn: { count: 1, description: 'Social Security Number' },
        healthKeywords: { count: 5, description: 'Healthcare-related keywords' },
      };

      const formatted = formatFindings(findings);

      expect(formatted).toBe('1 Social Security Number');
      expect(formatted).not.toContain('keyword');
    });

    it('should pluralize correctly', () => {
      const findings = {
        ssn: { count: 2, description: 'Social Security Number' },
      };

      const formatted = formatFindings(findings);

      expect(formatted).toBe('2 Social Security Numbers');
    });

    it('should return default message for no findings', () => {
      const formatted = formatFindings({});

      expect(formatted).toBe('No specific PHI patterns detected');
    });
  });

  describe('getRiskLevel()', () => {
    it('should return high for score >= 16', () => {
      expect(getRiskLevel(16)).toBe('high');
      expect(getRiskLevel(20)).toBe('high');
      expect(getRiskLevel(100)).toBe('high');
    });

    it('should return medium for score 6-15', () => {
      expect(getRiskLevel(6)).toBe('medium');
      expect(getRiskLevel(10)).toBe('medium');
      expect(getRiskLevel(15)).toBe('medium');
    });

    it('should return low for score 1-5', () => {
      expect(getRiskLevel(1)).toBe('low');
      expect(getRiskLevel(3)).toBe('low');
      expect(getRiskLevel(5)).toBe('low');
    });

    it('should return none for score 0', () => {
      expect(getRiskLevel(0)).toBe('none');
    });
  });

  describe('Edge Cases', () => {
    it('should handle code with only comments', () => {
      const code = `
        // This is a comment with SSN: 123-45-6789
        /* Multi-line comment
           MRN: ABC123
        */
      `;
      const result = detectPHI(code);

      expect(result.containsPHI).toBe(true);
      expect(result.findings.ssn).toBeDefined();
      expect(result.findings.mrn).toBeDefined();
    });

    it('should handle code with strings containing PHI', () => {
      const code = `
        const message = "Patient SSN is 123-45-6789";
        const note = \`DOB: 01/15/1990\`;
      `;
      const result = detectPHI(code);

      expect(result.containsPHI).toBe(true);
    });

    it('should handle very long code', () => {
      const code = 'const x = 1;\n'.repeat(10000) + 'const ssn = "123-45-6789";';
      const result = detectPHI(code);

      expect(result.containsPHI).toBe(true);
      expect(result.findings.ssn).toBeDefined();
    });

    it('should handle special characters', () => {
      const code = 'const data = { "ssn": "123-45-6789", "phone": "555-123-4567" };';
      const result = detectPHI(code);

      expect(result.containsPHI).toBe(true);
    });

    it('should handle mixed languages', () => {
      const code = `
        <!-- HTML comment: SSN 123-45-6789 -->
        # Python comment: phone 555-123-4567
        // JavaScript: email patient@hospital.com
      `;
      const result = detectPHI(code);

      expect(result.containsPHI).toBe(true);
      expect(result.findings.ssn).toBeDefined();
      expect(result.findings.phone).toBeDefined();
      expect(result.findings.email).toBeDefined();
    });
  });

  describe('Test Data Markers', () => {
    it('should reduce score for "test" marker', () => {
      const code = 'const ssn = "123-45-6789"; // test data';
      const result = detectPHI(code);

      expect(result.score).toBeLessThan(10);
    });

    it('should reduce score for "example" marker', () => {
      const code = '// Example: SSN 123-45-6789';
      const result = detectPHI(code);

      expect(result.score).toBeLessThan(10);
    });

    it('should reduce score for "mock" marker', () => {
      const code = 'const mockPatient = { ssn: "123-45-6789" };';
      const result = detectPHI(code);

      expect(result.score).toBeLessThan(10);
    });

    it('should reduce score for "dummy" marker', () => {
      const code = 'const dummySSN = "123-45-6789";';
      const result = detectPHI(code);

      expect(result.score).toBeLessThan(10);
    });

    it('should reduce score for "sample" marker', () => {
      const code = '// Sample data: SSN 123-45-6789';
      const result = detectPHI(code);

      expect(result.score).toBeLessThan(10);
    });

    it('should reduce score for "fixture" marker', () => {
      const code = 'const fixture = { ssn: "123-45-6789" };';
      const result = detectPHI(code);

      expect(result.score).toBeLessThan(10);
    });
  });
});
