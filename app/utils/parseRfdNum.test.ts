/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import { expect, test } from 'vitest'

import { parsePullNumFromUrl, parseRfdNum } from './parseRfdNum'

test.each([
  ['1', 1],
  ['01', 1],
  ['001', 1],
  ['0001', 1],
  ['0321', 321],
  ['9999', 9999],
  ['00001', null],
  ['13abc', null],
  ['../', null],
  ['abc', null],
  ['  5', null],
])('parseRfdNum', (input: string, result: number | null) => {
  expect(parseRfdNum(input)).toEqual(result)
})

test.each([
  ['https://github.com/oxidecomputer/rfd/pull/123', 123],
  ['https://github.com/oxidecomputer/rfd/pull/123456', 123456],
  ['https://github.com/oxidecomputer/rfd/pull/1234567', null],
  ['https://github.com/oxidecomputer/rfd/pull/123/files', null],
  ['https://github.com/oxidecomputer/rfd/pull/', null],
  ['https://github.com/oxidecomputer/rfd', null],
  ['', null],
  [null, null],
  [undefined, null],
])('parsePullNumFromUrl', (input: string | null | undefined, result: number | null) => {
  expect(parsePullNumFromUrl(input)).toEqual(result)
})
