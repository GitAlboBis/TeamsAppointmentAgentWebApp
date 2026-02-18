// ── MSAL / Azure AD ──
export const MSAL_CLIENT_ID = import.meta.env.VITE_MSAL_CLIENT_ID ?? '';
export const MSAL_TENANT_ID = import.meta.env.VITE_MSAL_TENANT_ID ?? '';
export const MSAL_REDIRECT_URI = import.meta.env.VITE_MSAL_REDIRECT_URI ?? window.location.origin;

// ── Copilot Agent Settings ──
export const COPILOT_APP_CLIENT_ID = import.meta.env.VITE_COPILOT_APP_CLIENT_ID ?? '';
export const COPILOT_TENANT_ID = import.meta.env.VITE_COPILOT_TENANT_ID ?? '';
export const COPILOT_ENV_ID = import.meta.env.VITE_COPILOT_ENV_ID ?? '';
export const COPILOT_AGENT_ID = import.meta.env.VITE_COPILOT_AGENT_ID ?? '';

export const agentsSettings = {
    environmentId: COPILOT_ENV_ID,
    schemaName: COPILOT_AGENT_ID,
};

// ── Sidebar ──
export const SIDEBAR_WIDTH = 280;

// ── Speech ──
export const SPEECH_KEY = import.meta.env.VITE_SPEECH_KEY ?? '';
export const SPEECH_REGION = import.meta.env.VITE_SPEECH_REGION ?? '';
