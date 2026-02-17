import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
            path: path.resolve(__dirname, 'src/mocks/empty-module.js'),
            fs: path.resolve(__dirname, 'src/mocks/empty-module.js'),
            url: path.resolve(__dirname, 'src/mocks/empty-module.js'),
            'source-map-js': path.resolve(__dirname, 'src/mocks/empty-module.js'),
        },
    },
    build: {
        rollupOptions: {
            // `swiper` is an optional dep of `adaptivecards` (carousel feature)
            // not needed for our use case — externalize to avoid build failure
            external: ['swiper', 'swiper/react', 'swiper/css'],
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

