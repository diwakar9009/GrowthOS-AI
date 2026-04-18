import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  const GEMINI_API_KEY = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  const base = process.env.GITHUB_REPOSITORY ? `/${process.env.GITHUB_REPOSITORY.split('/')[1]}/` : '/';
  
  return {
    base,
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    // --- YE SECTION ADD KIYA HAI ---
    build: {
      chunkSizeWarningLimit: 2000, // Warning limit ko badha diya
      rollupOptions: {
        output: {
          manualChunks(id) {
            // Isse bade packages (jaise Gemini SDK ya Vendor files) alag chunks mein toot jayenge
            if (id.includes('node_modules')) {
              return id.toString().split('node_modules/')[1].split('/')[0].toString();
            }
          },
        },
      },
    },
    // ------------------------------
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
