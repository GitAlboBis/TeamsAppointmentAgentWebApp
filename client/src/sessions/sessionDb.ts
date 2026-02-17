
import Dexie, { type Table } from 'dexie';


export interface ChatSession {
    sessionId: string;            // UUID v4 (primary key)
    conversationId: string;       // Direct Line conversation ID
    userId: string;               // Azure AD OID
    title: string;                // Auto-generated or user-edited
    createdAt: number;            // Date.now()
    updatedAt: number;            // Last message timestamp
    watermark: string | null;     // DL watermark for resume
    token: string;                // Direct Line token
    tokenExpiresAt: number;       // DL token expiry (epoch ms)
    activities: any[];            // Cached message history (Activity[])
    isArchived: boolean;          // Soft-delete flag
}

class AppDatabase extends Dexie {
    sessions!: Table<ChatSession, string>;

    constructor() {
        super('copilot-web-client-db');

        this.version(1).stores({
            // Indexed fields (non-indexed fields are still stored)
            sessions: 'sessionId, userId, updatedAt, isArchived'
        });
    }
}

export const db = new AppDatabase();

export const sessionRepository = {
    async addActivity(sessionId: string, activity: any) {
        await db.sessions.where('sessionId').equals(sessionId).modify(session => {
            if (!session.activities) {
                session.activities = [];
            }
            // Prevent duplicates
            if (!session.activities.some((a: any) => a.id === activity.id)) {
                session.activities.push(activity);
                session.updatedAt = Date.now();
            }
        });
    },

    async getActivities(sessionId: string): Promise<any[]> {
        const session = await db.sessions.get(sessionId);
        return session?.activities || [];
    }
};
