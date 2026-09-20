/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import { expect, test, type Locator, type Page } from '@playwright/test'

// ---------------------------------------------------------------------------
// Test fixture: RFD 9999 at test/fixtures/rfd/9999/README.adoc
//
// Diagrams (in order):
//   0: Wide flowchart (flowchart LR — wider than tall)
//   1: Tall sequence diagram (sequenceDiagram — taller than wide)
//   2: Small state diagram (stateDiagram-v2 — roughly square, small)
//   3: Large state diagram (stateDiagram-v2 — roughly square, large)
//   4: Gantt chart (gantt — wide)
// ---------------------------------------------------------------------------

const FIXTURE_RFD = '9999'
const DIAGRAM_COUNT = 5

const WIDE_FLOWCHART = 0
const TALL_SEQUENCE = 1
const SMALL_STATE = 2
const LARGE_STATE = 3
const GANTT_CHART = 4

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Wait for all mermaid diagrams to finish rendering (SVG injected into <code>). */
async function waitForMermaidDiagrams(page: Page) {
  await expect(page.locator('.listingblock code svg')).toHaveCount(DIAGRAM_COUNT, {
    timeout: 3000,
  })
}

/** Get all rendered mermaid diagram containers on the page. */
function mermaidDiagrams(page: Page): Locator {
  return page.locator('.listingblock code svg').locator('..')
}

/** Get the expand button for a specific diagram (by 0-based index). */
function expandButton(page: Page, index = 0): Locator {
  return page
    .locator('.listingblock')
    .filter({ has: page.locator('code svg') })
    .nth(index)
    .getByRole('button', { name: /expand/i })
}

/** Get the "Show Source | Mermaid" button for a specific diagram. */
function showSourceButton(page: Page, index = 0): Locator {
  return page
    .locator('.listingblock')
    .filter({ has: page.locator('code svg') })
    .nth(index)
    .getByRole('button', { name: /source/i })
}

/** Get the expanded diagram dialog/overlay. */
function expandedOverlay(page: Page): Locator {
  return page.getByRole('dialog', { name: /diagram/i })
}

/** Get the zoom-in button inside the expanded overlay. */
function zoomInButton(page: Page): Locator {
  return expandedOverlay(page).getByRole('button', { name: /zoom.?in/i })
}

/** Get the zoom-out button inside the expanded overlay. */
function zoomOutButton(page: Page): Locator {
  return expandedOverlay(page).getByRole('button', { name: /zoom.?out/i })
}

/** Get the close button inside the expanded overlay. */
function closeButton(page: Page): Locator {
  return expandedOverlay(page).getByRole('button', { name: /close/i })
}

/** Get the zoom level indicator inside the expanded overlay. */
function zoomLevel(page: Page): Locator {
  return expandedOverlay(page).getByText(/^\d+%$/)
}

