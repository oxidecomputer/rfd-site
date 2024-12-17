/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import { expect, test } from '@playwright/test'

test('Click around', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Requests for Discussion' })).toBeVisible()
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

  await page.getByPlaceholder('Filter by').fill('davidcrespo')

  // but after you filter there are fewer
  expect(await rfdLinks.count()).toEqual(2)
})

test('Header filter box', async ({ page }) => {
  await page.goto('/rfd/0002')

  await expect(
    page.getByRole('heading', { name: 'Mission, Principles and Values' }),
  ).toBeVisible()

  await expect(page.getByRole('banner').getByPlaceholder('Search')).toBeHidden()
  await page.getByRole('button', { name: 'Select a RFD' }).click()
  await page.getByRole('banner').getByPlaceholder('Search').fill('User Networking API')
  await page.getByRole('banner').getByPlaceholder('Search').press('Enter')

  await expect(page.getByRole('heading', { name: 'User Networking API' })).toBeVisible()
})

test('Direct link to public RFD', async ({ page }) => {
  await page.goto('/rfd/0068')

  await expect(
    page.getByRole('heading', { name: 'Partnership as Shared Values' }),
  ).toBeVisible()
  await expect(page.getByText('AuthorsBryan Cantrill')).toBeVisible()
})

test('Sign in button', async ({ page }) => {
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
