import { defineConfig, devices } from "@playwright/test";

// Kept in sync with e2e/mock-backend.mts, which Playwright runs as a
// separate process and can't be imported here
const MOCK_BACKEND_URL = "http://localhost:4010";
const MOCK_API_KEY = "e2e-api-key";

// Not 3000, so the tests can run next to `npm run dev`
const APP_PORT = 3100;
const isCI = !!process.env.CI;

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  reporter: isCI ? [["github"], ["html", { open: "never" }]] : [["list"]],

  use: {
    baseURL: `http://localhost:${APP_PORT}`,
    locale: "en-GB",
    // The app shows Paris time; a test can switch to another timezone
    timezoneId: "Europe/Paris",
    trace: "on-first-retry",
  },

  // The app is mobile-first and mostly used on iPhone (on-the-go demos):
  // run everything on Safari's engine on an iPhone, an Android phone and
  // a desktop
  projects: [
    { name: "iphone", use: { ...devices["iPhone 15"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
  ],

  webServer: [
    {
      command: "node e2e/mock-backend.mts",
      url: `${MOCK_BACKEND_URL}/health`,
      reuseExistingServer: !isCI,
    },
    {
      // A production build, as deployed. Process env vars take precedence
      // over .env.local, so a local run never reaches the real backend.
      command: `npm run build && npm run start -- --port ${APP_PORT}`,
      url: `http://localhost:${APP_PORT}/login`,
      reuseExistingServer: !isCI,
      timeout: 180_000,
      env: {
        API_BASE_URL: MOCK_BACKEND_URL,
        API_KEY: MOCK_API_KEY,
        NEXT_TELEMETRY_DISABLED: "1",
      },
    },
  ],
});
