/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import { defineConfig, devices } from '@playwright/test'

// in CI, we run the tests against the Vercel preview at BASE_URL

// https://playwright.dev/docs/test-configuration
export default defineConfig({
  testDir: './test/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  timeout: 60000,
  use: {
    baseURL: process.env.CI ? process.env.BASE_URL : 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chrome', use: { ...devices['Desktop Chrome'] } }],
  webServer: process.env.CI
    ? undefined
    : {
        command: 'npm run dev',
        port: 3000,
        // This turns out to be very useful locally because starting up the dev
        // server takes like 8 seconds. If you already have it running, the tests
        // run in only a few seconds.
        reuseExistingServer: true,
      },
})
