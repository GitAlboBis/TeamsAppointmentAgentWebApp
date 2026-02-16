import { AccountInfo, InteractionRequiredAuthError } from '@azure/msal-browser';
import { msalInstance, loginRequest } from '../auth/msalConfig';

/**
 * Authentication Service
 * 
 * Provides methods for managing user authentication and token acquisition
 * outside of the React component tree (e.g., for API interceptors).
 * 
 * For React components, prefer using the `useAuth` hook which wraps this service
 * or uses `@azure/msal-react` context directly.
 */
class AuthService {
    /**
     * Trigger interactive login (popup).
     */
    async login(): Promise<AccountInfo | null> {
        try {
            const response = await msalInstance.loginPopup(loginRequest);
            return response.account;
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        }
    }

    /**
     * Logout and clear MSAL cache.
     */
    async logout(): Promise<void> {
        await msalInstance.logoutPopup({
            postLogoutRedirectUri: window.location.origin,
        });
    }

    /**
     * Acquire an access token silently, falling back to popup if needed.
     * 
     * @param account The user account to acquire the token for.
     */
    async getToken(account: AccountInfo): Promise<string> {
        if (!account) {
            throw new Error('No account provided for token acquisition');
        }

        try {
            const response = await msalInstance.acquireTokenSilent({
                ...loginRequest,
                account,
            });
            return response.accessToken;
        } catch (error) {
            if (error instanceof InteractionRequiredAuthError) {
                const response = await msalInstance.acquireTokenPopup(loginRequest);
                return response.accessToken;
            }
            throw error;
        }
    }

    /**
     * Get the active account from MSAL instance.
     */
    getAccount(): AccountInfo | null {
        const accounts = msalInstance.getAllAccounts();
        return accounts[0] || null;
    }
}

export const authService = new AuthService();
