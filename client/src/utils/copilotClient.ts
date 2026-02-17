import { InteractionRequiredAuthError, BrowserAuthError } from '@azure/msal-browser';
import { msalInstance, msalReady } from '../auth/msalConfig';

import {
    COPILOT_APP_CLIENT_ID,
    COPILOT_TENANT_ID,
    COPILOT_ENV_ID,
    COPILOT_AGENT_ID
} from '../shared/constants';

export const agentsSettings = {
    appClientId: COPILOT_APP_CLIENT_ID,
    tenantId: COPILOT_TENANT_ID,
    environmentId: COPILOT_ENV_ID,
    agentIdentifier: COPILOT_AGENT_ID,
};

export async function acquireToken(): Promise<string> {
    // Ensure MSAL is initialized
    await msalReady;

    const account = msalInstance.getActiveAccount();
    if (!account) {
        const accounts = msalInstance.getAllAccounts();
        if (accounts.length > 0) {
            msalInstance.setActiveAccount(accounts[0]);
        } else {
            throw new Error('No active account found. Please log in first.');
        }
    }

    const loginRequest = {
        // 'https://api.powerplatform.com/.default' includes 'Copilot Studio.Copilots.Invoke'
        // provided it was added to the App Registration in Azure AD.
        scopes: ['https://api.powerplatform.com/.default'],
        account: msalInstance.getActiveAccount()!
    };

    try {
        const response = await msalInstance.acquireTokenSilent(loginRequest);
        return response.accessToken;
    } catch (e: unknown) {
        if (e instanceof InteractionRequiredAuthError ||
            (e instanceof BrowserAuthError && (e.errorCode === 'block_nested_popups' || e.errorCode === 'interaction_in_progress' || e.errorCode === 'timed_out' || e.errorCode === 'monitor_window_timeout'))) {
            // Do NOT automatically popup. High risk of race conditions with main.tsx redirect handling.
            // Throwing an error allows the UI to show a "Connect" button for manual interaction.
            throw new Error("Additional permissions required. Please click 'Connect' to authorize.");
        }
        throw e;
    }
}
