import { defineConfig } from 'vite';
export default defineConfig({ base: './', publicDir: false, build: { rollupOptions: { input: { main: 'index.html', tosho: 'tosho/index.html', detail: 'tosho/uwu.html' } } } });
