/**
 * Application Constants
 */

export const DEFAULT_RATE_LIMIT = 5;
export const DEFAULT_RATE_WINDOW_SEC = 60;

export const ERROR_MESSAGES = {
  RATE_LIMITED: 'Too many requests, please try again later.',
  INVALID_CONFIG: 'Invalid configuration provided.',
  NOT_FOUND: 'The requested resource was not found.',
  INTERNAL_ERROR: 'An unexpected error occurred.',
} as const;

export const ERROR_CODES = {
  RATE_LIMITED: 'rate_limited',
  NOT_FOUND: 'not_found',
  INTERNAL_ERROR: 'internal_server_error',
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
} as const;

export const HEADER_NAMES = {
  RATE_LIMIT: 'X-RateLimit-Limit',
  RATE_LIMIT_REMAINING: 'X-RateLimit-Remaining',
  RATE_LIMIT_RESET: 'X-RateLimit-Reset',
} as const;

export const LOG_PREFIXES = {
  SERVER: '[Server]',
  RATE_LIMITER: '[RateLimiter]',
  ERROR_HANDLER: '[Error Handler]',
} as const;
