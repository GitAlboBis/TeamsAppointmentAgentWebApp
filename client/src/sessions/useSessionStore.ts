import { db } from './sessionDb';
import { useAuth } from '@/auth/useAuth';
import { useLiveQuery } from 'dexie-react-hooks';
import { useSessionContext } from './SessionContext';

export function useSessionStore() {
    const { account } = useAuth();
    const userId = account?.localAccountId || 'anonymous';

    // Consume global context instead of local state
    const {
        activeSessionId,
        createSession,
        switchSession,
        deleteSession,
        updateWatermark,
        handleNewChat
    } = useSessionContext();

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

    return {
        sessions,
        activeSessionId,
        createSession,
        updateWatermark,
        deleteSession,
        switchSession,
        handleNewChat
    };
}
