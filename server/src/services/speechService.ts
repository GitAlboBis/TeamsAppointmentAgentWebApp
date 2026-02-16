import { env } from '../config/env.js';

/**
 * Issue a short-lived authorization token for the Azure Speech SDK.
 *
 * The client uses this token instead of the subscription key directly,
 * so the key is never exposed to the browser (PRD §FR2.7).
 *
 * Token lifetime: 10 minutes (Azure default).
 * Endpoint: POST https://{region}.api.cognitive.microsoft.com/sts/v1.0/issueToken
 */
export async function issueToken(): Promise<{ token: string; region: string }> {
    const url = `https://${env.SPEECH_REGION}.api.cognitive.microsoft.com/sts/v1.0/issueToken`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Ocp-Apim-Subscription-Key': env.SPEECH_KEY,
            'Content-Length': '0',
        },
    });

    if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText);
        throw new Error(`Speech token request failed (${response.status}): ${errorText}`);
    }

    const token = await response.text();

    return { token, region: env.SPEECH_REGION };
}
