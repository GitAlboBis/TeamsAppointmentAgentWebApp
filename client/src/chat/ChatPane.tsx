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
            if (inProgress !== InteractionStatus.None) {
                console.log("[ChatPane] Interaction in progress. Waiting for MSAL to return to idle...");
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
    }, [instance, inProgress, getToken, initializeChat]);

    const handleManualConnect = () => {
        // Clear any stuck error state first
        setError(null);
        console.log("[ChatPane] Initiating redirect for manual connection...");

        instance.acquireTokenRedirect({
            scopes: ['https://api.powerplatform.com/.default'],
            prompt: 'select_account'
        }).catch(e => {
            console.error("[ChatPane] Redirect initiation failed:", e);
            setError("Failed to initiate login redirect: " + (e.message || "Unknown error"));
        });
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
