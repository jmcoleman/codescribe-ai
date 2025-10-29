import express from 'express';
import multer from 'multer';
import path from 'path';
import docGenerator from '../services/docGenerator.js';
import { apiLimiter, generationLimiter } from '../middleware/rateLimiter.js';
import { checkUsage, incrementUsage } from '../middleware/tierGate.js';
import Usage from '../models/Usage.js';
import { TIER_FEATURES, TIER_PRICING } from '../config/tiers.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Helper function to format bytes
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Line 17 - add before route handler
router.post('/generate', apiLimiter, generationLimiter, checkUsage(), async (req, res) => {
  try {
    const { code, docType, language } = req.body;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Code is required and must be a string'
      });
    }

    if (code.length > 100000) {
      return res.status(400).json({
        error: 'Code too large',
        message: 'Maximum code length is 100,000 characters'
      });
    }

    const result = await docGenerator.generateDocumentation(code, {
      docType: docType || 'README',
      language: language || 'javascript',
      streaming: false
    });

    // Track usage after successful generation
    const userIdentifier = req.user?.id || `ip:${req.ip || req.socket?.remoteAddress || 'unknown'}`;
    try {
      await incrementUsage(userIdentifier);
      console.log(`[Usage] Incremented usage for ${req.user?.id ? `user ${req.user.id}` : `IP ${userIdentifier}`}`);
    } catch (usageError) {
      // Don't fail the request if usage tracking fails - just log it
      console.error('[Usage] Failed to increment usage:', usageError);
    }

    res.json(result);
  } catch (error) {
    console.error('Generate error:', error);
    res.status(500).json({
      error: 'Generation failed',
      message: error.message
    });
  }
});

