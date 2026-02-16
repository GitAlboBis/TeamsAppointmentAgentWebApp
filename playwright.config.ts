import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './e2e',
    fullyParallel: true,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: [['html'], ['junit', { outputFile: 'test-results/e2e.xml' }]],
    use: {
        baseURL: 'http://localhost:5173',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
    },
    projects: [
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
        { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
        { name: 'mobile', use: { ...devices['iPhone 14'] } },
    ],
    webServer: [
        {
            command: 'npm run dev',
            cwd: './client',
            port: 5173,
            reuseExistingServer: !process.env.CI,
        },
        {
            command: 'npm run dev',
            cwd: './server',
            port: 3001,
            reuseExistingServer: !process.env.CI,
        },
    ],
});
