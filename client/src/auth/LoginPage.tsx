import {
    Card,
    CardHeader,
    CardPreview,
    Button,
    Title1,
    Body1,
    makeStyles,
    tokens,
} from '@fluentui/react-components';
import { ChatBubblesQuestion24Regular } from '@fluentui/react-icons';
import { useAuth } from './useAuth';

const useStyles = makeStyles({
    container: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: tokens.colorNeutralBackground2,
    },
    card: {
        width: '400px',
        maxWidth: '90vw',
        padding: '32px',
        textAlign: 'center',
    },
    icon: {
        display: 'flex',
        justifyContent: 'center',
        marginBottom: '16px',
        fontSize: '48px',
        color: tokens.colorBrandForeground1,
    },
    title: {
        marginBottom: '8px',
    },
    description: {
        marginBottom: '24px',
        color: tokens.colorNeutralForeground2,
    },
});

/**
 * Branded login page rendered when user is not authenticated.
 * PRD §FR1.5 — Branded login page before any chat UI is rendered.
 */
export function LoginPage() {
    const styles = useStyles();
    const { login, inProgress } = useAuth();
    const isBusy = inProgress !== 'none'; // 'none' is the string value of InteractionStatus.None

    return (
        <div className={styles.container}>
            <Card className={styles.card}>
                <CardPreview>
                    <div className={styles.icon}>
                        <ChatBubblesQuestion24Regular />
                    </div>
                </CardPreview>
                <CardHeader
                    header={<Title1 className={styles.title}>Appointment Agent</Title1>}
                    description={
                        <Body1 className={styles.description}>
                            Sign in with your Microsoft account to start booking appointments
                            with your AI assistant.
                        </Body1>
                    }
                />
                <Button
                    appearance="primary"
                    size="large"
                    onClick={login}
                    disabled={isBusy}
                >
                    {isBusy ? 'Signing in...' : 'Sign in with Microsoft'}
                </Button>

                {isBusy && (
                    <div style={{ marginTop: '16px' }}>
                        <Button
                            appearance="subtle"
                            size="small"
                            onClick={() => {
                                localStorage.clear();
                                sessionStorage.clear();
                                window.location.reload();
                            }}
                        >
                            Reset Login State
                        </Button>
                    </div>
                )}
            </Card>
        </div>
    );
}
