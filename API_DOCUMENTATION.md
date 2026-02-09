# API Documentation

Complete reference for all endpoints and the rate limiter middleware.

## Base URL

```
http://localhost:3000
```

## Rate Limiting

All endpoints are rate-limited to **5 requests per minute per user**.

### Rate Limit Headers

Every response includes:

| Header | Description | Example |
|--------|-------------|---------|
| `X-RateLimit-Limit` | Maximum requests allowed in window | `5` |
| `X-RateLimit-Remaining` | Requests remaining in current window | `3` |
| `X-RateLimit-Reset` | Seconds until window resets | `45` |

### Rate Limit Exceeded

When rate limit is exceeded, the server returns:

**Status Code:** `429 Too Many Requests`

**Response Body:**
```json
{
  "error": "rate_limited",
  "message": "Too many requests, please try again later."
}
```

**Response Headers:**
```
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 60
```

## Endpoints

### Health Check

Verify the server is running and responsive.

```
GET /health
```

**Parameters:** None

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Status Code:** `200 OK`

**Rate Limited:** Yes

**Example:**
```bash
curl http://localhost:3000/health
```

---

### Test Endpoint (GET)

Test endpoint for GET requests with rate limiting.

```
GET /api/test
```

**Parameters:** None

**Response:**
```json
{
  "message": "Request successful",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Status Code:** `200 OK`

**Rate Limited:** Yes

**Example:**
```bash
curl http://localhost:3000/api/test
```

**With Headers:**
```bash
curl -v http://localhost:3000/api/test
```

---

### Test Endpoint (POST)

Test endpoint for POST requests with request body handling and rate limiting.

```
POST /api/test
```

**Content-Type:** `application/json` or `application/x-www-form-urlencoded`

**Request Body:**
```json
{
  "name": "string",
  "age": "number",
  "email": "string",
  ...any JSON
}
```

**Response:**
```json
{
  "message": "POST request successful",
  "data": {
    "name": "string",
    "age": "number",
    "email": "string"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Status Code:** `201 Created`

**Rate Limited:** Yes

**Example (JSON):**
```bash
curl -X POST http://localhost:3000/api/test \
  -H "Content-Type: application/json" \
  -d '{"name": "John", "age": 30}'
```

**Example (Form Data):**
```bash
curl -X POST http://localhost:3000/api/test \
  -d "name=John&age=30"
```

**Response Example:**
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

---

## Error Responses

### 404 Not Found

When requesting a non-existent endpoint.

**Status Code:** `404 Not Found`

**Response:**
```json
{
  "error": "not_found",
  "message": "The requested resource was not found."
}
```

**Example:**
```bash
curl http://localhost:3000/api/non-existent
```

---

### 429 Too Many Requests

When rate limit is exceeded.

**Status Code:** `429 Too Many Requests`

**Response:**
```json
{
  "error": "rate_limited",
  "message": "Too many requests, please try again later."
}
```

**Headers:**
```
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 45
```

**How to Avoid:**
- Wait for `X-RateLimit-Reset` seconds before making another request
- Spread requests across your 1-minute window
- Configure higher `RATE_LIMIT` if needed for your use case

---

### 500 Internal Server Error

When an unexpected server error occurs.

**Status Code:** `500 Internal Server Error`

**Response:**
```json
{
  "error": "internal_server_error",
  "message": "An unexpected error occurred."
}
```

**Troubleshooting:**
- Check server logs for detailed error information
- Ensure all environment variables are set correctly
- Verify request body is valid JSON

---

## Content Types

### Request Content Types

The server accepts:

- **application/json** - JSON request body
- **application/x-www-form-urlencoded** - Form-encoded data

### Response Content Type

All responses are:
- **application/json** - JSON response body

---

## User Identification

Users are automatically identified by a unique UUID v4. Each client receives a consistent UUID for rate limiting purposes.

The UUID is:
- Generated automatically on first request
- Stored in the request object
- Used for per-user rate limit tracking
- Ensures fair rate limiting across different users

---

## Rate Limiting Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `RATE_LIMIT` | `5` | Maximum requests per window |
| `RATE_WINDOW_SEC` | `60` | Time window in seconds |
| `PORT` | `3000` | Server port |

### Changing Rate Limits

**Via Environment Variables:**
```bash
RATE_LIMIT=10
RATE_WINDOW_SEC=120
```

**Via Code:**
```typescript
app.use(createRateLimiterMiddleware({
  limit: 10,
  windowSec: 120
}));
```

---

## Request/Response Examples

### Example 1: Successful GET Request

**Request:**
```bash
curl -v http://localhost:3000/api/test
```

**Response:**
```
HTTP/1.1 200 OK
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 4
X-RateLimit-Reset: 59
Content-Type: application/json
Content-Length: 75

{
  "message": "Request successful",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

### Example 2: Successful POST Request

**Request:**
```bash
curl -X POST http://localhost:3000/api/test \
  -H "Content-Type: application/json" \
  -d '{"name": "Alice", "role": "admin"}'
```

**Response:**
```
HTTP/1.1 201 Created
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 3
X-RateLimit-Reset: 58
Content-Type: application/json
Content-Length: 120

{
  "message": "POST request successful",
  "data": {
    "name": "Alice",
    "role": "admin"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

### Example 3: Rate Limited Request

**Request (6th request in 1 minute):**
```bash
curl http://localhost:3000/api/test
```

**Response:**
```
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 45
Content-Type: application/json
Content-Length: 88

{
  "error": "rate_limited",
  "message": "Too many requests, please try again later."
}
```

---

### Example 4: Not Found

**Request:**
```bash
curl http://localhost:3000/api/unknown
```

**Response:**
```
HTTP/1.1 404 Not Found
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 4
X-RateLimit-Reset: 59
Content-Type: application/json
Content-Length: 88

{
  "error": "not_found",
  "message": "The requested resource was not found."
}
```

---

## HTTP Status Codes

| Code | Meaning | When Used |
|------|---------|-----------|
| `200` | OK | Successful GET request |
| `201` | Created | Successful POST request |
| `400` | Bad Request | Invalid request format |
| `404` | Not Found | Endpoint doesn't exist |
| `429` | Too Many Requests | Rate limit exceeded |
| `500` | Internal Server Error | Server error |

---

## Testing the API

### Using cURL

```bash
# Single request
curl http://localhost:3000/api/test

# With headers
curl -v http://localhost:3000/api/test

# POST request
curl -X POST http://localhost:3000/api/test -d '{"key":"value"}'

# Check rate limiting (6th request should fail)
for i in {1..6}; do curl http://localhost:3000/api/test; done
```

### Using Node.js/Fetch

```javascript
// Single request
const response = await fetch('http://localhost:3000/api/test');
const data = await response.json();

// Check rate limit headers
const limit = response.headers.get('X-RateLimit-Limit');
const remaining = response.headers.get('X-RateLimit-Remaining');

console.log(`Limit: ${limit}, Remaining: ${remaining}`);
```

### Using JavaScript/Axios

```javascript
const axios = require('axios');

const response = await axios.get('http://localhost:3000/api/test');
console.log('Status:', response.status);
console.log('Headers:', response.headers);
console.log('Data:', response.data);
```

---

## Best Practices

### Client-Side Implementation

1. **Check Rate Limit Headers**
   ```javascript
   const remaining = parseInt(response.headers.get('X-RateLimit-Remaining'));
   if (remaining === 0) {
     console.warn('Approaching rate limit');
   }
   ```

2. **Handle 429 Errors**
   ```javascript
   if (response.status === 429) {
     const resetTime = response.headers.get('X-RateLimit-Reset');
     console.error(`Rate limited. Retry in ${resetTime} seconds`);
   }
   ```

3. **Implement Exponential Backoff**
   ```javascript
   async function retryWithBackoff(fn, maxRetries = 3) {
     for (let i = 0; i < maxRetries; i++) {
       try {
         return await fn();
       } catch (error) {
         if (error.status === 429) {
           const delay = Math.pow(2, i) * 1000;
           await new Promise(r => setTimeout(r, delay));
         }
       }
     }
   }
   ```

### Server-Side Optimization

1. **Adjust Rate Limits by Endpoint**
   ```typescript
   // Strict for expensive operations
   app.post('/api/expensive', 
     createRateLimiterMiddleware({ limit: 5, windowSec: 60 }),
     handler
   );
   ```

2. **Monitor Rate Limiting**
   ```typescript
   const stats = getRateLimitStats();
   console.log(`Active users: ${stats.activeUsers}`);
   ```

3. **Log Rate Limit Violations**
   ```typescript
   if (response.status === 429) {
     logger.warn(`Rate limit exceeded for user ${userId}`);
   }
   ```

---

## Versioning

This API follows semantic versioning. Current version: **1.0.0**

---

## Support

For issues or questions:
1. Check the `README.md` for complete documentation
2. See `USAGE_EXAMPLES.md` for code examples
3. Review `QUICK_START.md` for setup instructions
4. Check `LLM_PROMPTS.md` for design decisions

---

## Changes and Updates

See `CHANGELOG.md` for version history and updates.

---

**Last Updated:** January 2024
**API Version:** 1.0.0
