/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import { expect, Page, test } from '@playwright/test'

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

    // can click an RFD — scope to the list to avoid matching the header combobox
    await page.getByRole('link', { name: /RFD 223/ }).click()
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

    // The combobox input is in the DOM but inert (not interactive) until opened
    await page.getByRole('button', { name: 'Select an RFD' }).click()
    await page.getByRole('banner').getByPlaceholder('Search').fill('Mission')
    // Wait for useDeferredValue to settle before pressing Enter
    await page.waitForTimeout(200)
    await page.getByRole('banner').getByPlaceholder('Search').press('Enter')

    await expect(
      page.getByRole('heading', { name: 'Mission, Principles and Values', level: 1 }),
    ).toBeVisible()
  })
})

test.describe('Filtering', () => {
  test('Filter by title via text input', async ({ page }) => {
    await page.goto('/')

    const rfdList = page.getByTestId('rfd-list')
    const rfdLinks = rfdList.getByRole('link', { name: /^RFD/ })

    // don't know how many public RFDs there are but there are a bunch
    expect(await rfdLinks.count()).toBeGreaterThan(10)

    await page.getByPlaceholder('Filter by').fill('standard units')
    await page.waitForTimeout(250)

    // but after you filter there are fewer
    expect(await rfdLinks.count()).toEqual(1)
  })

  test('Filter by author via text input', async ({ page }) => {
    await page.goto('/')

    const rfdList = page.getByTestId('rfd-list')
    const rfdLinks = rfdList.getByRole('link', { name: /^RFD/ })

    // don't know how many public RFDs there are but there are a bunch
    expect(await rfdLinks.count()).toBeGreaterThan(10)

    await page.getByPlaceholder('Filter by').fill('david.crespo')
    await page.waitForTimeout(250)

    // but after you filter there are fewer
    expect(await rfdLinks.count()).toEqual(2)
  })

  test('Filter by author via chip dropdown', async ({ page }) => {
    await page.goto('/')

    const rfdList = page.getByTestId('rfd-list')
    const rfdLinks = rfdList.getByRole('link', { name: /^RFD/ })

    expect(await rfdLinks.count()).toBeGreaterThan(10)

    // Open the Author chip popover
    await page.getByTestId('filter-author').click()
    await expect(page.getByPlaceholder('Search authors')).toBeVisible()

    // Search and select David Crespo
    await page.getByPlaceholder('Search authors').fill('David Crespo')
    await page.getByRole('option', { name: /David Crespo/ }).click()

    // URL should update with author param
    await expect(page).toHaveURL(/author=/)

    // Close the popover by pressing Escape
    await page.keyboard.press('Escape')

    // RFD list filtered to David Crespo's RFDs
    expect(await rfdLinks.count()).toEqual(2)

    // The chip should show selected author name
    await expect(page.getByTestId('filter-author')).toContainText('David Crespo')
  })

  test('Filter by multiple authors via chip dropdown', async ({ page }) => {
    await page.goto('/')

    // Open Author chip
    await page.getByTestId('filter-author').click()
    await expect(page.getByPlaceholder('Search authors')).toBeVisible()

    // Select David Crespo
    await page.getByPlaceholder('Search authors').fill('David Crespo')
    await page.getByRole('option', { name: /David Crespo/ }).click()

    // Add a second author — clear search and pick another
    await page.getByPlaceholder('Search authors').fill('Justin Bennett')
    await page.getByRole('option', { name: /Justin Bennett/ }).click()

    await page.keyboard.press('Escape')

    // URL should have two author params
    await expect(page).toHaveURL(/author=/)
    const url = page.url()
    expect(url.split('author=').length - 1).toEqual(2)

    // Chip shows both names when exactly 2 are selected
    await expect(page.getByTestId('filter-author')).toContainText('David Crespo')
    await expect(page.getByTestId('filter-author')).toContainText('Justin Bennett')
  })

  test('Clear author filter via X button on chip', async ({ page }) => {
    await page.goto('/')

    const rfdLinks = page.getByTestId('rfd-list').getByRole('link', { name: /^RFD/ })
    const totalCount = await rfdLinks.count()

    // Select an author via the chip
    await page.getByTestId('filter-author').click()
    await page.getByPlaceholder('Search authors').fill('David Crespo')
    await page.getByRole('option', { name: /David Crespo/ }).click()
    await page.waitForTimeout(250)
    await page.keyboard.press('Escape')

    expect(await rfdLinks.count()).toBeLessThan(totalCount)

    // Click the X on the Author chip to clear
    await page.getByRole('button', { name: 'Clear Author filter' }).click()
    await page.waitForTimeout(250)

    // URL should no longer have author param
    await expect(page).not.toHaveURL(/author=/)

    // All RFDs visible again
    expect(await rfdLinks.count()).toEqual(totalCount)
  })

  test('Filter by label via chip dropdown', async ({ page }) => {
    await page.goto('/')

    const rfdLinks = page.getByTestId('rfd-list').getByRole('link', { name: /^RFD/ })
    const totalCount = await rfdLinks.count()
    expect(totalCount).toBeGreaterThan(10)

    // Open Label chip popover
    await page.getByTestId('filter-label').click()
    await expect(page.getByPlaceholder('Search labels')).toBeVisible()

    // Search for and select the 'sled' label
    await page.getByPlaceholder('Search labels').fill('storage')
    await page.getByRole('option', { name: /^storage/ }).click()

    // URL should update with label param
    await expect(page).toHaveURL(/label=storage/)

    await page.keyboard.press('Escape')

    // Filtered to fewer RFDs
    expect(await rfdLinks.count()).toBeLessThan(totalCount)
    expect(await rfdLinks.count()).toBeGreaterThan(0)

    // Chip reflects selected label
    await expect(page.getByTestId('filter-label')).toContainText('storage')
  })

  test('Clear label filter via X button on chip', async ({ page }) => {
    await page.goto('/?label=storage')

    const rfdList = page.getByTestId('rfd-list')
    const rfdLinks = rfdList.getByRole('link', { name: /^RFD/ })

    // Should be filtered to storage RFDs
    expect(await rfdLinks.count()).toBeGreaterThan(0)
    expect(await rfdLinks.count()).toBeLessThan(30)

    // Click the X on the Label chip
    await page.getByRole('button', { name: 'Clear Label filter' }).click()
    await page.waitForTimeout(250)

    await expect(page).not.toHaveURL(/label=/)
    expect(await rfdLinks.count()).toBeGreaterThan(10)
  })

  test('Suggested authors appear when typing in filter input', async ({ page }) => {
    await page.goto('/')

    // Type a partial author name — suggestions should appear
    await page.getByPlaceholder('Filter by').fill('David Crespo')
    await page.waitForTimeout(250)

    // Suggested authors banner should appear with a link to filter by that author
    const suggestedAuthors = page.getByText('Filter RFDs from:').locator('..')
    await expect(suggestedAuthors).toBeVisible()
    const authorLink = suggestedAuthors.getByRole('link', { name: 'David Crespo' })
    await expect(authorLink).toBeVisible()

    // Clicking the suggestion sets the author filter and clears the text input
    await authorLink.click()

    await expect(page).toHaveURL(/author=/)
    // Input should be cleared after clicking a suggestion
    await expect(page.getByPlaceholder('Filter by')).toHaveValue('')

    // RFDs filtered to David Crespo's
    const rfdLinks = page.getByTestId('rfd-list').getByRole('link', { name: /^RFD/ })
    expect(await rfdLinks.count()).toEqual(2)
  })

  test('Suggested labels appear when typing in filter input', async ({ page }) => {
    await page.goto('/')

    // "storage" matches exactly 1 of the 8 public labels, so suggestions appear
    await page.getByPlaceholder('Filter by').fill('storage')
    await page.waitForTimeout(250)

    // Suggested labels banner should appear
    const suggestedLabels = page.getByText('Filter RFDs labeled:').locator('..')
    await expect(suggestedLabels).toBeVisible()
    const labelLink = suggestedLabels.getByRole('link', { name: 'storage' })
    await expect(labelLink).toBeVisible()

    // Clicking sets label filter
    await labelLink.click()

    await expect(page).toHaveURL(/label=storage/)
    await expect(page.getByPlaceholder('Filter by')).toHaveValue('')
  })

  test('Empty state with Clear filters button', async ({ page }) => {
    await page.goto('/')

    // Filter to something that returns no results
    await page.getByPlaceholder('Filter by').fill('xyzzy_no_match_12345')
    await page.waitForTimeout(250)

    await expect(page.getByText('No RFDs match your filters')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Clear filters' })).toBeVisible()

    // Clicking Clear filters resets the input
    await page.getByRole('button', { name: 'Clear filters' }).click()
    await expect(page.getByText('No RFDs match your filters')).toBeHidden()
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
    test(`Direct link to public RFD ${rfd}`, async ({ page }) => {
      await page.goto(`/rfd/${rfd}`)
      await expectRfdPage(page, title, author)
    })
  }
})

test.describe('Authentication', () => {
  test('Sign in button functionality', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeHidden()
    await page.getByRole('link', { name: 'Sign in' }).click()
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
  })

  test('Login redirect on nonexistent or private RFD', async ({ page }) => {
    await page.goto('/rfd/4268')
    await expect(page).toHaveURL(/\/login\?returnTo=\/rfd\/4268$/)
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
  })
})

test.describe('Search', () => {
  test('Search functionality and navigation', async ({ page }) => {
    // Playwright + Chromium on macOS doesn't reliably fire Meta+<letter> keydown
    // events, so ControlOrMeta+k (which resolves to Meta+k on Mac) silently fails.
    // Ctrl+k works because Mousetrap's `mod+k` binding resolves to Ctrl in the
    // test browser's reported platform.
    const openSearchMenu = () => page.keyboard.press('Control+k')
    const searchButton = page.getByRole('button', { name: 'Search' })

    await page.goto('/')
    // Wait for the page to be interactive before using keyboard shortcuts
    await page.waitForLoadState('domcontentloaded')

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

    // Click on the search result
    await testScenarioResult.click()

    // Verify we navigated to the correct RFD and section
    await expect(page).toHaveURL(/\/rfd\/0363#_test_the_ignition_target/)
    await expect(
      page.getByRole('heading', {
        name: 'Minibar',
        level: 1,
      }),
    ).toBeVisible()

    // Verify we're at the correct section
    await expect(page.getByRole('link', { name: 'Test the Ignition Target' })).toBeVisible()
  })

  test('Search result navigation to different RFD', async ({ page }) => {
    const searchButton = page.getByRole('button', { name: 'Search' })

    await page.goto('/')

    const searchDialog = page.getByRole('dialog', { name: 'Search' })
    await expect(searchDialog).toBeHidden()

    await searchButton.click()
    await expect(searchDialog).toBeVisible()

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
    await expect(page).toHaveURL(/\/rfd\/0223#_browser_only/)
    await expect(
      page.getByRole('heading', { name: 'Web Console Architecture', level: 1 }),
    ).toBeVisible()

    // Verify we're at the correct section
    await expect(
      page.getByRole('heading', { name: 'Architectures', level: 2 }),
    ).toBeVisible()
  })
})
