import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { db, type ChatSession } from './sessionDb';
import { useAuth } from '@/auth/useAuth';

interface SessionContextType {
    activeSessionId: string | null;
    createSession: (conversationId: string, token: string, expiresIn: number) => Promise<ChatSession>;
    switchSession: (sessionId: string | null) => void;
    deleteSession: (sessionId: string) => Promise<void>;
    updateWatermark: (sessionId: string, watermark: string) => Promise<void>;
    renameSession: (sessionId: string, newTitle: string) => Promise<void>;
    handleNewChat: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
    const { account } = useAuth();
    const userId = account?.localAccountId || 'anonymous';
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

    // Initial load: Restore last active session if desired, or start fresh
    // For now, we start fresh (null) to show "New Chat" view

    const switchSession = useCallback((sessionId: string | null) => {
        setActiveSessionId(sessionId);
    }, []);

    const handleNewChat = useCallback(() => {
        setActiveSessionId(null);
    }, []);

    const createSession = useCallback(async (conversationId: string, token: string, expiresIn: number) => {
        const newSession: ChatSession = {
            sessionId: uuidv4(),
            conversationId,
            userId,
            title: 'New Chat',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            watermark: null,
            token,
            tokenExpiresAt: Date.now() + expiresIn * 1000,
            activities: [],
            isArchived: false,
        };

        await db.sessions.add(newSession);
        setActiveSessionId(newSession.sessionId);
        return newSession;
    }, [userId]);

    const deleteSession = useCallback(async (sessionId: string) => {
        await db.sessions.update(sessionId, { isArchived: true });
        if (activeSessionId === sessionId) {
            setActiveSessionId(null);
        }
    }, [activeSessionId]);

    const updateWatermark = useCallback(async (sessionId: string, watermark: string) => {
        await db.sessions.update(sessionId, { watermark, updatedAt: Date.now() });
    }, []);

    const renameSession = useCallback(async (sessionId: string, newTitle: string) => {
        await db.sessions.update(sessionId, { title: newTitle, updatedAt: Date.now() });
    }, []);

    return (
        <SessionContext.Provider value={{
            activeSessionId,
            createSession,
            renameSession,
            switchSession,
            deleteSession,
            updateWatermark,
            handleNewChat
        }}>
            {children}
        </SessionContext.Provider>
    );
}

export function useSessionContext() {
    const context = useContext(SessionContext);
    if (!context) {
        throw new Error('useSessionContext must be used within a SessionProvider');
    }
    return context;
}
