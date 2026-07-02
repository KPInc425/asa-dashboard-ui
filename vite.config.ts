/// <reference types="vitest" />
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import { getDevApiProxyTarget } from './src/utils/devProxy'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  const devApiProxyTarget = getDevApiProxyTarget(env.VITE_DEV_API_PROXY_TARGET)

  return {
    plugins: [react(), tailwindcss()],
    define: {
      global: 'globalThis',
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            'vendor-utils': ['axios', 'socket.io-client', '@tanstack/react-query'],
          },
        },
      },
    },
    optimizeDeps: {
      esbuildOptions: {
        define: {
          global: 'globalThis',
        },
      },
    },
    server: {
      proxy: {
        '/api': {
          target: devApiProxyTarget,
          changeOrigin: true,
          secure: false,
        },
        '/socket.io': {
          target: devApiProxyTarget,
          changeOrigin: true,
          secure: false,
          ws: true,
        },
      },
    },
  }
})
