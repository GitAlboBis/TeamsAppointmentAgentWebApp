// ── Backend API Response Types ──

/** POST /api/directline/token */
export interface DirectLineTokenResponse {
    token: string;
    conversationId: string;
    expiresIn: number;
}

/** POST /api/directline/refresh */
export interface DirectLineRefreshResponse {
    token: string;
    expiresIn: number;
}

/** GET /api/speech/token (Phase 2) */
export interface SpeechTokenResponse {
    token: string;
    region: string;
}
