import {
    PublicClientApplication,
    type Configuration,
    LogLevel,
    EventType,
    type EventMessage,
    type AuthenticationResult,
} from '@azure/msal-browser';
import { MSAL_CLIENT_ID, MSAL_TENANT_ID, MSAL_REDIRECT_URI } from '@/shared/constants';


const msalConfig: Configuration = {
    auth: {
        clientId: MSAL_CLIENT_ID,
        authority: `https://login.microsoftonline.com/${MSAL_TENANT_ID}`,
        redirectUri: MSAL_REDIRECT_URI,
        postLogoutRedirectUri: MSAL_REDIRECT_URI,
    },
    cache: {
        cacheLocation: 'localStorage',
    },
    system: {
        loggerOptions: {
            logLevel: LogLevel.Warning,
            loggerCallback: (level, message, containsPii) => {
                if (containsPii) return;
                if (level === LogLevel.Error) console.error(message);
                else if (level === LogLevel.Warning) console.warn(message);
            },
        },
    },
};


export const loginRequest = {
    scopes: [
        'openid',
        'profile',
        'User.Read',
    ],
    prompt: 'select_account',
};

export const apiTokenRequest = {
    // We request User.Read as a placeholder to get a valid token, 
    // though the backend won't validate it against the custom scope anymore.
    scopes: ['User.Read'],
};

/**
 * Scopes for the interactive consent fallback.
 * Includes Graph scopes (Calendar, People) to force user consent.
 */
export const consentRequest = {
    scopes: [
        'Calendars.ReadWrite',
        'People.Read',
    ],
};

/**
 * Singleton MSAL PublicClientApplication instance.
 * Adapted from sample's acquireToken.ts pattern.
 *
 * MSAL v5 requires initialize() before any other API calls.
 */
export const msalInstance = new PublicClientApplication(msalConfig);

/** Initialize MSAL — must complete before any auth operations. */
export const msalReady = msalInstance.initialize().then(async () => {
    // Handle redirect promise immediately after initialization
    try {
        await msalInstance.handleRedirectPromise();
    } catch (error: any) {
        // Ignore "no_token_request_cache_error" as it's common when no redirect happened
        if (error?.errorCode !== 'no_token_request_cache_error') {
            console.error("MSAL Redirect Error:", error);
        }
    }

    // Set active account on login success
    msalInstance.addEventCallback((event: EventMessage) => {
        if (event.eventType === EventType.LOGIN_SUCCESS && event.payload) {
            const payload = event.payload as AuthenticationResult;
            const account = payload.account;
            msalInstance.setActiveAccount(account);
        }
    });

    // Check availability of account after redirect
    const accounts = msalInstance.getAllAccounts();
    if (accounts.length > 0) {
        msalInstance.setActiveAccount(accounts[0]);
    }
});
