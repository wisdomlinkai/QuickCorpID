import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    // Generate sourcemaps for debugging (disable in production if needed)
    sourcemap: false,
    // Minify output
    minify: 'esbuild',
    // Target modern browsers
    target: 'es2020',
    // Chunk size warning limit
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          aws: ['aws-amplify'],
          icons: ['lucide-react'],
        },
      },
    },
  },
  // Enable gzip compression preview
  server: {
    host: true,
    port: 5173,
  },
  preview: {
    port: 4173,
  },
});
