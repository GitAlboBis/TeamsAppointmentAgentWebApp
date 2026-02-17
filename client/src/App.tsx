import { AuthenticatedTemplate, UnauthenticatedTemplate } from '@azure/msal-react';
import { MainLayout } from './layout/MainLayout';
import { ChatPane } from './chat/ChatPane';
import { LoginPage } from './auth/LoginPage';
import { SessionProvider } from './sessions/SessionContext';

/**
 * Root application component.
 *
 * code-organization.md §4 — Component hierarchy:
 *   - UnauthenticatedTemplate → LoginPage
 *   - AuthenticatedTemplate → MainLayout → ChatPane
 *
 * PRD §FR1.5 — Branded login before any chat UI.
 */
export default function App() {
    return (
        <>
            <UnauthenticatedTemplate>
                <LoginPage />
            </UnauthenticatedTemplate>

            <AuthenticatedTemplate>
                <SessionProvider>
                    <MainLayout>
                        <ChatPane />
                    </MainLayout>
                </SessionProvider>
            </AuthenticatedTemplate>
        </>
    );
}
