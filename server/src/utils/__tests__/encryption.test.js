/**
 * Tests for encryption utility
 */

import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import crypto from 'crypto';

// Store original env
const originalEnv = process.env.TOKEN_ENCRYPTION_KEY;

describe('Encryption Utility', () => {
  let encrypt, decrypt, isEncryptionConfigured;

  beforeEach(async () => {
    // Generate a valid test key (32 bytes = 64 hex chars)
    const testKey = crypto.randomBytes(32).toString('hex');
    process.env.TOKEN_ENCRYPTION_KEY = testKey;

    // Import fresh module
    const module = await import('../encryption.js');
    encrypt = module.encrypt;
    decrypt = module.decrypt;
    isEncryptionConfigured = module.isEncryptionConfigured;
  });

  afterEach(() => {
    // Restore original env
    if (originalEnv) {
      process.env.TOKEN_ENCRYPTION_KEY = originalEnv;
    } else {
      delete process.env.TOKEN_ENCRYPTION_KEY;
    }
  });

  describe('isEncryptionConfigured', () => {
    it('should return true when valid key is set', () => {
      expect(isEncryptionConfigured()).toBe(true);
    });

    it('should return false when key is not set', () => {
      delete process.env.TOKEN_ENCRYPTION_KEY;
      expect(isEncryptionConfigured()).toBe(false);
    });

    it('should return false when key is invalid length', () => {
      process.env.TOKEN_ENCRYPTION_KEY = 'tooshort';
      expect(isEncryptionConfigured()).toBe(false);
    });
  });

  describe('encrypt', () => {
    it('should encrypt a string', () => {
      const plaintext = 'gho_123456789abcdefghijklmnop';
      const encrypted = encrypt(plaintext);

      expect(encrypted).toBeDefined();
      expect(encrypted).not.toBe(plaintext);
      // Format should be iv:authTag:encryptedData
      expect(encrypted.split(':').length).toBe(3);
    });

    it('should throw when key is not set', () => {
      delete process.env.TOKEN_ENCRYPTION_KEY;
      expect(() => encrypt('test')).toThrow('TOKEN_ENCRYPTION_KEY environment variable is not set');
    });

    it('should throw when key is invalid length', () => {
      process.env.TOKEN_ENCRYPTION_KEY = 'tooshort';
      expect(() => encrypt('test')).toThrow('TOKEN_ENCRYPTION_KEY must be a 64-character hex string');
    });

    it('should produce different ciphertexts for same plaintext (due to random IV)', () => {
      const plaintext = 'test';
      const encrypted1 = encrypt(plaintext);
      const encrypted2 = encrypt(plaintext);

      expect(encrypted1).not.toBe(encrypted2);
    });
  });

  describe('decrypt', () => {
    it('should decrypt an encrypted string', () => {
      const plaintext = 'gho_123456789abcdefghijklmnop';
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should throw when key is not set', () => {
      const encrypted = encrypt('test');
      delete process.env.TOKEN_ENCRYPTION_KEY;

      expect(() => decrypt(encrypted)).toThrow('TOKEN_ENCRYPTION_KEY environment variable is not set');
    });

    it('should throw on invalid ciphertext format', () => {
      expect(() => decrypt('invalid')).toThrow('Invalid ciphertext format');
    });

    it('should throw when tampered with', () => {
      const encrypted = encrypt('test');
      const [iv, authTag, data] = encrypted.split(':');
      // Tamper with the data
      const tampered = `${iv}:${authTag}:${data.split('').reverse().join('')}`;

      expect(() => decrypt(tampered)).toThrow();
    });
  });

  describe('roundtrip', () => {
    it('should handle empty string', () => {
      const plaintext = '';
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle special characters', () => {
      const plaintext = 'gho_!@#$%^&*()_+-=[]{}|;:,.<>?';
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle long strings', () => {
      const plaintext = 'a'.repeat(10000);
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });
  });
});
