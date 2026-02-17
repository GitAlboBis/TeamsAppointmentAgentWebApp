import { useEffect, useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '../auth/useAuth';
import { InteractionStatus } from '@azure/msal-browser';
import ReactWebChat from 'botframework-webchat';
import { FluentThemeProvider } from 'botframework-webchat-fluent-theme';
import { Spinner, MessageBar, MessageBarBody, Button } from '@fluentui/react-components';
import { ChatInput } from './ChatInput';
import { useSessionStore } from '../sessions/useSessionStore';
import { useChatConnection } from './useChatConnection';

export const ChatPane = () => {
    // Custom auth hook
    const { inProgress, getToken, loginRedirect } = useAuth();

    // Global session store
    const { activeSessionId, createSession } = useSessionStore();

    // Local state for token management
    const [token, setToken] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isCreatingSession, setIsCreatingSession] = useState(false);
    const [pendingMessage, setPendingMessage] = useState<string | null>(null);

    // Use the custom connection hook
    const { connection, store, isReady, isOnline } = useChatConnection({
        token,
        sessionId: activeSessionId
    });

    const webchatSettings = {
        styleOptions: {
            hideSendBox: true,
            backgroundColor: 'transparent',
        }
    };

    // Ensure we have a token
    const connectToCopilot = useCallback(async () => {
        if (inProgress !== InteractionStatus.None) return;
        if (token) return;

        try {
            const newToken = await getToken(['https://api.powerplatform.com/.default']);
            if (newToken) {
                setToken(newToken);
                setError(null);
            }
        } catch (err) {
            console.error("Failed to connect:", err);
            setError(err instanceof Error ? err.message : "Failed to connect");
        }
    }, [getToken, inProgress, token]);

    // Initial connection attempt
    useEffect(() => {
        connectToCopilot();
    }, [connectToCopilot]);

    const handleManualConnect = () => {
        setError(null);
        console.log("[ChatPane] Initiating redirect for manual connection...");
        loginRedirect({
            scopes: ['https://api.powerplatform.com/.default'],
            prompt: 'select_account'
        }).catch(e => {
            console.error("[ChatPane] Redirect initiation failed:", e);
            setError("Failed to initiate login redirect: " + (e.message || "Unknown error"));
        });
    };

    const sendMessage = useCallback((text: string) => {
        if (!store) return;

        store.dispatch({
            type: 'WEB_CHAT/SEND_MESSAGE',
            payload: { text: text.trim() }
        });
    }, [store]);

    // Send pending message when connection is online
    useEffect(() => {
        if (isOnline && pendingMessage) {
            sendMessage(pendingMessage);
            setPendingMessage(null);
        }
    }, [isOnline, pendingMessage, sendMessage]);

    const handleSend = async (text: string) => {
        if (!text.trim()) return;

        // If no active session, create one
        if (!activeSessionId && !isCreatingSession) {
            setIsCreatingSession(true);
            setPendingMessage(text); // Queue message
            try {
                // Ensure we have a token before creating session
                let currentToken = token;
                if (!currentToken) {
                    currentToken = await getToken(['https://api.powerplatform.com/.default']);
                    setToken(currentToken);
                }

                if (currentToken) {
                    const newSessionId = uuidv4();
                    await createSession(newSessionId, currentToken, 3600);
                }
            } catch (e) {
                console.error("Error starting chat:", e);
                setError("Failed to start chat session.");
                setPendingMessage(null); // Clear on error
            } finally {
                setIsCreatingSession(false);
            }
        } else if (isReady) {
            sendMessage(text);
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

    // If we have an active session but connection is not ready, show spinner
    // If no active session, we show empty chat UI (allowing user to start new chat)
    // If active session exists but not ready, show spinner
    if (activeSessionId && !isReady) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <Spinner size="large" label="Connecting to Copilot..." />
            </div>
        );
    }

    return (
        <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ flexGrow: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <FluentThemeProvider>
                    {isReady ? (
                        <ReactWebChat
                            directLine={connection}
                            store={store}
                            styleOptions={webchatSettings.styleOptions}
                        />
                    ) : (
                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            height: '100%',
                            color: '#666'
                        }}>
                            <p>Start a new conversation</p>
                        </div>
                    )}
                </FluentThemeProvider>
            </div>
            <div style={{ position: 'relative', zIndex: 100 }}>
                <ChatInput onSend={handleSend} disabled={isCreatingSession} />
            </div>
        </div>
    );
};
