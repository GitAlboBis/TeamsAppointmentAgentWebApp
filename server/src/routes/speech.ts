import { Router } from 'express';
import * as speechService from '../services/speechService.js';

const router = Router();

/**
 * GET /api/speech/token
 *
 * Issues a short-lived authorization token for the Azure Speech SDK.
 * Protected by authMiddleware (registered in index.ts).
 *
 * PRD §FR5.3 — Speech token endpoint.
 * PRD §FR2.7 — Key never exposed to client.
 *
 * Response: { token: string, region: string }
 */
router.get('/token', async (_req, res, next) => {
    try {
        const result = await speechService.issueToken();
        res.json(result);
    } catch (err) {
        next(err);
    }
});

export default router;
