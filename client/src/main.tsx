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
import { msalReady } from './auth/msalConfig';

// Initialize MSAL (centralized in msalConfig)
msalReady.then(() => {
    // Render App only after MSAL is ready and potential redirects are handled
    ReactDOM.createRoot(document.getElementById('root')!).render(
        // <StrictMode> - Disabled due to botframework-webchat custom element collision
        <ThemeProvider>
            <AuthProvider>
                <App />
            </AuthProvider>
        </ThemeProvider>
        // </StrictMode>
    );
});
