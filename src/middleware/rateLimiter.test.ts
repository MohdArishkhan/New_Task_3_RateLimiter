import { Request, Response, NextFunction } from 'express';
import {
  createRateLimiterMiddleware,
  resetUserRateLimit,
  resetAllRateLimits,
  getRateLimitStats,
} from './rateLimiter';
import jest from 'jest'; // Import jest to fix the undeclared variable error

describe('Rate Limiter Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let jsonResponse: any;
  let statusCode: number;

  beforeEach(() => {
    // Reset rate limits before each test
    resetAllRateLimits();

    // Mock response object
    jsonResponse = null;
    statusCode = 200;

    mockRes = {
      status: (code: number) => {
        statusCode = code;
        return mockRes;
      },
      json: (data: any) => {
        jsonResponse = data;
        return mockRes;
      },
      setHeader: () => mockRes,
    };

    mockReq = {
      headers: {},
      cookies: {},
    };

    mockNext = jest.fn();
  });

  describe('Basic Rate Limiting', () => {
    it('should allow requests within the rate limit', () => {
      const middleware = createRateLimiterMiddleware({
        limit: 5,
        windowSec: 60,
      });

      for (let i = 0; i < 5; i++) {
        middleware(mockReq as Request, mockRes as Response, mockNext);
        expect(mockNext).toHaveBeenCalled();
      }
    });

    it('should reject requests exceeding the rate limit', () => {
      const middleware = createRateLimiterMiddleware({
        limit: 3,
        windowSec: 60,
      });

      // Make 3 allowed requests
      for (let i = 0; i < 3; i++) {
        mockNext.mockClear();
        middleware(mockReq as Request, mockRes as Response, mockNext);
        expect(mockNext).toHaveBeenCalled();
      }

      // 4th request should be rejected
      mockNext.mockClear();
      middleware(mockReq as Request, mockRes as Response, mockNext);
      expect(statusCode).toBe(429);
      expect(jsonResponse).toEqual({
        error: 'rate_limited',
        message: 'Too many requests, please try again later.',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return correct error response on rate limit exceeded', () => {
      const middleware = createRateLimiterMiddleware({
        limit: 1,
        windowSec: 60,
      });

      // First request succeeds
      middleware(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalled();

      // Second request fails
      mockNext.mockClear();
      middleware(mockReq as Request, mockRes as Response, mockNext);
      expect(statusCode).toBe(429);
      expect(jsonResponse.error).toBe('rate_limited');
      expect(jsonResponse.message).toContain('Too many requests');
    });
  });

  describe('Rate Limit Headers', () => {
    it('should set X-RateLimit-Limit header', () => {
      const middleware = createRateLimiterMiddleware({
        limit: 10,
        windowSec: 60,
      });
      const setHeaderMock = jest.fn();
      mockRes.setHeader = setHeaderMock;

      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(setHeaderMock).toHaveBeenCalledWith(
        'X-RateLimit-Limit',
        '10'
      );
    });

    it('should set X-RateLimit-Remaining header', () => {
      const middleware = createRateLimiterMiddleware({
        limit: 5,
        windowSec: 60,
      });
      const setHeaderMock = jest.fn();
      mockRes.setHeader = setHeaderMock;

      middleware(mockReq as Request, mockRes as Response, mockNext);

      const calls = setHeaderMock.mock.calls;
      const remainingCall = calls.find(
        (call) => call[0] === 'X-RateLimit-Remaining'
      );
      expect(remainingCall).toBeDefined();
      expect(remainingCall?.[1]).toBe('4'); // 5 - 1 request made
    });

    it('should set X-RateLimit-Reset header', () => {
      const middleware = createRateLimiterMiddleware({
        limit: 5,
        windowSec: 60,
      });
      const setHeaderMock = jest.fn();
      mockRes.setHeader = setHeaderMock;

      middleware(mockReq as Request, mockRes as Response, mockNext);

      const calls = setHeaderMock.mock.calls;
      const resetCall = calls.find(
        (call) => call[0] === 'X-RateLimit-Reset'
      );
      expect(resetCall).toBeDefined();
      expect(resetCall?.[1]).toBeDefined();
    });

    it('should decrement X-RateLimit-Remaining with each request', () => {
      const middleware = createRateLimiterMiddleware({
        limit: 5,
        windowSec: 60,
      });
      const setHeaderMock = jest.fn();
      mockRes.setHeader = setHeaderMock;

      // Make requests and check remaining count
      for (let i = 0; i < 3; i++) {
        setHeaderMock.mockClear();
        middleware(mockReq as Request, mockRes as Response, mockNext);

        const calls = setHeaderMock.mock.calls;
        const remainingCall = calls.find(
          (call) => call[0] === 'X-RateLimit-Remaining'
        );
        expect(remainingCall?.[1]).toBe(`${4 - i}`);
      }
    });
  });

  describe('User Identification', () => {
    it('should assign a userId to each user', () => {
      const middleware = createRateLimiterMiddleware({
        limit: 5,
        windowSec: 60,
      });

      middleware(mockReq as Request, mockRes as Response, mockNext);
      expect((mockReq as any).userId).toBeDefined();
      expect(typeof (mockReq as any).userId).toBe('string');
    });

    it('should use the same userId for multiple requests from same user', () => {
      const middleware = createRateLimiterMiddleware({
        limit: 5,
        windowSec: 60,
      });

      middleware(mockReq as Request, mockRes as Response, mockNext);
      const firstUserId = (mockReq as any).userId;

      mockNext.mockClear();
      middleware(mockReq as Request, mockRes as Response, mockNext);
      const secondUserId = (mockReq as any).userId;

      expect(firstUserId).toBe(secondUserId);
    });

    it('should assign different userIds to different users', () => {
      const middleware = createRateLimiterMiddleware({
        limit: 5,
        windowSec: 60,
      });

      const req1 = { headers: {}, cookies: {} } as any;
      const req2 = { headers: {}, cookies: {} } as any;

      middleware(req1 as Request, mockRes as Response, mockNext);
      middleware(req2 as Request, mockRes as Response, mockNext);

      expect(req1.userId).not.toBe(req2.userId);
    });
  });

  describe('Time Window Reset', () => {
    it('should reset count after time window expires', () => {
      jest.useFakeTimers();
      const middleware = createRateLimiterMiddleware({
        limit: 2,
        windowSec: 1,
      });

      // Make 2 requests (at limit)
      middleware(mockReq as Request, mockRes as Response, mockNext);
      mockNext.mockClear();
      middleware(mockReq as Request, mockRes as Response, mockNext);

      // 3rd request should fail
      mockNext.mockClear();
      middleware(mockReq as Request, mockRes as Response, mockNext);
      expect(statusCode).toBe(429);

      // Advance time beyond window
      jest.advanceTimersByTime(1100);

      // Now request should succeed
      statusCode = 200;
      mockNext.mockClear();
      middleware(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalled();
      expect(statusCode).toBe(200);

      jest.useRealTimers();
    });
  });

  describe('Configurable Limits', () => {
    it('should respect custom limit configuration', () => {
      const middleware = createRateLimiterMiddleware({
        limit: 2,
        windowSec: 60,
      });

      // Allow 2 requests
      middleware(mockReq as Request, mockRes as Response, mockNext);
      mockNext.mockClear();
      middleware(mockReq as Request, mockRes as Response, mockNext);

      // 3rd request should fail with custom limit of 2
      mockNext.mockClear();
      middleware(mockReq as Request, mockRes as Response, mockNext);
      expect(statusCode).toBe(429);
    });

    it('should respect custom time window configuration', () => {
      jest.useFakeTimers();
      const middleware = createRateLimiterMiddleware({
        limit: 1,
        windowSec: 2,
      });

      // Make first request
      middleware(mockReq as Request, mockRes as Response, mockNext);

      // Try second request immediately (should fail)
      mockNext.mockClear();
      middleware(mockReq as Request, mockRes as Response, mockNext);
      expect(statusCode).toBe(429);

      // Advance by 2.1 seconds
      jest.advanceTimersByTime(2100);

      // Now should succeed
      statusCode = 200;
      mockNext.mockClear();
      middleware(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalled();

      jest.useRealTimers();
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully and allow request to proceed', () => {
      const middleware = createRateLimiterMiddleware({
        limit: 5,
        windowSec: 60,
      });

      // Mock setHeader to throw error
      mockRes.setHeader = () => {
        throw new Error('Header error');
      };

      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation();

      middleware(mockReq as Request, mockRes as Response, mockNext);

      // Should still call next() even if error occurs
      expect(mockNext).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Statistics and Management', () => {
    it('should return correct rate limit statistics', () => {
      const middleware = createRateLimiterMiddleware({
        limit: 5,
        windowSec: 60,
      });

      const req1 = { headers: {}, cookies: {} } as any;
      const req2 = { headers: {}, cookies: {} } as any;

      middleware(req1 as Request, mockRes as Response, mockNext);
      middleware(req2 as Request, mockRes as Response, mockNext);

      const stats = getRateLimitStats();
      expect(stats.activeUsers).toBe(2);
      expect(stats.totalEntries).toBe(2);
    });

    it('should reset individual user rate limit', () => {
      const middleware = createRateLimiterMiddleware({
        limit: 1,
        windowSec: 60,
      });

      middleware(mockReq as Request, mockRes as Response, mockNext);
      const userId = (mockReq as any).userId;

      // Second request should fail
      mockNext.mockClear();
      middleware(mockReq as Request, mockRes as Response, mockNext);
      expect(statusCode).toBe(429);

      // Reset user
      resetUserRateLimit(userId);

      // Now should succeed
      statusCode = 200;
      mockNext.mockClear();
      middleware(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should reset all rate limits', () => {
      const middleware = createRateLimiterMiddleware({
        limit: 1,
        windowSec: 60,
      });

      const req1 = { headers: {}, cookies: {} } as any;
      const req2 = { headers: {}, cookies: {} } as any;

      middleware(req1 as Request, mockRes as Response, mockNext);
      middleware(req2 as Request, mockRes as Response, mockNext);

      let stats = getRateLimitStats();
      expect(stats.activeUsers).toBe(2);

      // Reset all
      resetAllRateLimits();

      stats = getRateLimitStats();
      expect(stats.activeUsers).toBe(0);
    });
  });
});
