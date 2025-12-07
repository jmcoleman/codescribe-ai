import express from 'express';
import multer from 'multer';
import path from 'path';
import docGenerator from '../services/docGenerator.js';
import { apiLimiter, generationLimiter } from '../middleware/rateLimiter.js';
import { rateLimitBypass } from '../middleware/rateLimitBypass.js';
import { checkUsage, incrementUsage, requireFeature } from '../middleware/tierGate.js';
import Usage from '../models/Usage.js';
import User from '../models/User.js';
import emailService from '../services/emailService.js';
import { TIER_FEATURES, TIER_PRICING } from '../config/tiers.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import githubService from '../services/githubService.js';
import { getDocTypeOptions } from '../prompts/docTypeConfig.js';

const router = express.Router();

// Helper function to format bytes
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// API root endpoint - provides API metadata and documentation
router.get('/', (req, res) => {
  const ENABLE_AUTH = process.env.ENABLE_AUTH === 'true';

  res.json({
    name: 'CodeScribe AI API',
    version: '2.7.10',
    status: 'operational',
    description: 'AI-powered code documentation generator',
    documentation: 'https://github.com/jmcoleman/codescribe-ai/blob/main/docs/api/API-Reference.md',
    endpoints: {
      health: {
        path: '/api/health',
        method: 'GET',
        description: 'Health check endpoint'
      },
      generate: {
        path: '/api/generate',
        method: 'POST',
        description: 'Generate documentation (non-streaming)',
        authentication: false
      },
      generateStream: {
        path: '/api/generate-stream',
        method: 'POST',
        description: 'Generate documentation (streaming SSE)',
        authentication: false
      },
      upload: {
        path: '/api/upload',
        method: 'POST',
        description: 'Upload code file for documentation',
        authentication: false
      },
      ...(ENABLE_AUTH && {
        auth: {
          path: '/api/auth/*',
          methods: ['POST', 'GET'],
          description: 'Authentication endpoints (signup, login, OAuth)',
          authentication: 'none'
        },
        payments: {
          path: '/api/payments/*',
          methods: ['GET', 'POST'],
          description: 'Subscription and payment management',
          authentication: 'required'
        },
        contact: {
          path: '/api/contact/*',
          methods: ['POST'],
          description: 'Contact sales and support',
          authentication: 'required'
        },
        legal: {
          path: '/api/legal/*',
          methods: ['GET', 'POST'],
          description: 'Legal documents and acceptance (GET /versions is public)',
          authentication: 'mixed'
        },
        admin: {
          path: '/api/admin/*',
          methods: ['GET'],
          description: 'Admin dashboard and analytics',
          authentication: 'admin-only'
        }
      })
    },
    features: {
      authentication: ENABLE_AUTH,
      streaming: true,
      rateLimiting: true,
      fileUpload: true,
      supportedLanguages: [
        'javascript', 'typescript', 'python', 'java', 'csharp',
        'cpp', 'go', 'rust', 'ruby', 'php', 'swift', 'kotlin',
        'scala', 'r', 'dart', 'shell', 'sql', 'html', 'css'
      ]
    },
    links: {
      website: 'https://codescribeai.com',
      github: 'https://github.com/jmcoleman/codescribe-ai',
      roadmap: 'https://jmcoleman.github.io/codescribe-ai/docs/roadmap/'
    }
  });
});

