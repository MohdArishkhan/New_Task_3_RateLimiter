import request from 'supertest';
import app from './server';
import { resetAllRateLimits } from './middleware/rateLimiter';

describe('Express Server with Rate Limiter', () => {
  beforeEach(() => {
    resetAllRateLimits();
  });

  describe('Health Check Endpoint', () => {
    it('GET /health should return 200 OK', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('Test Endpoint', () => {
    it('GET /api/test should return 200 OK', async () => {
      const response = await request(app).get('/api/test');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Request successful');
    });

    it('POST /api/test should return 201 Created', async () => {
      const response = await request(app)
        .post('/api/test')
        .send({ name: 'test' });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty(
        'message',
        'POST request successful'
      );
      expect(response.body).toHaveProperty('data');
    });
  });

  describe('Rate Limiter Integration', () => {
    it('should allow requests within rate limit', async () => {
      for (let i = 0; i < 5; i++) {
        const response = await request(app).get('/health');
        expect(response.status).toBe(200);
        expect(response.headers['x-ratelimit-limit']).toBe('5');
        expect(response.headers['x-ratelimit-remaining']).toBe(`${4 - i}`);
      }
    });

    it('should reject requests exceeding rate limit with 429', async () => {
      // Make 5 allowed requests
      for (let i = 0; i < 5; i++) {
        const response = await request(app).get('/health');
        expect(response.status).toBe(200);
      }

      // 6th request should be rejected
      const response = await request(app).get('/health');
      expect(response.status).toBe(429);
      expect(response.body).toEqual({
        error: 'rate_limited',
        message: 'Too many requests, please try again later.',
      });
    });

    it('should include rate limit headers in response', async () => {
      const response = await request(app).get('/health');

      expect(response.headers).toHaveProperty('x-ratelimit-limit');
      expect(response.headers).toHaveProperty('x-ratelimit-remaining');
      expect(response.headers).toHaveProperty('x-ratelimit-reset');
    });

    it('should properly track remaining requests', async () => {
      const responses = [];
      for (let i = 0; i < 5; i++) {
        const response = await request(app).get('/health');
        responses.push(response);
      }

      // Verify remaining count decreases
      for (let i = 0; i < 5; i++) {
        expect(responses[i].headers['x-ratelimit-remaining']).toBe(`${4 - i}`);
      }
    });

    it('should return reset time in seconds', async () => {
      const response = await request(app).get('/health');
      const resetTime = parseInt(response.headers['x-ratelimit-reset']);

      expect(resetTime).toBeGreaterThan(0);
      expect(resetTime).toBeLessThanOrEqual(60);
    });
  });

  describe('Rate Limiter per User', () => {
    it('should isolate rate limits per user based on UUID', async () => {
      // User 1: Make 3 requests
      for (let i = 0; i < 3; i++) {
        const response = await request(app)
          .get('/health')
          .set('Cookie', 'userId=user1');
        expect(response.status).toBe(200);
      }

      // User 2: Should be able to make fresh requests
      for (let i = 0; i < 3; i++) {
        const response = await request(app)
          .get('/health')
          .set('Cookie', 'userId=user2');
        expect(response.status).toBe(200);
      }
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app).get('/non-existent-route');
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        error: 'not_found',
        message: 'The requested resource was not found.',
      });
    });
  });

  describe('Different HTTP Methods', () => {
    it('should apply rate limiting to GET requests', async () => {
      for (let i = 0; i < 5; i++) {
        const response = await request(app).get('/api/test');
        expect(response.status).toBe(200);
      }

      const response = await request(app).get('/api/test');
      expect(response.status).toBe(429);
    });

    it('should apply rate limiting to POST requests', async () => {
      for (let i = 0; i < 5; i++) {
        const response = await request(app)
          .post('/api/test')
          .send({ data: 'test' });
        expect(response.status).toBe(201);
      }

      const response = await request(app)
        .post('/api/test')
        .send({ data: 'test' });
      expect(response.status).toBe(429);
    });

    it('should rate limit across different methods for same user', async () => {
      // Make GET requests
      const getRes = await request(app).get('/api/test');
      expect(getRes.status).toBe(200);

      // Make POST requests
      for (let i = 0; i < 4; i++) {
        const postRes = await request(app)
          .post('/api/test')
          .send({ data: 'test' });
        expect(postRes.status).toBe(200);
      }

      // Next request of any type should fail
      const response = await request(app).get('/api/test');
      expect(response.status).toBe(429);
    });
  });

  describe('JSON Request/Response Handling', () => {
    it('should handle JSON request body', async () => {
      const payload = { name: 'John', age: 30 };
      const response = await request(app)
        .post('/api/test')
        .send(payload);

      expect(response.status).toBe(201);
      expect(response.body.data).toEqual(payload);
    });

    it('should handle URL-encoded request body', async () => {
      const response = await request(app)
        .post('/api/test')
        .send('name=John&age=30');

      expect(response.status).toBe(201);
      expect(response.body.data).toBeDefined();
    });

    it('should return JSON responses with proper Content-Type', async () => {
      const response = await request(app).get('/health');
      expect(response.headers['content-type']).toMatch(/json/);
    });
  });
});
