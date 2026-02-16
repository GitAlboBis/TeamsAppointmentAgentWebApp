// ── API Endpoints ──
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

// ── MSAL / Azure AD ──
export const MSAL_CLIENT_ID = import.meta.env.VITE_MSAL_CLIENT_ID ?? '';
export const MSAL_TENANT_ID = import.meta.env.VITE_MSAL_TENANT_ID ?? '';
export const MSAL_REDIRECT_URI = import.meta.env.VITE_MSAL_REDIRECT_URI ?? window.location.origin;

// Backend API scope — e.g. api://<backend-app-id>/access_as_user
export const MSAL_API_SCOPE = import.meta.env.VITE_MSAL_API_SCOPE ?? '';

// ── Direct Line ──
export const DL_TOKEN_REFRESH_MARGIN_MS = 5 * 60 * 1000; // Refresh 5 min before expiry

// ── Sidebar ──
export const SIDEBAR_WIDTH = 280;
export const SESSION_TITLE_MAX_LENGTH = 50;
