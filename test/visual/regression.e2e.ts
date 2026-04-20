/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import { expect, test, type Page } from '@playwright/test'

async function hideTimestamps(page: Page) {
  await page.addStyleTag({
    content: `
      [data-testid*="timestamp"] {
        visibility: hidden !important;
      }
    `,
  })
}

// Full-page screenshots of key pages across the RFD site.

const pages = [
  { name: 'homepage', path: '/', heading: 'Requests for Discussion' },
  { name: 'login', path: '/login', heading: 'Sign in' },

  // A spread of public RFDs covering different content types
  { name: 'rfd-partnership', path: '/rfd/0068', heading: 'Partnership as Shared Values' },
  { name: 'rfd-dropshot', path: '/rfd/0479', heading: 'Dropshot API traits' },
  { name: 'rfd-web-console', path: '/rfd/0223', heading: 'Web Console Architecture' },
  { name: 'rfd-minibar', path: '/rfd/0363', heading: 'Minibar' },
]

for (const { name, path, heading } of pages) {
  test(`${name} (${path})`, async ({ page }) => {
    await page.goto(path)
    await expect(page.getByRole('heading', { name: heading, level: 1 })).toBeVisible()
    await hideTimestamps(page)
    await expect(page).toHaveScreenshot(`${name}.png`, { fullPage: true })
  })
}

// Mobile viewport for key pages
const mobilePages = [
  { name: 'homepage', path: '/', heading: 'Requests for Discussion' },
  { name: 'rfd', path: '/rfd/0068', heading: 'Partnership as Shared Values' },
]

for (const { name, path, heading } of mobilePages) {
  test(`mobile ${name} (${path})`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto(path)
    await expect(page.getByRole('heading', { name: heading, level: 1 })).toBeVisible()
    await hideTimestamps(page)
    await expect(page).toHaveScreenshot(`mobile-${name}.png`, { fullPage: true })
  })
}
