import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  // Dev proxy — only active during local development (npm run dev)
  // In production Vercel calls Render directly via VITE_API_URL env var
  server: {
    port: 5175,
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
    },
  },

  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts'],
          ui:     ['lucide-react'],
          utils:  ['zustand', 'axios', 'date-fns', 'date-fns-tz'],
        },
      },
    },
  },
});
