import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import Icons from 'unplugin-icons/vite';

// https://vite.dev/config/
export default defineConfig({
  server: {
    watch: {
      ignored: ['**/node_modules/**', '**/.pnpm-store/**'],
    },
  },
  build: {
    sourcemap: 'hidden',
  },
  plugins: [
    react({
      babel: {
        plugins: ['react-dev-locator'],
      },
    }),
    Icons({
      compiler: 'jsx',
      jsx: 'react',
      autoInstall: true,
    }),
    tsconfigPaths(),
  ],
});
