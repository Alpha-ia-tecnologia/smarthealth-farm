/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    // Testes de componente com Radix (portais/animações) ficam lentos sob carga paralela;
    // em máquinas modestas o run completo estoura timeouts curtos de forma intermitente.
    testTimeout: 30_000,
    coverage: {
      provider: 'v8',
      include: [
        'src/lib/**',
        'src/context/**',
        'src/components/auth/**',
        'src/pages/LoginPage.tsx',
      ],
    },
  },
})
