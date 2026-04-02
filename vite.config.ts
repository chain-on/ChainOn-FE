import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

const API_PREFIXES = ['/user', '/org', '/admin', '/order', '/notice', '/item'] as const;

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  const proxyTarget = env.VITE_API_PROXY_TARGET || 'http://localhost:8080';
  const proxy = Object.fromEntries(
    API_PREFIXES.map((prefix) => [
      prefix,
      {
        target: proxyTarget,
        changeOrigin: true,
        secure: false,
      },
    ])
  );

  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // 개발 시 브라우저 → Vite(동일 출처) → 백엔드로 전달하여 CORS 회피
      proxy,
    },
  };
});
