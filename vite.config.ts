import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

function githubPagesBase(): string {
  if (process.env.GITHUB_ACTIONS !== 'true') return './';
  const repository = process.env.GITHUB_REPOSITORY?.split('/')[1];
  return repository ? `/${repository}/` : '/';
}

export default defineConfig({
  base: githubPagesBase(),
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    target: 'es2020',
    chunkSizeWarningLimit: 1100,
  },
});
