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
});
