import { defineConfig } from '@playwright/test';

/**
 * E2E-smoketest tegen de echte stack: de Spring Boot-jar (in-memory H2) en
 * de Angular-dev-server met API-proxy. Bouw eerst de backend-jar:
 * `cd backend && mvn -DskipTests package`.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  use: {
    baseURL: 'http://localhost:4200',
    // Lokaal kan een systeem-Chromium worden aangewezen; in CI installeert
    // `npx playwright install chromium` de eigen browser.
    launchOptions: process.env['PLAYWRIGHT_CHROMIUM_PATH']
      ? { executablePath: process.env['PLAYWRIGHT_CHROMIUM_PATH'] }
      : {},
  },
  webServer: [
    {
      command:
        'java -jar ../backend/target/cada-sovereignty-navigator-0.1.0.jar ' +
        '"--spring.datasource.url=jdbc:h2:mem:e2e;DB_CLOSE_DELAY=-1"',
      url: 'http://localhost:8080/api/meta',
      reuseExistingServer: !process.env['CI'],
      timeout: 120_000,
    },
    {
      command: 'npm start',
      url: 'http://localhost:4200',
      reuseExistingServer: !process.env['CI'],
      timeout: 180_000,
    },
  ],
});
