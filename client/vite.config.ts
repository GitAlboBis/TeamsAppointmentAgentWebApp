import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: { '@': path.resolve(__dirname, 'src') },
    },
    build: {
        rollupOptions: {
            // `swiper` is an optional dep of `adaptivecards` (carousel feature)
            // not needed for our use case — externalize to avoid build failure
            external: (id: string) => id === 'swiper' || id.startsWith('swiper/'),
        },
    },
    server: {
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://localhost:3001',
                changeOrigin: true,
            },
        },
    },
});

