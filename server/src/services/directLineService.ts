import { env } from '../config/env.js';

const DL_BASE_URL = env.DIRECT_LINE_ENDPOINT || 'https://directline.botframework.com/v3/directline';

export interface DirectLineTokenResponse {
    token: string;
    conversationId: string;
    expiresIn: number;
}

export interface DirectLineRefreshResponse {
    token: string;
    expiresIn: number;
}

/**
 * Generate a user-scoped Direct Line token from the DL secret.
 *
 * Per PRD §6.1: The token is scoped to the user via `user.id` = Azure AD OID
 * and `user.name` = display name.
 */
export async function generateToken(
    userId: string,
    userName: string
): Promise<DirectLineTokenResponse> {
    const response = await fetch(`${DL_BASE_URL}/tokens/generate`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${env.DIRECT_LINE_SECRET}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            user: { id: userId, name: userName },
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        const error = new Error(
            `Direct Line token generation failed (${response.status}): ${errorText}`
        ) as Error & { status?: number };
        error.status = response.status === 403 ? 403 : 502;
        throw error;
    }

    const data = (await response.json()) as {
        token: string;
        conversationId: string;
        expires_in: number;
    };

    return {
        token: data.token,
        conversationId: data.conversationId,
        expiresIn: data.expires_in,
    };
}

/**
 * Refresh an existing Direct Line token before it expires.
 *
 * Per PRD §6.1: DL tokens are short-lived (30 min default).
 * The frontend calls this proactively at ~25 min.
 */
export async function refreshToken(
    existingToken: string
): Promise<DirectLineRefreshResponse> {
    const response = await fetch(`${DL_BASE_URL}/tokens/refresh`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${existingToken}`,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        const errorText = await response.text();
        const error = new Error(
            `Direct Line token refresh failed (${response.status}): ${errorText}`
        ) as Error & { status?: number };
        error.status = response.status === 401 ? 401 : 502;
        throw error;
    }

    const data = (await response.json()) as {
        token: string;
        expires_in: number;
    };

    return {
        token: data.token,
        expiresIn: data.expires_in,
    };
}
