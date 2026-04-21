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

// The RFD list is virtualized, so we can't count DOM nodes. Read the result
// count from the "Results:" badge above the list instead. Use `rfdCount` when
// you need to capture a value for comparison; otherwise prefer asserting on
// the count locator directly so Playwright's auto-wait handles the deferred
// render from `useDeferredValue` / `startTransition`.
const rfdCountLocator = (page: Page) => page.getByTestId('rfd-count')

async function rfdCount(page: Page): Promise<number> {
  const text = await rfdCountLocator(page).textContent()
  return Number(text?.trim() ?? '0')
}

// The home page has a `useEffect(focusInput)` that only runs post-hydration.
// Waiting for focus on the filter input is a reliable signal that React has
// attached its onChange handlers, so subsequent `fill()` calls actually update
// state. Without this, a fast-running test can fill the input before hydration
// and the filter silently never applies.
async function gotoHome(page: Page) {
  await page.goto('/')
  await expect(page.getByPlaceholder('Filter by')).toBeFocused()
}

test.describe('Navigation and Basic Functionality', () => {
  test('Header filter box navigation', async ({ page }) => {
    await page.goto('/rfd/0001')
    await expect(
      page.getByRole('heading', { name: 'Requests for Discussion' }),
    ).toBeVisible()

    // The combobox input is in the DOM but inert (not interactive) until opened
    await page.getByRole('button', { name: 'Select an RFD' }).click()
    const search = page.getByRole('banner').getByPlaceholder('Search')
    await search.fill('Mission')
    // Wait for the deferred filter to apply: the first item should be our
    // target before Enter navigates to the selected (first) match.
    await expect(page.getByRole('banner').locator('a[data-index="0"]')).toContainText(
      'Mission, Principles and Values',
    )
    await search.press('Enter')

    await expect(
      page.getByRole('heading', { name: 'Mission, Principles and Values', level: 1 }),
    ).toBeVisible()
  })
})

