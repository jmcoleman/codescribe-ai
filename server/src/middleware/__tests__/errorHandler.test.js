import { jest } from '@jest/globals';
import errorHandler from '../errorHandler.js';

describe('Error Handler Middleware', () => {
  let req;
  let res;
  let next;
  let consoleErrorSpy;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('Multer Errors', () => {
    it('should handle LIMIT_FILE_SIZE error with 413 status', () => {
      const err = {
        code: 'LIMIT_FILE_SIZE',
        message: 'File too large'
      };

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(413);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'File too large',
        message: 'Maximum file size is 500KB'
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error:', err);
    });

    it('should handle invalid file type error with 400 status', () => {
      const err = {
        message: 'Invalid file type'
      };

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid file type',
        message: 'Only .js, .jsx, .ts, .tsx, and .py files are allowed'
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error:', err);
    });
  });

  describe('Validation Errors', () => {
    it('should handle ValidationError with 400 status', () => {
      const err = {
        name: 'ValidationError',
        message: 'Code is required'
      };

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        message: 'Code is required'
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error:', err);
    });

    it('should preserve original validation error message', () => {
      const err = {
        name: 'ValidationError',
        message: 'Invalid documentation type'
      };

      errorHandler(err, req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        message: 'Invalid documentation type'
      });
    });
  });

  describe('Claude API Errors', () => {
    it('should handle api_error type with 500 status', () => {
      const err = {
        type: 'api_error',
        message: 'Claude API failed'
      };

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'AI service error',
        message: 'Failed to generate documentation. Please try again.'
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error:', err);
    });

    it('should provide user-friendly message for AI service errors', () => {
      const err = {
        type: 'api_error',
        message: 'Internal API error'
      };

      errorHandler(err, req, res, next);

      const responseCall = res.json.mock.calls[0][0];
      expect(responseCall.message).toBe('Failed to generate documentation. Please try again.');
    });
  });

  describe('Default Error Handling', () => {
    it('should handle unknown errors with 500 status', () => {
      const err = new Error('Something went wrong');

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Internal server error',
        message: 'An unexpected error occurred'
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error:', err);
    });

    it('should handle null error', () => {
      const err = null;

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Internal server error',
        message: 'An unexpected error occurred'
      });
    });

    it('should handle error without message', () => {
      const err = {};

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Internal server error',
        message: 'An unexpected error occurred'
      });
    });
  });

  describe('Error Logging', () => {
    it('should log all errors to console', () => {
      const err = new Error('Test error');

      errorHandler(err, req, res, next);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error:', err);
    });

    it('should log errors before sending response', () => {
      const callOrder = [];
      consoleErrorSpy.mockImplementation(() => callOrder.push('log'));
      res.status = jest.fn(() => {
        callOrder.push('status');
        return res;
      });

      const err = new Error('Test error');
      errorHandler(err, req, res, next);

      expect(callOrder[0]).toBe('log');
      expect(callOrder[1]).toBe('status');
    });
  });

  describe('Error Priority', () => {
    it('should prioritize Multer file size error over default', () => {
      const err = {
        code: 'LIMIT_FILE_SIZE',
        name: 'MulterError',
        message: 'File too large'
      };

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(413);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'File too large',
        message: 'Maximum file size is 500KB'
      });
    });

    it('should prioritize invalid file type error over default', () => {
      const err = {
        message: 'Invalid file type',
        code: 'SOME_OTHER_CODE'
      };

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid file type',
        message: 'Only .js, .jsx, .ts, .tsx, and .py files are allowed'
      });
    });

    it('should prioritize ValidationError over default', () => {
      const err = {
        name: 'ValidationError',
        message: 'Validation failed',
        type: 'some_other_type'
      };

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        message: 'Validation failed'
      });
    });

    it('should prioritize Claude API error over default', () => {
      const err = {
        type: 'api_error',
        message: 'API failed'
      };

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'AI service error',
        message: 'Failed to generate documentation. Please try again.'
      });
    });
  });

  describe('Response Format', () => {
    it('should return early for Multer file size error', () => {
      const err = { code: 'LIMIT_FILE_SIZE' };

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledTimes(1);
      expect(res.json).toHaveBeenCalledTimes(1);
      expect(next).not.toHaveBeenCalled();
    });

    it('should return early for invalid file type error', () => {
      const err = { message: 'Invalid file type' };

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledTimes(1);
      expect(res.json).toHaveBeenCalledTimes(1);
      expect(next).not.toHaveBeenCalled();
    });

    it('should return early for validation error', () => {
      const err = { name: 'ValidationError', message: 'Validation failed' };

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledTimes(1);
      expect(res.json).toHaveBeenCalledTimes(1);
      expect(next).not.toHaveBeenCalled();
    });

    it('should return early for Claude API error', () => {
      const err = { type: 'api_error' };

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledTimes(1);
      expect(res.json).toHaveBeenCalledTimes(1);
      expect(next).not.toHaveBeenCalled();
    });

    it('should call status and json for default error', () => {
      const err = new Error('Unknown error');

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Internal server error',
        message: 'An unexpected error occurred'
      });
    });
  });
});
