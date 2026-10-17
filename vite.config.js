import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  return {
    plugins: [react()],
    base: './',
    optimizeDeps: {
      // The app's dependencies are known. Avoid crawling temporary UI fixtures and
      // browser profiles on a cold start, or rediscovering dependencies per route.
      noDiscovery: true,
      include: [
        'react',
        'react-dom',
        'react-dom/client',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        'react-markdown',
        'remark-gfm',
      ],
      holdUntilCrawlEnd: false,
    },
    server: {
      port: 5173,
      host: '0.0.0.0',
      watch: {
        ignored: ['**/.tmp-*/**', '**/.codegraph/**', '**/docs/**', '**/Images/**', '**/artifacts/**', '**/dist/**'],
      },
      warmup: {
        clientFiles: ['./src/main.jsx', './src/pages/LoginPage.jsx', './src/styles/base.css'],
      },
      proxy: {
        '/api': {
          target: env.VITE_API_PROXY_TARGET || 'http://localhost:8080',
          changeOrigin: true,
        },
      },
    },
  };
});
