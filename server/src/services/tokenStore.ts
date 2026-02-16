/**
 * In-memory cache for Graph tokens keyed by conversationId.
 * Used by the SSO flow: the OBO-acquired Graph token is stored here
 * after DL token generation, and retrieved when the bot emits an OAuthCard.
 */

interface TokenEntry {
    token: string;
    expiresAt: number;
}

const store = new Map<string, TokenEntry>();

/**
 * Store a Graph token associated with a Direct Line conversation.
 */
export function set(
    conversationId: string,
    graphToken: string,
    expiresInSeconds: number
): void {
    store.set(conversationId, {
        token: graphToken,
        expiresAt: Date.now() + expiresInSeconds * 1000,
    });
}

/**
 * Retrieve a Graph token for a conversation.
 * Returns `null` if the token has expired or does not exist.
 */
export function get(conversationId: string): string | null {
    const entry = store.get(conversationId);

    if (!entry) return null;

    if (Date.now() >= entry.expiresAt) {
        store.delete(conversationId);
        return null;
    }

    return entry.token;
}

/**
 * Remove a token entry (e.g., when conversation ends).
 */
export function remove(conversationId: string): void {
    store.delete(conversationId);
}
