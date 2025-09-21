import { resolve } from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import viteReact from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [viteReact(), tailwindcss(), nodePolyfills()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
})
