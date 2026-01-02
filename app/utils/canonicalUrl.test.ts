/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import { expect, test } from 'vitest'

import { canonicalRfdUrl, canonicalUrl, formatRfdNum, SITE_URL } from './canonicalUrl'

test.each([
  [1, '0001'],
  [53, '0053'],
  [321, '0321'],
  [9999, '9999'],
])('formatRfdNum(%i) -> %s', (input: number, result: string) => {
  expect(formatRfdNum(input)).toEqual(result)
})

test.each([
  [1, `${SITE_URL}/rfd/0001`],
  [53, `${SITE_URL}/rfd/0053`],
  [321, `${SITE_URL}/rfd/0321`],
])('canonicalRfdUrl(%i) -> %s', (input: number, result: string) => {
  expect(canonicalRfdUrl(input)).toEqual(result)
})

test.each([
  ['/', `${SITE_URL}/`],
  ['/login', `${SITE_URL}/login`],
  ['/rfd/0053', `${SITE_URL}/rfd/0053`],
])('canonicalUrl(%s) -> %s', (input: string, result: string) => {
  expect(canonicalUrl(input)).toEqual(result)
})
