# Rate Limiter Middleware

A production-ready rate limiter middleware for Express.js built with TypeScript, following industry best practices and clean code principles.

## Overview

This project implements a robust rate limiting middleware that:
- Limits requests to **5 per minute per user** (configurable)
- Uses **UUID v4** for unique user identification
- Tracks request counts in **in-memory Map** with automatic cleanup
- Returns standard **HTTP 429** responses when limits are exceeded
- Includes useful **rate limit headers** in all responses
- Is **fully testable** with comprehensive test coverage
- Follows **TypeScript strict mode** and industry best practices

## Features

✅ Per-user rate limiting with UUID v4 identification
✅ Configurable request limits and time windows
✅ Standard HTTP rate limit headers (X-RateLimit-*)
✅ In-memory storage with automatic expiration
✅ Global middleware for all routes
✅ Production-ready error handling
✅ Comprehensive test suite (unit & integration)
✅ TypeScript with strict mode enabled
✅ Clean, documented, testable codebase
✅ Environment variable configuration

## Project Structure

```
.
├── src/
│   ├── middleware/
│   │   ├── rateLimiter.ts          # Core rate limiter middleware
│   │   └── rateLimiter.test.ts     # Unit tests for middleware
│   ├── server.ts                    # Express server setup
│   └── server.test.ts               # Integration tests
├── dist/                            # Compiled JavaScript output
├── jest.config.js                   # Jest testing configuration
├── tsconfig.json                    # TypeScript configuration
├── .eslintrc.json                   # ESLint configuration
├── .env.example                     # Example environment variables
├── .gitignore                       # Git ignore rules
├── package.json                     # Project dependencies
├── README.md                        # This file
└── LLM_PROMPTS.md                   # LLM prompts used in development
```

## Installation

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Setup

1. **Clone and install dependencies:**
```bash
npm install
```

2. **Create environment file:**
```bash
cp .env.example .env
```

3. **Configure environment variables (optional):**
```bash
# .env
PORT=3000
RATE_LIMIT=5
RATE_WINDOW_SEC=60
```

## Running the Server

### Development Mode
```bash
npm run dev
```

The server will start on `http://localhost:3000`

### Production Build
```bash
npm run build
npm start
```

## API Endpoints

### Health Check
```bash
GET /health
```

Returns server status:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Test Endpoint (GET)
```bash
GET /api/test
```

Returns:
```json
{
  "message": "Request successful",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Test Endpoint (POST)
```bash
POST /api/test
Content-Type: application/json

{
  "name": "example",
  "value": 123
}
```

Returns:
```json
{
  "message": "POST request successful",
  "data": {
    "name": "example",
    "value": 123
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Rate Limiting Details

### Headers
Every response includes rate limit information:

- `X-RateLimit-Limit`: Maximum requests allowed (default: 5)
- `X-RateLimit-Remaining`: Requests remaining in current window
- `X-RateLimit-Reset`: Seconds until window resets

### Rate Limit Exceeded Response
When a user exceeds the limit, they receive:

**Status:** `429 Too Many Requests`

**Body:**
```json
{
  "error": "rate_limited",
  "message": "Too many requests, please try again later."
}
```

### Configuration

Rate limits are configurable via environment variables:

```bash
RATE_LIMIT=5              # Requests per window (default: 5)
RATE_WINDOW_SEC=60        # Time window in seconds (default: 60)
```

### User Identification

Users are identified by UUID v4. Each unique client automatically receives a UUID, which is used consistently for rate limiting tracking.

## Testing

### Run All Tests
```bash
npm test
```

### Watch Mode (auto-rerun on file changes)
```bash
npm run test:watch
```

### Coverage Report
```bash
npm run test:coverage
```

### Test Structure

**Unit Tests** (`rateLimiter.test.ts`):
- Basic rate limiting functionality
- Request header validation
- User identification and isolation
- Time window reset behavior
- Configurable limits
- Error handling
- Statistics and management functions

**Integration Tests** (`server.test.ts`):
- Health check endpoint
- Test endpoints (GET/POST)
- Rate limiter integration
- Per-user rate limit isolation
- HTTP method variations
- JSON request/response handling
- 404 handling

## Code Quality

### Type Checking
```bash
npm run type-check
```

Ensures strict TypeScript compilation with no implicit types.

### Linting
```bash
npm run lint
```

Checks code style and best practices.

## Architecture & Design Patterns

### Middleware Pattern
The rate limiter uses Express middleware pattern for clean integration:

```typescript
app.use(createRateLimiterMiddleware());
```

### Factory Pattern
`createRateLimiterMiddleware()` is a factory function that returns a configured middleware instance, allowing for customizable configuration.

### In-Memory Storage
Uses TypeScript `Map<string, UserRateLimit>` for efficient per-user tracking with automatic cleanup of expired entries.

### Error Handling
Graceful error handling ensures the middleware never breaks the request pipeline, logging errors while allowing requests to proceed.

## Configuration Options

### Rate Limiter Initialization
```typescript
// Use environment variables (default)
app.use(createRateLimiterMiddleware());

// Or provide custom configuration
app.use(createRateLimiterMiddleware({
  limit: 10,
  windowSec: 120
}));
```

## Best Practices Implemented

✅ **TypeScript Strict Mode**: All compiler options enabled for type safety
✅ **Pure Functions**: Middleware is stateless and deterministic
✅ **Error Handling**: Graceful error handling with logging
✅ **Testing**: Comprehensive unit and integration tests
✅ **Documentation**: Code comments and API documentation
✅ **Configuration**: Environment-driven configuration
✅ **Logging**: Structured console output with prefixes
✅ **HTTP Standards**: Proper status codes and headers
✅ **Separation of Concerns**: Clear module boundaries
✅ **Performance**: O(1) lookups with Map-based storage

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `RATE_LIMIT` | `5` | Max requests per window |
| `RATE_WINDOW_SEC` | `60` | Time window in seconds |

## Performance Considerations

- **In-Memory Storage**: Efficient Map-based lookups in O(1) time
- **Automatic Cleanup**: Expired entries are cleaned up during request processing
- **No External Dependencies**: No database or cache required
- **Minimal Overhead**: Each request adds negligible overhead

## Scalability Notes

For production deployments at scale:
1. Consider Redis for multi-instance setups
2. Use a load balancer to distribute requests
3. Monitor memory usage with large user bases
4. Adjust `RATE_LIMIT` and `RATE_WINDOW_SEC` based on your needs

## Development Guide

### Adding New Endpoints

1. Add route handler in `src/server.ts`
2. Rate limiting is automatic via middleware
3. Add tests in `src/server.test.ts`

### Customizing Rate Limiter

1. Modify `src/middleware/rateLimiter.ts`
2. Update tests accordingly
3. Test with `npm run test`

### Deploying to Production

1. Run `npm run build`
2. Set environment variables
3. Deploy `dist` folder
4. Run `npm start`

## Troubleshooting

### Rate Limit Headers Not Appearing
- Ensure middleware is applied before route handlers
- Check that custom middleware doesn't override headers

### Test Failures
- Run `npm run test` to see detailed error messages
- Check that Node.js version is 16+
- Ensure all dependencies are installed: `npm install`

### Port Already in Use
- Change `PORT` in `.env` file
- Or kill existing process on port 3000

## License

MIT

## Contributing

This project follows clean code and TypeScript best practices. When contributing:
- Maintain TypeScript strict mode compliance
- Add tests for new features
- Update documentation
- Run `npm run lint` and `npm run type-check`

## Support

For issues or questions:
1. Check the test files for usage examples
2. Review the inline code documentation
3. Refer to Express.js documentation for middleware patterns
