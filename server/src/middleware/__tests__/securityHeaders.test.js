import { jest } from '@jest/globals';
import { securityHeaders, strictSecurityHeaders } from '../securityHeaders.js';

describe('Security Headers Middleware', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {};
    res = {
      setHeader: jest.fn()
    };
    next = jest.fn();
  });

  describe('securityHeaders', () => {
    it('should set X-Frame-Options header to DENY', () => {
      securityHeaders(req, res, next);
      expect(res.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'DENY');
    });

    it('should set X-Content-Type-Options header to nosniff', () => {
      securityHeaders(req, res, next);
      expect(res.setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
    });

    it('should set X-XSS-Protection header with mode=block', () => {
      securityHeaders(req, res, next);
      expect(res.setHeader).toHaveBeenCalledWith('X-XSS-Protection', '1; mode=block');
    });

    it('should set Referrer-Policy header to strict-origin-when-cross-origin', () => {
      securityHeaders(req, res, next);
      expect(res.setHeader).toHaveBeenCalledWith('Referrer-Policy', 'strict-origin-when-cross-origin');
    });

    it('should set Permissions-Policy header with restricted permissions', () => {
      securityHeaders(req, res, next);
      expect(res.setHeader).toHaveBeenCalledWith('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
    });

    it('should call next() to continue middleware chain', () => {
      securityHeaders(req, res, next);
      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith();
    });

    it('should set all 5 headers in a single call', () => {
      securityHeaders(req, res, next);
      expect(res.setHeader).toHaveBeenCalledTimes(5);
    });

    it('should set headers before calling next()', () => {
      const callOrder = [];
      res.setHeader = jest.fn(() => callOrder.push('setHeader'));
      next = jest.fn(() => callOrder.push('next'));

      securityHeaders(req, res, next);

      expect(callOrder).toEqual([
        'setHeader', 'setHeader', 'setHeader', 'setHeader', 'setHeader', 'next'
      ]);
    });
  });

  describe('strictSecurityHeaders', () => {
    it('should call securityHeaders function', () => {
      strictSecurityHeaders(req, res, next);

      // Verify all base headers are set
      expect(res.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'DENY');
      expect(res.setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
      expect(res.setHeader).toHaveBeenCalledWith('X-XSS-Protection', '1; mode=block');
      expect(res.setHeader).toHaveBeenCalledWith('Referrer-Policy', 'strict-origin-when-cross-origin');
      expect(res.setHeader).toHaveBeenCalledWith('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
    });

    it('should call next() to continue middleware chain', () => {
      strictSecurityHeaders(req, res, next);
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('should set all base security headers', () => {
      strictSecurityHeaders(req, res, next);
      expect(res.setHeader).toHaveBeenCalledTimes(5);
    });
  });

  describe('Integration with Express', () => {
    it('should work with standard Express req/res/next pattern', () => {
      const mockReq = { method: 'GET', path: '/api/health' };
      const mockRes = {
        setHeader: jest.fn(),
        statusCode: 200
      };
      const mockNext = jest.fn();

      securityHeaders(mockReq, mockRes, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledTimes(5);
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should not interfere with existing response headers', () => {
      res.existingHeader = 'existing-value';

      securityHeaders(req, res, next);

      expect(res.existingHeader).toBe('existing-value');
      expect(next).toHaveBeenCalled();
    });

    it('should handle requests without modifying req object', () => {
      const originalReq = { ...req };

      securityHeaders(req, res, next);

      expect(req).toEqual(originalReq);
    });
  });

  describe('OWASP Compliance', () => {
    it('should implement OWASP recommended X-Frame-Options header', () => {
      securityHeaders(req, res, next);
      const call = res.setHeader.mock.calls.find(c => c[0] === 'X-Frame-Options');
      expect(call[1]).toBe('DENY');
    });

    it('should implement OWASP recommended X-Content-Type-Options header', () => {
      securityHeaders(req, res, next);
      const call = res.setHeader.mock.calls.find(c => c[0] === 'X-Content-Type-Options');
      expect(call[1]).toBe('nosniff');
    });

    it('should implement OWASP recommended XSS Protection header', () => {
      securityHeaders(req, res, next);
      const call = res.setHeader.mock.calls.find(c => c[0] === 'X-XSS-Protection');
      expect(call[1]).toBe('1; mode=block');
    });

    it('should implement secure Referrer-Policy', () => {
      securityHeaders(req, res, next);
      const call = res.setHeader.mock.calls.find(c => c[0] === 'Referrer-Policy');
      expect(call[1]).toBe('strict-origin-when-cross-origin');
    });

    it('should implement restrictive Permissions-Policy', () => {
      securityHeaders(req, res, next);
      const call = res.setHeader.mock.calls.find(c => c[0] === 'Permissions-Policy');
      expect(call[1]).toContain('camera=()');
      expect(call[1]).toContain('microphone=()');
      expect(call[1]).toContain('geolocation=()');
      expect(call[1]).toContain('payment=()');
    });
  });
});
