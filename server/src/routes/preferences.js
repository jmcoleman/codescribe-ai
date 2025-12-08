/**
 * Preferences API Routes
 *
 * Provides endpoints for user preferences management (cross-device sync).
 * Part of: User Preferences Consolidation (v3.3.0)
 *
 * Endpoints:
 * - GET    /api/preferences                 - Get user's core preferences
 * - PATCH  /api/preferences                 - Update core preferences (partial)
 * - GET    /api/preferences/tables          - Get all table preferences
 * - GET    /api/preferences/tables/:tableId - Get specific table preferences
 * - PATCH  /api/preferences/tables/:tableId - Update table preferences
 *
 * Access: All authenticated users (no tier gating)
 */

import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { apiLimiter } from '../middleware/rateLimiter.js';
import preferencesService from '../services/preferencesService.js';

const router = express.Router();

// ============================================================================
// GET /api/preferences - Get user's core preferences
// ============================================================================
router.get(
  '/',
  requireAuth,
  apiLimiter,
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const preferences = await preferencesService.getPreferences(userId);

      res.json({
        success: true,
        preferences: {
          theme: preferences.theme,
          layoutMode: preferences.layoutMode,
          sidebarCollapsed: preferences.sidebarCollapsed,
          sidebarWidth: preferences.sidebarWidth,
          selectedProjectId: preferences.selectedProjectId
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================================
// PATCH /api/preferences - Update core preferences (partial update)
// ============================================================================
router.patch(
  '/',
  requireAuth,
  apiLimiter,
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { theme, layoutMode, sidebarCollapsed, sidebarWidth, selectedProjectId } = req.body;

      // Ensure at least one field is being updated
      if (
        theme === undefined &&
        layoutMode === undefined &&
        sidebarCollapsed === undefined &&
        sidebarWidth === undefined &&
        selectedProjectId === undefined
      ) {
        return res.status(400).json({
          success: false,
          error: 'NO_UPDATES',
          message: 'At least one field must be provided for update'
        });
      }

      const preferences = await preferencesService.updatePreferences(userId, {
        theme,
        layoutMode,
        sidebarCollapsed,
        sidebarWidth,
        selectedProjectId
      });

      res.json({
        success: true,
        preferences: {
          theme: preferences.theme,
          layoutMode: preferences.layoutMode,
          sidebarCollapsed: preferences.sidebarCollapsed,
          sidebarWidth: preferences.sidebarWidth,
          selectedProjectId: preferences.selectedProjectId
        }
      });
    } catch (error) {
      // Handle validation errors from service
      if (error.message.includes('Invalid') || error.message.includes('Must be')) {
        return res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: error.message
        });
      }
      next(error);
    }
  }
);

// ============================================================================
// GET /api/preferences/tables - Get all table preferences
// ============================================================================
router.get(
  '/tables',
  requireAuth,
  apiLimiter,
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const tables = await preferencesService.getAllTablePreferences(userId);

      res.json({
        success: true,
        tables
      });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================================
// GET /api/preferences/tables/:tableId - Get specific table preferences
// ============================================================================
router.get(
  '/tables/:tableId',
  requireAuth,
  apiLimiter,
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { tableId } = req.params;

      if (!tableId || tableId.length > 50) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_TABLE_ID',
          message: 'Table ID is required and must be 50 characters or less'
        });
      }

      const preferences = await preferencesService.getTablePreferences(userId, tableId);

      if (!preferences) {
        // Return empty defaults instead of 404 - table may just not have prefs yet
        return res.json({
          success: true,
          tableId,
          preferences: {
            columnSizing: {}
          }
        });
      }

      res.json({
        success: true,
        tableId,
        preferences: {
          columnSizing: preferences.columnSizing,
          updatedAt: preferences.updatedAt
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================================
// PATCH /api/preferences/tables/:tableId - Update table preferences
// ============================================================================
router.patch(
  '/tables/:tableId',
  requireAuth,
  apiLimiter,
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { tableId } = req.params;
      const { columnSizing } = req.body;

      if (!tableId || tableId.length > 50) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_TABLE_ID',
          message: 'Table ID is required and must be 50 characters or less'
        });
      }

      // Ensure at least columnSizing is provided
      if (columnSizing === undefined) {
        return res.status(400).json({
          success: false,
          error: 'NO_UPDATES',
          message: 'columnSizing must be provided for update'
        });
      }

      const preferences = await preferencesService.updateTablePreferences(
        userId,
        tableId,
        { columnSizing }
      );

      res.json({
        success: true,
        tableId,
        preferences: {
          columnSizing: preferences.columnSizing,
          updatedAt: preferences.updatedAt
        }
      });
    } catch (error) {
      // Handle validation errors from service
      if (error.message.includes('Invalid') || error.message.includes('must be') || error.message.includes('required')) {
        return res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: error.message
        });
      }
      next(error);
    }
  }
);

export default router;
