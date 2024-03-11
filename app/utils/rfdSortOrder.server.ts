/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

// mostly a separate module to keep zod on the server
import { z } from 'zod'

// separated so we can get the type out
const sortAttrSchema = z.enum(['number', 'updated'])
export type SortAttr = z.infer<typeof sortAttrSchema>

const sortOrderSchema = z.object({
  sortAttr: sortAttrSchema,
  sortDir: z.enum(['asc', 'desc']),
})

type SortOrder = z.infer<typeof sortOrderSchema>

export function parseSortOrder(obj: unknown): SortOrder {
  const parsed = sortOrderSchema.safeParse(obj)
  return parsed.success ? parsed.data : { sortAttr: 'updated', sortDir: 'desc' }
}
