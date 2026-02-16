
import Dexie, { type Table } from 'dexie';
import type { Activity } from 'botframework-directlinejs';

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
    activities: Activity[];       // Cached message history
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
