import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

/**
 * Interface for rate limit configuration
 */
export interface RateLimitConfig {
  limit: number;
  windowSec: number;
}

/**
 * Interface for tracking request counts per user
 */
interface UserRateLimit {
  count: number;
  resetTime: number;
}

/**
 * Type-safe storage for rate limit data
 */
type RateLimitStore = Map<string, UserRateLimit>;

/**
 * Get configuration from environment variables with fallbacks
 */
const getConfig = (): RateLimitConfig => {
  const limit = parseInt(process.env.RATE_LIMIT ?? '5', 10);
  const windowSec = parseInt(process.env.RATE_WINDOW_SEC ?? '60', 10);

  // Validate configuration values
  if (limit <= 0 || isNaN(limit)) {
    throw new Error('RATE_LIMIT must be a positive number');
  }
  if (windowSec <= 0 || isNaN(windowSec)) {
    throw new Error('RATE_WINDOW_SEC must be a positive number');
  }

  return { limit, windowSec };
};

/**
 * In-memory storage for rate limit data
 */
const rateLimitStore: RateLimitStore = new Map();

/**
 * Clear expired entries from the rate limit store
 */
const cleanupExpiredEntries = (): void => {
  const now = Date.now();
  for (const [userId, data] of rateLimitStore.entries()) {
    if (now > data.resetTime) {
      rateLimitStore.delete(userId);
    }
  }
};

/**
 * Get or create a user ID from the request
 * The user ID is stored in a request property for testing and tracking
 */
const getUserId = (req: Request, res: Response): string => {
  // Check if userId is already set (useful for testing)
  if ((req as any).userId) {
    return (req as any).userId;
  }

  // Check if userId is in cookies (for browser-based requests)
  const existingUserId = req.cookies?.userId;
  if (existingUserId) {
    (req as any).userId = existingUserId;
    return existingUserId;
  }

  // Generate new UUID v4 for new user and set cookie
  const userId = uuidv4();
  (req as any).userId = userId;
  
  // Set cookie for future requests (expires in 24 hours)
  res.cookie('userId', userId, { 
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    httpOnly: true,
    sameSite: 'lax'
  });
  
  return userId;
};

/**
 * Get remaining requests and reset time for a user
 */
const getUserRateLimitData = (
  userId: string,
  config: RateLimitConfig
): { remaining: number; resetIn: number } => {
  const now = Date.now();
  const userData = rateLimitStore.get(userId);

  if (!userData || now > userData.resetTime) {
    return { remaining: config.limit, resetIn: config.windowSec };
  }

  const remaining = Math.max(0, config.limit - userData.count);
  const resetIn = Math.ceil((userData.resetTime - now) / 1000);

  return { remaining, resetIn };
};

/**
 * Rate limiter middleware factory
 * Creates a middleware that enforces rate limiting per user
 */
export const createRateLimiterMiddleware = (
  customConfig?: Partial<RateLimitConfig>
) => {
  const baseConfig = getConfig();
  const config: RateLimitConfig = { ...baseConfig, ...customConfig };

  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Clean up expired entries periodically
      cleanupExpiredEntries();

      const userId = getUserId(req, res);
      const now = Date.now();
      const resetTime = now + config.windowSec * 1000;

      // Get or initialize user rate limit data
      let userData = rateLimitStore.get(userId);

      if (!userData || now > userData.resetTime) {
        userData = { count: 0, resetTime };
        rateLimitStore.set(userId, userData);
      }

      // Increment request count
      userData.count++;

      // Get rate limit info
      const { remaining, resetIn } = getUserRateLimitData(userId, config);

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', config.limit.toString());
      res.setHeader('X-RateLimit-Remaining', Math.max(0, remaining).toString());
      res.setHeader('X-RateLimit-Reset', resetIn.toString());

      // Check if limit exceeded
      if (userData.count > config.limit) {
        res.status(429).json({
          error: 'rate_limited',
          message: 'Too many requests, please try again later.',
        });
        return;
      }

      // Proceed to next middleware
      next();
    } catch (error) {
      // If there's an error in rate limiter, log it but allow request to proceed
      console.error('[RateLimiter] Error:', error);
      next();
    }
  };
};

/**
 * Get current rate limit statistics (useful for testing and monitoring)
 */
export const getRateLimitStats = (): {
  activeUsers: number;
  totalEntries: number;
} => {
  cleanupExpiredEntries();
  return {
    activeUsers: rateLimitStore.size,
    totalEntries: rateLimitStore.size,
  };
};

/**
 * Reset rate limit for a specific user (useful for testing)
 */
export const resetUserRateLimit = (userId: string): void => {
  rateLimitStore.delete(userId);
};

/**
 * Reset all rate limits (useful for testing)
 */
export const resetAllRateLimits = (): void => {
  rateLimitStore.clear();
};
