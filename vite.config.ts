import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const isProd = mode === 'production';
    
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        allowedHosts: ['localhost', '.trycloudflare.com', '.loca.lt', '.ngrok-free.app', '.ngrok.io'],
        // Ignore changes to these directories/files to prevent unnecessary reloads
        watch: {
          ignored: [
            '**/android/**',
            '**/ios/**',
            '**/dist/**',
            '**/node_modules/**',
            '**/supabase/functions/**',
            '**/*.md',
            '**/supabase/.temp/**',
            '**/.DS_Store',
            '**/.git/**',
            '**/tmp/**',
            '**/logs/**',
          ],
        },
        // Reduce HMR sensitivity for more stable mobile testing
        hmr: {
          overlay: false, // Disable error overlay on mobile
        },
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      
      // Production optimizations
      esbuild: {
        // Strip console.log and debugger in production
        drop: isProd ? ['console', 'debugger'] : [],
      },
      
      build: {
        // Increase chunk size warning limit slightly (default is 500)
        chunkSizeWarningLimit: 600,
        
        rollupOptions: {
          output: {
            // Manual chunk splitting for better caching
            manualChunks: {
              // React core - changes rarely
              'react-vendor': ['react', 'react-dom', 'react-router-dom'],
              
              // Animation & UI libraries
              'ui-vendor': ['framer-motion', 'lucide-react'],
              
              // Charts - only used in RecipeDetail
              'charts': ['recharts'],
              
              // Supabase - auth & database
              'supabase': ['@supabase/supabase-js'],
              
              // Capacitor plugins
              'capacitor': [
                '@capacitor/core',
                '@capacitor/haptics',
                '@capacitor/preferences',
                '@capacitor/share'
              ],
              
              // Date utilities
              'date-utils': ['date-fns'],
            }
          }
        },
        
        // Enable source maps for error tracking (Sentry)
        sourcemap: isProd ? 'hidden' : true,
      }
    };
});