test.describe('Filtering', () => {
  test('Filter by title via text input', async ({ page }) => {
    await gotoHome(page)

    // don't know how many public RFDs there are but there are a bunch
    expect(await rfdCount(page)).toBeGreaterThan(10)

    await page.getByPlaceholder('Filter by').fill('standard units')
    await expect(rfdCountLocator(page)).toHaveText('1')
  })

  test('Filter by author via text input', async ({ page }) => {
    await gotoHome(page)
    expect(await rfdCount(page)).toBeGreaterThan(10)

    await page.getByPlaceholder('Filter by').fill('david.crespo')
    await expect(rfdCountLocator(page)).toHaveText('2')
  })

  test('Filter by author via chip dropdown', async ({ page }) => {
    await gotoHome(page)
    expect(await rfdCount(page)).toBeGreaterThan(10)

    // Open the Author chip popover
    await page.getByTestId('filter-author').click()
    await expect(page.getByPlaceholder('Search authors')).toBeVisible()

    // Select David Crespo
    await page.getByRole('option', { name: /David Crespo/ }).click()

    // URL should update with author param
    await expect(page).toHaveURL(/author=/)

    await page.keyboard.press('Escape')

    // RFD list filtered to David Crespo's RFDs
    await expect(rfdCountLocator(page)).toHaveText('2')

    // The chip should show selected author name
    await expect(page.getByTestId('filter-author')).toContainText('David Crespo')
  })

  test('Filter by multiple authors via chip dropdown', async ({ page }) => {
    await gotoHome(page)

    await page.getByTestId('filter-author').click()
    await expect(page.getByPlaceholder('Search authors')).toBeVisible()

    const authorSearch = page.getByPlaceholder('Search authors')

    await authorSearch.fill('David Crespo')
    await page.getByRole('option', { name: /David Crespo/ }).click()

    await authorSearch.fill('Justin Bennett')
    await page.getByRole('option', { name: /Justin Bennett/ }).click()

    // Two author params in the URL
    await expect(page).toHaveURL(/author=.*author=/)

    await page.keyboard.press('Escape')

    // Chip shows both names when exactly 2 are selected
    await expect(page.getByTestId('filter-author')).toContainText('David Crespo')
    await expect(page.getByTestId('filter-author')).toContainText('Justin Bennett')
  })

  test('Clear author filter via X button on chip', async ({ page }) => {
    await gotoHome(page)
    expect(await rfdCount(page)).toBeGreaterThan(10)
    const totalCount = await rfdCount(page)

    // Select an author via the chip
    await page.getByTestId('filter-author').click()
    await page.getByPlaceholder('Search authors').fill('David Crespo')
    await page.getByRole('option', { name: /David Crespo/ }).click()
    await page.keyboard.press('Escape')

    await expect.poll(() => rfdCount(page)).toBeLessThan(totalCount)

    // Click the X on the Author chip to clear
    await page.getByRole('button', { name: 'Clear Author filter' }).click()

    await expect(page).not.toHaveURL(/author=/)
    await expect(rfdCountLocator(page)).toHaveText(String(totalCount))
  })

  test('Filter by label via chip dropdown', async ({ page }) => {
    await gotoHome(page)
    expect(await rfdCount(page)).toBeGreaterThan(10)
    const totalCount = await rfdCount(page)

    // Open Label chip popover
    await page.getByTestId('filter-label').click()
    await expect(page.getByPlaceholder('Search labels')).toBeVisible()

    // Select the 'storage' label
    await page.getByRole('option', { name: /^storage/ }).click()

    // URL should update with label param
    await expect(page).toHaveURL(/label=storage/)

    await page.keyboard.press('Escape')

    // Filtered to fewer (but more than 0) RFDs
    await expect.poll(() => rfdCount(page)).toBeLessThan(totalCount)
    expect(await rfdCount(page)).toBeGreaterThan(0)

    // Chip reflects selected label
    await expect(page.getByTestId('filter-label')).toContainText('storage')
  })

  test('Clear label filter via X button on chip', async ({ page }) => {
    await page.goto('/?label=storage')

    // Should be filtered to storage RFDs
    await expect.poll(() => rfdCount(page)).toBeGreaterThan(0)
    await expect.poll(() => rfdCount(page)).toBeLessThan(30)

    // Click the X on the Label chip
    await page.getByRole('button', { name: 'Clear Label filter' }).click()

    await expect(page).not.toHaveURL(/label=/)
    await expect.poll(() => rfdCount(page)).toBeGreaterThan(10)
  })

  test('Filter by state via chip dropdown', async ({ page }) => {
    await gotoHome(page)
    expect(await rfdCount(page)).toBeGreaterThan(10)
    const totalCount = await rfdCount(page)

    // Open State chip popover
    await page.getByTestId('filter-state').click()
    await expect(page.getByPlaceholder('Search states')).toBeVisible()

    // Deselect 'published' — this narrows the default state set
    await page.getByPlaceholder('Search states').fill('published')
    await page.getByRole('option', { name: /^published/ }).click()

    // URL should update with state params (deviation from default)
    await expect(page).toHaveURL(/state=/)

    await page.keyboard.press('Escape')

    // Fewer RFDs (but more than 0) now that published is excluded
    await expect.poll(() => rfdCount(page)).toBeLessThan(totalCount)
    expect(await rfdCount(page)).toBeGreaterThan(0)

    // Chip reflects the deviation
    await expect(page.getByTestId('filter-state')).toContainText(/selected|:/i)
  })

  test('Clear state filter via X button on chip', async ({ page }) => {
    // Start with a non-default state selection
    await page.goto('/?state=published')
    await expect.poll(() => rfdCount(page)).toBeGreaterThan(0)
    const filteredCount = await rfdCount(page)

    // Click the X on the State chip
    await page.getByRole('button', { name: 'Clear State filter' }).click()

    // URL should no longer have state param
    await expect(page).not.toHaveURL(/state=/)

    // Back to default — more RFDs than just published
    await expect.poll(() => rfdCount(page)).toBeGreaterThan(filteredCount)
  })

  test('Suggested authors appear when typing in filter input', async ({ page }) => {
    await gotoHome(page)

    // Type a partial author name — suggestions should appear
    await page.getByPlaceholder('Filter by').fill('David Crespo')

    // Suggested authors banner should appear with a link to filter by that author
    const suggestedAuthors = page.getByText('Filter RFDs from:').locator('..')
    const authorLink = suggestedAuthors.getByRole('link', { name: 'David Crespo' })
    await expect(authorLink).toBeVisible()

    // Clicking the suggestion sets the author filter and clears the text input
    await authorLink.click()

    await expect(page).toHaveURL(/author=/)
    await expect(page.getByPlaceholder('Filter by')).toHaveValue('')
    await expect(rfdCountLocator(page)).toHaveText('2')
  })

  test('Suggested labels appear when typing in filter input', async ({ page }) => {
    await gotoHome(page)

    // "storage" matches exactly 1 of the 8 public labels, so suggestions appear
    await page.getByPlaceholder('Filter by').fill('storage')

    // Suggested labels banner should appear
    const suggestedLabels = page.getByText('Filter RFDs labeled:').locator('..')
    const labelLink = suggestedLabels.getByRole('link', { name: 'storage' })
    await expect(labelLink).toBeVisible()

    // Clicking sets label filter
    await labelLink.click()

    await expect(page).toHaveURL(/label=storage/)
    await expect(page.getByPlaceholder('Filter by')).toHaveValue('')
  })

  test('Empty state with Clear filters button', async ({ page }) => {
    await gotoHome(page)

    // Filter to something that returns no results
    await page.getByPlaceholder('Filter by').fill('xyzzy_no_match_12345')

    await expect(page.getByText('No RFDs match your filters')).toBeVisible()
    const clearBtn = page.getByRole('button', { name: 'Clear filters' })
    await expect(clearBtn).toBeVisible()

    // Clicking Clear filters resets the input
    await clearBtn.click()
    await expect(page.getByText('No RFDs match your filters')).toBeHidden()
  })
})

