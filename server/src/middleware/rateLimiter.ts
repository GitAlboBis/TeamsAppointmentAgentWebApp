import type { Request, Response, NextFunction } from 'express';

interface RateLimiterOptions {
    windowMs?: number;
    maxRequests?: number;
}

interface WindowEntry {
    count: number;
    resetAt: number;
}

/**
 * Simple in-memory sliding-window rate limiter.
 * Keys by IP address. Returns 429 when limit exceeded.
 */
export function rateLimiter(options: RateLimiterOptions = {}) {
    const windowMs = options.windowMs ?? 60_000; // default 60s
    const maxRequests = options.maxRequests ?? 30; // default 30 req/window

    const store = new Map<string, WindowEntry>();

    // Periodic cleanup to avoid memory leaks
    const cleanupInterval: ReturnType<typeof setInterval> = setInterval(() => {
        const now = Date.now();
        for (const [key, entry] of store) {
            if (now >= entry.resetAt) {
                store.delete(key);
            }
        }
    }, windowMs * 2);

    // Allow the timer to not prevent Node.js from exiting
    cleanupInterval.unref();

    return (req: Request, res: Response, next: NextFunction): void => {
        const key = req.ip ?? req.socket.remoteAddress ?? 'unknown';
        const now = Date.now();

        let entry = store.get(key);

        if (!entry || now >= entry.resetAt) {
            entry = { count: 0, resetAt: now + windowMs };
            store.set(key, entry);
        }

        entry.count++;

        if (entry.count > maxRequests) {
            const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);
            res.set('Retry-After', String(retryAfterSeconds));
            res.status(429).json({
                error: 'Too Many Requests',
                status: 429,
                retryAfter: retryAfterSeconds,
            });
            return;
        }

        next();
    };
}
