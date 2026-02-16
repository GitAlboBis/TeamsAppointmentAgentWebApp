import { useState, useCallback, type KeyboardEvent } from 'react';
import {
    Input,
    Button,
    makeStyles,
    tokens,
} from '@fluentui/react-components';
import { Send24Regular } from '@fluentui/react-icons';
import { MicButton } from '../speech/MicButton';

const useStyles = makeStyles({
    container: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '12px 16px',
        borderTop: `1px solid ${tokens.colorNeutralStroke1}`,
        backgroundColor: tokens.colorNeutralBackground1,
    },
    input: {
        flex: 1,
    },
});

interface ChatInputProps {
    onSend: (text: string) => void;
    disabled?: boolean;
}

/**
 * Custom chat input with text field, mic button placeholder, and send button.
 * PRD §FR4.5 — Keyboard (Enter) + microphone input.
 * code-organization.md §4 — ChatInput with Input + MicButton + Send.
 */
export function ChatInput({ onSend, disabled = false }: ChatInputProps) {
    const styles = useStyles();
    const [text, setText] = useState('');

    const handleSend = useCallback(() => {
        const trimmed = text.trim();
        if (!trimmed) return;
        onSend(trimmed);
        setText('');
    }, [text, onSend]);

    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
            }
        },
        [handleSend]
    );

    return (
        <div className={styles.container}>
            {/* Mic button — Real-time speech-to-text */}
            <MicButton
                onInterim={(interim) => setText(interim)}
                onTranscript={(final) => {
                    // Auto-send on final result
                    onSend(final);
                    setText('');
                }}
                disabled={disabled}
            />

            <Input
                className={styles.input}
                placeholder="Type a message..."
                value={text}
                onChange={(_e, data) => setText(data.value)}
                onKeyDown={handleKeyDown}
                disabled={disabled}
            />

            <Button
                icon={<Send24Regular />}
                appearance="primary"
                onClick={handleSend}
                disabled={disabled || !text.trim()}
                title="Send message"
            />
        </div>
    );
}
