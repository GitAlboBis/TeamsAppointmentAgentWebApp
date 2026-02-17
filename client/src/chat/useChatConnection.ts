import { useState, useEffect, useRef, useCallback } from 'react';
import { createStore } from 'botframework-webchat';
import {
    CopilotStudioClient,
    CopilotStudioWebChat,
    type CopilotStudioWebChatConnection,
    type ConnectionSettings
} from '@microsoft/agents-copilotstudio-client';
import { sessionRepository } from '../sessions/sessionDb';
import { agentsSettings } from '../shared/constants';

interface UseChatConnectionProps {
    token: string | null;
    sessionId: string | null;
}

export const useChatConnection = ({ token, sessionId }: UseChatConnectionProps) => {
    const [connection, setConnection] = useState<CopilotStudioWebChatConnection | null>(null);
    const [store, setStore] = useState<any>(null);
    const [isOnline, setIsOnline] = useState(false);
    const initializingSessionId = useRef<string | null>(null);
    const connectionRef = useRef<CopilotStudioWebChatConnection | null>(null);

    const cleanupConnection = useCallback(() => {
        if (connectionRef.current) {
            connectionRef.current.end();
            connectionRef.current = null;
        }
        setConnection(null);
        setStore(null);
        initializingSessionId.current = null;
    }, []);

    useEffect(() => {
        // If no token or session, or if we're already initializing THIS session, skip
        if (!token || !sessionId || initializingSessionId.current === sessionId) {
            return;
        }

        const init = async () => {
            initializingSessionId.current = sessionId;

            // Cleanup previous connection if any (though we usually rely on unmount)
            if (connectionRef.current) {
                connectionRef.current.end();
            }

            try {
                // 1. Load history
                const initialActivities = await sessionRepository.getActivities(sessionId);

                // 2. Create Store with Middleware
                const newStore = createStore(
                    { activities: initialActivities },
                    () => (next: any) => (action: any) => {
                        if (action.type === 'DIRECT_LINE/INCOMING_ACTIVITY') {
                            const activity = action.payload.activity;
                            if (activity.type === 'message') {
                                sessionRepository.addActivity(sessionId, activity);
                            }
                        } else if (action.type === 'DIRECT_LINE/POST_ACTIVITY_PENDING') {
                            const activity = action.payload.activity;
                            if (activity.type === 'message') {
                                sessionRepository.addActivity(sessionId, activity);
                            }
                        } else if (action.type === 'DIRECT_LINE/CONNECT_FULFILLED') {
                            setIsOnline(true);
                        }
                        return next(action);
                    }
                );

                // 3. Initialize Client
                const client = new CopilotStudioClient(
                    agentsSettings as ConnectionSettings,
                    token
                );

                // 4. Create Connection
                // Note: styleOptions are passed to the View (ReactWebChat), not the connection.
                const newConnection = CopilotStudioWebChat.createConnection(client, {
                    // showTyping: true // Verify if this is valid, keeping it for now if not flagged
                });

                // 5. Subscribe to outgoing activities
                newConnection.activity$.subscribe({
                    next: (activity: any) => {
                        if (activity.type === 'message' && activity.from.role === 'user') {
                            sessionRepository.addActivity(sessionId, activity);
                        }
                    },
                    error: (err: any) => console.error("Activity subscription error:", err)
                });

                connectionRef.current = newConnection;
                setConnection(newConnection);
                setStore(newStore);

            } catch (err) {
                console.error("Failed to initialize chat connection:", err);
                initializingSessionId.current = null;
                cleanupConnection();
            }
        };

        init();

        return () => {
            // Optional: Cleanup on unmount or session change
            // For now, we might want to keep the connection alive if the user just navigates away momentarily?
            // But strictly speaking, if props change, we should probably cleanup.
            // Given the requirements, let's keep it simple and strictly follow the hook lifecycle.
            cleanupConnection();
        };

    }, [token, sessionId, cleanupConnection]);

    return { connection, store, isReady: !!connection && !!store, isOnline };
};
