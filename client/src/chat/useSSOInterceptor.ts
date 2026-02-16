import { useCallback, useRef } from 'react';
import { useAuth } from '@/auth/useAuth';
import { apiGet } from '@/shared/api';

/**
 * WebChat activity middleware that intercepts OAuthCard activities
 * for seamless SSO token exchange.
 *
 * PRD §6.2 — Zero-prompt SSO:
 *   1. Bot emits OAuthCard → middleware intercepts
 *   2. Fetch pre-cached Graph token from backend
 *   3. Submit TokenResponse activity → bot completes auth silently
 *
 * code-organization.md §3.1 — useSSOInterceptor module contract
 */
export function useSSOInterceptor(conversationId: string | null) {
    const { getToken } = useAuth();
    const isExchangingRef = useRef(false);

    /**
     * Creates a WebChat activity middleware that handles SSO.
     */
    const createSSOActivityMiddleware = useCallback(
        () =>
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            () => (next: any) => (action: any) => {
                // Intercept incoming activities with OAuthCard attachments
                if (action.type === 'DIRECT_LINE/INCOMING_ACTIVITY') {
                    const { activity } = action.payload;

                    if (
                        activity.type === 'message' &&
                        activity.attachments?.some(
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            (att: any) => att.contentType === 'application/vnd.microsoft.card.oauth'
                        )
                    ) {
                        // Prevent multiple simultaneous exchanges
                        if (!isExchangingRef.current && conversationId) {
                            isExchangingRef.current = true;

                            (async () => {
                                try {
                                    const userToken = await getToken();

                                    // Retrieve pre-cached Graph token from backend
                                    const { token: graphToken } = await apiGet<{ token: string }>(
                                        `/directline/sso/${conversationId}`,
                                        userToken
                                    );

                                    if (graphToken) {
                                        // Submit TokenResponse to complete SSO silently
                                        // The store.dispatch will be handled by the WebChat Composer
                                        action.payload.activity._ssoToken = graphToken;
                                    }
                                } catch (err) {
                                    console.warn('[SSO] Token exchange failed, user will see login card:', err);
                                } finally {
                                    isExchangingRef.current = false;
                                }
                            })();
                        }

                        // Skip rendering the OAuthCard — SSO handles it
                        return;
                    }
                }

                return next(action);
            },
        [conversationId, getToken]
    );

    return { createSSOStoreMiddleware: createSSOActivityMiddleware };
}
