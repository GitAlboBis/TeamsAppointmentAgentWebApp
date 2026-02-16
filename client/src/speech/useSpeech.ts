import { useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from '../auth/useAuth';
import { SpeechService } from './SpeechService';

/**
 * Hook managing the speech recognition lifecycle.
 *
 * @returns {
 *   isListening: boolean,
 *   interimText: string,
 *   startListening: (onFinalResult: (text: string) => void) => Promise<void>,
 *   stopListening: () => void,
 *   error: string | null
 * }
 */
export function useSpeech() {
    const { getToken } = useAuth();
    const [isListening, setIsListening] = useState(false);
    const [interimText, setInterimText] = useState('');
    const [error, setError] = useState<string | null>(null);

    const speechServiceRef = useRef<SpeechService>(new SpeechService());

    const stopListening = useCallback(async () => {
        try {
            await speechServiceRef.current.stop();
        } catch (err) {
            console.error('Error stopping speech service:', err);
        } finally {
            setIsListening(false);
            setInterimText('');
        }
    }, []);

    const startListening = useCallback(
        async (onFinalResult: (text: string) => void) => {
            setError(null);
            setIsListening(true);
            setInterimText('');

            try {
                // Get fresh token (may trigger popup if needed, though usually silent)
                const authToken = await getToken();

                // Start recognition
                await speechServiceRef.current.start(
                    authToken,
                    (interim) => {
                        setInterimText(interim);
                    },
                    (final) => {
                        onFinalResult(final);
                        // Optional: stop automatically after one sentence?
                        // For chat, often yes. Let's start with continuous until manual stop or silence timeout.
                        // Actually, chat apps usually stop after one utterance.
                        // Let's implement auto-stop after final result for typical voice input behavior.
                        stopListening();
                    },
                    (err) => {
                        setError(err);
                        stopListening();
                    }
                );
            } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : String(err);
                setError(msg);
                stopListening();
            }
        },
        [getToken, stopListening]
    );

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            speechServiceRef.current.stop();
        };
    }, []);

    return {
        isListening,
        interimText,
        startListening,
        stopListening,
        error,
    };
}
