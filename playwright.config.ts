import { defineConfig, devices } from '@playwright/test';

// End-to-end checks run against the production build (the same relative-path
// build that is deployed), served from a sub-path the way GitHub Pages serves
// it. `npm run test:e2e` builds first.
const PORT = 4174;

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}/kaku/`,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: `npx vite preview --port ${PORT} --strictPort --base /kaku/`,
    url: `http://localhost:${PORT}/kaku/`,
    reuseExistingServer: !process.env.CI,
  },
});
