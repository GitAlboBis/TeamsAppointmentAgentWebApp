import { useEffect, useState, useCallback } from 'react';
import { useMsal } from '@azure/msal-react';
import { InteractionStatus, InteractionRequiredAuthError, BrowserAuthError } from '@azure/msal-browser';
import {
    CopilotStudioClient,
    CopilotStudioWebChat,
    type CopilotStudioWebChatConnection,
    type ConnectionSettings
} from '@microsoft/agents-copilotstudio-client';
import { Components } from 'botframework-webchat';
import { FluentThemeProvider } from 'botframework-webchat-fluent-theme';
import { agentsSettings } from '../utils/copilotClient';
import { Spinner, MessageBar, MessageBarBody, Button } from '@fluentui/react-components';
import { ChatInput } from './ChatInput';

const { BasicWebChat, Composer } = Components;

export const ChatPane = () => {
    const { instance, inProgress } = useMsal();
    const [connection, setConnection] = useState<CopilotStudioWebChatConnection | null>(null);
    const [error, setError] = useState<string | null>(null);

    const webchatSettings = {
        showTyping: true,
        styleOptions: {
            hideSendBox: true,
        }
    };

    // Helper to start the chat connection with a valid token
    const initializeChat = useCallback((token: string) => {
        const client = new CopilotStudioClient(
            agentsSettings as ConnectionSettings,
            token
        );
        const newConnection = CopilotStudioWebChat.createConnection(client, webchatSettings);
        setConnection(newConnection);
    }, []);

    // Internal helper to get token silently
    const getToken = useCallback(async () => {
        const account = instance.getActiveAccount();
        if (!account) {
            throw new Error("No active account. Please sign in.");
        }

        const loginRequest = {
            scopes: ['https://api.powerplatform.com/.default'],
            account: account
        };

        try {
            const response = await instance.acquireTokenSilent(loginRequest);
            return response.accessToken;
        } catch (e: unknown) {
            console.error("[ChatPane] Silent token acquisition failed:", e);
            if (e instanceof InteractionRequiredAuthError ||
                (e instanceof BrowserAuthError && (e.errorCode === 'block_nested_popups' || e.errorCode === 'interaction_in_progress' || e.errorCode === 'timed_out' || e.errorCode === 'monitor_window_timeout'))) {
                throw new Error("Additional permissions required. Please click 'Connect' to authorize.");
            }
            throw e;
        }
    }, [instance]);

    useEffect(() => {
        let mounted = true;

        const connectToCopilot = async () => {
            // Safety: If MSAL is already busy (e.g. handling a redirect from login), 
            // DO NOT attempt silent token acquisition. It will fail with 'interaction_in_progress'.
            // Instead, we just wait. The user can click "Connect" if needed, 
            // or we could listen to event callbacks (but manual connect is safer for now).
            if (inProgress !== InteractionStatus.None) {
                console.log("[ChatPane] Interaction in progress. Skipping automatic silent token acquisition.");
                // We don't set an error here, we just don't connect yet. 
                // The user sees the "Connect & Authorize" button if they are not connected.
                // Actually, if we just return, the UI might stay in "Spinner" or empty state.
                // Let's set a specific error asking to connect manually if it takes too long? 
                // For now, let's treat it as "needs connection".
                setError("Please connect to Copilot Studio.");
                return;
            }

            try {
                // 1. Acquire Token via MSAL (Silent or Throw)
                const token = await getToken();

                if (!mounted) return;

                // 2. Initialize Chat
                initializeChat(token);

            } catch (err) {
                console.error("Failed to connect to Copilot Studio:", err);
                if (mounted) {
                    setError(err instanceof Error ? err.message : "Failed to connect");
                }
            }
        };

        // Only try to connect if we are authenticated in the main app
        if (instance.getActiveAccount()) {
            connectToCopilot();
        }

        return () => {
            mounted = false;
        };
    }, [instance, inProgress, getToken, initializeChat]); // dependencies updated

    const handleManualConnect = async () => {
        // Clear any stuck error state first to give feedback
        setError(null);

        const waitForIdle = async (maxWaitMs = 5000, intervalMs = 200) => {
            const start = Date.now();
            while (Date.now() - start < maxWaitMs) {
                // We can't easily check internal status without a private property access or hook update.
                // But we can try to yield a bit.
                await new Promise(r => setTimeout(r, intervalMs));
            }
        };

        let retries = 0;
        const MAX_RETRIES = 3;

        while (retries <= MAX_RETRIES) {
            try {
                // Active cleanup of any pending redirect/state
                await instance.handleRedirectPromise().catch(err => console.warn("[ChatPane] Cleanup", err));

                console.log(`[ChatPane] Attempting loginPopup (Attempt ${retries + 1})...`);

                // Use loginPopup
                const response = await instance.loginPopup({
                    scopes: ['https://api.powerplatform.com/.default'],
                    prompt: 'select_account'
                });

                // Success
                initializeChat(response.accessToken);
                return;

            } catch (e: any) {
                console.warn(`[ChatPane] Manual connect error (Attempt ${retries + 1}):`, e);

                const isInteractionError = e.errorCode === 'interaction_in_progress' ||
                    e.message?.includes('interaction_in_progress');

                if (isInteractionError && retries < MAX_RETRIES) {
                    setError("System busy. Retrying...");
                    // Exponential backoff: 2s, 4s, 8s
                    const waitTime = 2000 * Math.pow(2, retries);
                    console.log(`[ChatPane] Waiting ${waitTime}ms...`);
                    await new Promise(r => setTimeout(r, waitTime));
                    retries++;
                } else {
                    if (isInteractionError) {
                        setError("Authentication system is blocked. Please refresh the page.");
                    } else {
                        setError("Connection failed: " + (e.message || "Unknown error"));
                    }
                    return;
                }
            }
        }
    };

    const handleSend = (text: string) => {
        if (connection && text.trim()) {
            const activity = {
                type: 'message',
                from: { id: instance.getActiveAccount()?.localAccountId ?? 'user' },
                text: text.trim(),
            };

            connection.postActivity(activity as any).subscribe({
                error: (err) => console.error("Error posting activity:", err)
            });
        }
    };

    if (error) {
        return (
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', height: '100%', justifyContent: 'center' }}>
                <MessageBar intent="error">
                    <MessageBarBody>
                        {error}
                    </MessageBarBody>
                </MessageBar>

                <Button
                    appearance="primary"
                    onClick={handleManualConnect}
                    disabled={inProgress !== InteractionStatus.None}
                >
                    {inProgress !== InteractionStatus.None ? 'Connecting...' : 'Connect & Authorize'}
                </Button>
            </div>
        );
    }

    if (!connection) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <Spinner size="large" label="Connecting to Copilot..." />
            </div>
        );
    }

    return (
        <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
            <FluentThemeProvider>
                <Composer directLine={connection}>
                    <BasicWebChat />
                </Composer>
            </FluentThemeProvider>
            <ChatInput onSend={handleSend} disabled={!connection} />
        </div>
    );
};
