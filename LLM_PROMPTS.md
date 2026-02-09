# LLM Prompts Used in Development

This document contains all the prompts and instructions used with LLM assistance during the development of this Rate Limiter Middleware project.

## Project Brief Prompt

```
Create a production-ready TypeScript/Node.js backend Express.js rate limiter middleware that:

1. Allows only n(=5) requests per minute per user
2. Each user identified by UUID v4
3. Responds with HTTP 429 Too Many Requests when limit exceeded
4. Use in-memory Map for storage
5. Reset limit every 1 minute with automatic cleanup
6. Apply globally to all routes
7. Return HTTP rate limit headers (X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset)
8. Return JSON error response on 429 status
9. Make limit and time window configurable via environment variables
10. Implement with best industry practices, clean codebase, and full test coverage

Requirements:
- TypeScript with strict mode
- Comprehensive unit and integration tests
- Clean code architecture
- Easily testable design
- Production-ready error handling
- Proper type safety throughout
- ESLint configuration
- Full documentation
```

## Detailed Implementation Prompts

### 1. Project Structure and Dependencies

```
Create a complete backend project structure for a rate limiter middleware with:

Dependencies needed:
- express: ^4.18.2 (web framework)
- uuid: ^9.0.0 (UUID generation)
- dotenv: ^16.3.1 (environment variables)

Dev Dependencies:
- TypeScript 5.1.3
- ts-jest 29.1.0
- Jest 29.5.0
- Supertest 6.3.3
- @types packages for all dependencies
- ESLint with TypeScript support
- ts-node for development

Scripts:
- build: Compile TypeScript
- start: Run compiled server
- dev: Run in development with ts-node
- test: Run all tests
- test:watch: Watch mode
- test:coverage: Coverage report
- lint: Check code quality
- type-check: Verify TypeScript

Project structure:
- src/middleware/rateLimiter.ts (core middleware)
- src/middleware/rateLimiter.test.ts (unit tests)
- src/server.ts (Express server)
- src/server.test.ts (integration tests)
```

### 2. Rate Limiter Middleware Implementation

```
Implement a production-grade rate limiter middleware with:

Core Features:
1. RateLimitConfig interface with limit and windowSec properties
2. In-memory Map<string, UserRateLimit> for storage
3. UUID v4 user identification
4. Automatic cleanup of expired entries
5. Configurable via environment variables with validation

Main Functions:
- createRateLimiterMiddleware(customConfig?): Returns Express middleware
- getUserId(req): Extract or generate UUID for user
- getRateLimitStats(): Return current statistics
- resetUserRateLimit(userId): Clear specific user's limit
- resetAllRateLimits(): Clear all limits

Middleware Behavior:
1. On each request:
   - Identify user by UUID
   - Increment request counter
   - Check if limit exceeded
   - Set rate limit headers
   - Return 429 if exceeded
   - Call next() otherwise
2. Set headers: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset
3. Error response: { error: 'rate_limited', message: '...' }
4. Graceful error handling - never break request pipeline

Configuration:
- RATE_LIMIT=5 (default)
- RATE_WINDOW_SEC=60 (default)
- Validate values on initialization

Code Quality:
- Full TypeScript typing
- Comprehensive JSDoc comments
- Pure functions where possible
- Clear variable names
- No side effects in utility functions
```

### 3. Express Server Setup

```
Create Express server with:

Core Setup:
- Express app initialization
- JSON and URL-encoded middleware
- Apply rate limiter globally
- dotenv configuration loading

Endpoints:
1. GET /health - Status check
2. GET /api/test - Test endpoint
3. POST /api/test - Test endpoint with body
4. 404 handler - Not found responses
5. Error handler - Global error handling

Features:
- Graceful shutdown handling (SIGTERM, SIGINT)
- Structured console logging with [Server] prefix
- JSON responses with timestamps
- Proper HTTP status codes
- Configuration logging on startup

Return Formats:
- Success: { status/message, timestamp }
- Error 404: { error, message }
- Error 429: { error: 'rate_limited', message: '...' }
```

### 4. Unit Test Suite

```
Create comprehensive unit tests for rate limiter middleware covering:

Test Categories:

1. Basic Rate Limiting (4 tests)
   - Allow requests within limit
   - Reject requests exceeding limit
   - Correct error response format
   - Error contains proper fields

2. Rate Limit Headers (5 tests)
   - X-RateLimit-Limit header present and correct
   - X-RateLimit-Remaining header correct value
   - X-RateLimit-Reset header present
   - Remaining decrements with each request
   - Reset time value validity

3. User Identification (3 tests)
   - Assign unique userId to each user
   - Use same userId for multiple requests
   - Different users get different IDs

4. Time Window Reset (1 test)
   - Using jest.useFakeTimers
   - Counter resets after window expiry

5. Configurable Limits (2 tests)
   - Custom limit configuration respected
   - Custom time window configuration respected

6. Error Handling (1 test)
   - Errors don't break request pipeline
   - Errors are logged

7. Statistics/Management (3 tests)
   - getRateLimitStats returns correct data
   - resetUserRateLimit clears specific user
   - resetAllRateLimits clears all data

Mocking:
- Mock Express Request/Response objects
- Mock next() function with jest.fn()
- Track jsonResponse and statusCode
- Spy on console.error for error tests
```

### 5. Integration Tests

