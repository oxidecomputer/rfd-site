/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import { fuzz } from './fuzz'

type SearchableRfd = {
  formattedNumber: string
  title: string | null
  authors: { name: string; email: string }[]
}

export function filterRfds<T extends SearchableRfd>(rfds: T[], input: string): T[] {
  const haystack = rfds.map((rfd) => {
    const authorString = rfd.authors.map((a) => `${a.name} ${a.email}`).join(' ')
    return `${rfd.formattedNumber} ¦ ${rfd.title || ''} ¦ ${authorString}`
  })
  const idxs = fuzz.filter(haystack, input)

  return idxs ? idxs.map((i) => rfds[i]) : []
}
