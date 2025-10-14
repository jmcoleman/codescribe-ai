import express from 'express';
import multer from 'multer';
import path from 'path';
import docGenerator from '../services/docGenerator.js';
import { apiLimiter, generationLimiter } from '../middleware/rateLimiter.js';

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
router.post('/generate', apiLimiter, generationLimiter, async (req, res) => {
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
router.post('/generate-stream', apiLimiter, generationLimiter, async (req, res) => { 
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
