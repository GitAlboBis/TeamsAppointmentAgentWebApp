import { useEffect, useState, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '../auth/useAuth';
import { InteractionStatus } from '@azure/msal-browser';
import {
    CopilotStudioClient,
    CopilotStudioWebChat,
    type CopilotStudioWebChatConnection,
    type ConnectionSettings
} from '@microsoft/agents-copilotstudio-client';
import ReactWebChat from 'botframework-webchat';
import { FluentThemeProvider } from 'botframework-webchat-fluent-theme';
import { agentsSettings } from '../shared/constants';
import { Spinner, MessageBar, MessageBarBody, Button } from '@fluentui/react-components';
import { ChatInput } from './ChatInput';
import { useSessionStore } from '../sessions/useSessionStore';

export const ChatPane = () => {
    // Use custom auth hook (Refactored to separate concerns)
    const { inProgress, getToken, loginRedirect } = useAuth();

    // Use global session store
    const { activeSessionId, createSession } = useSessionStore();

    const [connection, setConnection] = useState<CopilotStudioWebChatConnection | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isCreatingSession, setIsCreatingSession] = useState(false);

    const webchatSettings = {
        showTyping: true,
        styleOptions: {
            hideSendBox: true,
        }
    };

    const connectionRef = useRef<CopilotStudioWebChatConnection | null>(null);

    const cleanupConnection = useCallback(() => {
        if (connectionRef.current) {
            connectionRef.current.end();
            connectionRef.current = null;
        }
    }, []);

    const initializeChat = useCallback((token: string) => {
        cleanupConnection();

        const client = new CopilotStudioClient(
            agentsSettings as ConnectionSettings,
            token
        );
        const newConnection = CopilotStudioWebChat.createConnection(client, webchatSettings);

        newConnection.activity$.subscribe((activity) => {
            if (activeSessionId && activity.type === 'message') {
                // Future persistence logic here
            }
        });

        connectionRef.current = newConnection;
        setConnection(newConnection);
    }, [activeSessionId, cleanupConnection]);

    const connectToCopilot = useCallback(async () => {
        if (inProgress !== InteractionStatus.None) return;

        try {
            // Use enhanced useAuth with specific Power Platform scope
            const token = await getToken(['https://api.powerplatform.com/.default']);
            if (!token) return;

            initializeChat(token);

        } catch (err) {
            console.error("Failed to connect:", err);
            setError(err instanceof Error ? err.message : "Failed to connect");
        }
    }, [getToken, initializeChat, inProgress]);

    useEffect(() => {
        // Simple connectivity check on mount or session change
        // We might want to defer this until user interaction for "New Chat" 
        // but for now we keep it eager to be ready.
        connectToCopilot();

        return () => {
            cleanupConnection();
            setConnection(null);
        };
    }, [activeSessionId, connectToCopilot, cleanupConnection]);

    const handleManualConnect = () => {
        setError(null);
        console.log("[ChatPane] Initiating redirect for manual connection...");
        // Use exposed method from useAuth
        loginRedirect({
            scopes: ['https://api.powerplatform.com/.default'],
            prompt: 'select_account'
        }).catch(e => {
            console.error("[ChatPane] Redirect initiation failed:", e);
            setError("Failed to initiate login redirect: " + (e.message || "Unknown error"));
        });
    };

    const handleSend = async (text: string) => {
        if (!text.trim()) return;

        if (!activeSessionId && !isCreatingSession) {
            setIsCreatingSession(true);
            try {
                const token = await getToken(['https://api.powerplatform.com/.default']);
                // Create local session placeholder
                // Create local session placeholder
                await createSession("placeholder-conv-id", token, 3600);

                if (connection) {
                    const activity = {
                        type: 'message',
                        id: uuidv4(),
                        from: { id: 'user' }, // useAuth could provide account.localAccountId if needed
                        text: text.trim(),
                    };
                    connection.postActivity(activity as any).subscribe({
                        error: (err) => console.error("Error posting activity:", err)
                    });
                    // Sync session details if needed after first message
                }

            } catch (e) {
                console.error("Error starting chat:", e);
            } finally {
                setIsCreatingSession(false);
            }
        } else if (connection) {
            const activity = {
                type: 'message',
                id: uuidv4(),
                from: { id: 'user' },
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
                <ReactWebChat
                    directLine={connection}
                    styleOptions={webchatSettings.styleOptions}
                />
            </FluentThemeProvider>
            <ChatInput onSend={handleSend} disabled={!connection} />
        </div>
    );
};
