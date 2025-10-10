/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import { expect, takeSnapshot, test } from '@chromatic-com/playwright'
import { Page } from '@playwright/test'

// Test helper functions
async function limitContentHeight(page: Page) {
  await page.evaluate(() => {
    const content = document.querySelector('main')
    if (content) {
      content.style.maxHeight = '5000px'
      content.style.overflow = 'hidden'
    }
  })
}

async function hideTimestamps(page: Page) {
  await page.addStyleTag({
    content: `
      [data-testid*="timestamp"] {
        visibility: hidden !important;
      }
    `,
  })
}

async function expectRfdPage(page: Page, title: string, author: string) {
  await expect(page.getByRole('heading', { name: title, level: 1 })).toBeVisible()
  await expect(page.getByText(`Authors${author}`)).toBeVisible()
}

test.describe('Navigation and Basic Functionality', () => {
  test('Click around main interface', async ({ page }) => {
    await page.goto('/')

    await expect(
      page.getByRole('heading', { name: 'Requests for Discussion' }),
    ).toBeVisible()
    // we're in public mode so we should see the banner
    await expect(page.getByText('Viewing public RFDs')).toBeVisible()

    // can click an RFD
    await page.getByRole('link', { name: 'RFD 223' }).click()
    await expect(
      page.getByRole('heading', { name: 'Web Console Architecture' }),
    ).toBeVisible()
    await expect(page.getByText('AuthorsDavid Crespo, Justin Bennett')).toBeVisible()
    // banner shows up on this page too
    await expect(page.getByText('Viewing public RFDs')).toBeVisible()

    await page.getByRole('link', { name: 'Back to index' }).click()
    await expect(
      page.getByRole('heading', { name: 'Requests for Discussion' }),
    ).toBeVisible()
  })

  test('Header filter box navigation', async ({ page }) => {
    await page.goto('/rfd/0001')
    await expect(
      page.getByRole('heading', { name: 'Requests for Discussion' }),
    ).toBeVisible()

    await expect(page.getByRole('banner').getByPlaceholder('Search')).toBeHidden()

    await page.getByRole('button', { name: 'Select a RFD' }).click()
    await page.getByRole('banner').getByPlaceholder('Search').fill('Mission')
    await page.getByRole('banner').getByPlaceholder('Search').press('Enter')

    await expect(
      page.getByRole('heading', { name: 'Mission, Principles and Values', level: 1 }),
    ).toBeVisible()
  })
})

test.describe('Filtering', () => {
  test('Filter by title', async ({ page }, testInfo) => {
    await page.goto('/')
    await hideTimestamps(page)

    const rfdLinks = page.getByRole('link', { name: /^RFD/ })

    // don't know how many public RFDs there are but there are a bunch
    expect(await rfdLinks.count()).toBeGreaterThan(10)

    await page.getByPlaceholder('Filter by').fill('standard units')

    await takeSnapshot(page, testInfo)

    // but after you filter there are fewer
    expect(await rfdLinks.count()).toEqual(1)
  })

  test('Filter by author', async ({ page }, testInfo) => {
    await page.goto('/')
    await hideTimestamps(page)

    const rfdLinks = page.getByRole('link', { name: /^RFD/ })

    // don't know how many public RFDs there are but there are a bunch
    expect(await rfdLinks.count()).toBeGreaterThan(10)

    await page.getByPlaceholder('Filter by').fill('david.crespo')

    // but after you filter there are fewer
    expect(await rfdLinks.count()).toEqual(2)

    await takeSnapshot(page, testInfo)
  })
})

