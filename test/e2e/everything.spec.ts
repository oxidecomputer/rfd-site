/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import { expect, takeSnapshot, test } from '@chromatic-com/playwright'

// Test helper functions
async function limitContentHeight(page: any) {
  await page.evaluate(() => {
    const content = document.querySelector('main')
    if (content) {
      content.style.maxHeight = '5000px'
      content.style.overflow = 'hidden'
    }
  })
}

async function hideTimestamps(page: any) {
  await page.addStyleTag({
    content: `
      [data-testid*="timestamp"] {
        visibility: hidden !important;
      }
    `,
  })
}

async function expectRfdPage(page: any, title: string, author: string) {
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

  const searchHelpers = {
    async openSearchDialog(page: any) {
      await page.keyboard.press(`ControlOrMeta+k`)
      return page.getByRole('dialog', { name: 'Search' })
    },

    async performSearch(page: any, query: string) {
      const searchDialog = await this.openSearchDialog(page)
      await expect(searchDialog).toBeVisible()
      await page.keyboard.insertText(query)
      return searchDialog
    },
  }

  test('Search functionality and navigation', async ({ page }, testInfo) => {
    await page.goto('/')

    const searchDialog = await searchHelpers.performSearch(page, 'test')

    // Wait for search results to appear
    await expect(
      searchDialog.getByText('RFD 125 Telemetry requirements and building blocks'),
    ).toBeVisible()

    // Verify one of the expected search results is present
    const testScenarioResult = searchDialog
      .getByRole('button')
      .filter({ hasText: 'Use cases and requirements' })
    await expect(testScenarioResult).toBeVisible()

    await takeSnapshot(page, testInfo)

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
  })

  test('Search result navigation to different RFD', async ({ page }, testInfo) => {
    await page.goto('/')

    const searchDialog = await searchHelpers.openSearchDialog(page)
    await expect(searchDialog).toBeVisible()

    await takeSnapshot(page, testInfo)

    // Type search query
    await page.keyboard.insertText('test')

    await expect(
      page.getByRole('heading', { name: 'RFD 532 Versioning for' }),
    ).toBeVisible()

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
  })
})