// Line 17 - add before route handler
router.post('/generate', optionalAuth, rateLimitBypass, apiLimiter, generationLimiter, checkUsage(), async (req, res) => {
  try {
    const { code, docType, language, isDefaultCode, filename } = req.body;

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

    // Build trial info for watermarking (if user is on trial)
    const trialInfo = req.user?.isOnTrial ? {
      isOnTrial: true,
      trialEndsAt: req.user.trialEndsAt
    } : null;

    const result = await docGenerator.generateDocumentation(code, {
      docType: docType || 'README',
      language: language || 'javascript',
      streaming: false,
      isDefaultCode: isDefaultCode === true, // Cache user message if this is default/example code
      userTier: req.user?.effectiveTier || 'free', // Pass effective tier for attribution (includes overrides)
      filename: filename || 'untitled', // Pass filename for title formatting
      trialInfo // Pass trial info for watermarking
    });

    // Track usage after successful generation
    const userIdentifier = req.user?.id || `ip:${req.ip || req.socket?.remoteAddress || 'unknown'}`;
    try {
      await incrementUsage(userIdentifier);
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
router.post('/generate-stream', optionalAuth, rateLimitBypass, apiLimiter, generationLimiter, checkUsage(), async (req, res) => {
  try {
    const { code, docType, language, isDefaultCode, filename } = req.body;

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

    const userTier = req.user?.effectiveTier || 'free';

    // Build trial info for watermarking (if user is on trial)
    const trialInfo = req.user?.isOnTrial ? {
      isOnTrial: true,
      trialEndsAt: req.user.trialEndsAt
    } : null;

    const result = await docGenerator.generateDocumentation(code, {
      docType: docType || 'README',
      language: language || 'javascript',
      streaming: true,
      isDefaultCode: isDefaultCode === true, // Cache user message if this is default/example code
      userTier, // Pass effective tier for attribution (includes overrides)
      filename: filename || 'untitled', // Pass filename for title formatting
      trialInfo, // Pass trial info for watermarking
      onChunk: (chunk) => {
        res.write(`data: ${JSON.stringify({
          type: 'chunk',
          content: chunk
        })}\n\n`);
      }
    });

    // Send tier-based attribution footer as a separate message type
    // The client will handle inserting it properly (closing any unclosed code blocks)
    const attribution = docGenerator.buildAttribution(userTier, trialInfo);
    if (attribution) {
      res.write(`data: ${JSON.stringify({
        type: 'attribution',
        content: attribution
      })}\n\n`);
    }

    // Track usage after successful generation
    const userIdentifier = req.user?.id || `ip:${req.ip || req.socket?.remoteAddress || 'unknown'}`;
    try {
      await incrementUsage(userIdentifier);
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
      '.kt', '.kts',                  // Kotlin
      '.swift',                       // Swift
      '.dart',                        // Dart
      '.sh', '.bash', '.zsh',        // Shell scripts
      '.gs',                          // Google Apps Script
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
router.get('/user/usage', optionalAuth, async (req, res) => {
  try {
    // Prevent caching of user-specific data
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    // Support both authenticated users and anonymous users
    const userIdentifier = req.user?.id || `ip:${req.ip || req.socket?.remoteAddress || 'unknown'}`;
    // Use effectiveTier to account for trials and admin overrides
    const tier = req.user?.effectiveTier || 'free';

    // Get usage from database
    const usage = await Usage.getUserUsage(userIdentifier);

    // Get tier limits
    const tierConfig = TIER_FEATURES[tier];

    if (!tierConfig) {
      throw new Error(`Invalid tier: ${tier}`);
    }

    const dailyLimit = tierConfig.dailyGenerations;
    const monthlyLimit = tierConfig.monthlyGenerations;

    // Calculate reset times
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // Check if user has a role that bypasses rate limits and usage warnings
    const shouldShowWarnings = !req.user || !User.canBypassRateLimits(req.user);

    const response = {
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
      },
      shouldShowWarnings // false for admin/support/super_admin, true for regular users
    };

    res.json(response);
  } catch (error) {
    console.error('[Usage] Failed to get user usage:', {
      message: error.message,
      stack: error.stack,
      tier: req.user?.tier,
      userId: req.user?.id
    });
    res.status(500).json({
      error: 'Failed to retrieve usage',
      message: error.message
    });
  }
});

// GET /api/user/tier-features - Get current user's tier and feature access
router.get('/user/tier-features', requireAuth, async (req, res) => {
  try {
    // Prevent caching of user-specific data
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

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

// GET /api/user/data-export - Export all user data (GDPR/CCPA compliance)
router.get('/user/data-export', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    console.log(`[Data Export] User ${userId} requested data export`);

    // Get complete user data export
    const exportData = await User.exportUserData(userId);

    // Set headers for JSON download
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `codescribe-ai-data-export-${timestamp}.json`;

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

    console.log(`[Data Export] Sending data export to user ${userId}`);
    res.json(exportData);
  } catch (error) {
    console.error('[Data Export] Failed:', error);
    res.status(500).json({
      error: 'Failed to export user data',
      message: error.message
    });
  }
});

// POST /api/user/delete-account - Schedule account for deletion (soft delete)
router.post('/user/delete-account', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { reason } = req.body;

    console.log(`[Account Deletion] User ${userId} requested account deletion`);

    // Schedule account for deletion (30-day grace period)
    const user = await User.scheduleForDeletion(userId, reason || null);

    // Send deletion scheduled email with restore link
    const userName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
    await emailService.sendDeletionScheduledEmail(
      user.email,
      userName,
      user.restore_token,
      user.deletion_scheduled_at
    );

    console.log(`[Account Deletion] Deletion scheduled for user ${userId} on ${user.deletion_scheduled_at}`);

    res.json({
      message: 'Account deletion scheduled successfully',
      deletion_date: user.deletion_scheduled_at,
      grace_period_days: 30
    });
  } catch (error) {
    console.error('[Account Deletion] Failed:', error);
    res.status(500).json({
      error: 'Failed to schedule account deletion',
      message: error.message
    });
  }
});

// POST /api/user/restore-account - Restore account (cancel scheduled deletion)
router.post('/user/restore-account', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        error: 'Restore token is required'
      });
    }

    console.log(`[Account Restore] Restore token received`);

    // Find user by restore token
    const user = await User.findByRestoreToken(token);

    if (!user) {
      return res.status(404).json({
        error: 'Invalid or expired restore token'
      });
    }

    // Restore account (cancel deletion)
    const restoredUser = await User.restoreAccount(user.id);

    // Send confirmation email
    const userName = `${restoredUser.first_name || ''} ${restoredUser.last_name || ''}`.trim();
    await emailService.sendAccountRestoredEmail(
      restoredUser.email,
      userName
    );

    console.log(`[Account Restore] Account restored for user ${user.id}`);

    res.json({
      message: 'Account restored successfully',
      email: restoredUser.email
    });
  } catch (error) {
    console.error('[Account Restore] Failed:', error);
    res.status(500).json({
      error: 'Failed to restore account',
      message: error.message
    });
  }
});

// ============================================================================
// GitHub Integration Endpoints
// ============================================================================

/**
 * Parse GitHub URL
 * POST /api/github/parse-url
 * Body: { url: string }
 * Returns: Parsed URL components or error
 */
router.post('/github/parse-url', apiLimiter, (req, res) => {
  try {
    const { url } = req.body;

    console.log('[GitHub] Parse URL request:', { url, type: typeof url });

    if (!url || typeof url !== 'string') {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'URL is required and must be a string'
      });
    }

    const parsed = githubService.parseGitHubUrl(url);

    if (!parsed) {
      console.log('[GitHub] Parse failed for URL:', url);
      return res.status(400).json({
        error: 'Invalid GitHub URL',
        message: `Could not parse URL: "${url}". Please provide a valid GitHub URL or owner/repo format`,
        examples: [
          'github.com/facebook/react/blob/main/README.md',
          'facebook/react',
          'https://github.com/vercel/next.js'
        ],
        received: url
      });
    }

    console.log('[GitHub] Successfully parsed:', parsed);

    res.json({
      success: true,
      ...parsed
    });
  } catch (error) {
    console.error('[GitHub] Parse URL error:', error);
    res.status(500).json({
      error: 'Failed to parse URL',
      message: error.message
    });
  }
});

