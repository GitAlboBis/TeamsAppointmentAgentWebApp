import { Router, Request, Response } from 'express';
import fetch from 'node-fetch';

const router = Router();

// Environment constraints
const ENVIRONMENT_HOST = '8d663d4d8b46ec73a82e086ecb86df.48.environment.api.powerplatform.com';
const ENVIRONMENT_SCOPE = `https://${ENVIRONMENT_HOST}/.default`;
const DIRECT_LINE_ENDPOINT = `https://${ENVIRONMENT_HOST}/powervirtualagents/botsbyschema/cr239_teamsAppointmentAgent/directline/token?api-version=2022-03-01-preview`;

router.post('/token', async (req: Request, res: Response) => {
    try {
        const { userId } = req.body;

        // Step 1: Get Azure AD Token
        const tenantId = process.env.AZURE_AD_TENANT_ID;
        const clientId = process.env.AZURE_AD_CLIENT_ID;
        const clientSecret = process.env.AZURE_AD_CLIENT_SECRET;

        if (!tenantId || !clientId || !clientSecret) {
            console.error('[TokenRoutes] Missing Azure AD environment variables');
            res.status(500).json({ error: 'Server configuration error' });
            return;
        }

        const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
        const tokenBody = new URLSearchParams();
        tokenBody.append('grant_type', 'client_credentials');
        tokenBody.append('client_id', clientId);
        tokenBody.append('client_secret', clientSecret);
        tokenBody.append('scope', ENVIRONMENT_SCOPE);

        const aadResponse = await fetch(tokenUrl, {
            method: 'POST',
            body: tokenBody,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        if (!aadResponse.ok) {
            const errorText = await aadResponse.text();
            console.error('[TokenRoutes] Step 1 Failed (Azure AD Auth):', {
                status: aadResponse.status,
                statusText: aadResponse.statusText,
                error: errorText
            });
            throw new Error(`Azure AD Auth failed: ${aadResponse.statusText}`);
        }

        const aadData = await aadResponse.json() as { access_token: string };
        const aadToken = aadData.access_token;

        // Step 2: Exchange for Direct Line Token
        const dlResponse = await fetch(DIRECT_LINE_ENDPOINT, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${aadToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user: { id: userId || 'guest-user' }
            })
        });

        if (!dlResponse.ok) {
            const errorText = await dlResponse.text();
            console.error('[TokenRoutes] Step 2 Failed (Dataverse Auth):', {
                status: dlResponse.status,
                statusText: dlResponse.statusText,
                error: errorText
            });
            throw new Error(`Dataverse Auth failed: ${dlResponse.statusText}`);
        }

        const dlData = await dlResponse.json();

        // Return the Direct Line token response to the client
        res.json(dlData);

    } catch (error) {
        console.error('[TokenRoutes] Error in token generation flow:', error);
        res.status(500).json({ error: 'Failed to generate token' });
    }
});

export default router;
