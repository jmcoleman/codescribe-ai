/**
 * Encryption Utility
 * AES-256-GCM encryption for sensitive tokens (e.g., GitHub access tokens)
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;

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
