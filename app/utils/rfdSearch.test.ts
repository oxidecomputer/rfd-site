/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import { expect, test } from 'vitest'

import { filterRfds } from './rfdSearch'

const rfds = [
  {
    number: 13,
    formattedNumber: '0013',
    title: 'Thirteen',
    authors: [{ name: 'Alyssa P. Hacker', email: 'alyssa@example.com' }],
  },
  {
    number: 130,
    formattedNumber: '0130',
    title: 'One hundred thirty',
    authors: [],
  },
]

test.each([
  ['13', 'an unpadded RFD number'],
  ['0013', 'a padded RFD number'],
  ['Thirteen', 'a title'],
  ['Alyssa Hacker', 'an author name'],
  ['alyssa@example.com', 'an author email'],
])('matches %s as %s', (input) => {
  expect(filterRfds(rfds, input)).toContain(rfds[0])
})

test('returns an empty array when nothing matches', () => {
  expect(filterRfds(rfds, 'nonexistent')).toEqual([])
})