test.describe('Direct RFD Access', () => {
  const rfdTestCases = [
    { rfd: '0068', title: 'Partnership as Shared Values', author: 'Bryan Cantrill' },
    { rfd: '0479', title: 'Dropshot API traits', author: 'Rain Paharia' },
    { rfd: '0400', title: 'Dealing with cancel safety in async Rust', author: 'Rain Paharia' },
    { rfd: '0463', title: 'The Oximeter Query Language', author: 'Benjamin Naecker' },
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
    const searchDialog = page.getByRole('dialog', { name: 'Search' })

    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')

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

    const testScenarioResult = searchDialog
      .getByRole('button')
      .filter({ hasText: 'Manufacturing Test Needs' })
      .first()
    await testScenarioResult.click()

    await expect(page).toHaveURL(/\/rfd\/0363#_test_the_ignition_target/)
    await expect(page.getByRole('heading', { name: 'Minibar', level: 1 })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Test the Ignition Target' })).toBeVisible()
  })

  test('Search result navigation to different RFD', async ({ page }) => {
    const searchButton = page.getByRole('button', { name: 'Search' })
    const searchDialog = page.getByRole('dialog', { name: 'Search' })

    await page.goto('/')
    await expect(searchDialog).toBeHidden()

    await searchButton.click()
    await expect(searchDialog).toBeVisible()

    await page.keyboard.insertText('web console')

    await expect(page.getByRole('heading', { name: 'RFD 223 Web Console' })).toBeVisible()

    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowDown')

    const architecturesResult = searchDialog
      .getByRole('button')
      .filter({ hasText: 'Architectures' })
      .first()
    await architecturesResult.click()

    await expect(page).toHaveURL(/\/rfd\/0223#_browser_only/)
    await expect(
      page.getByRole('heading', { name: 'Web Console Architecture', level: 1 }),
    ).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Architectures', level: 2 })).toBeVisible()
  })
})
