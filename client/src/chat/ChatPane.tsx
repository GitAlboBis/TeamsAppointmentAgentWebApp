import { Components, hooks } from 'botframework-webchat';
import { FluentThemeProvider } from 'botframework-webchat-fluent-theme';
import {
    Spinner,
    MessageBar,
    MessageBarBody,
    Button,
    makeStyles,
    tokens,
} from '@fluentui/react-components';
import { useDirectLine } from './useDirectLine';
import { createActivityMiddleware, createAttachmentMiddleware } from './webchatMiddleware';
import { ChatInput } from './ChatInput';
import { useSSOInterceptor } from './useSSOInterceptor';

const { BasicWebChat, Composer } = Components;
const { useSendMessage } = hooks;

const useStyles = makeStyles({
    container: {
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        height: '100%',
        overflow: 'hidden',
    },
    webchatWrapper: {
        flex: 1,
        overflow: 'hidden',
        // Ensure WebChat takes full space but leaves room for input
        display: 'flex',
        flexDirection: 'column',
    },
    loading: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        height: '100%',
    },
    error: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        flex: 1,
        padding: '24px',
    },
});

/**
 * Inner layout component that has access to WebChat hooks.
 * Renders the BasicWebChat (without send box) and our custom ChatInput.
 */
function ChatLayout() {
    const styles = useStyles();
    const sendMessage = useSendMessage();

    return (
        <>
            <div className={styles.webchatWrapper}>
                <BasicWebChat />
            </div>
            <ChatInput onSend={sendMessage} />
        </>
    );
}

/**
 * Chat pane component.
 *
 * Adapted from sample's Chat.tsx:
 *   - Sample: CopilotStudioClient → CopilotStudioWebChatConnection → Composer
 *   - Ours: useDirectLine() → createDirectLine → Composer
 *
 * PRD §FR4.1 — WebChat with WebChatFluentTheme.
 * code-organization.md §4 — Component hierarchy.
 */
export function ChatPane() {
    const styles = useStyles();
    const { directLine, conversationId, isConnecting, error, reconnect } = useDirectLine();
    const { createSSOStoreMiddleware } = useSSOInterceptor(conversationId);

    // Loading state
    if (isConnecting) {
        return (
            <div className={styles.loading}>
                <Spinner size="large" label="Connecting to assistant..." />
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className={styles.error}>
                <MessageBar intent="error">
                    <MessageBarBody>
                        {error.message.includes('AADSTS') || error.message.includes('invalid_grant')
                            ? 'Connection failed: Please ensure you have granted the necessary permissions.'
                            : error.message}
                    </MessageBarBody>
                </MessageBar>
                <Button appearance="primary" onClick={reconnect}>
                    Reconnect
                </Button>
            </div>
        );
    }

    // Connected — render WebChat
    if (!directLine) return null;

    return (
        <div className={styles.container}>
            <FluentThemeProvider>
                <Composer
                    directLine={directLine}
                    // @ts-ignore
                    storeMiddleware={createSSOStoreMiddleware()}
                    activityMiddleware={createActivityMiddleware()}
                    attachmentMiddleware={createAttachmentMiddleware()}
                    styleOptions={{
                        hideUploadButton: true,
                        hideSendBox: true,
                        bubbleBackground: tokens.colorNeutralBackground1,
                        bubbleFromUserBackground: tokens.colorBrandBackground,
                        bubbleFromUserTextColor: tokens.colorNeutralForegroundOnBrand,
                    }}
                >
                    <ChatLayout />
                </Composer>
            </FluentThemeProvider>
        </div>
    );
}
