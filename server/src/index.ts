import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { authMiddleware } from './middleware/authMiddleware.js';
import { errorHandler } from './middleware/errorHandler.js';
import { rateLimiter } from './middleware/rateLimiter.js';
import healthRouter from './routes/health.js';
import tokenRouter from './routes/tokenRoutes.js';
import speechRouter from './routes/speech.js';

const app = express();

// ── Global Middleware ──────────────────────────────────────────────

// CORS — restrict to allowed origins (PRD §6)
app.use(
    cors({
        origin: env.ALLOWED_ORIGINS,
        methods: ['GET', 'POST'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    })
);

// Security headers (PRD §6.3)
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                connectSrc: [
                    "'self'",
                    'https://*.botframework.com',
                    'https://login.microsoftonline.com',
                    'https://*.cognitiveservices.azure.com',
                ],
                scriptSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
                fontSrc: ["'self'", 'https://fonts.gstatic.com'],
            },
        },
        // Additional security headers from PRD §6.3
        frameguard: { action: 'deny' }, // X-Frame-Options: DENY
        hsts: { maxAge: 31536000, includeSubDomains: true },
    })
);

// Parse JSON bodies
app.use(express.json());

// ── Rate Limiting ──────────────────────────────────────────────────

// Apply rate limiting to token endpoints
app.use('/api/directline', rateLimiter({ windowMs: 60_000, maxRequests: 30 }));
app.use('/api/speech', rateLimiter({ windowMs: 60_000, maxRequests: 20 }));

// ── Routes ─────────────────────────────────────────────────────────

// Public routes (no auth required)
app.use(healthRouter);

// Protected routes (require Azure AD Bearer token)
// Protected routes (require Azure AD Bearer token)
// Hybrid Auth: /api/directline is now public/unprotected from Azure AD to allow bypassing Admin Consent.
// We trust the client to send the correct userId.
app.use('/api/directline', tokenRouter);
app.use('/api/speech', authMiddleware, speechRouter);

// ── Error Handling ────────────────────────────────────────────────

app.use(errorHandler);

// ── Start Server ──────────────────────────────────────────────────

app.listen(env.PORT, () => {
    console.log(`[server] Backend middleware running on http://localhost:${env.PORT}`);
    console.log(`[server] Allowed origins: ${env.ALLOWED_ORIGINS.join(', ')}`);
});

export default app;
