import { useState, useEffect, useRef, useCallback } from 'react';
import { createDirectLine } from 'botframework-webchat';
import { useAuth } from '@/auth/useAuth';
import { apiPost } from '@/shared/api';
import { DL_TOKEN_REFRESH_MARGIN_MS } from '@/shared/constants';
import type { DirectLineTokenResponse, DirectLineRefreshResponse } from '@/shared/types';

/**
 * Hook for managing Direct Line connection lifecycle.
 *
 * Flow (per PRD §2.1 and code-organization.md §6.1):
 *   1. getToken() → user access token
 *   2. POST /api/directline/token → { dlToken, conversationId, expiresIn }
 *   3. createDirectLine({ token: dlToken })
 *   4. Set up refresh timer at (expiresIn - 5min)
 *
 * Adapted from sample's Chat.tsx useEffect pattern.
 */
export function useDirectLine() {
    const { getToken, account } = useAuth();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [directLine, setDirectLine] = useState<any>(null);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const currentTokenRef = useRef<string | null>(null);
    const initializingRef = useRef(false);

    /**
     * Schedule token refresh before expiry.
     */
    const scheduleRefresh = useCallback(
        (token: string, expiresInMs: number) => {
            if (refreshTimerRef.current) {
                clearTimeout(refreshTimerRef.current);
            }

            // Refresh 5 minutes before expiry, or in 10s if expiring very soon
            const refreshIn = Math.max(expiresInMs - DL_TOKEN_REFRESH_MARGIN_MS, 10_000);

            refreshTimerRef.current = setTimeout(async () => {
                try {
                    const userToken = await getToken();
                    if (!userToken) return;

                    const refreshed = await apiPost<DirectLineRefreshResponse>(
                        '/directline/refresh',
                        { token },
                        userToken
                    );
                    currentTokenRef.current = refreshed.token;
                    // Recursively schedule next refresh
                    scheduleRefresh(refreshed.token, refreshed.expiresIn * 1000);
                } catch (err) {
                    console.error('[useDirectLine] Token refresh failed:', err);
                    // Don't kill the connection immediately on refresh failure,
                    // but user might eventually get disconnected by the bot.
                    // We could set error here if we want to force reconnect UI.
                }
            }, refreshIn);
        },
        [getToken]
    );

    /**
     * Initialize the Direct Line connection.
     */
    const connect = useCallback(async () => {
        if (initializingRef.current || directLine) return;

        initializingRef.current = true;
        setIsConnecting(true);
        setError(null);

        try {
            const userToken = await getToken();
            if (!userToken) {
                throw new Error('User not authenticated');
            }

            // POST to backend — triggers DL token generation (bypassing OBO)
            // PRD §FR1.4 — Pass user ID for backend Direct Line scoping
            const response = await apiPost<DirectLineTokenResponse>(
                '/directline/token',
                { userId: account?.homeAccountId },
                userToken
            );

            // Create WebChat Direct Line adapter
            // PRD §FR1.4 — Pass user ID for backend token exchange scoping
            const dlObject = createDirectLine({
                token: response.token,
            });

            setDirectLine(dlObject);
            setConversationId(response.conversationId);
            currentTokenRef.current = response.token;

            // Schedule refresh
            scheduleRefresh(response.token, response.expiresIn * 1000);

        } catch (err) {
            console.error('[useDirectLine] Connection failed:', err);

            // Hybrid Auth: We removed the "Consent Required" logic because we are not asking
            // for the custom scope anymore. Admin Consent should not be triggered.

            setError(err instanceof Error ? err : new Error('Failed to connect'));
            setDirectLine(null);
            setConversationId(null);
        } finally {
            setIsConnecting(false);
            initializingRef.current = false;
        }
    }, [getToken, account, directLine, scheduleRefresh]);

    // Initial connection on mount (if authenticated)
    useEffect(() => {
        if (account && !directLine && !isConnecting && !error) {
            connect();
        }

        return () => {
            if (refreshTimerRef.current) {
                clearTimeout(refreshTimerRef.current);
            }
        };
    }, [account, connect, directLine, isConnecting, error]);

    // Force reconnect handler
    const reconnect = useCallback(() => {
        setDirectLine(null);
        setConversationId(null);
        setError(null);
        initializingRef.current = false;
        // The useEffect will trigger connect() again because directLine is null
    }, []);

    return {
        directLine,
        conversationId,
        isConnecting,
        error,
        reconnect
    };
}
