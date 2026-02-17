/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_BASE_URL?: string;
    readonly VITE_MSAL_CLIENT_ID?: string;
    readonly VITE_MSAL_TENANT_ID?: string;
    readonly VITE_MSAL_REDIRECT_URI?: string;
    readonly VITE_MSAL_API_SCOPE?: string;
    readonly VITE_SPEECH_KEY?: string;
    readonly VITE_SPEECH_REGION?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
