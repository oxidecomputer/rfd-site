/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import { expect, test } from 'vitest'

import { fuzz } from './fuzz'

const matching = (input: string, candidates: string[]) =>
  (fuzz.filter(candidates, input) ?? []).map((i) => candidates[i])

test('keeps the first and last characters exact', () => {
  expect(matching('metro', ['metrics', 'metro'])).toEqual(['metro'])
})

test('still tolerates an internal transposition', () => {
  expect(matching('netwroking', ['networking'])).toEqual(['networking'])
})

test.each([
  ['an internal substitution', 'netwarking'],
  ['a missing internal character', 'netorking'],
  ['an extra internal character', 'networkking'],
])('tolerates %s', (_, input) => {
  expect(matching(input, ['networking'])).toEqual(['networking'])
})

test.each([
  ['a leading typo', 'betworking'],
  ['a trailing typo', 'networkinh'],
])('rejects %s', (_, input) => {
  expect(matching(input, ['networking'])).toEqual([])
})

test('still matches a plain prefix while typing', () => {
  expect(matching('netw', ['networking'])).toEqual(['networking'])
})

test('tolerates a typo within one term of a multi-term query', () => {
  expect(matching('user netwroking', ['user networking policy'])).toEqual([
    'user networking policy',
  ])
})
