import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider } from './theme/ThemeContext';
import { AuthProvider } from './auth/AuthProvider';
import App from './App';
import './styles/global.css';

/**
 * Application entry point.
 *
 * code-organization.md §4 — Provider hierarchy:
 *   FluentProvider → MsalProvider → App
 *
 * PRD §FR4.8 — Entire tree wrapped in FluentProvider.
 */
import { msalInstance } from './auth/msalConfig';

// Initialize MSAL and handle any pending redirect response
msalInstance.initialize().then(() => {
    // Optional: Check if we just returned from a redirect
    msalInstance.handleRedirectPromise().then(() => {
        // If tokenResponse is not null, we just logged in.
        // We can check accounts here if needed.
        const accounts = msalInstance.getAllAccounts();
        if (accounts.length > 0) {
            msalInstance.setActiveAccount(accounts[0]);
        }

        ReactDOM.createRoot(document.getElementById('root')!).render(
            <StrictMode>
                <ThemeProvider>
                    <AuthProvider>
                        <App />
                    </AuthProvider>
                </ThemeProvider>
            </StrictMode>
        );
    }).catch(error => {
        console.error("MSAL Redirect Error:", error);
        // Even on error, render the app (so we can show login page / error state)
        ReactDOM.createRoot(document.getElementById('root')!).render(
            <StrictMode>
                <ThemeProvider>
                    <AuthProvider>
                        <App />
                    </AuthProvider>
                </ThemeProvider>
            </StrictMode>
        );
    });
});
