
import { Button, makeStyles, tokens, Text } from '@fluentui/react-components';
import { Add24Regular } from '@fluentui/react-icons';
import { useSessionStore } from './useSessionStore';
import { SessionItem } from './SessionItem';
import type { ChatSession } from './sessionDb';

const useStyles = makeStyles({
    container: {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: '16px',
        gap: '16px',
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    list: {
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        overflowY: 'auto',
    },
});

export function Sidebar() {
    const styles = useStyles();
    const { sessions, activeSessionId, switchSession, deleteSession } = useSessionStore();

    // Placeholder for handleNewChat
    const handleNewChat = async () => {
        // In real flow, this would probably trigger a specialized action that also
        // tells the ChatPane to reset. For now, we'll just create a placeholder session entry.
        // But wait, createSession requires a conversationId token etc.
        // We probably need to lift the "creation" logic to a higher level or
        // let ChatPane handle the initial creation and then sync to DB.

        // Phase 3 MVP: Just alert for now or implement a "stub" session
        // that gets populated when ChatPane connects?
        console.log("New Chat clicked");
    };

    return (
        <div className={styles.container}>
            <Button
                appearance="primary"
                icon={<Add24Regular />}
                size="large"
                onClick={handleNewChat}
            >
                New Chat
            </Button>

            <div className={styles.list}>
                {sessions?.map((session: ChatSession) => (
                    <SessionItem
                        key={session.sessionId}
                        session={session}
                        isActive={session.sessionId === activeSessionId}
                        onSelect={() => switchSession(session.sessionId)}
                        onDelete={() => deleteSession(session.sessionId)}
                    />
                ))}

                {(!sessions || sessions.length === 0) && (
                    <Text align="center" style={{ color: tokens.colorNeutralForeground3, marginTop: '20px' }}>
                        No history yet
                    </Text>
                )}
            </div>
        </div>
    );
}
