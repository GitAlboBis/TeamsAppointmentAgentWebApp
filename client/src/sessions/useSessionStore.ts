
import { useState, useCallback } from 'react';
import { db, type ChatSession } from './sessionDb';
import { useAuth } from '@/auth/useAuth';
import { v4 as uuidv4 } from 'uuid';
import { useLiveQuery } from 'dexie-react-hooks';

export function useSessionStore() {
    const { account } = useAuth();
    const userId = account?.localAccountId || 'anonymous';

    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

    // Live query for sidebar list (reactive to DB changes)
    const sessions = useLiveQuery(
        () =>
            userId
                ? db.sessions
                    .where('userId')
                    .equals(userId)
                    .filter((s) => !s.isArchived)
                    .reverse()
                    .sortBy('updatedAt')
                : [],
        [userId]
    );

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

    const updateWatermark = useCallback(async (sessionId: string, watermark: string) => {
        await db.sessions.update(sessionId, { watermark, updatedAt: Date.now() });
    }, []);

    const deleteSession = useCallback(async (sessionId: string) => {
        // Soft delete
        await db.sessions.update(sessionId, { isArchived: true });
        if (activeSessionId === sessionId) {
            setActiveSessionId(null);
        }
    }, [activeSessionId]);

    const switchSession = useCallback((sessionId: string) => {
        setActiveSessionId(sessionId);
    }, []);

    return {
        sessions,
        activeSessionId,
        createSession,
        updateWatermark,
        deleteSession,
        switchSession,
    };
}
