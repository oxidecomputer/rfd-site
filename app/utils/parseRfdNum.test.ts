/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import { expect, test } from 'vitest'

import { parseRfdNum } from './parseRfdNum'

test.each([
  ['1', 1],
  ['01', 1],
  ['001', 1],
  ['0001', 1],
  ['0321', 321],
  ['9999', 9999],
  ['00001', null],
  ['../', null],
  ['abc', null],
  ['  5', null],
])('parseRfdNum', (input: string, result: number | null) => {
  expect(parseRfdNum(input)).toEqual(result)
})
