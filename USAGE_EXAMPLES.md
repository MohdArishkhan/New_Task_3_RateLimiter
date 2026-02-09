# Rate Limiter Middleware - Usage Examples

Complete practical examples for using the rate limiter middleware in your Express.js application.

## Basic Setup

### Minimal Configuration

```typescript
import express from 'express';
import { createRateLimiterMiddleware } from './middleware/rateLimiter';

const app = express();

// Apply rate limiter to all routes
app.use(createRateLimiterMiddleware());

// Your routes here
app.get('/api/data', (req, res) => {
  res.json({ data: 'example' });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

### Custom Configuration

```typescript
// Apply with custom limits
app.use(createRateLimiterMiddleware({
  limit: 10,        // Allow 10 requests
  windowSec: 120    // Per 2 minutes
}));
```

### Using Environment Variables

```bash
# .env
RATE_LIMIT=5
RATE_WINDOW_SEC=60
```

```typescript
// In code - reads from env automatically
app.use(createRateLimiterMiddleware());
```

## Real-World Examples

### Example 1: API with Authenticated and Public Routes

```typescript
import express from 'express';
import { createRateLimiterMiddleware } from './middleware/rateLimiter';

const app = express();
app.use(express.json());

// Public API: 5 requests per minute
app.use(createRateLimiterMiddleware({
  limit: 5,
  windowSec: 60
}));

// Public endpoint
app.get('/api/public/status', (req, res) => {
  res.json({ status: 'ok' });
});

// User info endpoint
app.get('/api/users/:id', (req, res) => {
  // Rate limited to 5 requests/minute per user
  res.json({
    id: req.params.id,
    username: 'user_' + req.params.id
  });
});

app.listen(3000);
```

### Example 2: Stricter Limits for Expensive Operations

```typescript
import express, { Router } from 'express';
import { createRateLimiterMiddleware } from './middleware/rateLimiter';

const app = express();

// General API: 100 requests per minute
app.use(createRateLimiterMiddleware({
  limit: 100,
  windowSec: 60
}));

// Create a router for expensive operations with stricter limits
const expensiveRouter = Router();
expensiveRouter.use(createRateLimiterMiddleware({
  limit: 5,    // Very strict: 5 requests per minute
  windowSec: 60
}));

// Expensive operations
expensiveRouter.post('/generate-report', async (req, res) => {
  // This endpoint is limited to 5 requests/minute
  res.json({ status: 'Report generation started' });
});

expensiveRouter.post('/export-data', async (req, res) => {
  res.json({ status: 'Export started' });
});

app.use('/api/expensive', expensiveRouter);

app.listen(3000);
```

### Example 3: Testing with Different Rate Limits

```typescript
import { createRateLimiterMiddleware } from './middleware/rateLimiter';
import request from 'supertest';
import app from './server';

describe('API with Rate Limiting', () => {
  it('should limit requests appropriately', async () => {
    // Make 5 allowed requests
    for (let i = 0; i < 5; i++) {
      const res = await request(app).get('/api/test');
      expect(res.status).toBe(200);
    }

    // 6th request should be rate limited
    const res = await request(app).get('/api/test');
    expect(res.status).toBe(429);
    expect(res.body.error).toBe('rate_limited');
  });

  it('should include rate limit headers', async () => {
    const res = await request(app).get('/api/test');
    
    expect(res.headers['x-ratelimit-limit']).toBe('5');
    expect(res.headers['x-ratelimit-remaining']).toBeDefined();
    expect(res.headers['x-ratelimit-reset']).toBeDefined();
  });
});
```

### Example 4: Error Handling and Graceful Degradation

```typescript
import express from 'express';
import { createRateLimiterMiddleware } from './middleware/rateLimiter';

const app = express();
app.use(express.json());

// Apply rate limiter
app.use(createRateLimiterMiddleware({
  limit: 10,
  windowSec: 60
}));

// Your API endpoint
app.post('/api/data', (req, res) => {
  try {
    // Process request
    res.status(201).json({
      success: true,
      data: req.body
    });
  } catch (error) {
    res.status(500).json({
      error: 'internal_error',
      message: 'Failed to process request'
    });
  }
});

// Handle rate limit exceeded
app.use((req, res) => {
  res.status(429).json({
    error: 'rate_limited',
    message: 'Too many requests. Check X-RateLimit-Reset header.'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'internal_error',
    message: 'An unexpected error occurred'
  });
});

app.listen(3000);
```

### Example 5: Monitoring and Statistics

```typescript
import express from 'express';
import { 
  createRateLimiterMiddleware,
  getRateLimitStats,
  resetAllRateLimits
} from './middleware/rateLimiter';

const app = express();

// Apply rate limiter
app.use(createRateLimiterMiddleware({
  limit: 5,
  windowSec: 60
}));

// Admin endpoint: Get rate limit statistics
app.get('/admin/stats', (req, res) => {
  const stats = getRateLimitStats();
  res.json({
    activeUsers: stats.activeUsers,
    totalRequests: stats.totalEntries,
    timestamp: new Date().toISOString()
  });
});

