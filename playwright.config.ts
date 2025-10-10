/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import { type ChromaticConfig } from '@chromatic-com/playwright'
import { defineConfig, devices } from '@playwright/test'

// in CI, we run the tests against the Vercel preview at BASE_URL

// https://playwright.dev/docs/test-configuration
export default defineConfig<ChromaticConfig>({
  testDir: './test/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  // use all available cores (2) on github actions. use fewer locally
  workers: process.env.CI ? '100%' : '66%',
  timeout: 60000,
  use: {
    baseURL: process.env.CI ? process.env.BASE_URL : 'http://localhost:3000',
    trace: 'on-first-retry',
    disableAutoSnapshot: true,
  },
  projects: [
    {
      name: 'chrome',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 720 } },
    },
  ],
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
