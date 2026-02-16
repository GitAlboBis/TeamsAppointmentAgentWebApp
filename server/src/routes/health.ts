import { Router } from 'express';

const router = Router();

/**
 * GET /api/health
 *
 * Public health check endpoint for monitoring.
 * No authentication required.
 */
router.get('/api/health', (_req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
    });
});

export default router;
