import { defineConfig } from '@playwright/test'

const port = 4173

export default defineConfig({
  testDir: 'tests',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: `http://127.0.0.1:${port}`, channel: 'chrome' },
  projects: [
    { name: 'build', testMatch: /build\.spec\.ts/ },
    { name: 'desktop', testMatch: /hub\.spec\.ts/, use: { viewport: { width: 1440, height: 900 } } },
    { name: 'phone', testMatch: /hub\.spec\.ts/, use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
  ],
  webServer: {
    command: `npm run build && npm run preview -- --port ${port} --strictPort`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