async function gotoFixture(page: Page) {
  await page.goto(`/rfd/${FIXTURE_RFD}`)
  await waitForMermaidDiagrams(page)
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('Mermaid Diagram Expansion', () => {
  test.describe('Expand button presence', () => {
    test('all diagrams have an expand button', async ({ page }) => {
      await gotoFixture(page)
      const count = await mermaidDiagrams(page).count()
      expect(count).toBe(DIAGRAM_COUNT)

      for (let i = 0; i < count; i++) {
        await expect(expandButton(page, i)).toBeVisible()
      }
    })

    test('expand and show-source buttons do not overlap', async ({ page }) => {
      await gotoFixture(page)

      const expand = expandButton(page, WIDE_FLOWCHART)
      const source = showSourceButton(page, WIDE_FLOWCHART)
      await expect(expand).toBeVisible()
      await expect(source).toBeVisible()

      const expandBox = await expand.boundingBox()
      const sourceBox = await source.boundingBox()
      expect(expandBox).toBeTruthy()
      expect(sourceBox).toBeTruthy()

      const overlaps =
        expandBox!.x < sourceBox!.x + sourceBox!.width &&
        expandBox!.x + expandBox!.width > sourceBox!.x &&
        expandBox!.y < sourceBox!.y + sourceBox!.height &&
        expandBox!.y + expandBox!.height > sourceBox!.y

      expect(overlaps, 'Expand and Show Source buttons must not overlap').toBe(false)
    })
  })

  test.describe('Expand and close', () => {
    test('clicking expand opens a full-screen overlay', async ({ page }) => {
      await gotoFixture(page)
      await expect(expandedOverlay(page)).toBeHidden()

      await expandButton(page, WIDE_FLOWCHART).click()
      await expect(expandedOverlay(page)).toBeVisible()
    })

    test('close button dismisses the overlay', async ({ page }) => {
      await gotoFixture(page)
      await expandButton(page, WIDE_FLOWCHART).click()
      await expect(expandedOverlay(page)).toBeVisible()

      await closeButton(page).click()
      await expect(expandedOverlay(page)).toBeHidden()
    })

    test('Escape key dismisses the overlay', async ({ page }) => {
      await gotoFixture(page)
      await expandButton(page, WIDE_FLOWCHART).click()
      await expect(expandedOverlay(page)).toBeVisible()

      await page.keyboard.press('Escape')
      await expect(expandedOverlay(page)).toBeHidden()
    })

    test('overlay contains the SVG diagram', async ({ page }) => {
      await gotoFixture(page)
      await expandButton(page, WIDE_FLOWCHART).click()

      const overlaySvg = expandedOverlay(page).locator('svg')
      await expect(overlaySvg.first()).toBeVisible()
    })
  })

  test.describe('Initial zoom', () => {
    test('initial zoom is 100%', async ({ page }) => {
      await gotoFixture(page)
      await expandButton(page, WIDE_FLOWCHART).click()
      await expect(expandedOverlay(page)).toBeVisible()

      expect(await zoomLevel(page).textContent()).toBe('100%')
    })

    test('initial zoom is 100% for tall diagrams', async ({ page }) => {
      await gotoFixture(page)
      await expandButton(page, TALL_SEQUENCE).click()
      await expect(expandedOverlay(page)).toBeVisible()

      expect(await zoomLevel(page).textContent()).toBe('100%')
    })

    test('diagram is centered in the overlay', async ({ page }) => {
      await gotoFixture(page)
      await expandButton(page, SMALL_STATE).click()

      const overlay = expandedOverlay(page)
      await expect(overlay).toBeVisible()

      const scrollContainer = overlay.locator('[data-scroll-container]')
      const svg = overlay.locator('svg').first()
      await expect(svg).toBeVisible()

      const containerBox = await scrollContainer.boundingBox()
      const svgBox = await svg.boundingBox()
      expect(containerBox).not.toBeNull()
      expect(svgBox).not.toBeNull()

      const leftGap = svgBox!.x - containerBox!.x
      const rightGap = containerBox!.x + containerBox!.width - (svgBox!.x + svgBox!.width)
      expect(Math.abs(leftGap - rightGap)).toBeLessThanOrEqual(2)

      const topGap = svgBox!.y - containerBox!.y
      const bottomGap =
        containerBox!.y + containerBox!.height - (svgBox!.y + svgBox!.height)
      expect(Math.abs(topGap - bottomGap)).toBeLessThanOrEqual(2)
    })

    test('diagram may overflow and be scrollable at initial zoom', async ({ page }) => {
      await gotoFixture(page)
      await expandButton(page, TALL_SEQUENCE).click()

      const overlay = expandedOverlay(page)
      await expect(overlay).toBeVisible()

      const scrollInfo = await overlay.evaluate((el) => {
        const scrollEl = el.querySelector('[data-scroll-container]') || el
        return {
          scrollWidth: scrollEl.scrollWidth,
          scrollHeight: scrollEl.scrollHeight,
          clientWidth: scrollEl.clientWidth,
          clientHeight: scrollEl.clientHeight,
        }
      })

      const overflowsH = scrollInfo.scrollWidth > scrollInfo.clientWidth
      const overflowsV = scrollInfo.scrollHeight > scrollInfo.clientHeight
      if (overflowsH || overflowsV) {
        const overflow = await overlay.evaluate((el) => {
          const scrollEl = el.querySelector('[data-scroll-container]') || el
          const style = window.getComputedStyle(scrollEl)
          return { x: style.overflowX, y: style.overflowY }
        })
        expect(['auto', 'scroll']).toContain(overflow.x)
        expect(['auto', 'scroll']).toContain(overflow.y)
      }
    })
  })

  test.describe('Solid background respects theme', () => {
    test('overlay has an opaque background in dark theme', async ({ page }) => {
      await gotoFixture(page)

      await page.evaluate(() => {
        localStorage.setItem('theme-preference', 'dark')
        document.documentElement.dataset.theme = 'dark'
      })

      await expandButton(page, WIDE_FLOWCHART).click()
      const overlay = expandedOverlay(page)
      await expect(overlay).toBeVisible()

      const bgColor = await overlay.evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor
      })

      expect(bgColor).not.toBe('transparent')
      expect(bgColor).not.toBe('rgba(0, 0, 0, 0)')
      if (bgColor.includes('/')) {
        expect(bgColor).toMatch(/\/\s*1\s*\)/)
      }
    })

    test('overlay has an opaque background in light theme', async ({ page }) => {
      await gotoFixture(page)

      await page.evaluate(() => {
        localStorage.setItem('theme-preference', 'light')
        document.documentElement.dataset.theme = 'light'
      })

      await expandButton(page, WIDE_FLOWCHART).click()
      const overlay = expandedOverlay(page)
      await expect(overlay).toBeVisible()

      const bgColor = await overlay.evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor
      })

      expect(bgColor).not.toBe('transparent')
      expect(bgColor).not.toBe('rgba(0, 0, 0, 0)')
      if (bgColor.includes('/')) {
        expect(bgColor).toMatch(/\/\s*1\s*\)/)
      }
    })

    test('dark and light theme backgrounds are different colors', async ({ page }) => {
      await gotoFixture(page)

      await page.evaluate(() => {
        localStorage.setItem('theme-preference', 'dark')
        document.documentElement.dataset.theme = 'dark'
      })
      await expandButton(page, WIDE_FLOWCHART).click()
      const darkBg = await expandedOverlay(page).evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor
      })
      await closeButton(page).click()
      await expect(expandedOverlay(page)).toBeHidden()

      await page.evaluate(() => {
        localStorage.setItem('theme-preference', 'light')
        document.documentElement.dataset.theme = 'light'
      })
      await expandButton(page, WIDE_FLOWCHART).click()
      const lightBg = await expandedOverlay(page).evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor
      })

      expect(darkBg).not.toEqual(lightBg)
    })
  })

  test.describe('Zoom controls', () => {
    test('initial zoom level is displayed as a percentage', async ({ page }) => {
      await gotoFixture(page)
      await expandButton(page, WIDE_FLOWCHART).click()

      await expect(zoomLevel(page)).toBeVisible()
      expect(await zoomLevel(page).textContent()).toBe('100%')
    })

    test('zoom-in button increases zoom level', async ({ page }) => {
      await gotoFixture(page)
      await expandButton(page, WIDE_FLOWCHART).click()

      await zoomInButton(page).click()

      const text = await zoomLevel(page).textContent()
      const level = parseInt(text!.replace('%', ''), 10)
      expect(level).toBeGreaterThan(100)
    })

    test('zoom-out button decreases zoom level', async ({ page }) => {
      await gotoFixture(page)
      await expandButton(page, WIDE_FLOWCHART).click()

      await zoomOutButton(page).click()

      const text = await zoomLevel(page).textContent()
      const level = parseInt(text!.replace('%', ''), 10)
      expect(level).toBeLessThan(100)
    })

    test('multiple zoom-in clicks increase progressively', async ({ page }) => {
      await gotoFixture(page)
      await expandButton(page, WIDE_FLOWCHART).click()

      await zoomInButton(page).click()
      const level1 = parseInt((await zoomLevel(page).textContent())!.replace('%', ''), 10)

      await zoomInButton(page).click()
      const level2 = parseInt((await zoomLevel(page).textContent())!.replace('%', ''), 10)

      expect(level2).toBeGreaterThan(level1)
    })

    test('clicking zoom level resets to 100%', async ({ page }) => {
      await gotoFixture(page)
      await expandButton(page, WIDE_FLOWCHART).click()

      await zoomInButton(page).click()
      await zoomInButton(page).click()
      await zoomInButton(page).click()

      expect(await zoomLevel(page).textContent()).not.toBe('100%')

      await zoomLevel(page).click()

      expect(await zoomLevel(page).textContent()).toBe('100%')
    })

    test('zoom level resets to 100% when overlay is reopened', async ({ page }) => {
      await gotoFixture(page)
      await expandButton(page, WIDE_FLOWCHART).click()

      await zoomInButton(page).click()
      await zoomInButton(page).click()

      const zoomedLevel = parseInt(
        (await zoomLevel(page).textContent())!.replace('%', ''),
        10,
      )
      expect(zoomedLevel).toBeGreaterThan(100)

      await closeButton(page).click()
      await expect(expandedOverlay(page)).toBeHidden()
      await expandButton(page, WIDE_FLOWCHART).click()

      expect(await zoomLevel(page).textContent()).toBe('100%')
    })
  })

  test.describe('Scroll to pan (native scrolling)', () => {
    test('zoomed-in diagram becomes scrollable', async ({ page }) => {
      await gotoFixture(page)
      await expandButton(page, WIDE_FLOWCHART).click()

      for (let i = 0; i < 5; i++) {
        await zoomInButton(page).click()
      }

      const overlay = expandedOverlay(page)
      const isScrollable = await overlay.evaluate((el) => {
        const scrollEl = el.querySelector('[data-scroll-container]') || el
        return (
          scrollEl.scrollWidth > scrollEl.clientWidth ||
          scrollEl.scrollHeight > scrollEl.clientHeight
        )
      })

      expect(isScrollable).toBe(true)
    })

    test('native scroll changes the visible area of a zoomed diagram', async ({ page }) => {
      await gotoFixture(page)
      await expandButton(page, WIDE_FLOWCHART).click()

      for (let i = 0; i < 5; i++) {
        await zoomInButton(page).click()
      }

      const overlay = expandedOverlay(page)

      const initialScroll = await overlay.evaluate((el) => {
        const scrollEl = el.querySelector('[data-scroll-container]') || el
        return { left: scrollEl.scrollLeft, top: scrollEl.scrollTop }
      })

      await overlay.hover()
      await page.mouse.wheel(200, 0)
      await page.waitForTimeout(200)

      const newScroll = await overlay.evaluate((el) => {
        const scrollEl = el.querySelector('[data-scroll-container]') || el
        return { left: scrollEl.scrollLeft, top: scrollEl.scrollTop }
      })

      expect(
        newScroll.left !== initialScroll.left || newScroll.top !== initialScroll.top,
      ).toBe(true)
    })
  })

  test.describe('Click-and-drag to pan', () => {
    test('click-and-drag pans the zoomed diagram', async ({ page }) => {
      await gotoFixture(page)
      await expandButton(page, WIDE_FLOWCHART).click()

      for (let i = 0; i < 5; i++) {
        await zoomInButton(page).click()
      }

      const overlay = expandedOverlay(page)
      const overlayBox = await overlay.boundingBox()
      expect(overlayBox).not.toBeNull()

      const centerX = overlayBox!.x + overlayBox!.width / 2
      const centerY = overlayBox!.y + overlayBox!.height / 2

      const beforeScroll = await overlay.evaluate((el) => {
        const scrollEl = el.querySelector('[data-scroll-container]') || el
        return { left: scrollEl.scrollLeft, top: scrollEl.scrollTop }
      })

      await page.mouse.move(centerX, centerY)
      await page.mouse.down()
      await page.mouse.move(centerX - 100, centerY - 50, { steps: 10 })
      await page.mouse.up()

      await page.waitForTimeout(100)

      const afterScroll = await overlay.evaluate((el) => {
        const scrollEl = el.querySelector('[data-scroll-container]') || el
        return { left: scrollEl.scrollLeft, top: scrollEl.scrollTop }
      })

      expect(
        afterScroll.left !== beforeScroll.left || afterScroll.top !== beforeScroll.top,
      ).toBe(true)
    })

    test('cursor shows grab/grabbing during drag', async ({ page }) => {
      await gotoFixture(page)
      await expandButton(page, WIDE_FLOWCHART).click()

      for (let i = 0; i < 5; i++) {
        await zoomInButton(page).click()
      }

      const overlay = expandedOverlay(page)

      const cursorBefore = await overlay.evaluate((el) => {
        const scrollEl = el.querySelector('[data-scroll-container]') || el
        return window.getComputedStyle(scrollEl).cursor
      })
      expect(cursorBefore).toBe('grab')

      const overlayBox = await overlay.boundingBox()
      const centerX = overlayBox!.x + overlayBox!.width / 2
      const centerY = overlayBox!.y + overlayBox!.height / 2

      await page.mouse.move(centerX, centerY)
      await page.mouse.down()

      const cursorDuring = await overlay.evaluate((el) => {
        const scrollEl = el.querySelector('[data-scroll-container]') || el
        return window.getComputedStyle(scrollEl).cursor
      })
      expect(cursorDuring).toBe('grabbing')

      await page.mouse.up()
    })
  })

  test.describe('Diagram types', () => {
    test('wide flowchart can be expanded', async ({ page }) => {
      await gotoFixture(page)
      await expandButton(page, WIDE_FLOWCHART).click()

      await expect(expandedOverlay(page)).toBeVisible()
      await expect(expandedOverlay(page).locator('svg').first()).toBeVisible()
    })

    test('tall sequence diagram can be expanded', async ({ page }) => {
      await gotoFixture(page)
      await expandButton(page, TALL_SEQUENCE).click()

      await expect(expandedOverlay(page)).toBeVisible()
      await expect(expandedOverlay(page).locator('svg').first()).toBeVisible()
    })

    test('small state diagram can be expanded', async ({ page }) => {
      await gotoFixture(page)
      await expandButton(page, SMALL_STATE).click()

      await expect(expandedOverlay(page)).toBeVisible()
      await expect(expandedOverlay(page).locator('svg').first()).toBeVisible()
    })

    test('large state diagram can be expanded', async ({ page }) => {
      await gotoFixture(page)
      await expandButton(page, LARGE_STATE).click()

      await expect(expandedOverlay(page)).toBeVisible()
      await expect(expandedOverlay(page).locator('svg').first()).toBeVisible()
    })

    test('gantt chart can be expanded', async ({ page }) => {
      await gotoFixture(page)
      await expandButton(page, GANTT_CHART).click()

      await expect(expandedOverlay(page)).toBeVisible()
      await expect(expandedOverlay(page).locator('svg').first()).toBeVisible()
    })

    test('each diagram opens independently', async ({ page }) => {
      await gotoFixture(page)

      await expandButton(page, WIDE_FLOWCHART).click()
      await expect(expandedOverlay(page)).toBeVisible()
      const firstSvg = await expandedOverlay(page).locator('svg').first().innerHTML()
      await closeButton(page).click()
      await expect(expandedOverlay(page)).toBeHidden()

      await expandButton(page, TALL_SEQUENCE).click()
      await expect(expandedOverlay(page)).toBeVisible()
      const secondSvg = await expandedOverlay(page).locator('svg').first().innerHTML()

      expect(firstSvg).not.toEqual(secondSvg)
    })

    test('tall diagram zoom controls work', async ({ page }) => {
      await gotoFixture(page)
      await expandButton(page, TALL_SEQUENCE).click()

      await zoomInButton(page).click()
      const level = parseInt((await zoomLevel(page).textContent())!.replace('%', ''), 10)
      expect(level).toBeGreaterThan(100)
    })

    test('tall diagram can be panned when zoomed in', async ({ page }) => {
      await gotoFixture(page)
      await expandButton(page, TALL_SEQUENCE).click()

      for (let i = 0; i < 5; i++) {
        await zoomInButton(page).click()
      }

      const overlay = expandedOverlay(page)
      const isScrollable = await overlay.evaluate((el) => {
        const scrollEl = el.querySelector('[data-scroll-container]') || el
        return (
          scrollEl.scrollWidth > scrollEl.clientWidth ||
          scrollEl.scrollHeight > scrollEl.clientHeight
        )
      })

      expect(isScrollable).toBe(true)
    })
  })
})
