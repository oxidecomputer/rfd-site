/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import { expect, test } from '@chromatic-com/playwright'

// Helper function to limit content height for Chromatic screenshots
async function limitContentHeight(page: any) {
  await page.evaluate(() => {
    const content = document.querySelector('main')
    if (content) {
      content.style.maxHeight = '5000px'
      content.style.overflow = 'hidden'
    }
  })
}

test('Click around', async ({ page }) => {
  await page.goto('/')

  // Hide timestamps for consistent Chromatic screenshots
  await page.addStyleTag({
    content: `
      [data-testid*="timestamp"] {
        visibility: hidden !important;
      }
    `,
  })

  await expect(page.getByRole('heading', { name: 'Requests for Discussion' })).toBeVisible()
  // we're in public mode so we should see the banner
  await expect(page.getByText('Viewing public RFDs')).toBeVisible()

  // click the sort number button for more consistency in visual regression tests
  await page.getByTestId('sort-number').click()

  // can click an RFD
  await page.getByRole('link', { name: 'RFD 223' }).click()
  await expect(
    page.getByRole('heading', { name: 'Web Console Architecture' }),
  ).toBeVisible()
  await expect(page.getByText('AuthorsDavid Crespo, Justin Bennett')).toBeVisible()
  // banner shows up on this page too
  await expect(page.getByText('Viewing public RFDs')).toBeVisible()

  await page.getByRole('link', { name: 'Back to index' }).click()
  await expect(page.getByRole('heading', { name: 'Requests for Discussion' })).toBeVisible()
})

test('Filter by title', async ({ page }) => {
  await page.goto('/')

  const rfdLinks = page.getByRole('link', { name: /^RFD/ })

  // don't know how many public RFDs there are but there are a bunch
  expect(await rfdLinks.count()).toBeGreaterThan(10)

  await page.getByPlaceholder('Filter by').fill('standard units')

  // but after you filter there are fewer
  expect(await rfdLinks.count()).toEqual(1)
})

test('Filter by author', async ({ page }) => {
  await page.goto('/')

  const rfdLinks = page.getByRole('link', { name: /^RFD/ })

  // don't know how many public RFDs there are but there are a bunch
  expect(await rfdLinks.count()).toBeGreaterThan(10)

  await page.getByPlaceholder('Filter by').fill('david.crespo')

  // but after you filter there are fewer
  expect(await rfdLinks.count()).toEqual(2)
})

test('Header filter box', async ({ page }) => {
  await page.goto('/rfd/0001')
  await expect(page.getByRole('heading', { name: 'Requests for Discussion' })).toBeVisible()

  await expect(page.getByRole('banner').getByPlaceholder('Search')).toBeHidden()

  await page.getByRole('button', { name: 'Select a RFD' }).click()
  await page.getByRole('banner').getByPlaceholder('Search').fill('Mission')
  await page.getByRole('banner').getByPlaceholder('Search').press('Enter')

  await expect(
    page.getByRole('heading', { name: 'Mission, Principles and Values', level: 1 }),
  ).toBeVisible()
})

test('Direct link to public RFD 68', async ({ page }) => {
  await page.goto('/rfd/0068')

  await expect(
    page.getByRole('heading', { name: 'Partnership as Shared Values', level: 1 }),
  ).toBeVisible()
  await expect(page.getByText('AuthorsBryan Cantrill')).toBeVisible()

  // Limit content height for Chromatic screenshots
  await limitContentHeight(page)
})

test('Direct link to public RFD 479', async ({ page }) => {
  await page.goto('/rfd/0479')

  await expect(
    page.getByRole('heading', { name: 'Dropshot API traits', level: 1 }),
  ).toBeVisible()
  await expect(page.getByText('AuthorsRain Paharia')).toBeVisible()

  // Limit content height for Chromatic screenshots
  await limitContentHeight(page)
})

test('Direct link to public RFD 400', async ({ page }) => {
  await page.goto('/rfd/0400')

  await expect(
    page.getByRole('heading', {
      name: 'Dealing with cancel safety in async Rust',
      level: 1,
    }),
  ).toBeVisible()
  await expect(page.getByText('AuthorsRain Paharia')).toBeVisible()

  // Limit content height for Chromatic screenshots
  await limitContentHeight(page)
})

