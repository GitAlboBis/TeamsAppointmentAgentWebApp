import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk';
import { apiGet } from '../shared/api';

/**
 * Wrapper for Azure Cognitive Services Speech SDK.
 * Handles token acquisition, recognizer lifecycle, and event bridging.
 */
export class SpeechService {
    private recognizer: SpeechSDK.SpeechRecognizer | null = null;

    /**
     * Starts continuous speech recognition.
     *
     * @param authToken - Azure AD Bearer token for the backend API
     * @param onInterim - Callback for partial results (while speaking)
     * @param onFinal - Callback for final results (sentence completed)
     * @param onError - Callback for errors
     */
    async start(
        authToken: string,
        onInterim: (text: string) => void,
        onFinal: (text: string) => void,
        onError: (error: string) => void
    ) {
        try {
            // 1. Fetch short-lived Speech auth token from backend
            //    GET /api/speech/token → { token, region }
            const { token, region } = await apiGet<{ token: string; region: string }>(
                '/speech/token',
                authToken
            );

            // 2. Configure Speech SDK
            const speechConfig = SpeechSDK.SpeechConfig.fromAuthorizationToken(token, region);
            speechConfig.speechRecognitionLanguage = 'it-IT'; // Default to Italian per PRD/User preference
            // TODO: Make language configurable/dynamic based on user settings

            // 3. Configure Audio (Mic)
            const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();

            // 4. Create Recognizer
            this.recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);

            // 5. Bind Events
            this.recognizer.recognizing = (_s, e) => {
                if (e.result.reason === SpeechSDK.ResultReason.RecognizingSpeech) {
                    onInterim(e.result.text);
                }
            };

            this.recognizer.recognized = (_s, e) => {
                if (e.result.reason === SpeechSDK.ResultReason.RecognizedSpeech) {
                    // Only send non-empty text
                    if (e.result.text && e.result.text.trim()) {
                        onFinal(e.result.text);
                    }
                } else if (e.result.reason === SpeechSDK.ResultReason.NoMatch) {
                    console.log('[SpeechService] SEMAPHORE: No speech could be recognized.');
                }
            };

            this.recognizer.canceled = (_s, e) => {
                const reason = e.reason;
                if (reason === SpeechSDK.CancellationReason.Error) {
                    console.error(`[SpeechService] CANCELED: ErrorDetails=${e.errorDetails}`);
                    onError(e.errorDetails);
                }
                this.stop();
            };

            this.recognizer.sessionStopped = (_s, _e) => {
                console.log('[SpeechService] Session stopped.');
                this.stop();
            };

            // 6. Start Recognition
            await this.recognizer.startContinuousRecognitionAsync();

        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            console.error('[SpeechService] Start failed:', msg);
            onError(msg);
        }
    }

    /**
     * Stops recognition and cleans up resources.
     */
    async stop() {
        if (this.recognizer) {
            try {
                await this.recognizer.stopContinuousRecognitionAsync();
                this.recognizer.close();
            } catch (err) {
                console.warn('[SpeechService] Error stopping recognizer:', err);
            } finally {
                this.recognizer = null;
            }
        }
    }

    /**
     * Validates browser microphone permission (optional helper).
     */
    static async requestMicrophonePermission(): Promise<boolean> {
        try {
            await navigator.mediaDevices.getUserMedia({ audio: true });
            return true;
        } catch (err) {
            console.error('[SpeechService] Mic permission exceeded/denied:', err);
            return false;
        }
    }
}
