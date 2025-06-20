import { defineConfig, type UserConfig } from 'vite'
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import mkcert from 'vite-plugin-mkcert'

// https://vitejs.dev/config/
export default defineConfig((): UserConfig => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      mkcert()
    ],
    build: {
      rollupOptions: {
        input: {
          taskpane: resolve(__dirname, 'taskpane.html'),
          commands: resolve(__dirname, 'commands.html'),
        },
      },
      outDir: 'dist',
      emptyOutDir: true,
    },
    server: {
      host: 'localhost',
      port: 3000,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    },
  }
}) 