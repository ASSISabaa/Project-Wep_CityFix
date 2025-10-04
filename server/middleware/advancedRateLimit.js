const rateLimit = require('express-rate-limit');

// Create rate limiter with memory store only (simpler approach)
const createRateLimiter = (options = {}) => {
  const defaultOptions = {
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        message: 'Too many requests. Please wait before trying again.',
        retryAfter: Math.ceil(options.windowMs / 1000)
      });
    }
  };

  return rateLimit({ ...defaultOptions, ...options });
};

// Different rate limits for different operations
const rateLimiters = {
  // Very strict for auth endpoints
  auth: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests per 15 minutes
    skipSuccessfulRequests: true
  }),

  // Moderate for general API calls
  api: createRateLimiter({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100 // increased from 60 to avoid 429 errors
  }),

  // Lenient for public endpoints
  public: createRateLimiter({
    windowMs: 1 * 60 * 1000,
    max: 200 // increased for public access
  }),

  // Strict for write operations
  write: createRateLimiter({
    windowMs: 1 * 60 * 1000,
    max: 30
  })
};

module.exports = rateLimiters;