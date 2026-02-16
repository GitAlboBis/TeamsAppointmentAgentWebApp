import { ToggleButton, Tooltip, makeStyles, tokens } from '@fluentui/react-components';
import { Mic24Regular, Mic24Filled } from '@fluentui/react-icons';
import { useSpeech } from './useSpeech';
import { useEffect } from 'react';

const useStyles = makeStyles({
    listening: {
        color: tokens.colorPaletteRedForeground1,
        backgroundColor: tokens.colorPaletteRedBackground1,
        border: `1px solid ${tokens.colorPaletteRedBorder1}`,
        ':hover': {
            backgroundColor: tokens.colorPaletteRedBackground2,
            color: tokens.colorPaletteRedForeground2,
        },
        ':active': {
            backgroundColor: tokens.colorPaletteRedBackground3,
        },
        // Simple pulse animation
        animationName: {
            '0%': { boxShadow: `0 0 0 0 ${tokens.colorPaletteRedBackground2}` },
            '70%': { boxShadow: `0 0 0 6px ${tokens.colorPaletteRedBackground1}` },
            '100%': { boxShadow: `0 0 0 0 ${tokens.colorPaletteRedBackground1}` },
        },
        animationDuration: '1.5s',
        animationIterationCount: 'infinite',
    },
});

interface MicButtonProps {
    onTranscript: (text: string) => void;
    onInterim: (text: string) => void;
    disabled?: boolean;
}

export function MicButton({ onTranscript, onInterim, disabled }: MicButtonProps) {
    const styles = useStyles();
    const { isListening, interimText, startListening, stopListening, error } = useSpeech();

    // Propagate interim text up to parent (ChatInput)
    useEffect(() => {
        onInterim(interimText);
    }, [interimText, onInterim]);

    // Handle button click
    const handleClick = () => {
        if (isListening) {
            stopListening();
        } else {
            startListening((text) => {
                onTranscript(text);
            });
        }
    };

    // If there's an error, maybe log it or show a tooltip? (PRD §FR2.8 just says visual indicator)
    const tooltipContent = error
        ? `Error: ${error}`
        : isListening
            ? 'Listening...'
            : 'Use voice input';

    return (
        <Tooltip content={tooltipContent} relationship="label">
            <ToggleButton
                icon={isListening ? <Mic24Filled /> : <Mic24Regular />}
                checked={isListening}
                onClick={handleClick}
                disabled={disabled}
                appearance={isListening ? 'primary' : 'subtle'}
                className={isListening ? styles.listening : undefined}
                aria-label={isListening ? 'Stop listening' : 'Start voice input'}
            />
        </Tooltip>
    );
}
