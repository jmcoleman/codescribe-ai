/**
 * Tests for Legal Versions Constants and Utilities
 *
 * Tests cover:
 * - Version constant exports
 * - hasAcceptedCurrentTerms() function
 * - hasAcceptedCurrentPrivacy() function
 * - needsLegalReacceptance() function
 * - Version comparison logic
 */

import { describe, it, expect } from '@jest/globals';
import {
  CURRENT_TERMS_VERSION,
  CURRENT_PRIVACY_VERSION,
  hasAcceptedCurrentTerms,
  hasAcceptedCurrentPrivacy,
  needsLegalReacceptance,
} from '../legalVersions.js';

describe('Legal Version Constants', () => {
  it('should export CURRENT_TERMS_VERSION', () => {
    expect(CURRENT_TERMS_VERSION).toBeDefined();
    expect(typeof CURRENT_TERMS_VERSION).toBe('string');
  });

  it('should export CURRENT_PRIVACY_VERSION', () => {
    expect(CURRENT_PRIVACY_VERSION).toBeDefined();
    expect(typeof CURRENT_PRIVACY_VERSION).toBe('string');
  });

  it('should use ISO date format for version numbers', () => {
    // ISO date format: YYYY-MM-DD
    const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;

    expect(CURRENT_TERMS_VERSION).toMatch(isoDatePattern);
    expect(CURRENT_PRIVACY_VERSION).toMatch(isoDatePattern);
  });

  it('should have valid initial versions', () => {
    expect(CURRENT_TERMS_VERSION).toBe('2025-11-02');
    expect(CURRENT_PRIVACY_VERSION).toBe('2025-11-02');
  });
});

describe('hasAcceptedCurrentTerms()', () => {
  it('should return true when user has accepted current terms version', () => {
    const user = {
      terms_version_accepted: CURRENT_TERMS_VERSION,
    };

    expect(hasAcceptedCurrentTerms(user)).toBe(true);
  });

  it('should return false when user has not accepted terms', () => {
    const user = {
      terms_version_accepted: null,
    };

    expect(hasAcceptedCurrentTerms(user)).toBe(false);
  });

  it('should return false when user has accepted old terms version', () => {
    const user = {
      terms_version_accepted: '2025-01-01',
    };

    expect(hasAcceptedCurrentTerms(user)).toBe(false);
  });

  it('should return false when user has no terms_version_accepted field', () => {
    const user = {};

    expect(hasAcceptedCurrentTerms(user)).toBe(false);
  });

  it('should handle undefined user gracefully', () => {
    const user = {
      terms_version_accepted: undefined,
    };

    expect(hasAcceptedCurrentTerms(user)).toBe(false);
  });
});

describe('hasAcceptedCurrentPrivacy()', () => {
  it('should return true when user has accepted current privacy version', () => {
    const user = {
      privacy_version_accepted: CURRENT_PRIVACY_VERSION,
    };

    expect(hasAcceptedCurrentPrivacy(user)).toBe(true);
  });

  it('should return false when user has not accepted privacy policy', () => {
    const user = {
      privacy_version_accepted: null,
    };

    expect(hasAcceptedCurrentPrivacy(user)).toBe(false);
  });

  it('should return false when user has accepted old privacy version', () => {
    const user = {
      privacy_version_accepted: '2025-01-01',
    };

    expect(hasAcceptedCurrentPrivacy(user)).toBe(false);
  });

  it('should return false when user has no privacy_version_accepted field', () => {
    const user = {};

    expect(hasAcceptedCurrentPrivacy(user)).toBe(false);
  });

  it('should handle undefined user gracefully', () => {
    const user = {
      privacy_version_accepted: undefined,
    };

    expect(hasAcceptedCurrentPrivacy(user)).toBe(false);
  });
});

