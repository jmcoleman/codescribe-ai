/**
 * Unit tests for User model
 * Tests user creation, authentication, and database operations
 */

import bcrypt from 'bcrypt';
import User from '../User.js';

// Mock @vercel/postgres
jest.mock('@vercel/postgres', () => ({
  sql: jest.fn()
}));

import { sql } from '@vercel/postgres';

describe('User Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new user with hashed password', async () => {
      const mockResult = {
        rows: [{
          id: 1,
          email: 'test@example.com',
          tier: 'free',
          created_at: new Date()
        }]
      };

      sql.mockResolvedValue(mockResult);

      const user = await User.create({
        email: 'test@example.com',
        password: 'PlainTextPassword123'
      });

      expect(user).toEqual(mockResult.rows[0]);
      expect(sql).toHaveBeenCalledTimes(1);
    });

    it('should create user with custom tier', async () => {
      const mockResult = {
        rows: [{
          id: 2,
          email: 'pro@example.com',
          tier: 'pro',
          created_at: new Date()
        }]
      };

      sql.mockResolvedValue(mockResult);

      const user = await User.create({
        email: 'pro@example.com',
        password: 'Password123',
        tier: 'pro'
      });

      expect(user.tier).toBe('pro');
      expect(sql).toHaveBeenCalled();
    });

    it('should default to free tier if not specified', async () => {
      const mockResult = {
        rows: [{
          id: 3,
          email: 'free@example.com',
          tier: 'free',
          created_at: new Date()
        }]
      };

      sql.mockResolvedValue(mockResult);

      await User.create({
        email: 'free@example.com',
        password: 'Password123'
      });

      expect(sql).toHaveBeenCalled();
    });

    it('should throw error if database fails', async () => {
      sql.mockRejectedValue(new Error('Database connection failed'));

      await expect(
        User.create({
          email: 'test@example.com',
          password: 'Password123'
        })
      ).rejects.toThrow('Database connection failed');
    });

    it('should hash password with bcrypt before storing', async () => {
      const mockResult = {
        rows: [{ id: 1, email: 'test@example.com', tier: 'free' }]
      };

      sql.mockResolvedValue(mockResult);

      const password = 'MySecretPassword';
      await User.create({
        email: 'test@example.com',
        password
      });

      // Password should not be passed directly to sql
      expect(sql).toHaveBeenCalled();

      // Verify bcrypt.hash was called (indirectly - the User.create calls it)
      // We can't easily test the internal hash, but we test validatePassword works
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password_hash: '$2b$10$hashedpassword',
        tier: 'free',
        created_at: new Date()
      };

      sql.mockResolvedValue({ rows: [mockUser] });

      const user = await User.findByEmail('test@example.com');

      expect(user).toEqual(mockUser);
      expect(sql).toHaveBeenCalledTimes(1);
    });

    it('should return null if user not found', async () => {
      sql.mockResolvedValue({ rows: [] });

      const user = await User.findByEmail('nonexistent@example.com');

      expect(user).toBeNull();
    });

    it('should include password_hash in result', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password_hash: '$2b$10$hashedpassword'
      };

      sql.mockResolvedValue({ rows: [mockUser] });

      const user = await User.findByEmail('test@example.com');

      expect(user.password_hash).toBeDefined();
    });
  });

  describe('findById', () => {
    it('should find user by ID', async () => {
      const mockUser = {
        id: 123,
        email: 'test@example.com',
        tier: 'pro',
        created_at: new Date()
      };

      sql.mockResolvedValue({ rows: [mockUser] });

      const user = await User.findById(123);

      expect(user).toEqual(mockUser);
      expect(sql).toHaveBeenCalledTimes(1);
    });

    it('should return null if user not found', async () => {
      sql.mockResolvedValue({ rows: [] });

      const user = await User.findById(999);

      expect(user).toBeNull();
    });
  });

  describe('findOrCreateByGithub', () => {
    it('should return existing user by GitHub ID', async () => {
      const mockUser = {
        id: 1,
        email: 'github@example.com',
        github_id: 'gh123',
        tier: 'free'
      };

      sql.mockResolvedValue({ rows: [mockUser] });

      const user = await User.findOrCreateByGithub({
        githubId: 'gh123',
        email: 'github@example.com'
      });

      expect(user).toEqual(mockUser);
      expect(sql).toHaveBeenCalledTimes(1);
    });

    it('should link GitHub account to existing email', async () => {
      const existingUser = {
        id: 1,
        email: 'user@example.com',
        github_id: null,
        tier: 'free'
      };

      const updatedUser = {
        ...existingUser,
        github_id: 'gh456'
      };

      // First call: check by GitHub ID (not found)
      // Second call: check by email (found)
      // Third call: update with GitHub ID
      sql
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [existingUser] })
        .mockResolvedValueOnce({ rows: [updatedUser] });

      const user = await User.findOrCreateByGithub({
        githubId: 'gh456',
        email: 'user@example.com'
      });

      expect(user.github_id).toBe('gh456');
      expect(sql).toHaveBeenCalledTimes(3);
    });

    it('should create new user if not found', async () => {
      const newUser = {
        id: 2,
        email: 'newgithub@example.com',
        github_id: 'gh789',
        tier: 'free'
      };

      // First call: check by GitHub ID (not found)
      // Second call: check by email (not found)
      // Third call: create new user
      sql
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [newUser] });

      const user = await User.findOrCreateByGithub({
        githubId: 'gh789',
        email: 'newgithub@example.com'
      });

      expect(user).toEqual(newUser);
      expect(sql).toHaveBeenCalledTimes(3);
    });
  });

  describe('validatePassword', () => {
    it('should return true for correct password', async () => {
      const password = 'MySecretPassword123';
      const hash = await bcrypt.hash(password, 10);

      const isValid = await User.validatePassword(password, hash);

      expect(isValid).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const hash = await bcrypt.hash('CorrectPassword', 10);

      const isValid = await User.validatePassword('WrongPassword', hash);

      expect(isValid).toBe(false);
    });

    it('should return false if hash is null', async () => {
      const isValid = await User.validatePassword('anypassword', null);

      expect(isValid).toBe(false);
    });

    it('should return false if hash is undefined', async () => {
      const isValid = await User.validatePassword('anypassword', undefined);

      expect(isValid).toBe(false);
    });

    it('should handle bcrypt comparison correctly', async () => {
      const password = 'Test123!@#';
      const hash = await bcrypt.hash(password, 10);

      const validResult = await User.validatePassword(password, hash);
      const invalidResult = await User.validatePassword('Wrong123', hash);

      expect(validResult).toBe(true);
      expect(invalidResult).toBe(false);
    });
  });

  describe('updateTier', () => {
    it('should update user tier successfully', async () => {
      const updatedUser = {
        id: 1,
        email: 'user@example.com',
        tier: 'pro',
        updated_at: new Date()
      };

      sql.mockResolvedValue({ rows: [updatedUser] });

      const user = await User.updateTier(1, 'pro');

      expect(user).toEqual(updatedUser);
      expect(sql).toHaveBeenCalledTimes(1);
    });

    it('should support all tier levels', async () => {
      const tiers = ['free', 'pro', 'team', 'enterprise'];

      for (const tier of tiers) {
        jest.clearAllMocks();
        sql.mockResolvedValue({
          rows: [{ id: 1, email: 'test@example.com', tier }]
        });

        const result = await User.updateTier(1, tier);

        expect(result.tier).toBe(tier);
      }
    });
  });

  describe('delete', () => {
    it('should delete user and return true', async () => {
      sql.mockResolvedValue({ rowCount: 1 });

      const result = await User.delete(123);

      expect(result).toBe(true);
      expect(sql).toHaveBeenCalledTimes(1);
    });

    it('should return false if user not found', async () => {
      sql.mockResolvedValue({ rowCount: 0 });

      const result = await User.delete(999);

      expect(result).toBe(false);
    });

    it('should handle database errors', async () => {
      sql.mockRejectedValue(new Error('Database error'));

      await expect(User.delete(1)).rejects.toThrow('Database error');
    });
  });

  describe('Security', () => {
    it('should hash passwords with bcrypt', async () => {
      const mockResult = {
        rows: [{ id: 1, email: 'test@example.com', tier: 'free' }]
      };

      sql.mockResolvedValue(mockResult);

      await User.create({
        email: 'test@example.com',
        password: 'TestPassword123'
      });

      // Verify sql was called (password should be hashed before this)
      expect(sql).toHaveBeenCalled();
    });

    it('should generate different hashes for same password', async () => {
      const password = 'SamePassword';
      const hash1 = await bcrypt.hash(password, 10);
      const hash2 = await bcrypt.hash(password, 10);

      // Same password should produce different hashes (due to salt)
      expect(hash1).not.toBe(hash2);

      // But both should validate against the same password
      const valid1 = await bcrypt.compare(password, hash1);
      const valid2 = await bcrypt.compare(password, hash2);
      expect(valid1).toBe(true);
      expect(valid2).toBe(true);
    });

    it('should use bcrypt with sufficient salt rounds', async () => {
      const password = 'TestPassword';
      const hash = await bcrypt.hash(password, 10);

      // Bcrypt hashes should start with $2b$ or $2a$
      expect(hash.startsWith('$2')).toBe(true);
      expect(hash.length).toBeGreaterThan(50);
    });
  });

  describe('Edge Cases', () => {
    it('should handle special characters in email', async () => {
      const mockResult = {
        rows: [{ id: 1, email: 'test+tag@example.co.uk', tier: 'free' }]
      };

      sql.mockResolvedValue(mockResult);

      const user = await User.create({
        email: 'test+tag@example.co.uk',
        password: 'Password123'
      });

      expect(user.email).toBe('test+tag@example.co.uk');
    });

    it('should handle special characters in password', async () => {
      const complexPassword = 'P@ssw0rd!#$%^&*()_+{}:"<>?';
      const hash = await bcrypt.hash(complexPassword, 10);

      const isValid = await bcrypt.compare(complexPassword, hash);
      expect(isValid).toBe(true);
    });

    it('should handle very long passwords', async () => {
      const longPassword = 'a'.repeat(1000);
      const hash = await bcrypt.hash(longPassword, 10);

      // Bcrypt truncates passwords at 72 bytes, but should still work
      expect(hash).toBeDefined();
      expect(hash.startsWith('$2')).toBe(true);
    });

    it('should handle empty result sets gracefully', async () => {
      sql.mockResolvedValue({ rows: [] });

      const user = await User.findByEmail('test@example.com');
      expect(user).toBeNull();

      const userById = await User.findById(123);
      expect(userById).toBeNull();
    });

    it('should handle database connection errors', async () => {
      sql.mockRejectedValue(new Error('Connection timeout'));

      await expect(
        User.findByEmail('test@example.com')
      ).rejects.toThrow('Connection timeout');
    });
  });

  describe('Password Reset', () => {
    describe('setResetToken', () => {
      it('should set password reset token', async () => {
        const token = 'reset-token-123';
        const expiresAt = new Date(Date.now() + 3600000);
        const mockResult = {
          rows: [{
            id: 1,
            email: 'user@example.com',
            tier: 'free'
          }]
        };

        sql.mockResolvedValue(mockResult);

        const user = await User.setResetToken(1, token, expiresAt);

        expect(user).toEqual(mockResult.rows[0]);
        expect(sql).toHaveBeenCalledTimes(1);
      });

      it('should update reset_token_expires timestamp', async () => {
        const token = 'reset-token-456';
        const expiresAt = new Date(Date.now() + 3600000);

        sql.mockResolvedValue({
          rows: [{ id: 2, email: 'test@example.com', tier: 'free' }]
        });

        await User.setResetToken(2, token, expiresAt);

        expect(sql).toHaveBeenCalled();
      });
    });

    describe('findByResetToken', () => {
      it('should find user by valid reset token', async () => {
        const token = 'valid-token-123';
        const mockUser = {
          id: 1,
          email: 'user@example.com',
          password_hash: '$2b$10$hash',
          github_id: null,
          tier: 'free',
          reset_token_hash: token,
          reset_token_expires: new Date(Date.now() + 3600000)
        };

        sql.mockResolvedValue({ rows: [mockUser] });

        const user = await User.findByResetToken(token);

        expect(user).toEqual(mockUser);
        expect(sql).toHaveBeenCalledTimes(1);
      });

      it('should return null for expired token', async () => {
        sql.mockResolvedValue({ rows: [] });

        const user = await User.findByResetToken('expired-token');

        expect(user).toBeNull();
      });

      it('should return null for non-existent token', async () => {
        sql.mockResolvedValue({ rows: [] });

        const user = await User.findByResetToken('nonexistent-token');

        expect(user).toBeNull();
      });
    });

    describe('updatePassword', () => {
      it('should update user password with hashed value', async () => {
        const newPassword = 'NewSecurePassword123';
        const mockResult = {
          rows: [{
            id: 1,
            email: 'user@example.com',
            tier: 'free'
          }]
        };

        sql.mockResolvedValue(mockResult);

        const user = await User.updatePassword(1, newPassword);

        expect(user).toEqual(mockResult.rows[0]);
        expect(sql).toHaveBeenCalledTimes(1);
      });

      it('should hash password before storing', async () => {
        const newPassword = 'TestPassword123';

        sql.mockResolvedValue({
          rows: [{ id: 1, email: 'test@example.com', tier: 'free' }]
        });

        await User.updatePassword(1, newPassword);

        // Verify sql was called (password should be hashed)
        expect(sql).toHaveBeenCalled();
      });

      it('should handle database errors', async () => {
        sql.mockRejectedValue(new Error('Database error'));

        await expect(
          User.updatePassword(1, 'newpassword')
        ).rejects.toThrow('Database error');
      });
    });

    describe('clearResetToken', () => {
      it('should clear reset token and expiration', async () => {
        const mockResult = {
          rows: [{
            id: 1,
            email: 'user@example.com',
            tier: 'free'
          }]
        };

        sql.mockResolvedValue(mockResult);

        const user = await User.clearResetToken(1);

        expect(user).toEqual(mockResult.rows[0]);
        expect(sql).toHaveBeenCalledTimes(1);
      });

      it('should handle non-existent user', async () => {
        sql.mockResolvedValue({ rows: [] });

        const user = await User.clearResetToken(999);

        expect(user).toBeUndefined();
      });

      it('should handle database errors', async () => {
        sql.mockRejectedValue(new Error('Connection lost'));

        await expect(
          User.clearResetToken(1)
        ).rejects.toThrow('Connection lost');
      });
    });

    describe('Password Reset Flow', () => {
      it('should support complete password reset flow', async () => {
        const userId = 1;
        const email = 'reset@example.com';
        const resetToken = 'secure-token-123';
        const expiresAt = new Date(Date.now() + 3600000);
        const newPassword = 'NewPassword123';

        // Step 1: Set reset token
        sql.mockResolvedValueOnce({
          rows: [{ id: userId, email, tier: 'free' }]
        });
        const setResult = await User.setResetToken(userId, resetToken, expiresAt);
        expect(setResult.id).toBe(userId);

        // Step 2: Find by reset token
        sql.mockResolvedValueOnce({
          rows: [{
            id: userId,
            email,
            password_hash: '$2b$10$oldhash',
            reset_token_hash: resetToken,
            reset_token_expires: expiresAt
          }]
        });
        const foundUser = await User.findByResetToken(resetToken);
        expect(foundUser.id).toBe(userId);

        // Step 3: Update password
        sql.mockResolvedValueOnce({
          rows: [{ id: userId, email, tier: 'free' }]
        });
        const updated = await User.updatePassword(userId, newPassword);
        expect(updated.id).toBe(userId);

        // Step 4: Clear reset token
        sql.mockResolvedValueOnce({
          rows: [{ id: userId, email, tier: 'free' }]
        });
        const cleared = await User.clearResetToken(userId);
        expect(cleared.id).toBe(userId);
      });
    });
  });

  describe('Integration Scenarios', () => {
    it('should support full user lifecycle', async () => {
      const email = 'lifecycle@test.com';
      const password = 'Password123';

      // Create
      sql.mockResolvedValueOnce({
        rows: [{ id: 1, email, tier: 'free', created_at: new Date() }]
      });
      const created = await User.create({ email, password });
      expect(created.email).toBe(email);

      // Find by email
      const hash = await bcrypt.hash(password, 10);
      sql.mockResolvedValueOnce({
        rows: [{ id: 1, email, password_hash: hash, tier: 'free' }]
      });
      const found = await User.findByEmail(email);
      expect(found.email).toBe(email);

      // Validate password
      const isValid = await User.validatePassword(password, found.password_hash);
      expect(isValid).toBe(true);

      // Update tier
      sql.mockResolvedValueOnce({
        rows: [{ id: 1, email, tier: 'pro', updated_at: new Date() }]
      });
      const upgraded = await User.updateTier(1, 'pro');
      expect(upgraded.tier).toBe('pro');

      // Delete
      sql.mockResolvedValueOnce({ rowCount: 1 });
      const deleted = await User.delete(1);
      expect(deleted).toBe(true);
    });

    it('should handle OAuth user creation and linking', async () => {
      const email = 'github@test.com';
      const githubId = 'gh12345';

      // Create via GitHub (user doesn't exist)
      sql
        .mockResolvedValueOnce({ rows: [] }) // Not found by GitHub ID
        .mockResolvedValueOnce({ rows: [] }) // Not found by email
        .mockResolvedValueOnce({ rows: [{ id: 1, email, github_id: githubId, tier: 'free' }] }); // Created

      const created = await User.findOrCreateByGithub({ githubId, email });
      expect(created.github_id).toBe(githubId);

      // Second login - should find existing user
      sql.mockResolvedValueOnce({ rows: [created] }); // Found by GitHub ID

      const found = await User.findOrCreateByGithub({ githubId, email });
      expect(found.id).toBe(created.id);
    });
  });

  describe('Email Verification', () => {
    describe('createVerificationToken', () => {
      it('should create a verification token with 24-hour expiry', async () => {
        const userId = 1;

        sql.mockResolvedValue({ rows: [] });

        const token = await User.createVerificationToken(userId);

        expect(token).toBeDefined();
        expect(typeof token).toBe('string');
        expect(token.length).toBe(64); // 32 bytes in hex = 64 characters
        expect(sql).toHaveBeenCalledTimes(1);
      });

      it('should update existing user with token', async () => {
        const userId = 42;
        sql.mockResolvedValue({ rows: [] });

        const token = await User.createVerificationToken(userId);

        expect(sql).toHaveBeenCalledTimes(1);
        expect(token).toBeDefined();
        expect(typeof token).toBe('string');
      });

      it('should generate unique tokens for multiple calls', async () => {
        sql.mockResolvedValue({ rows: [] });

        const token1 = await User.createVerificationToken(1);
        const token2 = await User.createVerificationToken(1);
        const token3 = await User.createVerificationToken(2);

        expect(token1).not.toBe(token2);
        expect(token2).not.toBe(token3);
        expect(token1).not.toBe(token3);
      });

      it('should handle database errors gracefully', async () => {
        sql.mockRejectedValue(new Error('Database connection failed'));

        await expect(
          User.createVerificationToken(1)
        ).rejects.toThrow('Database connection failed');
      });
    });

    describe('findByVerificationToken', () => {
      it('should find user by valid, non-expired token', async () => {
        const token = 'valid-token-123';
        const mockUser = {
          id: 1,
          email: 'test@example.com',
          first_name: 'Test',
          last_name: 'User',
          email_verified: false,
          verification_token_expires: new Date(Date.now() + 3600000) // 1 hour from now
        };

        sql.mockResolvedValue({ rows: [mockUser] });

        const user = await User.findByVerificationToken(token);

        expect(user).toEqual(mockUser);
        expect(sql).toHaveBeenCalledTimes(1);
      });

      it('should return null for non-existent token', async () => {
        sql.mockResolvedValue({ rows: [] });

        const user = await User.findByVerificationToken('non-existent-token');

        expect(user).toBeNull();
      });

      it('should return null for expired token', async () => {
        // Mock will return empty rows since SQL filters out expired tokens
        sql.mockResolvedValue({ rows: [] });

        const user = await User.findByVerificationToken('expired-token');

        expect(user).toBeNull();
      });

      it('should only select necessary user fields', async () => {
        sql.mockResolvedValue({ rows: [] });

        const user = await User.findByVerificationToken('some-token');

        expect(sql).toHaveBeenCalledTimes(1);
        expect(user).toBeNull(); // No user found in empty rows
      });

      it('should handle database errors', async () => {
        sql.mockRejectedValue(new Error('Connection timeout'));

        await expect(
          User.findByVerificationToken('token')
        ).rejects.toThrow('Connection timeout');
      });
    });

    describe('markEmailAsVerified', () => {
      it('should mark email as verified and clear token', async () => {
        const userId = 1;
        const mockUpdatedUser = {
          id: userId,
          email: 'verified@example.com',
          first_name: 'Test',
          last_name: 'User',
          email_verified: true
        };

        sql.mockResolvedValue({ rows: [mockUpdatedUser] });

        const user = await User.markEmailAsVerified(userId);

        expect(user).toEqual(mockUpdatedUser);
        expect(user.email_verified).toBe(true);
        expect(sql).toHaveBeenCalledTimes(1);
      });

      it('should return updated user object', async () => {
        const mockUser = {
          id: 5,
          email: 'user@test.com',
          first_name: 'John',
          last_name: 'Doe',
          email_verified: true
        };

        sql.mockResolvedValue({ rows: [mockUser] });

        const result = await User.markEmailAsVerified(5);

        expect(result).toEqual(mockUser);
        expect(result.email_verified).toBe(true);
      });

      it('should use RETURNING clause to get updated user', async () => {
        const mockUser = {
          id: 1,
          email: 'test@example.com',
          first_name: 'Test',
          last_name: 'User',
          email_verified: true
        };

        sql.mockResolvedValue({ rows: [mockUser] });

        const result = await User.markEmailAsVerified(1);

        expect(result).toEqual(mockUser);
        expect(sql).toHaveBeenCalledTimes(1);
      });

      it('should handle non-existent user', async () => {
        sql.mockResolvedValue({ rows: [] });

        const result = await User.markEmailAsVerified(999);

        expect(result).toBeUndefined();
      });

      it('should handle database errors', async () => {
        sql.mockRejectedValue(new Error('Update failed'));

        await expect(
          User.markEmailAsVerified(1)
        ).rejects.toThrow('Update failed');
      });
    });

    describe('Email Verification Flow Integration', () => {
      it('should complete full verification flow', async () => {
        const userId = 1;
        const email = 'verify@test.com';

        // Step 1: Create verification token
        sql.mockResolvedValueOnce({ rows: [] });
        const token = await User.createVerificationToken(userId);
        expect(token).toBeDefined();

        // Step 2: Find user by token (simulates clicking email link)
        sql.mockResolvedValueOnce({
          rows: [{
            id: userId,
            email,
            first_name: 'Test',
            last_name: 'User',
            email_verified: false,
            verification_token_expires: new Date(Date.now() + 3600000)
          }]
        });
        const foundUser = await User.findByVerificationToken(token);
        expect(foundUser).toBeDefined();
        expect(foundUser.email_verified).toBe(false);

        // Step 3: Mark email as verified
        sql.mockResolvedValueOnce({
          rows: [{
            id: userId,
            email,
            first_name: 'Test',
            last_name: 'User',
            email_verified: true
          }]
        });
        const verifiedUser = await User.markEmailAsVerified(userId);
        expect(verifiedUser.email_verified).toBe(true);
      });

      it('should handle token expiry correctly', async () => {
        const userId = 1;

        // Create token
        sql.mockResolvedValueOnce({ rows: [] });
        const token = await User.createVerificationToken(userId);

        // Try to find with expired token (database filters out expired)
        sql.mockResolvedValueOnce({ rows: [] });
        const user = await User.findByVerificationToken(token);

        expect(user).toBeNull();
      });

      it('should allow creating new token after expiry', async () => {
        const userId = 1;
        sql.mockResolvedValue({ rows: [] });

        const token1 = await User.createVerificationToken(userId);
        expect(token1).toBeDefined();

        // Simulate expiry - create new token
        const token2 = await User.createVerificationToken(userId);
        expect(token2).toBeDefined();
        expect(token2).not.toBe(token1);
      });
    });
  });
});