test('Direct link to public RFD 463', async ({ page }) => {
  await page.goto('/rfd/0463')

  await expect(
    page.getByRole('heading', { name: 'The Oximeter Query Language', level: 1 }),
  ).toBeVisible()
  await expect(page.getByText('AuthorsBenjamin Naecker')).toBeVisible()

  // Limit content height for Chromatic screenshots
  await limitContentHeight(page)
})

test('Sign in button', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeHidden()
  await page.getByRole('link', { name: 'Sign in' }).click()
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
})

test.describe('Login redirect', () => {
  test.use({
    disableAutoSnapshot: true, // Disables the automated snapshot generated at the end of the test
  })
  test('Login redirect on nonexistent or private RFD', async ({ page }) => {
    await page.goto('/rfd/4268')
    await expect(page).toHaveURL(/\/login\?returnTo=\/rfd\/4268$/)
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
  })
})

test('Search menu open and close', async ({ page }) => {
  await page.goto('/')

  const openSearchMenu = () => page.keyboard.press(`ControlOrMeta+k`)
  const searchDialog = page.getByRole('dialog', { name: 'Search' })

  // Test keyboard open and close
  await openSearchMenu()
  await expect(searchDialog).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(searchDialog).toBeHidden()

  await openSearchMenu()
  await expect(searchDialog).toBeVisible()

  // Limit content height for Chromatic screenshots
  await limitContentHeight(page)
})

test('Search functionality and navigation', async ({ page }) => {
  await page.goto('/')

  const openSearchMenu = () => page.keyboard.press(`ControlOrMeta+k`)
  const searchDialog = page.getByRole('dialog', { name: 'Search' })

  // Open search dialog
  await openSearchMenu()
  await expect(searchDialog).toBeVisible()

  // Type search query
  await page.keyboard.insertText('test')

  // Wait for search results to appear
  await expect(
    searchDialog.getByText('RFD 125 Telemetry requirements and building blocks'),
  ).toBeVisible()

  // Verify one of the expected search results is present
  const testScenarioResult = searchDialog
    .getByRole('button')
    .filter({ hasText: 'Use cases and requirements' })
  await expect(testScenarioResult).toBeVisible()

  // Click on the search result
  await testScenarioResult.click()

  // Verify we navigated to the correct RFD and section
  await expect(page).toHaveURL(/\/rfd\/125#_use_cases_and_requirements/)
  await expect(
    page.getByRole('heading', {
      name: 'Telemetry requirements and building blocks',
      level: 1,
    }),
  ).toBeVisible()

  // Verify we're at the correct section
  await expect(
    page.getByRole('heading', { name: 'Use cases and requirements', level: 2 }),
  ).toBeVisible()

  // Limit content height for Chromatic screenshots
  await limitContentHeight(page)
})

test('Search result navigation to different RFD', async ({ page }) => {
  await page.goto('/')

  const openSearchMenu = () => page.keyboard.press(`ControlOrMeta+k`)
  const searchDialog = page.getByRole('dialog', { name: 'Search' })

  // Open search dialog
  await openSearchMenu()
  await expect(searchDialog).toBeVisible()

  // Type search query
  await page.keyboard.insertText('test')

  await expect(page.getByRole('heading', { name: 'RFD 532 Versioning for' })).toBeVisible()

  // Navigate through results with arrow keys
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('ArrowDown')

  // Click on the "Assumptions" result from RFD 523
  const assumptionsResult = searchDialog
    .getByRole('button')
    .filter({ hasText: 'Assumptions' })
  await expect(assumptionsResult).toBeVisible()
  await assumptionsResult.click()

  // Verify we navigated to RFD 532 and the correct section
  await expect(page).toHaveURL(/\/rfd\/532#_assumptions/)
  await expect(
    page.getByRole('heading', { name: 'Versioning for internal HTTP APIs', level: 1 }),
  ).toBeVisible()

  // Verify we're at the correct section
  await expect(page.getByRole('heading', { name: 'Assumptions', level: 2 })).toBeVisible()

  // Limit content height for Chromatic screenshots
  await limitContentHeight(page)
})
