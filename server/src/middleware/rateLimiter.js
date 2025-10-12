import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per window
  message: {
    error: 'Rate limit exceeded',
    message: 'Too many requests. Please try again in 60 seconds.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Apply to routes
app.use('/api/', apiLimiter);