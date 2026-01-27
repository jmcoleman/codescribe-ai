/**
 * Encryption Utility
 * AES-256-GCM encryption for sensitive data
 * - GitHub access tokens (TOKEN_ENCRYPTION_KEY)
 * - HIPAA-compliant encryption for user data (ENCRYPTION_KEY)
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Encrypt a plaintext string using AES-256-GCM
 * @param {string} plaintext - The string to encrypt
 * @returns {string} Encrypted string in format: iv:authTag:encryptedData (all hex)
 * @throws {Error} If TOKEN_ENCRYPTION_KEY is not set or invalid
 */
export function encrypt(plaintext) {
  if (!process.env.TOKEN_ENCRYPTION_KEY) {
    throw new Error('TOKEN_ENCRYPTION_KEY environment variable is not set');
  }

  const key = Buffer.from(process.env.TOKEN_ENCRYPTION_KEY, 'hex');

  if (key.length !== 32) {
    throw new Error('TOKEN_ENCRYPTION_KEY must be a 64-character hex string (32 bytes)');
  }

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  // Format: iv:authTag:encryptedData
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypt a ciphertext string using AES-256-GCM
 * @param {string} ciphertext - The encrypted string in format: iv:authTag:encryptedData
 * @returns {string} Decrypted plaintext
 * @throws {Error} If TOKEN_ENCRYPTION_KEY is not set, invalid, or decryption fails
 */
export function decrypt(ciphertext) {
  if (!process.env.TOKEN_ENCRYPTION_KEY) {
    throw new Error('TOKEN_ENCRYPTION_KEY environment variable is not set');
  }

  const key = Buffer.from(process.env.TOKEN_ENCRYPTION_KEY, 'hex');

  if (key.length !== 32) {
    throw new Error('TOKEN_ENCRYPTION_KEY must be a 64-character hex string (32 bytes)');
  }

  const parts = ciphertext.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid ciphertext format');
  }

  const [ivHex, authTagHex, encrypted] = parts;

  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/**
 * Check if the encryption key is properly configured
 * @returns {boolean} True if encryption is available
 */
export function isEncryptionConfigured() {
  if (!process.env.TOKEN_ENCRYPTION_KEY) {
    return false;
  }

  try {
    const key = Buffer.from(process.env.TOKEN_ENCRYPTION_KEY, 'hex');
    return key.length === 32;
  } catch {
    return false;
  }
}

// =============================================================================
// HIPAA-Compliant Encryption Functions
// Separate key (ENCRYPTION_KEY) for user data and PHI
// =============================================================================

/**
 * Get HIPAA encryption key from environment
 * Uses ENCRYPTION_KEY (base64-encoded 32-byte key)
 * @returns {Buffer} Encryption key
 * @throws {Error} If ENCRYPTION_KEY is not set or invalid
 */
function getHIPAAEncryptionKey() {
  const key = process.env.ENCRYPTION_KEY;

  if (!key) {
    throw new Error(
      'ENCRYPTION_KEY environment variable not set. ' +
      'Generate with: node -e "console.log(crypto.randomBytes(32).toString(\'base64\'))"'
    );
  }

  const keyBuffer = Buffer.from(key, 'base64');

  if (keyBuffer.length !== 32) {
    throw new Error(
      'ENCRYPTION_KEY must be 32 bytes (256 bits). ' +
      'Current length: ' + keyBuffer.length + ' bytes'
    );
  }

  return keyBuffer;
}

/**
 * Encrypt data for HIPAA compliance
 * @param {string} plaintext - Data to encrypt
 * @returns {string|null} Encrypted data in format: iv:authTag:ciphertext (base64)
 */
export function encryptHIPAA(plaintext) {
  if (!plaintext) {
    return null;
  }

  if (typeof plaintext !== 'string') {
    throw new TypeError('Plaintext must be a string');
  }

  try {
    const key = getHIPAAEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let ciphertext = cipher.update(plaintext, 'utf8', 'base64');
    ciphertext += cipher.final('base64');

    const authTag = cipher.getAuthTag();

    // Return format: iv:authTag:ciphertext (all base64)
    return [
      iv.toString('base64'),
      authTag.toString('base64'),
      ciphertext
    ].join(':');
  } catch (error) {
    console.error('[Encryption] HIPAA encryption failed:', error.message);
    throw new Error('Encryption failed: ' + error.message);
  }
}

/**
 * Decrypt HIPAA-encrypted data
 * @param {string} encryptedData - Encrypted data in format: iv:authTag:ciphertext
 * @returns {string|null} Decrypted plaintext
 */
export function decryptHIPAA(encryptedData) {
  if (!encryptedData) {
    return null;
  }

  if (typeof encryptedData !== 'string') {
    throw new TypeError('Encrypted data must be a string');
  }

  try {
    const key = getHIPAAEncryptionKey();
    const parts = encryptedData.split(':');

    if (parts.length !== 3) {
      throw new Error(
        'Invalid encrypted data format. Expected: iv:authTag:ciphertext'
      );
    }

    const [ivBase64, authTagBase64, ciphertext] = parts;
    const iv = Buffer.from(ivBase64, 'base64');
    const authTag = Buffer.from(authTagBase64, 'base64');

    if (iv.length !== IV_LENGTH) {
      throw new Error(`Invalid IV length: ${iv.length} (expected ${IV_LENGTH})`);
    }

    if (authTag.length !== AUTH_TAG_LENGTH) {
      throw new Error(`Invalid auth tag length: ${authTag.length} (expected ${AUTH_TAG_LENGTH})`);
    }

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let plaintext = decipher.update(ciphertext, 'base64', 'utf8');
    plaintext += decipher.final('utf8');

    return plaintext;
  } catch (error) {
    console.error('[Encryption] HIPAA decryption failed:', error.message);
    throw new Error('Decryption failed: ' + error.message);
  }
}

/**
 * Hash data using SHA-256 (one-way)
 * @param {string} data - Data to hash
 * @returns {string|null} Hex-encoded hash
 */
export function hashData(data) {
  if (!data) {
    return null;
  }

  if (typeof data !== 'string') {
    throw new TypeError('Data must be a string');
  }

  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Generate secure random encryption key
 * @returns {string} Base64-encoded 256-bit key
 */
export function generateEncryptionKey() {
  return crypto.randomBytes(32).toString('base64');
}

/**
 * Validate encryption key format
 * @param {string} key - Base64-encoded key to validate
 * @returns {boolean} True if valid
 */
export function isValidEncryptionKey(key) {
  if (!key || typeof key !== 'string') {
    return false;
  }

  try {
    const keyBuffer = Buffer.from(key, 'base64');
    return keyBuffer.length === 32;
  } catch {
    return false;
  }
}

/**
 * Encrypt multiple fields in an object
 * @param {Object} obj - Object with fields to encrypt
 * @param {string[]} fields - Array of field names to encrypt
 * @returns {Object} Object with encrypted fields
 */
export function encryptFields(obj, fields) {
  if (!obj || typeof obj !== 'object') {
    throw new TypeError('Object must be an object');
  }

  if (!Array.isArray(fields)) {
    throw new TypeError('Fields must be an array');
  }

  const result = { ...obj };

  for (const field of fields) {
    if (result[field] !== null && result[field] !== undefined) {
      result[field] = encryptHIPAA(String(result[field]));
    }
  }

  return result;
}

/**
 * Decrypt multiple fields in an object
 * @param {Object} obj - Object with encrypted fields
 * @param {string[]} fields - Array of field names to decrypt
 * @returns {Object} Object with decrypted fields
 */
export function decryptFields(obj, fields) {
  if (!obj || typeof obj !== 'object') {
    throw new TypeError('Object must be an object');
  }

  if (!Array.isArray(fields)) {
    throw new TypeError('Fields must be an array');
  }

  const result = { ...obj };

  for (const field of fields) {
    if (result[field] !== null && result[field] !== undefined) {
      result[field] = decryptHIPAA(String(result[field]));
    }
  }

  return result;
}

/**
 * Check if data is encrypted (has correct format)
 * @param {string} data - Data to check
 * @returns {boolean} True if data appears to be encrypted
 */
export function isEncrypted(data) {
  if (!data || typeof data !== 'string') {
    return false;
  }

  const parts = data.split(':');
  if (parts.length !== 3) {
    return false;
  }

  try {
    const [ivBase64, authTagBase64] = parts;
    const iv = Buffer.from(ivBase64, 'base64');
    const authTag = Buffer.from(authTagBase64, 'base64');

    return iv.length === IV_LENGTH && authTag.length === AUTH_TAG_LENGTH;
  } catch {
    return false;
  }
}

/**
 * Check if HIPAA encryption is properly configured
 * @returns {boolean} True if ENCRYPTION_KEY is set and valid
 */
export function isHIPAAEncryptionConfigured() {
  if (!process.env.ENCRYPTION_KEY) {
    return false;
  }

  try {
    const key = Buffer.from(process.env.ENCRYPTION_KEY, 'base64');
    return key.length === 32;
  } catch {
    return false;
  }
}

export default {
  // GitHub token encryption (backward compatible)
  encrypt,
  decrypt,
  isEncryptionConfigured,
  // HIPAA encryption
  encryptHIPAA,
  decryptHIPAA,
  hashData,
  generateEncryptionKey,
  isValidEncryptionKey,
  encryptFields,
  decryptFields,
  isEncrypted,
  isHIPAAEncryptionConfigured
};