// Admin endpoint: Reset all rate limits
app.post('/admin/reset-limits', (req, res) => {
  resetAllRateLimits();
  res.json({
    message: 'All rate limits have been reset',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/data', (req, res) => {
  res.json({ data: 'example' });
});

app.listen(3000);
```

## cURL Examples

### Basic Request

```bash
curl http://localhost:3000/api/test
```

Response:
```json
{
  "message": "Request successful",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

Headers:
```
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 4
X-RateLimit-Reset: 59
```

### Making Multiple Requests to Hit Rate Limit

```bash
# Make 5 requests
for i in {1..5}; do
  curl http://localhost:3000/api/test
done

# This 6th request will be rate limited
curl http://localhost:3000/api/test
```

Response on 6th request (429):
```json
{
  "error": "rate_limited",
  "message": "Too many requests, please try again later."
}
```

### POST Request

```bash
curl -X POST http://localhost:3000/api/test \
  -H "Content-Type: application/json" \
  -d '{"name": "John", "age": 30}'
```

Response:
```json
{
  "message": "POST request successful",
  "data": {
    "name": "John",
    "age": 30
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Check Headers

```bash
curl -v http://localhost:3000/api/test
```

Look for rate limit headers in the response.

## JavaScript/Fetch Examples

### Client-Side Request

```javascript
// Make request
const response = await fetch('http://localhost:3000/api/test');
const data = await response.json();

// Check rate limit headers
const limit = response.headers.get('X-RateLimit-Limit');
const remaining = response.headers.get('X-RateLimit-Remaining');
const reset = response.headers.get('X-RateLimit-Reset');

console.log(`Limit: ${limit}, Remaining: ${remaining}, Reset in: ${reset}s`);

// Handle rate limit
if (response.status === 429) {
  console.error('Rate limited! Try again in', reset, 'seconds');
}
```

### Implementing Client-Side Rate Limit Tracking

```javascript
class APIClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.rateLimitInfo = null;
  }

  async request(endpoint, options = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, options);

    // Extract rate limit info
    this.rateLimitInfo = {
      limit: response.headers.get('X-RateLimit-Limit'),
      remaining: response.headers.get('X-RateLimit-Remaining'),
      reset: response.headers.get('X-RateLimit-Reset')
    };

    if (response.status === 429) {
      throw new Error(
        `Rate limited! Retry in ${this.rateLimitInfo.reset} seconds`
      );
    }

    return response.json();
  }

  getRateLimitInfo() {
    return this.rateLimitInfo;
  }
}

// Usage
const client = new APIClient('http://localhost:3000');

try {
  const data = await client.request('/api/test');
  console.log(data);
  console.log('Rate limit info:', client.getRateLimitInfo());
} catch (error) {
  console.error(error.message);
}
```

## Testing Examples

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Get coverage report
npm run test:coverage
```

### Jest Test Example

```typescript
import request from 'supertest';
import app from '../server';
import { resetAllRateLimits } from '../middleware/rateLimiter';

describe('My API', () => {
  beforeEach(() => {
    // Reset rate limits before each test
    resetAllRateLimits();
  });

  it('should handle requests within rate limit', async () => {
    const response = await request(app)
      .get('/api/test')
      .expect(200);

    expect(response.body).toHaveProperty('message');
  });

  it('should reject requests exceeding rate limit', async () => {
    // Make 5 requests (hitting the limit)
    for (let i = 0; i < 5; i++) {
      await request(app).get('/api/test');
    }

    // 6th request should fail
    const response = await request(app)
      .get('/api/test')
      .expect(429);

    expect(response.body.error).toBe('rate_limited');
  });
});
```

## Docker Example

### Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

ENV NODE_ENV=production
ENV PORT=3000
ENV RATE_LIMIT=5
ENV RATE_WINDOW_SEC=60

EXPOSE 3000

CMD ["npm", "start"]
```

### Docker Compose

```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      PORT: 3000
      RATE_LIMIT: 5
      RATE_WINDOW_SEC: 60
    restart: unless-stopped
```

## Performance Monitoring Example

```typescript
import express from 'express';
import { createRateLimiterMiddleware, getRateLimitStats } from './middleware/rateLimiter';

const app = express();

app.use(createRateLimiterMiddleware());

// Monitoring middleware
app.use((req, res, next) => {
  const stats = getRateLimitStats();
  
  // Log every 100 requests
  if (req.query.monitor === 'true') {
    console.log('Rate Limit Stats:', {
      activeUsers: stats.activeUsers,
      timestamp: new Date().toISOString()
    });
  }
  
  next();
});

app.get('/api/data', (req, res) => {
  res.json({ data: 'example' });
});

app.listen(3000);
```

## Best Practices Summary

1. **Always reset rate limits in tests**: Use `resetAllRateLimits()` in `beforeEach()`
2. **Check headers in client code**: Use `X-RateLimit-*` headers to warn users
3. **Log rate limit events**: Monitor which users are hitting limits
4. **Configure appropriately**: Adjust `RATE_LIMIT` and `RATE_WINDOW_SEC` based on your API
5. **Handle 429 gracefully**: Provide helpful error messages to clients
6. **Test edge cases**: Test at exactly the limit boundary
7. **Document limits**: Let users know about rate limiting in your API docs
8. **Monitor memory**: For long-running servers, check memory usage

## Common Issues and Solutions

### Issue: Tests are interfering with each other
**Solution**: Reset rate limits before each test
```typescript
beforeEach(() => resetAllRateLimits());
```

### Issue: Different users seeing shared rate limits
**Solution**: Ensure each request gets unique user ID (UUID)
```typescript
// Middleware generates UUID automatically, no action needed
```

### Issue: Rate limit not resetting after time window
**Solution**: Check that `RATE_WINDOW_SEC` is set correctly
```bash
RATE_WINDOW_SEC=60  # 60 seconds
```

### Issue: Getting "Too many requests" immediately
**Solution**: Check if rate limit is too strict
```typescript
// Increase limit
app.use(createRateLimiterMiddleware({
  limit: 20,  // Increased from 5
  windowSec: 60
}));
```
