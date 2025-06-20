import { defineConfig, type UserConfig } from 'vite'
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'node:fs'

// https://vitejs.dev/config/
export default defineConfig((): UserConfig => {
  // Use the same SSL certificates as the backend (generated on host)
  const sslKeyPath = resolve(__dirname, 'ssl/localhost+2-key.pem')
  const sslCertPath = resolve(__dirname, 'ssl/localhost+2.pem')
  
  const httpsConfig = fs.existsSync(sslKeyPath) && fs.existsSync(sslCertPath) 
    ? {
        key: fs.readFileSync(sslKeyPath),
        cert: fs.readFileSync(sslCertPath),
      }
    : undefined

  return {
    plugins: [
      react(),
      tailwindcss(),
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
      host: '0.0.0.0',
      port: 3000,
      https: httpsConfig,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    },
  }
}) 