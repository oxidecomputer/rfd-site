import { test } from '@playwright/test'

test('debug', async ({ page }) => {
  await page.goto('/')

  const inputs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('input')).map((i) => ({
      classes: i.className.slice(0, 80),
      placeholder: i.placeholder,
      display: getComputedStyle(i).display,
      visibility: getComputedStyle(i).visibility,
      autofocus: i.autofocus,
    }))
  })
  console.log(JSON.stringify(inputs, null, 2))
})
