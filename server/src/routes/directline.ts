import { Router } from 'express';
import * as directLineService from '../services/directLineService.js';
// import * as oboService from '../services/oboService.js';
import * as tokenStore from '../services/tokenStore.js';

const router = Router();

/**
 * POST /api/directline/token
 *
 * Authenticated endpoint. Generates a user-scoped Direct Line token
 * and performs the OBO flow to pre-acquire a Graph token for SSO.
 *
 * Flow (per PRD §6.2):
 *   1. Validate Bearer token (done by authMiddleware)
 *   2. OBO exchange → Graph token
 *   3. DL secret → DL token (scoped to user)
 *   4. Store Graph token keyed by conversationId for SSO
 *   5. Return DL token to client
 */
/**
 * POST /api/directline/token
 *
 * Hybrid Auth Mode:
 * - Bypasses Azure AD OBO flow to avoid "Admin Consent" issues.
 * - Accepts `userId` from the client.
 * - Generates a Direct Line token scoped to that user.
 */
router.post('/token', async (req, res, next) => {
    try {
        // Hybrid Auth: We don't have req.user (authMiddleware bypassed).
        // We expect userId in the body.
        const { userId } = req.body;

        if (!userId) {
            res.status(400).json({ error: 'Missing userId in request body' });
            return;
        }

        // We use a generic name or the userId as the name since we don't have the token claims
        const name = 'User';

        // Step 1: Generate user-scoped Direct Line token directly
        // (Skipping OBO exchange)
        const dlResponse = await directLineService.generateToken(userId, name);

        // Hybrid Auth: We DO NOT store the Graph token because we didn't get one.
        // The Bot will operate in "text-only" mode without SSO.

        // Step 2: Return DL token to client
        res.json({
            token: dlResponse.token,
            conversationId: dlResponse.conversationId,
            expiresIn: dlResponse.expiresIn,
        });
    } catch (err) {
        console.error('[DirectLine] Route Error:', err);
        // Log detailed error structure if available
        if (err instanceof Error) {
            console.error('[DirectLine] Stack:', err.stack);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const anyErr = err as any;
            if (anyErr.response) {
                console.error('[DirectLine] Upstream Response Status:', anyErr.response.status);
                console.error('[DirectLine] Upstream Response Data:', JSON.stringify(anyErr.response.data));
            }
        }
        next(err);
    }
});

/**
 * POST /api/directline/refresh
 *
 * Authenticated endpoint. Refreshes an existing Direct Line token
 * before it expires (typically called at ~25 min mark).
 *
 * Body: { token: string }
 */
router.post('/refresh', async (req, res, next) => {
    try {
        const { token } = req.body as { token?: string };

        if (!token) {
            res.status(400).json({ error: 'Missing token in request body', status: 400 });
            return;
        }

        const refreshed = await directLineService.refreshToken(token);

        res.json({
            token: refreshed.token,
            expiresIn: refreshed.expiresIn,
        });
    } catch (err) {
        next(err);
    }
});

export default router;
