import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { createRateLimiterMiddleware } from './middleware/rateLimiter';

dotenv.config();

const app = express();
const PORT = process.env.PORT ?? 3000;

// Middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

//global rate limiter middleware
app.use(createRateLimiterMiddleware());

/**
 * Health check endpoint
 */
app.get('/health', (_req: Request, res: Response): void => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

/**
 * Test endpoint to verify rate limiter
 */
app.get('/api/test', (_req: Request, res: Response): void => {
  res.status(200).json({
    message: 'Request successful',
    timestamp: new Date().toISOString(),
  });
});

/**
 * Test endpoint with POST method
 */
app.post('/api/test', (req: Request, res: Response): void => {
  res.status(201).json({
    message: 'POST request successful',
    data: req.body,
    timestamp: new Date().toISOString(),
  });
});

/**
 * Catch-all 404 handler
 */
app.use((_req: Request, res: Response): void => {
  res.status(404).json({
    error: 'not_found',
    message: 'The requested resource was not found.',
  });
});

/**
 * Error handling middleware
 */
app.use(
  (
    err: any,
    _req: Request,
    res: Response,
    _next: express.NextFunction
  ): void => {
    console.error('[Error Handler]', err);
    res.status(500).json({
      error: 'internal_server_error',
      message: 'An unexpected error occurred.',
    });
  }
);

// Start server
const server = app.listen(PORT, () => {
  console.log(`[Server] Running on http://localhost:${PORT}`);
  console.log(`[Config] Rate Limit: ${process.env.RATE_LIMIT ?? 5} requests`);
  console.log(
    `[Config] Time Window: ${process.env.RATE_WINDOW_SEC ?? 60} seconds`
  );
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Server] SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('[Server] HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('[Server] SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('[Server] HTTP server closed');
    process.exit(0);
  });
});

export default app;
