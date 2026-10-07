/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// A relative base makes the build work from any sub-path, e.g.
// https://username.github.io/project-name/ — no server or router required.
// Override with BASE_PATH=/project-name/ if you prefer absolute asset URLs.
export default defineConfig({
  base: process.env.BASE_PATH ?? './',
  plugins: [react(), tailwindcss()],
  build: {
    target: 'es2020',
    // Vendor code changes rarely, so keep it in its own long-cached chunks.
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'react', test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/, priority: 2 },
            { name: 'editor', test: /node_modules[\\/](@tiptap|prosemirror-|linkifyjs|orderedmap|rope-sequence|w3c-keyname|@floating-ui)/, priority: 1 },
          ],
        },
      },
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
