// Imports removed as they are no longer used by the deprecated function


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

/**
 * @deprecated This function is deprecated. 
 * Use the `useMsal` hook in your components (e.g. ChatPane.tsx) or `useAuth` hook for token acquisition.
 * This function creates race conditions by not checking `InteractionStatus`.
 */
export async function acquireToken(): Promise<string> {
    throw new Error("Deprecated. Use proper MSAL hooks instead.");
}
