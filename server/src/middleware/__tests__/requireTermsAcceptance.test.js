/**
 * Tests for requireTermsAcceptance Middleware
 *
 * Middleware that checks if authenticated users have accepted current legal documents
 * Tests cover:
 * - Blocking requests when user needs to re-accept legal documents
 * - Allowing requests when user has accepted current versions
 * - Handling unauthenticated users (skip check)
 * - Warning mode (warnTermsAcceptance)
 * - Response format for re-acceptance required
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  requireTermsAcceptance,
  warnTermsAcceptance,
} from '../requireTermsAcceptance.js';
import {
  CURRENT_TERMS_VERSION,
  CURRENT_PRIVACY_VERSION,
} from '../../constants/legalVersions.js';

describe('requireTermsAcceptance Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      user: null,
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      setHeader: jest.fn(),
    };
    next = jest.fn();
  });

  describe('When user is not authenticated', () => {
    it('should skip check and call next() for unauthenticated requests', () => {
      req.user = null;

      requireTermsAcceptance(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should skip check when req.user is undefined', () => {
      req.user = undefined;

      requireTermsAcceptance(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('When user has accepted current versions', () => {
    it('should allow request when both terms and privacy are current', () => {
      req.user = {
        id: 123,
        terms_version_accepted: CURRENT_TERMS_VERSION,
        privacy_version_accepted: CURRENT_PRIVACY_VERSION,
      };

      requireTermsAcceptance(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('When user needs to re-accept legal documents', () => {
    it('should return 403 when user has not accepted terms', () => {
      req.user = {
        id: 123,
        terms_version_accepted: null,
        privacy_version_accepted: CURRENT_PRIVACY_VERSION,
      };

      requireTermsAcceptance(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Terms acceptance required',
          reacceptance_required: true,
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 when user has not accepted privacy policy', () => {
      req.user = {
        id: 123,
        terms_version_accepted: CURRENT_TERMS_VERSION,
        privacy_version_accepted: null,
      };

      requireTermsAcceptance(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Terms acceptance required',
          reacceptance_required: true,
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 when user has accepted old terms version', () => {
      req.user = {
        id: 123,
        terms_version_accepted: '2025-01-01',
        privacy_version_accepted: CURRENT_PRIVACY_VERSION,
      };

      requireTermsAcceptance(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 when user has accepted old privacy version', () => {
      req.user = {
        id: 123,
        terms_version_accepted: CURRENT_TERMS_VERSION,
        privacy_version_accepted: '2025-01-01',
      };

      requireTermsAcceptance(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 when user has not accepted either document', () => {
      req.user = {
        id: 123,
        terms_version_accepted: null,
        privacy_version_accepted: null,
      };

      requireTermsAcceptance(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Response format when re-acceptance required', () => {
    it('should include missing_acceptance with terms version when terms needs acceptance', () => {
      req.user = {
        id: 123,
        terms_version_accepted: null,
        privacy_version_accepted: CURRENT_PRIVACY_VERSION,
      };

      requireTermsAcceptance(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          missing_acceptance: {
            terms: CURRENT_TERMS_VERSION,
            privacy: null,
          },
        })
      );
    });

    it('should include missing_acceptance with privacy version when privacy needs acceptance', () => {
      req.user = {
        id: 123,
        terms_version_accepted: CURRENT_TERMS_VERSION,
        privacy_version_accepted: null,
      };

      requireTermsAcceptance(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          missing_acceptance: {
            terms: null,
            privacy: CURRENT_PRIVACY_VERSION,
          },
        })
      );
    });

    it('should include missing_acceptance with both versions when both need acceptance', () => {
      req.user = {
        id: 123,
        terms_version_accepted: null,
        privacy_version_accepted: null,
      };

      requireTermsAcceptance(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          missing_acceptance: {
            terms: CURRENT_TERMS_VERSION,
            privacy: CURRENT_PRIVACY_VERSION,
          },
        })
      );
    });

    it('should include current_versions in response', () => {
      req.user = {
        id: 123,
        terms_version_accepted: null,
        privacy_version_accepted: null,
      };

      requireTermsAcceptance(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          current_versions: {
            terms: CURRENT_TERMS_VERSION,
            privacy: CURRENT_PRIVACY_VERSION,
          },
        })
      );
    });

    it('should include descriptive message in response', () => {
      req.user = {
        id: 123,
        terms_version_accepted: null,
        privacy_version_accepted: null,
      };

      requireTermsAcceptance(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'You must accept the current Terms of Service and Privacy Policy to continue.',
        })
      );
    });
  });
});

describe('warnTermsAcceptance Middleware (Warning Mode)', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      user: null,
    };
    res = {
      setHeader: jest.fn(),
    };
    next = jest.fn();
  });

  describe('When user is not authenticated', () => {
    it('should skip check and call next() for unauthenticated requests', () => {
      req.user = null;

      warnTermsAcceptance(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.setHeader).not.toHaveBeenCalled();
    });
  });

  describe('When user has accepted current versions', () => {
    it('should not set warning headers when user is current', () => {
      req.user = {
        id: 123,
        terms_version_accepted: CURRENT_TERMS_VERSION,
        privacy_version_accepted: CURRENT_PRIVACY_VERSION,
      };

      warnTermsAcceptance(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.setHeader).not.toHaveBeenCalled();
    });
  });

  describe('When user needs to re-accept legal documents', () => {
    it('should set warning headers but not block request when terms needs acceptance', () => {
      req.user = {
        id: 123,
        terms_version_accepted: null,
        privacy_version_accepted: CURRENT_PRIVACY_VERSION,
      };

      warnTermsAcceptance(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith('X-Terms-Reacceptance-Required', 'true');
      expect(res.setHeader).toHaveBeenCalledWith(
        'X-Terms-Missing',
        JSON.stringify({ terms: true, privacy: false })
      );
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('should set warning headers but not block request when privacy needs acceptance', () => {
      req.user = {
        id: 123,
        terms_version_accepted: CURRENT_TERMS_VERSION,
        privacy_version_accepted: null,
      };

      warnTermsAcceptance(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith('X-Terms-Reacceptance-Required', 'true');
      expect(res.setHeader).toHaveBeenCalledWith(
        'X-Terms-Missing',
        JSON.stringify({ terms: false, privacy: true })
      );
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('should set warning headers but not block request when both need acceptance', () => {
      req.user = {
        id: 123,
        terms_version_accepted: null,
        privacy_version_accepted: null,
      };

      warnTermsAcceptance(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith('X-Terms-Reacceptance-Required', 'true');
      expect(res.setHeader).toHaveBeenCalledWith(
        'X-Terms-Missing',
        JSON.stringify({ terms: true, privacy: true })
      );
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('should always call next() even when warnings are set', () => {
      req.user = {
        id: 123,
        terms_version_accepted: null,
        privacy_version_accepted: null,
      };

      warnTermsAcceptance(req, res, next);

      // Should not block, always proceed
      expect(next).toHaveBeenCalledTimes(1);
    });
  });
});

describe('Edge Cases', () => {
  let req, res, next;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  it('should handle user with undefined acceptance fields', () => {
    req.user = {
      id: 123,
      terms_version_accepted: undefined,
      privacy_version_accepted: undefined,
    };

    requireTermsAcceptance(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('should handle new user with no legal acceptance fields', () => {
    req.user = {
      id: 123,
      email: 'newuser@example.com',
      // No terms_version_accepted or privacy_version_accepted
    };

    requireTermsAcceptance(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('should handle user object with only id', () => {
    req.user = {
      id: 123,
    };

    requireTermsAcceptance(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});
