/**
 * Tests for encryption utility
 */

import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import crypto from 'crypto';

// Store original env
const originalEnv = process.env.TOKEN_ENCRYPTION_KEY;

describe('Encryption Utility', () => {
  let encrypt, decrypt, isEncryptionConfigured;
  let encryptHIPAA, decryptHIPAA, hashData, generateEncryptionKey;
  let isValidEncryptionKey, encryptFields, decryptFields, isEncrypted, isHIPAAEncryptionConfigured;

  beforeEach(async () => {
    // Generate a valid test key (32 bytes = 64 hex chars)
    const testKey = crypto.randomBytes(32).toString('hex');
    process.env.TOKEN_ENCRYPTION_KEY = testKey;

    // Generate HIPAA encryption key (32 bytes base64)
    const hipaaKey = crypto.randomBytes(32).toString('base64');
    process.env.ENCRYPTION_KEY = hipaaKey;

    // Import fresh module
    const module = await import('../encryption.js');
    encrypt = module.encrypt;
    decrypt = module.decrypt;
    isEncryptionConfigured = module.isEncryptionConfigured;
    encryptHIPAA = module.encryptHIPAA;
    decryptHIPAA = module.decryptHIPAA;
    hashData = module.hashData;
    generateEncryptionKey = module.generateEncryptionKey;
    isValidEncryptionKey = module.isValidEncryptionKey;
    encryptFields = module.encryptFields;
    decryptFields = module.decryptFields;
    isEncrypted = module.isEncrypted;
    isHIPAAEncryptionConfigured = module.isHIPAAEncryptionConfigured;
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

  // ==========================================================================
  // HIPAA Encryption Tests
  // ==========================================================================

  describe('HIPAA encryptHIPAA', () => {
    it('should encrypt plaintext successfully', () => {
      const plaintext = 'patient@hospital.com';
      const encrypted = encryptHIPAA(plaintext);

      expect(encrypted).toBeDefined();
      expect(typeof encrypted).toBe('string');
      expect(encrypted).not.toBe(plaintext);
      expect(encrypted.split(':')).toHaveLength(3);
    });

    it('should produce different ciphertexts for same plaintext', () => {
      const plaintext = 'same-email@example.com';
      const encrypted1 = encryptHIPAA(plaintext);
      const encrypted2 = encryptHIPAA(plaintext);

      expect(encrypted1).not.toBe(encrypted2);
    });

    it('should return null for null input', () => {
      expect(encryptHIPAA(null)).toBeNull();
    });

    it('should return null for undefined input', () => {
      expect(encryptHIPAA(undefined)).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(encryptHIPAA('')).toBeNull();
    });

    it('should throw TypeError for non-string input', () => {
      expect(() => encryptHIPAA(12345)).toThrow(TypeError);
      expect(() => encryptHIPAA({})).toThrow(TypeError);
    });

    it('should throw error if ENCRYPTION_KEY not set', () => {
      delete process.env.ENCRYPTION_KEY;

      expect(() => encryptHIPAA('test')).toThrow(
        'ENCRYPTION_KEY environment variable not set'
      );
    });

    it('should throw error if ENCRYPTION_KEY is invalid length', () => {
      process.env.ENCRYPTION_KEY = Buffer.from('short').toString('base64');

      expect(() => encryptHIPAA('test')).toThrow(
        'ENCRYPTION_KEY must be 32 bytes'
      );
    });
  });

  describe('HIPAA decryptHIPAA', () => {
    it('should decrypt ciphertext successfully', () => {
      const plaintext = 'sensitive-email@example.com';
      const encrypted = encryptHIPAA(plaintext);
      const decrypted = decryptHIPAA(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle special characters', () => {
      const plaintext = '特殊字符@测试.com';
      const encrypted = encryptHIPAA(plaintext);
      const decrypted = decryptHIPAA(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle long strings', () => {
      const plaintext = 'a'.repeat(10000);
      const encrypted = encryptHIPAA(plaintext);
      const decrypted = decryptHIPAA(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should return null for null input', () => {
      expect(decryptHIPAA(null)).toBeNull();
    });

    it('should return null for undefined input', () => {
      expect(decryptHIPAA(undefined)).toBeNull();
    });

    it('should throw TypeError for non-string input', () => {
      expect(() => decryptHIPAA(12345)).toThrow(TypeError);
    });

    it('should throw error if ENCRYPTION_KEY not set', () => {
      const encrypted = encryptHIPAA('test');
      delete process.env.ENCRYPTION_KEY;

      expect(() => decryptHIPAA(encrypted)).toThrow(
        'ENCRYPTION_KEY environment variable not set'
      );
    });

    it('should throw error if format is invalid', () => {
      expect(() => decryptHIPAA('invalid')).toThrow(
        'Invalid encrypted data format'
      );
    });

    it('should throw error if decryption fails (wrong key)', () => {
      const encrypted = encryptHIPAA('test');
      process.env.ENCRYPTION_KEY = crypto.randomBytes(32).toString('base64');

      expect(() => decryptHIPAA(encrypted)).toThrow('Decryption failed');
    });

    it('should throw error if auth tag is invalid (tampering)', () => {
      const encrypted = encryptHIPAA('test');
      const parts = encrypted.split(':');
      parts[1] = Buffer.from('x'.repeat(16)).toString('base64');
      const tampered = parts.join(':');

      expect(() => decryptHIPAA(tampered)).toThrow();
    });
  });

  describe('HIPAA isHIPAAEncryptionConfigured', () => {
    it('should return true when valid key is set', () => {
      expect(isHIPAAEncryptionConfigured()).toBe(true);
    });

    it('should return false when key is not set', () => {
      delete process.env.ENCRYPTION_KEY;
      expect(isHIPAAEncryptionConfigured()).toBe(false);
    });

    it('should return false when key is invalid', () => {
      process.env.ENCRYPTION_KEY = 'invalid';
      expect(isHIPAAEncryptionConfigured()).toBe(false);
    });
  });

  describe('hashData', () => {
    it('should hash data successfully', () => {
      const data = 'sensitive-input-code';
      const hash = hashData(data);

      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash).toHaveLength(64);
    });

    it('should produce same hash for same input', () => {
      const data = 'same-input';
      const hash1 = hashData(data);
      const hash2 = hashData(data);

      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different inputs', () => {
      const hash1 = hashData('input1');
      const hash2 = hashData('input2');

      expect(hash1).not.toBe(hash2);
    });

    it('should return null for null input', () => {
      expect(hashData(null)).toBeNull();
    });

    it('should return null for undefined input', () => {
      expect(hashData(undefined)).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(hashData('')).toBeNull();
    });

    it('should throw TypeError for non-string input', () => {
      expect(() => hashData(12345)).toThrow(TypeError);
    });
  });

  describe('generateEncryptionKey', () => {
    it('should generate valid encryption key', () => {
      const key = generateEncryptionKey();

      expect(key).toBeDefined();
      expect(typeof key).toBe('string');
      expect(isValidEncryptionKey(key)).toBe(true);
    });

    it('should generate different keys each time', () => {
      const key1 = generateEncryptionKey();
      const key2 = generateEncryptionKey();

      expect(key1).not.toBe(key2);
    });
  });

  describe('isValidEncryptionKey', () => {
    it('should return true for valid key', () => {
      const key = generateEncryptionKey();
      expect(isValidEncryptionKey(key)).toBe(true);
    });

    it('should return false for null', () => {
      expect(isValidEncryptionKey(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isValidEncryptionKey(undefined)).toBe(false);
    });

    it('should return false for non-string', () => {
      expect(isValidEncryptionKey(12345)).toBe(false);
    });

    it('should return false for invalid base64', () => {
      expect(isValidEncryptionKey('not-base64!!!')).toBe(false);
    });

    it('should return false for wrong length', () => {
      const shortKey = Buffer.from('short').toString('base64');
      expect(isValidEncryptionKey(shortKey)).toBe(false);
    });
  });

  describe('encryptFields', () => {
    it('should encrypt specified fields', () => {
      const obj = {
        email: 'test@example.com',
        name: 'John Doe',
        ssn: '123-45-6789'
      };

      const encrypted = encryptFields(obj, ['email', 'ssn']);

      expect(encrypted.email).not.toBe(obj.email);
      expect(encrypted.ssn).not.toBe(obj.ssn);
      expect(encrypted.name).toBe(obj.name);
      expect(isEncrypted(encrypted.email)).toBe(true);
      expect(isEncrypted(encrypted.ssn)).toBe(true);
    });

    it('should handle null values', () => {
      const obj = { email: null, name: 'John' };
      const encrypted = encryptFields(obj, ['email']);

      expect(encrypted.email).toBeNull();
      expect(encrypted.name).toBe('John');
    });

    it('should handle undefined values', () => {
      const obj = { email: undefined, name: 'John' };
      const encrypted = encryptFields(obj, ['email']);

      expect(encrypted.email).toBeUndefined();
      expect(encrypted.name).toBe('John');
    });

    it('should throw TypeError for non-object', () => {
      expect(() => encryptFields('not-object', ['field'])).toThrow(TypeError);
    });

    it('should throw TypeError for non-array fields', () => {
      expect(() => encryptFields({}, 'not-array')).toThrow(TypeError);
    });
  });

  describe('decryptFields', () => {
    it('should decrypt specified fields', () => {
      const obj = {
        email: 'test@example.com',
        name: 'John Doe',
        ssn: '123-45-6789'
      };

      const encrypted = encryptFields(obj, ['email', 'ssn']);
      const decrypted = decryptFields(encrypted, ['email', 'ssn']);

      expect(decrypted.email).toBe(obj.email);
      expect(decrypted.ssn).toBe(obj.ssn);
      expect(decrypted.name).toBe(obj.name);
    });

    it('should handle null values', () => {
      const obj = { email: null, name: 'John' };
      const decrypted = decryptFields(obj, ['email']);

      expect(decrypted.email).toBeNull();
      expect(decrypted.name).toBe('John');
    });

    it('should throw TypeError for non-object', () => {
      expect(() => decryptFields('not-object', ['field'])).toThrow(TypeError);
    });

    it('should throw TypeError for non-array fields', () => {
      expect(() => decryptFields({}, 'not-array')).toThrow(TypeError);
    });
  });

  describe('isEncrypted', () => {
    it('should return true for encrypted data', () => {
      const encrypted = encryptHIPAA('test-data');
      expect(isEncrypted(encrypted)).toBe(true);
    });

    it('should return false for plaintext', () => {
      expect(isEncrypted('plaintext')).toBe(false);
    });

    it('should return false for null', () => {
      expect(isEncrypted(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isEncrypted(undefined)).toBe(false);
    });

    it('should return false for non-string', () => {
      expect(isEncrypted(12345)).toBe(false);
    });

    it('should return false for invalid format', () => {
      expect(isEncrypted('one:two')).toBe(false);
      expect(isEncrypted('short:short:short')).toBe(false);
    });
  });

  describe('HIPAA Integration Tests', () => {
    it('should encrypt and decrypt round-trip successfully', () => {
      const original = 'sensitive-patient-email@hospital.com';
      const encrypted = encryptHIPAA(original);
      const decrypted = decryptHIPAA(encrypted);

      expect(decrypted).toBe(original);
      expect(encrypted).not.toBe(original);
    });

    it('should work with encryptFields/decryptFields round-trip', () => {
      const user = {
        id: 123,
        email: 'patient@hospital.com',
        name: 'John Doe',
        ssn: '123-45-6789'
      };

      const encrypted = encryptFields(user, ['email', 'ssn']);
      const decrypted = decryptFields(encrypted, ['email', 'ssn']);

      expect(decrypted).toEqual(user);
    });

    it('should maintain data integrity with special characters', () => {
      const data = '🏥 Hospital Email: test@例え.jp';
      const encrypted = encryptHIPAA(data);
      const decrypted = decryptHIPAA(encrypted);

      expect(decrypted).toBe(data);
    });
  });
});
