import 'dotenv/config';

interface EnvConfig {
    DIRECT_LINE_SECRET: string;
    AZURE_AD_CLIENT_ID: string;
    AZURE_AD_CLIENT_SECRET: string;
    AZURE_AD_TENANT_ID: string;
    SPEECH_KEY: string;
    SPEECH_REGION: string;
    ALLOWED_ORIGINS: string[];
    PORT: number;
    DIRECT_LINE_ENDPOINT?: string;
}

function requireEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}

function loadEnv(): EnvConfig {
    return {
        DIRECT_LINE_SECRET: requireEnv('DIRECT_LINE_SECRET'),
        AZURE_AD_CLIENT_ID: requireEnv('AZURE_AD_CLIENT_ID'),
        AZURE_AD_CLIENT_SECRET: requireEnv('AZURE_AD_CLIENT_SECRET'),
        AZURE_AD_TENANT_ID: requireEnv('AZURE_AD_TENANT_ID'),
        SPEECH_KEY: requireEnv('SPEECH_KEY'),
        SPEECH_REGION: requireEnv('SPEECH_REGION'),
        ALLOWED_ORIGINS: (process.env['ALLOWED_ORIGINS'] ?? 'http://localhost:5173')
            .split(',')
            .map((o) => o.trim()),
        PORT: parseInt(process.env['PORT'] ?? '3001', 10),
        DIRECT_LINE_ENDPOINT: process.env['DIRECT_LINE_ENDPOINT'],
    };
}

export const env = loadEnv();