```
Create integration tests using Supertest covering:

Test Categories:

1. Health Check Endpoint (1 test)
   - GET /health returns 200 with correct body

2. Test Endpoints (2 tests)
   - GET /api/test returns 200
   - POST /api/test returns 201 with request body data

3. Rate Limiter Integration (4 tests)
   - Allow requests within limit
   - Reject exceeding with 429
   - Headers present in all responses
   - Remaining count tracking

4. Per-User Isolation (1 test)
   - Different users have independent limits
   - One user hitting limit doesn't affect others

5. 404 Handler (1 test)
   - Non-existent routes return 404

6. HTTP Methods (3 tests)
   - Rate limit applies to GET
   - Rate limit applies to POST
   - Rate limit shared across methods per user

7. JSON Handling (3 tests)
   - Handle JSON request body
   - Handle URL-encoded body
   - Response Content-Type is JSON

Jest Configuration:
- ts-jest preset
- Node test environment
- Collect coverage from src/
- Exclude .test.ts files from coverage
- Coverage thresholds: 70% all metrics
```

### 6. TypeScript Configuration

```
Configure TypeScript with:

Compiler Options:
- target: ES2020
- module: commonjs
- outDir: ./dist
- rootDir: ./src
- strict: true (enables all strict type checking)
- strictNullChecks: true
- noImplicitAny: true
- noUnusedLocals: true
- noUnusedParameters: true
- noImplicitReturns: true
- esModuleInterop: true
- resolveJsonModule: true
- declaration: true
- sourceMap: true

Include: src/**/*
Exclude: node_modules, dist, **/*.test.ts

Rationale:
- ES2020 target for modern JavaScript features
- Strict mode ensures type safety
- Unused detection prevents dead code
- Declaration files enable IDE support
- Source maps aid debugging
```

### 7. ESLint Configuration

```
Configure ESLint for TypeScript with:

Plugins:
- @typescript-eslint/parser (TypeScript parser)
- @typescript-eslint/eslint-plugin (TypeScript rules)

Extends:
- eslint:recommended
- plugin:@typescript-eslint/recommended

Key Rules:
- explicit-function-return-types: error (all functions must have return type)
- no-unused-vars: error with argsIgnorePattern: ^_ (allow underscore params)
- no-explicit-any: warn (discourage any type)
- explicit-module-boundary-types: error (exports need types)
- no-console: warn except warn/error/log
- prefer-const: error (use const over let)
- no-var: error (use let/const only)

Environment:
- node: true
- es2020: true
```

### 8. Documentation

```
Create comprehensive README with:

Sections:
1. Overview - What it does and features
2. Project Structure - File layout
3. Installation - Setup instructions
4. Running Server - Dev and production
5. API Endpoints - All available routes
6. Rate Limiting Details - How it works
7. Configuration - Environment variables
8. Testing - How to run tests
9. Code Quality - Linting and type checking
10. Architecture - Design patterns used
11. Best Practices - Implemented patterns
12. Performance Considerations
13. Scalability Notes
14. Development Guide
15. Troubleshooting

Code Examples:
- Installation steps
- cURL requests for endpoints
- Response formats (success and errors)
- Configuration examples
- Test running examples

Include:
- Feature checklist
- Performance notes
- Scalability considerations
- Troubleshooting section
```

### 9. Environment Configuration

```
Create .env.example with:

Configuration Variables:
- PORT=3000
- RATE_LIMIT=5
- RATE_WINDOW_SEC=60

Include comments explaining:
- What each variable controls
- Default values
- Valid ranges
```

## Key Design Decisions

### In-Memory Storage vs Database
- **Decision**: Use in-memory Map
- **Rationale**: Fast O(1) lookups, no external dependencies, suitable for single-instance deployments
- **Trade-off**: Data lost on restart, not suitable for distributed systems

### UUID v4 for User Identification
- **Decision**: Use uuid package for v4 generation
- **Rationale**: Ensures uniqueness without server state, standard approach
- **Implementation**: Generate on first request, store in request object

### Factory Pattern for Middleware
- **Decision**: Use createRateLimiterMiddleware() factory
- **Rationale**: Enables custom configuration, cleaner API, testable
- **Benefit**: Multiple instances with different configs possible

### Automatic Cleanup
- **Decision**: Clean expired entries on each request
- **Rationale**: Simple, no background tasks needed
- **Performance**: O(n) operation but only on active traffic

### Graceful Error Handling
- **Decision**: Catch errors, log, and allow request to proceed
- **Rationale**: Rate limiter should never break application
- **Benefit**: Resilient to unexpected errors

## Testing Strategy

### Unit Tests Focus
- Middleware logic in isolation
- Mock Express objects
- Test configuration validation
- Test edge cases

### Integration Tests Focus
- Real Express server
- Supertest for HTTP requests
- End-to-end rate limiting
- Cross-endpoint interactions
- Per-user isolation

### Coverage Goals
- 70% minimum across all metrics
- Focus on critical paths
- Test error conditions
- Test configuration variations

## Code Quality Standards

### TypeScript
- Strict mode enabled
- No implicit any
- Explicit return types
- Unused variable detection

### Documentation
- JSDoc comments for all exports
- Inline comments for complex logic
- README with examples
- LLM prompts documentation

### Testing
- Unit tests for logic
- Integration tests for API
- Error scenario coverage
- Edge case testing

### Performance
- O(1) lookups with Map
- Minimal request overhead
- Automatic memory cleanup
- No external I/O

## Deployment Checklist

Before production deployment:
- [ ] Run `npm run build`
- [ ] Run `npm test` - all pass
- [ ] Run `npm run lint` - no errors
- [ ] Run `npm run type-check` - no errors
- [ ] Set environment variables
- [ ] Review RATE_LIMIT configuration
- [ ] Test with production traffic patterns
- [ ] Monitor memory usage
- [ ] Set up error logging
- [ ] Document any custom configuration