test.describe('Direct RFD Access', () => {
  const rfdTestCases = [
    {
      rfd: '0068',
      title: 'Partnership as Shared Values',
      author: 'Bryan Cantrill',
    },
    {
      rfd: '0479',
      title: 'Dropshot API traits',
      author: 'Rain Paharia',
    },
    {
      rfd: '0400',
      title: 'Dealing with cancel safety in async Rust',
      author: 'Rain Paharia',
    },
    {
      rfd: '0463',
      title: 'The Oximeter Query Language',
      author: 'Benjamin Naecker',
    },
  ]

  for (const { rfd, title, author } of rfdTestCases) {
    test(`Direct link to public RFD ${rfd}`, async ({ page }, testInfo) => {
      await page.goto(`/rfd/${rfd}`)
      await hideTimestamps(page)

      await expectRfdPage(page, title, author)
      await limitContentHeight(page)
      await takeSnapshot(page, testInfo)
    })
  }
})

test.describe('Authentication', () => {
  test('Sign in button functionality', async ({ page }, testInfo) => {
    await page.goto('/')

    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeHidden()
    await page.getByRole('link', { name: 'Sign in' }).click()
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()

    await takeSnapshot(page, testInfo)
  })

  test('Login redirect on nonexistent or private RFD', async ({ page }) => {
    await page.goto('/rfd/4268')
    await expect(page).toHaveURL(/\/login\?returnTo=\/rfd\/4268$/)
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
  })
})

test.describe('Search', () => {
  test.use({ cropToViewport: true })

  test('Search functionality and navigation', async ({ page }, testInfo) => {
    const openSearchMenu = () => page.keyboard.press(`ControlOrMeta+k`)
    const searchButton = page.getByRole('button', { name: 'Search' })

    await page.goto('/')

    const searchDialog = page.getByRole('dialog', { name: 'Search' })
    await expect(searchDialog).toBeHidden()

    // Test keyboard open and close
    await openSearchMenu()
    await expect(searchDialog).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(searchDialog).toBeHidden()

    // Test button to open
    await searchButton.click()
    await expect(searchDialog).toBeVisible()

    await page.keyboard.insertText('test')

    // Wait for search results to appear
    await expect(searchDialog.getByText('RFD 363 Minibar')).toBeVisible()

    // Verify one of the expected search results is present
    const testScenarioResult = searchDialog
      .getByRole('button')
      .filter({ hasText: 'Manufacturing Test Needs' })
      .first()
    await expect(testScenarioResult).toBeVisible()

    await takeSnapshot(page, testInfo)

    // Click on the search result
    await testScenarioResult.click()

    // Verify we navigated to the correct RFD and section
    await expect(page).toHaveURL(/\/rfd\/363#_test_the_ignition_target/)
    await expect(
      page.getByRole('heading', {
        name: 'Minibar',
        level: 1,
      }),
    ).toBeVisible()

    // Verify we're at the correct section
    await expect(page.getByRole('link', { name: 'Test the Ignition Target' })).toBeVisible()
  })

  test('Search result navigation to different RFD', async ({ page }, testInfo) => {
    const searchButton = page.getByRole('button', { name: 'Search' })

    await page.goto('/')

    const searchDialog = page.getByRole('dialog', { name: 'Search' })
    await expect(searchDialog).toBeHidden()

    await searchButton.click()
    await expect(searchDialog).toBeVisible()

    await takeSnapshot(page, testInfo)

    // Type search query
    await page.keyboard.insertText('web console')

    await expect(page.getByRole('heading', { name: 'RFD 223 Web Console' })).toBeVisible()

    // Navigate through results with arrow keys
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowDown')

    // Click on the "Manufacturing Test Needs" result from RFD 363
    const architecturesResult = searchDialog
      .getByRole('button')
      .filter({ hasText: 'Architectures' })
      .first()
    await expect(architecturesResult).toBeVisible()
    await architecturesResult.click()

    // Verify we navigated to RFD 223 and the correct section
    await expect(page).toHaveURL(/\/rfd\/223#_browser_only/)
    await expect(
      page.getByRole('heading', { name: 'Web Console Architecture', level: 1 }),
    ).toBeVisible()

    // Verify we're at the correct section
    await expect(
      page.getByRole('heading', { name: 'Architectures', level: 2 }),
    ).toBeVisible()
  })
})
