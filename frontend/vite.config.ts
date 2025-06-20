import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  base: '/static/',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: 'src/main.tsx',
      },
    },
    manifest: true,
  },
  server: {
    host: 'localhost',
    port: 5173,
  },
}) 