describe('needsLegalReacceptance()', () => {
  it('should return all false when user has accepted both current versions', () => {
    const user = {
      terms_version_accepted: CURRENT_TERMS_VERSION,
      privacy_version_accepted: CURRENT_PRIVACY_VERSION,
    };

    const result = needsLegalReacceptance(user);

    expect(result).toEqual({
      needsTerms: false,
      needsPrivacy: false,
      needsAny: false,
    });
  });

  it('should return needsTerms: true when terms not accepted', () => {
    const user = {
      terms_version_accepted: null,
      privacy_version_accepted: CURRENT_PRIVACY_VERSION,
    };

    const result = needsLegalReacceptance(user);

    expect(result).toEqual({
      needsTerms: true,
      needsPrivacy: false,
      needsAny: true,
    });
  });

  it('should return needsPrivacy: true when privacy not accepted', () => {
    const user = {
      terms_version_accepted: CURRENT_TERMS_VERSION,
      privacy_version_accepted: null,
    };

    const result = needsLegalReacceptance(user);

    expect(result).toEqual({
      needsTerms: false,
      needsPrivacy: true,
      needsAny: true,
    });
  });

  it('should return all true when neither is accepted', () => {
    const user = {
      terms_version_accepted: null,
      privacy_version_accepted: null,
    };

    const result = needsLegalReacceptance(user);

    expect(result).toEqual({
      needsTerms: true,
      needsPrivacy: true,
      needsAny: true,
    });
  });

  it('should return needsTerms: true when old terms version accepted', () => {
    const user = {
      terms_version_accepted: '2025-01-01',
      privacy_version_accepted: CURRENT_PRIVACY_VERSION,
    };

    const result = needsLegalReacceptance(user);

    expect(result.needsTerms).toBe(true);
    expect(result.needsAny).toBe(true);
  });

  it('should return needsPrivacy: true when old privacy version accepted', () => {
    const user = {
      terms_version_accepted: CURRENT_TERMS_VERSION,
      privacy_version_accepted: '2025-01-01',
    };

    const result = needsLegalReacceptance(user);

    expect(result.needsPrivacy).toBe(true);
    expect(result.needsAny).toBe(true);
  });

  it('should handle user with no acceptance fields', () => {
    const user = {};

    const result = needsLegalReacceptance(user);

    expect(result).toEqual({
      needsTerms: true,
      needsPrivacy: true,
      needsAny: true,
    });
  });

  it('should handle user with undefined acceptance values', () => {
    const user = {
      terms_version_accepted: undefined,
      privacy_version_accepted: undefined,
    };

    const result = needsLegalReacceptance(user);

    expect(result).toEqual({
      needsTerms: true,
      needsPrivacy: true,
      needsAny: true,
    });
  });

  it('should correctly set needsAny when both need reacceptance', () => {
    const user = {
      terms_version_accepted: '2024-01-01',
      privacy_version_accepted: '2024-01-01',
    };

    const result = needsLegalReacceptance(user);

    expect(result.needsAny).toBe(true);
    expect(result.needsTerms).toBe(true);
    expect(result.needsPrivacy).toBe(true);
  });

  it('should correctly set needsAny when only terms needs reacceptance', () => {
    const user = {
      terms_version_accepted: '2024-01-01',
      privacy_version_accepted: CURRENT_PRIVACY_VERSION,
    };

    const result = needsLegalReacceptance(user);

    expect(result.needsAny).toBe(true);
  });

  it('should correctly set needsAny when only privacy needs reacceptance', () => {
    const user = {
      terms_version_accepted: CURRENT_TERMS_VERSION,
      privacy_version_accepted: '2024-01-01',
    };

    const result = needsLegalReacceptance(user);

    expect(result.needsAny).toBe(true);
  });

  it('should handle new user with no previous acceptances', () => {
    const newUser = {
      id: 123,
      email: 'newuser@example.com',
      tier: 'free',
      // No terms_version_accepted or privacy_version_accepted
    };

    const result = needsLegalReacceptance(newUser);

    expect(result).toEqual({
      needsTerms: true,
      needsPrivacy: true,
      needsAny: true,
    });
  });
});

describe('Version Update Scenarios', () => {
  it('should require reacceptance after terms version update', () => {
    // Simulate user who accepted old version
    const user = {
      terms_version_accepted: '2025-01-15',
      privacy_version_accepted: CURRENT_PRIVACY_VERSION,
    };

    const result = needsLegalReacceptance(user);

    // Should need to accept new terms version
    expect(result.needsTerms).toBe(true);
    expect(result.needsPrivacy).toBe(false);
    expect(result.needsAny).toBe(true);
  });

  it('should require reacceptance after privacy version update', () => {
    // Simulate user who accepted old version
    const user = {
      terms_version_accepted: CURRENT_TERMS_VERSION,
      privacy_version_accepted: '2025-01-15',
    };

    const result = needsLegalReacceptance(user);

    // Should need to accept new privacy version
    expect(result.needsTerms).toBe(false);
    expect(result.needsPrivacy).toBe(true);
    expect(result.needsAny).toBe(true);
  });

  it('should require reacceptance after both versions update', () => {
    // Simulate user who accepted old versions
    const user = {
      terms_version_accepted: '2025-01-15',
      privacy_version_accepted: '2025-01-15',
    };

    const result = needsLegalReacceptance(user);

    // Should need to accept both new versions
    expect(result.needsTerms).toBe(true);
    expect(result.needsPrivacy).toBe(true);
    expect(result.needsAny).toBe(true);
  });
});
