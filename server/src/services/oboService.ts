import { ConfidentialClientApplication } from '@azure/msal-node';
import { env } from '../config/env.js';

export interface OboTokenResponse {
    graphToken: string;
    expiresOn: number; // epoch ms
}

/**
 * MSAL ConfidentialClientApplication — single instance.
 * Used for the On-Behalf-Of (OBO) flow to exchange a user's access token
 * for a Microsoft Graph token.
 */
const cca = new ConfidentialClientApplication({
    auth: {
        clientId: env.AZURE_AD_CLIENT_ID,
        clientSecret: env.AZURE_AD_CLIENT_SECRET,
        authority: `https://login.microsoftonline.com/${env.AZURE_AD_TENANT_ID}`,
    },
});

/**
 * Exchange a user's Azure AD access token for a Microsoft Graph token
 * via the On-Behalf-Of (OBO) grant.
 *
 * Per PRD §6.2: The Graph token is acquired with scopes
 * `Calendars.ReadWrite` and `User.Read` so Power Automate flows
 * can call Graph as the logged-in user.
 */
export async function exchangeToken(
    userAccessToken: string
): Promise<OboTokenResponse> {
    const result = await cca.acquireTokenOnBehalfOf({
        oboAssertion: userAccessToken,
        scopes: [
            'https://graph.microsoft.com/Calendars.ReadWrite',
            'https://graph.microsoft.com/User.Read',
        ],
    });

    if (!result) {
        const error = new Error('OBO token exchange returned null') as Error & { status?: number };
        error.status = 502;
        throw error;
    }

    return {
        graphToken: result.accessToken,
        expiresOn: result.expiresOn ? result.expiresOn.getTime() : Date.now() + 3600 * 1000,
    };
}
