import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

function normalizeBasePath(input?: string) {
  if (!input || input === '/') {
    return '/'
  }

  const trimmed = input.trim().replace(/^\/+|\/+$/g, '')
  return trimmed ? `/${trimmed}/` : '/'
}

const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1] ?? 'olympiad-knowledge-system'
const basePath = normalizeBasePath(
  process.env.VITE_BASE_PATH ?? (process.env.GITHUB_ACTIONS === 'true' ? `/${repositoryName}/` : '/'),
)

// https://vite.dev/config/
export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    fs: {
      allow: ['..'],
    },
  },
})
