import { useCallback } from 'react';
import { useMsal, useAccount } from '@azure/msal-react';
import { InteractionRequiredAuthError, InteractionStatus } from '@azure/msal-browser';
import { loginRequest, apiTokenRequest, consentRequest } from './msalConfig';

/**
 * Custom auth hook exposing MSAL state and actions.
 *
 * Pattern adapted from sample's acquireToken.ts:
 * - Try acquireTokenSilent first
 * - Fall back to acquireTokenPopup on InteractionRequiredAuthError
 *
 * code-organization.md §3.1 — auth/ module contract:
 * useAuth() → { account, login, logout, getToken }
 */
export function useAuth() {
    const { instance, accounts, inProgress } = useMsal();
    const account = useAccount(accounts[0] ?? null);
    const isAuthenticated = accounts.length > 0;

    /**
     * Trigger interactive login (Redirect).
     * PRD §FR1.1 — Azure AD OAuth 2.0 + PKCE.
     * Switched to Redirect flow to avoid popup blocking and extension interference.
     */
    const login = useCallback(async () => {
        if (inProgress !== InteractionStatus.None) return;
        try {
            await instance.loginRedirect(loginRequest);
        } catch (error) {
            console.error("Login failed:", error);
        }
    }, [instance, inProgress]);

    // Expose loginRedirect simply as an alias to login (or instance.loginRedirect) if needed
    // But forcing the standard login request is safer.
    // For manual connection with specific scopes, we might expose the raw method or an overload.
    const loginRedirect = useCallback(async (request?: any) => {
        // If we are already handling a redirect, don't try to redirect again immediately
        if (inProgress !== InteractionStatus.None && inProgress !== InteractionStatus.Startup) return;

        try {
            await instance.acquireTokenRedirect(request || loginRequest);
        } catch (error) {
            console.error("Login Redirect failed:", error);
            throw error;
        }
    }, [instance, inProgress]);


    /**
     * Logout and clear MSAL cache.
     */
    const logout = useCallback(async () => {
        if (inProgress !== InteractionStatus.None) return;

        await instance.logoutRedirect({
            postLogoutRedirectUri: window.location.origin,
        });
    }, [instance, inProgress]);

    /**
     * Acquire an access token silently, falling back to popup.
     * Adapted from sample acquireToken.ts pattern.
     *
     * PRD §FR1.6 — Silent refresh; no re-login unless refresh token expired.
     */
    const getToken = useCallback(async (scopes?: string[]): Promise<string> => {
        if (!account) {
            throw new Error('No authenticated account');
        }

        const request = {
            ...apiTokenRequest,
            scopes: scopes || apiTokenRequest.scopes,
            account,
        };

        try {
            // 1. Try to get token silently
            const response = await instance.acquireTokenSilent(request);
            return response.accessToken;
        } catch (error) {
            // 2. Check if interaction is required (e.g. consent missing)
            if (error instanceof InteractionRequiredAuthError) {
                console.warn('[useAuth] Silent token acquisition failed. Triggering popup for consent...');
                try {
                    // 3. Trigger Popup with "Consent Scopes" to prime the permissions
                    const response = await instance.acquireTokenPopup({
                        ...consentRequest,
                        account,
                    });
                    return response.accessToken;
                } catch (popupError) {
                    console.error('[useAuth] Interactive login failed/cancelled:', popupError);
                    throw popupError;
                }
            }
            throw error;
        }
    }, [account, instance]);

    /**
     * Manuallly trigger the consent popup.
     * Used when the backend reports a "Consent Required" error (AADSTS65001)
     * even though the frontend token acquisition succeeded.
     */
    const consent = useCallback(async (): Promise<string> => {
        if (!account) throw new Error('No authenticated account');
        try {
            const response = await instance.acquireTokenPopup({
                ...consentRequest,
                account,
            });
            return response.accessToken;
        } catch (error) {
            console.error('[useAuth] Consent popup failed:', error);
            throw error;
        }
    }, [account, instance]);

    return {
        account,
        isAuthenticated,
        inProgress,
        login,
        loginRedirect,
        logout,
        getToken,
        consent,
    };
}
