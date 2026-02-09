# Quick Start Guide

Get the rate limiter middleware running in 5 minutes.

## 1️⃣ Install Dependencies

```bash
npm install
```

## 2️⃣ Create Environment File

```bash
cp .env.example .env
```

Optional: Customize rate limits in `.env`
```
RATE_LIMIT=5
RATE_WINDOW_SEC=60
PORT=3000
```

## 3️⃣ Start Development Server

```bash
npm run dev
```

Server starts on `http://localhost:3000`

## 4️⃣ Test It Works

### Terminal 1 (Running server)
```bash
npm run dev
```

### Terminal 2 (Test requests)

Make 5 successful requests:
```bash
for i in {1..5}; do curl http://localhost:3000/api/test; done
```

Try 6th request (should be rate limited):
```bash
curl http://localhost:3000/api/test
```

Should return **HTTP 429**:
```json
{
  "error": "rate_limited",
  "message": "Too many requests, please try again later."
}
```

## 5️⃣ Run Tests

```bash
npm test
```

All tests should pass ✅

## What's Working

✅ **Rate Limiter**: Limits to 5 requests/minute per user
✅ **Headers**: Returns X-RateLimit-* headers
✅ **User IDs**: Automatic UUID v4 identification
✅ **Configuration**: Environment variables
✅ **Error Handling**: 429 responses with proper JSON
✅ **Tests**: 60+ tests covering all functionality

## Project Structure

```
src/
├── middleware/
│   ├── rateLimiter.ts      ← Core middleware logic
│   └── rateLimiter.test.ts ← Unit tests
├── utils/
│   └── constants.ts        ← App constants
├── server.ts               ← Express server setup
└── server.test.ts          ← Integration tests
```

## Available Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server with hot reload |
| `npm start` | Start production server |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm test` | Run all tests once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Get test coverage report |
| `npm run lint` | Check code quality |
| `npm run type-check` | Verify TypeScript types |

## API Endpoints

### Health Check
```bash
GET http://localhost:3000/health
```

### Test Endpoint
```bash
GET http://localhost:3000/api/test
POST http://localhost:3000/api/test
```

All endpoints are rate-limited to 5 requests/minute per user.

## Rate Limit Headers

Every response includes:
- `X-RateLimit-Limit`: Max requests allowed (5)
- `X-RateLimit-Remaining`: Requests left this minute
- `X-RateLimit-Reset`: Seconds until reset

Example:
```
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 3
X-RateLimit-Reset: 45
```

## Configuration

### Change Rate Limit

Edit `.env`:
```
RATE_LIMIT=10
RATE_WINDOW_SEC=120
```

Then restart server.

### Custom Config in Code

```typescript
import { createRateLimiterMiddleware } from './middleware/rateLimiter';

app.use(createRateLimiterMiddleware({
  limit: 10,      // 10 requests
  windowSec: 120  // per 2 minutes
}));
```

## Testing

### Run Tests
```bash
npm test
```

### Watch Mode (auto-rerun)
```bash
npm run test:watch
```

### Coverage Report
```bash
npm run test:coverage
```

### Run Specific Test
```bash
npm test -- rateLimiter.test.ts
```

## Debugging

### Enable TypeScript Checking
```bash
npm run type-check
```

### Check Code Quality
```bash
npm run lint
```

### View Server Logs
When running `npm run dev`, check console output for:
- Server startup messages
- Rate limit info
- Any errors or warnings

## Next Steps

1. **Review Code**: Check `src/middleware/rateLimiter.ts` to understand implementation
2. **Read Docs**: See `README.md` for complete documentation
3. **Check Examples**: See `USAGE_EXAMPLES.md` for real-world examples
4. **Run Tests**: Execute `npm test` to see middleware in action
5. **Customize**: Modify `.env` to adjust rate limits

## Troubleshooting

### Port 3000 Already in Use
Change port in `.env`:
```
PORT=3001
```

### Tests Failing
Clear cache and reinstall:
```bash
rm -rf node_modules package-lock.json
npm install
npm test
```

### Type Errors
Run type checker:
```bash
npm run type-check
```

### Rate Limiter Not Working
Check logs:
```bash
npm run dev
# Look for "[RateLimiter]" messages
```

## Production Deployment

### Build for Production
```bash
npm run build
```

### Set Environment Variables
```bash
export RATE_LIMIT=5
export RATE_WINDOW_SEC=60
export PORT=3000
```

### Start Production Server
```bash
npm start
```

## Features Included

✨ **Rate Limiting**
- Per-user tracking with UUID v4
- Configurable requests per window
- Automatic time window reset
- Standard HTTP 429 responses

✨ **Quality**
- TypeScript strict mode
- 60+ test cases
- Full test coverage (70%+)
- ESLint configuration
- Production-ready error handling

✨ **Developer Experience**
- Hot reload in development
- Clear error messages
- Comprehensive documentation
- Example usage code
- Detailed test examples

## Support

- 📖 **Documentation**: See `README.md`
- 💡 **Examples**: See `USAGE_EXAMPLES.md`
- 🧪 **Tests**: See `src/**/*.test.ts` files
- ⚙️ **Config**: See `LLM_PROMPTS.md` for design decisions

---

**Ready to use!** Start with `npm run dev` and test with `curl`. 🚀
