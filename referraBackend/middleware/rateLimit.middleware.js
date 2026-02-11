import rateLimit from "express-rate-limit";

/**
 * Generic rate limiter
 */
export const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, 
});

export const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, 
  max: 10, 
})