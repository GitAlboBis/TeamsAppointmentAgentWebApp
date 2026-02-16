import { MsalProvider } from '@azure/msal-react';
import { msalInstance } from './msalConfig';
import type { ReactNode } from 'react';

interface AuthProviderProps {
    children: ReactNode;
}

/**
 * Wraps the app tree in MsalProvider.
 * code-organization.md §4 — Component hierarchy: MsalProvider wraps App.
 */
export function AuthProvider({ children }: AuthProviderProps) {
    return <MsalProvider instance={msalInstance}>{children}</MsalProvider>;
}