/**
 * Fetch file from GitHub
 * POST /api/github/file
 * Body: { owner: string, repo: string, path: string, ref?: string }
 * Returns: File content and metadata
 */
router.post('/github/file', apiLimiter, async (req, res) => {
  try {
    const { owner, repo, path, ref } = req.body;

    // Validation
    if (!owner || !repo || !path) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'owner, repo, and path are required'
      });
    }

    if (typeof owner !== 'string' || typeof repo !== 'string' || typeof path !== 'string') {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'owner, repo, and path must be strings'
      });
    }

    const fileData = await githubService.fetchFile(owner, repo, path, ref);

    res.json({
      success: true,
      file: fileData
    });
  } catch (error) {
    console.error('[GitHub] Fetch file error:', error);

    // Handle different error types
    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: 'Not found',
        message: error.message
      });
    }

    if (error.message.includes('rate limit')) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: error.message
      });
    }

    if (error.message.includes('too large')) {
      return res.status(413).json({
        error: 'File too large',
        message: error.message
      });
    }

    if (error.message.includes('forbidden') || error.message.includes('private')) {
      return res.status(403).json({
        error: 'Access forbidden',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Failed to fetch file',
      message: error.message
    });
  }
});

/**
 * Fetch repository tree
 * POST /api/github/tree
 * Body: { owner: string, repo: string, ref?: string }
 * Returns: Repository tree structure
 */
router.post('/github/tree', apiLimiter, async (req, res) => {
  try {
    const { owner, repo, ref } = req.body;

    // Validation
    if (!owner || !repo) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'owner and repo are required'
      });
    }

    if (typeof owner !== 'string' || typeof repo !== 'string') {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'owner and repo must be strings'
      });
    }

    const treeData = await githubService.fetchTree(owner, repo, ref);

    res.json({
      success: true,
      repository: treeData
    });
  } catch (error) {
    console.error('[GitHub] Fetch tree error:', error);

    // Handle different error types
    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: 'Not found',
        message: error.message
      });
    }

    if (error.message.includes('rate limit')) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: error.message
      });
    }

    if (error.message.includes('forbidden') || error.message.includes('private')) {
      return res.status(403).json({
        error: 'Access forbidden',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Failed to fetch repository tree',
      message: error.message
    });
  }
});