// Line 51 - add before route handler
router.post('/generate-stream', apiLimiter, generationLimiter, checkUsage(), async (req, res) => { 
  try {
    const { code, docType, language } = req.body;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Code is required and must be a string'
      });
    }

    if (code.length > 100000) {
      return res.status(400).json({
        error: 'Code too large',
        message: 'Maximum code length is 100,000 characters'
      });
    }

    // Set up SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);

    const result = await docGenerator.generateDocumentation(code, {
      docType: docType || 'README',
      language: language || 'javascript',
      streaming: true,
      onChunk: (chunk) => {
        res.write(`data: ${JSON.stringify({
          type: 'chunk',
          content: chunk
        })}\n\n`);
      }
    });

    // Track usage after successful generation
    const userIdentifier = req.user?.id || `ip:${req.ip || req.socket?.remoteAddress || 'unknown'}`;
    try {
      await incrementUsage(userIdentifier);
      console.log(`[Usage] Incremented usage for ${req.user?.id ? `user ${req.user.id}` : `IP ${userIdentifier}`} (stream)`);
    } catch (usageError) {
      // Don't fail the request if usage tracking fails - just log it
      console.error('[Usage] Failed to increment usage:', usageError);
    }

    res.write(`data: ${JSON.stringify({
      type: 'complete',
      qualityScore: result.qualityScore,
      metadata: result.metadata
    })}\n\n`);

    res.end();
  } catch (error) {
    console.error('Stream error:', error);
    res.write(`data: ${JSON.stringify({
      type: 'error',
      error: error.message
    })}\n\n`);
    res.end();
  }
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 500 * 1024 // 500KB
  },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = [
      '.js', '.jsx', '.ts', '.tsx',  // JavaScript/TypeScript
      '.py',                          // Python
      '.java',                        // Java
      '.cpp', '.c', '.h', '.hpp',    // C/C++
      '.cs',                          // C#
      '.go',                          // Go
      '.rs',                          // Rust
      '.rb',                          // Ruby
      '.php',                         // PHP
      '.txt'                          // Plain text
    ];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed: ${allowedExtensions.join(', ')}`));
    }
  }
});

router.post('/upload', apiLimiter, (req, res) => {
  upload.single('file')(req, res, async (err) => {
    try {
      // Handle multer errors
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
              success: false,
              error: 'File too large',
              message: 'Maximum file size is 500KB'
            });
          }
          return res.status(400).json({
            success: false,
            error: 'Upload error',
            message: err.message
          });
        }
        // Handle custom filter errors
        return res.status(400).json({
          success: false,
          error: 'Invalid file type',
          message: err.message
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No file uploaded',
          message: 'Please select a file to upload'
        });
      }

      // Validate file is not empty
      if (req.file.size === 0) {
        return res.status(400).json({
          success: false,
          error: 'Empty file',
          message: 'The uploaded file is empty. Please upload a file with content.'
        });
      }

      // Convert buffer to string and validate content
      const content = req.file.buffer.toString('utf-8');

      // Additional validation: ensure content is not just whitespace
      if (!content.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Empty content',
          message: 'The uploaded file contains no meaningful content.'
        });
      }

      // Validate content length (same as code input validation)
      if (content.length > 100000) {
        return res.status(400).json({
          success: false,
          error: 'File content too large',
          message: 'Maximum file content is 100,000 characters'
        });
      }

      res.json({
        success: true,
        file: {
          name: req.file.originalname,
          size: req.file.size,
          sizeFormatted: formatBytes(req.file.size),
          extension: path.extname(req.file.originalname),
          mimetype: req.file.mimetype,
          content: content
        }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: 'Upload failed',
        message: error.message
      });
    }
  });
});

// GET /api/user/usage - Get current user's usage statistics
// Supports both authenticated users (by user ID) and anonymous users (by IP)
router.get('/user/usage', async (req, res) => {
  try {
    // Support both authenticated users and anonymous users
    const userIdentifier = req.user?.id || `ip:${req.ip || req.socket?.remoteAddress || 'unknown'}`;
    const tier = req.user?.tier || 'free';

    // Get usage from database
    const usage = await Usage.getUserUsage(userIdentifier);

    // Get tier limits
    const tierConfig = TIER_FEATURES[tier];
    const dailyLimit = tierConfig.dailyGenerations;
    const monthlyLimit = tierConfig.monthlyGenerations;

    // Calculate reset times
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    res.json({
      tier,
      daily: {
        used: usage.dailyGenerations,
        limit: dailyLimit,
        remaining: dailyLimit === -1 ? 'unlimited' : Math.max(0, dailyLimit - usage.dailyGenerations)
      },
      monthly: {
        used: usage.monthlyGenerations,
        limit: monthlyLimit,
        remaining: monthlyLimit === -1 ? 'unlimited' : Math.max(0, monthlyLimit - usage.monthlyGenerations)
      },
      resetTimes: {
        daily: tomorrow.toISOString(),
        monthly: nextMonth.toISOString()
      }
    });
  } catch (error) {
    console.error('[Usage] Failed to get user usage:', error);
    res.status(500).json({
      error: 'Failed to retrieve usage',
      message: error.message
    });
  }
});

// GET /api/user/tier-features - Get current user's tier and feature access
router.get('/user/tier-features', requireAuth, async (req, res) => {
  try {
    const tier = req.user.tier || 'free';
    const tierConfig = TIER_FEATURES[tier];

    // Map tier config to feature flags for frontend
    const features = {
      // Core features (all tiers have these in Free tier model)
      basicDocs: true,
      streaming: tierConfig.streaming,
      qualityScoring: tierConfig.qualityScoring,
      monacoEditor: tierConfig.monacoEditor,
      fileUpload: tierConfig.fileUpload,
      mermaidDiagrams: tierConfig.mermaidDiagrams,

      // Advanced features (tier-dependent)
      batchProcessing: tierConfig.batchProcessing,
      customTemplates: tierConfig.customTemplates,
      apiAccess: tierConfig.apiAccess,
      priorityQueue: tierConfig.priorityQueue,

      // Team features
      teamWorkspace: tierConfig.teamWorkspace || false,
      sharedTemplates: tierConfig.sharedTemplates || false,

      // Export formats
      exportMarkdown: tierConfig.exportFormats.includes('markdown'),
      exportHtml: tierConfig.exportFormats.includes('html'),
      exportPdf: tierConfig.exportFormats.includes('pdf'),
    };

    const limits = {
      maxFileSize: tierConfig.maxFileSize,
      dailyGenerations: tierConfig.dailyGenerations,
      monthlyGenerations: tierConfig.monthlyGenerations,
      maxUsers: tierConfig.maxUsers || 1
    };

    res.json({
      tier,
      features,
      limits,
      support: tierConfig.support,
      sla: tierConfig.sla
    });
  } catch (error) {
    console.error('[Tier] Failed to get tier features:', error);
    res.status(500).json({
      error: 'Failed to retrieve tier features',
      message: error.message
    });
  }
});

// GET /api/tiers - Get all tier definitions (public endpoint for pricing page)
router.get('/tiers', (req, res) => {
  try {
    const tiers = Object.keys(TIER_FEATURES).map(tierId => {
      const tierConfig = TIER_FEATURES[tierId];
      const pricing = TIER_PRICING[tierId];

      return {
        id: tierId,
        name: tierId.charAt(0).toUpperCase() + tierId.slice(1),
        price: pricing.price,
        period: pricing.period,
        annual: pricing.annual,
        description: pricing.description,
        startingAt: pricing.startingAt,
        limits: {
          maxFileSize: tierConfig.maxFileSize,
          dailyGenerations: tierConfig.dailyGenerations,
          monthlyGenerations: tierConfig.monthlyGenerations,
          maxUsers: tierConfig.maxUsers || 1
        },
        features: {
          // Document types
          documentTypes: tierConfig.documentTypes,

          // Core features
          streaming: tierConfig.streaming,
          qualityScoring: tierConfig.qualityScoring,
          monacoEditor: tierConfig.monacoEditor,
          fileUpload: tierConfig.fileUpload,
          mermaidDiagrams: tierConfig.mermaidDiagrams,

          // Advanced features
          batchProcessing: tierConfig.batchProcessing,
          customTemplates: tierConfig.customTemplates,
          priorityQueue: tierConfig.priorityQueue,
          exportFormats: tierConfig.exportFormats,
          apiAccess: tierConfig.apiAccess,

          // Team features
          teamWorkspace: tierConfig.teamWorkspace || false,
          sharedTemplates: tierConfig.sharedTemplates || false,
          versionHistory: tierConfig.versionHistory || false,
          usageAnalytics: tierConfig.usageAnalytics || false,

          // Enterprise features
          ssoSaml: tierConfig.ssoSaml || false,
          auditLogs: tierConfig.auditLogs || false,
          whiteLabel: tierConfig.whiteLabel || false,
          onPremise: tierConfig.onPremise || false
        },
        support: tierConfig.support,
        sla: tierConfig.sla
      };
    });

    res.json({ tiers });
  } catch (error) {
    console.error('[Tiers] Failed to get tiers:', error);
    res.status(500).json({
      error: 'Failed to retrieve tiers',
      message: error.message
    });
  }
});

router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

export default router;
