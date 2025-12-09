/**
 * Preferences Service Unit Tests
 *
 * Tests for user preferences and table preferences management.
 */

import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import { sql } from '@vercel/postgres';

// Mock @vercel/postgres
jest.mock('@vercel/postgres', () => ({
  sql: jest.fn()
}));

// Import after mocking
import {
  getPreferences,
  updatePreferences,
  deletePreferences,
  getTablePreferences,
  updateTablePreferences,
  getAllTablePreferences,
  deleteAllTablePreferences,
  deleteTablePreferences
} from '../preferencesService.js';

describe('PreferencesService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================================
  // Core Preferences Tests
  // ============================================================================

  describe('getPreferences', () => {
    test('should throw error if userId is not provided', async () => {
      await expect(getPreferences(null)).rejects.toThrow('User ID is required');
      await expect(getPreferences(undefined)).rejects.toThrow('User ID is required');
      await expect(getPreferences(0)).rejects.toThrow('User ID is required');
    });

    test('should return existing preferences', async () => {
      const mockRow = {
        user_id: 1,
        theme: 'dark',
        layout_mode: 'split',
        sidebar_collapsed: false,
        sidebar_width: 20,
        selected_project_id: 5,
        created_at: new Date('2025-01-01'),
        updated_at: new Date('2025-01-02')
      };

      sql.mockResolvedValueOnce({ rows: [mockRow] });

      const result = await getPreferences(1);

      expect(result).toEqual({
        userId: 1,
        theme: 'dark',
        layoutMode: 'split',
        sidebarCollapsed: false,
        sidebarWidth: 20,
        selectedProjectId: 5,
        createdAt: mockRow.created_at,
        updatedAt: mockRow.updated_at
      });
    });

    test('should create default preferences if none exist', async () => {
      const mockDefaultRow = {
        user_id: 1,
        theme: 'auto',
        layout_mode: 'split',
        sidebar_collapsed: false,
        sidebar_width: 20,
        selected_project_id: null,
        created_at: new Date(),
        updated_at: new Date()
      };

      // First query returns no results
      sql.mockResolvedValueOnce({ rows: [] });
      // Insert returns default row
      sql.mockResolvedValueOnce({ rows: [mockDefaultRow] });

      const result = await getPreferences(1);

      expect(result.theme).toBe('auto');
      expect(result.layoutMode).toBe('split');
      expect(result.sidebarCollapsed).toBe(false);
      expect(result.sidebarWidth).toBe(20);
      expect(result.selectedProjectId).toBeNull();
    });
  });

  describe('updatePreferences', () => {
    test('should throw error if userId is not provided', async () => {
      await expect(updatePreferences(null, {})).rejects.toThrow('User ID is required');
    });

    test('should throw error for invalid theme', async () => {
      await expect(updatePreferences(1, { theme: 'invalid' }))
        .rejects.toThrow('Invalid theme: invalid');
    });

    test('should throw error for invalid layout mode', async () => {
      await expect(updatePreferences(1, { layoutMode: 'invalid' }))
        .rejects.toThrow('Invalid layout mode: invalid');
    });

    test('should throw error for sidebar width out of range', async () => {
      await expect(updatePreferences(1, { sidebarWidth: 5 }))
        .rejects.toThrow('Invalid sidebar width: 5');
      await expect(updatePreferences(1, { sidebarWidth: 55 }))
        .rejects.toThrow('Invalid sidebar width: 55');
    });

    test('should throw error for non-numeric sidebar width', async () => {
      await expect(updatePreferences(1, { sidebarWidth: 'abc' }))
        .rejects.toThrow('Invalid sidebar width: abc');
    });

    test('should update preferences with valid values', async () => {
      const existingRow = {
        user_id: 1,
        theme: 'light',
        layout_mode: 'split',
        sidebar_collapsed: false,
        sidebar_width: 20,
        selected_project_id: null,
        created_at: new Date(),
        updated_at: new Date()
      };

      const updatedRow = {
        ...existingRow,
        theme: 'dark',
        layout_mode: 'code',
        updated_at: new Date()
      };

      // getPreferences call
      sql.mockResolvedValueOnce({ rows: [existingRow] });
      // update call
      sql.mockResolvedValueOnce({ rows: [updatedRow] });

      const result = await updatePreferences(1, { theme: 'dark', layoutMode: 'code' });

      expect(result.theme).toBe('dark');
      expect(result.layoutMode).toBe('code');
    });

    test('should handle setting selectedProjectId to null', async () => {
      const existingRow = {
        user_id: 1,
        theme: 'auto',
        layout_mode: 'split',
        sidebar_collapsed: false,
        sidebar_width: 20,
        selected_project_id: 5,
        created_at: new Date(),
        updated_at: new Date()
      };

      const updatedRow = {
        ...existingRow,
        selected_project_id: null
      };

      sql.mockResolvedValueOnce({ rows: [existingRow] });
      sql.mockResolvedValueOnce({ rows: [updatedRow] });

      const result = await updatePreferences(1, { selectedProjectId: null });

      expect(result.selectedProjectId).toBeNull();
    });

    test('should accept valid theme values', async () => {
      const themes = ['light', 'dark', 'auto'];

      for (const theme of themes) {
        const existingRow = {
          user_id: 1,
          theme: 'auto',
          layout_mode: 'split',
          sidebar_collapsed: false,
          sidebar_width: 20,
          selected_project_id: null,
          created_at: new Date(),
          updated_at: new Date()
        };

        sql.mockResolvedValueOnce({ rows: [existingRow] });
        sql.mockResolvedValueOnce({ rows: [{ ...existingRow, theme }] });

        const result = await updatePreferences(1, { theme });
        expect(result.theme).toBe(theme);
      }
    });

    test('should accept valid layout modes', async () => {
      const layouts = ['split', 'code', 'doc'];

      for (const layoutMode of layouts) {
        const existingRow = {
          user_id: 1,
          theme: 'auto',
          layout_mode: 'split',
          sidebar_collapsed: false,
          sidebar_width: 20,
          selected_project_id: null,
          created_at: new Date(),
          updated_at: new Date()
        };

        sql.mockResolvedValueOnce({ rows: [existingRow] });
        sql.mockResolvedValueOnce({ rows: [{ ...existingRow, layout_mode: layoutMode }] });

        const result = await updatePreferences(1, { layoutMode });
        expect(result.layoutMode).toBe(layoutMode);
      }
    });

    test('should accept valid sidebar width values', async () => {
      const widths = [10, 25, 50];

      for (const sidebarWidth of widths) {
        const existingRow = {
          user_id: 1,
          theme: 'auto',
          layout_mode: 'split',
          sidebar_collapsed: false,
          sidebar_width: 20,
          selected_project_id: null,
          created_at: new Date(),
          updated_at: new Date()
        };

        sql.mockResolvedValueOnce({ rows: [existingRow] });
        sql.mockResolvedValueOnce({ rows: [{ ...existingRow, sidebar_width: sidebarWidth }] });

        const result = await updatePreferences(1, { sidebarWidth });
        expect(result.sidebarWidth).toBe(sidebarWidth);
      }
    });
  });

  describe('deletePreferences', () => {
    test('should return false if userId is not provided', async () => {
      const result = await deletePreferences(null);
      expect(result).toBe(false);
    });

    test('should return true when preferences are deleted', async () => {
      sql.mockResolvedValueOnce({ rowCount: 1 });

      const result = await deletePreferences(1);

      expect(result).toBe(true);
    });

    test('should return false when no preferences exist', async () => {
      sql.mockResolvedValueOnce({ rowCount: 0 });

      const result = await deletePreferences(1);

      expect(result).toBe(false);
    });
  });

  // ============================================================================
  // Table Preferences Tests
  // ============================================================================

  describe('getTablePreferences', () => {
    test('should return null if userId is not provided', async () => {
      const result = await getTablePreferences(null, 'history');
      expect(result).toBeNull();
    });

    test('should return null if tableId is not provided', async () => {
      const result = await getTablePreferences(1, null);
      expect(result).toBeNull();
    });

    test('should return null if no preferences exist', async () => {
      sql.mockResolvedValueOnce({ rows: [] });

      const result = await getTablePreferences(1, 'history');

      expect(result).toBeNull();
    });

    test('should return table preferences', async () => {
      const mockRow = {
        user_id: 1,
        table_id: 'history',
        column_sizing: { filename: 200, docType: 150 },
        updated_at: new Date()
      };

      sql.mockResolvedValueOnce({ rows: [mockRow] });

      const result = await getTablePreferences(1, 'history');

      expect(result).toEqual({
        userId: 1,
        tableId: 'history',
        columnSizing: { filename: 200, docType: 150 },
        updatedAt: mockRow.updated_at
      });
    });

    test('should parse string column_sizing', async () => {
      const mockRow = {
        user_id: 1,
        table_id: 'history',
        column_sizing: '{"filename": 200}',
        updated_at: new Date()
      };

      sql.mockResolvedValueOnce({ rows: [mockRow] });

      const result = await getTablePreferences(1, 'history');

      expect(result.columnSizing).toEqual({ filename: 200 });
    });
  });

  describe('updateTablePreferences', () => {
    test('should throw error if userId is not provided', async () => {
      await expect(updateTablePreferences(null, 'history', {}))
        .rejects.toThrow('User ID is required');
    });

    test('should throw error if tableId is invalid', async () => {
      await expect(updateTablePreferences(1, '', {}))
        .rejects.toThrow('Valid table ID is required');
      await expect(updateTablePreferences(1, null, {}))
        .rejects.toThrow('Valid table ID is required');
      await expect(updateTablePreferences(1, 123, {}))
        .rejects.toThrow('Valid table ID is required');
    });

    test('should throw error if tableId is too long', async () => {
      const longTableId = 'a'.repeat(51);
      await expect(updateTablePreferences(1, longTableId, {}))
        .rejects.toThrow('Valid table ID is required');
    });

    test('should throw error if columnSizing is not an object', async () => {
      await expect(updateTablePreferences(1, 'history', { columnSizing: 'invalid' }))
        .rejects.toThrow('Column sizing must be an object');
      await expect(updateTablePreferences(1, 'history', { columnSizing: ['array'] }))
        .rejects.toThrow('Column sizing must be an object');
    });

    test('should upsert table preferences', async () => {
      const mockRow = {
        user_id: 1,
        table_id: 'history',
        column_sizing: { filename: 250 },
        updated_at: new Date()
      };

      sql.mockResolvedValueOnce({ rows: [mockRow] });

      const result = await updateTablePreferences(1, 'history', { columnSizing: { filename: 250 } });

      expect(result.tableId).toBe('history');
      expect(result.columnSizing).toEqual({ filename: 250 });
    });

    test('should use empty object for undefined columnSizing', async () => {
      const mockRow = {
        user_id: 1,
        table_id: 'history',
        column_sizing: {},
        updated_at: new Date()
      };

      sql.mockResolvedValueOnce({ rows: [mockRow] });

      const result = await updateTablePreferences(1, 'history', {});

      expect(result.columnSizing).toEqual({});
    });
  });

  describe('getAllTablePreferences', () => {
    test('should return empty object if userId is not provided', async () => {
      const result = await getAllTablePreferences(null);
      expect(result).toEqual({});
    });

    test('should return empty object if no table preferences exist', async () => {
      sql.mockResolvedValueOnce({ rows: [] });

      const result = await getAllTablePreferences(1);

      expect(result).toEqual({});
    });

    test('should return map of table preferences', async () => {
      const mockRows = [
        {
          user_id: 1,
          table_id: 'admin_users',
          column_sizing: { email: 250 },
          updated_at: new Date('2025-01-01')
        },
        {
          user_id: 1,
          table_id: 'history',
          column_sizing: { filename: 200 },
          updated_at: new Date('2025-01-02')
        }
      ];

      sql.mockResolvedValueOnce({ rows: mockRows });

      const result = await getAllTablePreferences(1);

      expect(Object.keys(result)).toEqual(['admin_users', 'history']);
      expect(result.history.columnSizing).toEqual({ filename: 200 });
      expect(result.admin_users.columnSizing).toEqual({ email: 250 });
    });
  });

  describe('deleteAllTablePreferences', () => {
    test('should return 0 if userId is not provided', async () => {
      const result = await deleteAllTablePreferences(null);
      expect(result).toBe(0);
    });

    test('should return count of deleted entries', async () => {
      sql.mockResolvedValueOnce({ rowCount: 3 });

      const result = await deleteAllTablePreferences(1);

      expect(result).toBe(3);
    });
  });

  describe('deleteTablePreferences', () => {
    test('should return false if userId is not provided', async () => {
      const result = await deleteTablePreferences(null, 'history');
      expect(result).toBe(false);
    });

    test('should return false if tableId is not provided', async () => {
      const result = await deleteTablePreferences(1, null);
      expect(result).toBe(false);
    });

    test('should return true when deleted', async () => {
      sql.mockResolvedValueOnce({ rowCount: 1 });

      const result = await deleteTablePreferences(1, 'history');

      expect(result).toBe(true);
    });

    test('should return false when not found', async () => {
      sql.mockResolvedValueOnce({ rowCount: 0 });

      const result = await deleteTablePreferences(1, 'nonexistent');

      expect(result).toBe(false);
    });
  });
});