/**
 * Fetch repository branches
 * POST /api/github/branches
 * Body: { owner: string, repo: string }
 * Returns: List of branches
 */
router.post('/github/branches', apiLimiter, async (req, res) => {
  try {
    const { owner, repo } = req.body;

    // Validation
    if (!owner || !repo) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'owner and repo are required'
      });
    }

    if (typeof owner !== 'string' || typeof repo !== 'string') {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'owner and repo must be strings'
      });
    }

    const branches = await githubService.fetchBranches(owner, repo);

    res.json({
      success: true,
      branches
    });
  } catch (error) {
    console.error('[GitHub] Fetch branches error:', error);

    // Handle different error types
    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: 'Not found',
        message: error.message
      });
    }

    if (error.message.includes('rate limit')) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: error.message
      });
    }

    if (error.message.includes('forbidden') || error.message.includes('private')) {
      return res.status(403).json({
        error: 'Access forbidden',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Failed to fetch branches',
      message: error.message
    });
  }
});

/**
 * Fetch multiple files in batch with parallel processing
 * POST /api/github/files-batch
 * Body: { owner: string, repo: string, paths: string[], branch: string }
 * Returns: Array of file results with success/error status for each
 *
 * Features:
 * - Tier-gated (Pro+ only)
 * - Respects tier-based batch limits
 * - Processes files in parallel batches of 5
 * - Returns partial success (some files may fail)
 */
router.post('/github/files-batch', requireAuth, apiLimiter, requireFeature('batchProcessing'), async (req, res) => {
  try {
    const { owner, repo, paths, branch = 'main' } = req.body;

    // Validation
    if (!owner || !repo || !paths) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'owner, repo, and paths are required'
      });
    }

    if (typeof owner !== 'string' || typeof repo !== 'string') {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'owner and repo must be strings'
      });
    }

    if (!Array.isArray(paths) || paths.length === 0) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'paths must be a non-empty array'
      });
    }

    if (paths.some(p => typeof p !== 'string')) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'all paths must be strings'
      });
    }

    // Check tier-based batch limit
    const userTier = req.user?.effectiveTier || 'free';

    const BATCH_LIMITS = {
      free: 1,
      starter: 1,
      pro: 20,
      team: 50,
      enterprise: 100
    };

    const maxFiles = BATCH_LIMITS[userTier] || 1;

    if (paths.length > maxFiles) {
      return res.status(400).json({
        error: 'Batch limit exceeded',
        message: `Your ${userTier} tier allows up to ${maxFiles} files per batch`,
        currentTier: userTier,
        maxFiles,
        requestedFiles: paths.length,
        upgradePath: '/pricing'
      });
    }

    // Process files in parallel batches of 5
    const PARALLEL_BATCH_SIZE = 5;
    const results = [];

    for (let i = 0; i < paths.length; i += PARALLEL_BATCH_SIZE) {
      const batch = paths.slice(i, i + PARALLEL_BATCH_SIZE);

      // Process batch in parallel
      const batchResults = await Promise.allSettled(
        batch.map(async (path) => {
          try {
            const fileData = await githubService.fetchFile(owner, repo, path, branch);
            return {
              success: true,
              path,
              data: fileData
            };
          } catch (error) {
            return {
              success: false,
              path,
              error: error.message
            };
          }
        })
      );

      // Collect results
      batchResults.forEach(result => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({
            success: false,
            path: batch[results.length % batch.length],
            error: result.reason?.message || 'Unknown error'
          });
        }
      });
    }

    // Count successes and failures
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    res.json({
      success: true,
      total: paths.length,
      successful: successCount,
      failed: failureCount,
      results
    });

  } catch (error) {
    console.error('[GitHub] Batch fetch error:', error);

    // Handle different error types
    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: 'Not found',
        message: error.message
      });
    }

    if (error.message.includes('rate limit')) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: error.message
      });
    }

    if (error.message.includes('forbidden') || error.message.includes('private')) {
      return res.status(403).json({
        error: 'Access forbidden',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Failed to fetch files',
      message: error.message
    });
  }
});

// ============================================================================
// Doc Types Configuration
// ============================================================================

router.get('/doc-types', (req, res) => {
  try {
    const docTypes = getDocTypeOptions(true); // Only active doc types
    res.json({
      success: true,
      docTypes,
      count: docTypes.length
    });
  } catch (error) {
    console.error('Error fetching doc types:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch doc types',
      message: error.message
    });
  }
});

// ============================================================================
// Health Check
// ============================================================================

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
