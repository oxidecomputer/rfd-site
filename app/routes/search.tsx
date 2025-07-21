/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import type { SearchResults } from '@oxide/rfd.ts/client'
import { type LoaderFunctionArgs } from '@remix-run/node'

import { authenticate } from '~/services/auth.server'
import { searchRfds } from '~/services/rfd.remote.server'

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await authenticate(request)
  const url = new URL(request.url)

  const results = await searchRfds(user, url.searchParams.entries())
  return adaptResults(results)
}

function adaptResults(results: SearchResults) {
  const hits = results.hits.map((hit) => {
    const highlightResult: any = {
      content: {
        value: hit.formatted?.content,
      },
      objectID: {
        value: hit.formatted?.objectId,
      },
      rfd_number: {
        value: `${hit.formatted?.rfdNumber}`,
      },
      anchor: {
        value: hit.formatted?.anchor,
      },
      url: {
        value: hit.formatted?.url || '',
      },
    }

    if (hit.formatted?.hierarchy) {
      for (const i in hit.formatted?.hierarchy) {
        if (hit.formatted?.hierarchy[i]) {
          highlightResult[`hierarchy_lvl${i}`] = {
            value: hit.formatted?.hierarchy[i],
          }
        }
      }
    }

    if (hit.formatted?.hierarchyRadio) {
      for (const i in hit.formatted?.hierarchyRadio) {
        if (hit.formatted?.hierarchyRadio[i]) {
          highlightResult[`hierarchy_radio_lvl${i}`] = {
            value: hit.formatted?.hierarchyRadio[i],
          }
          break
        }
      }
    }

    const adaptedHit: any = {
      content: hit.content,
      objectID: hit.objectId,
      rfd_number: hit.rfdNumber,
      anchor: hit.anchor,
      url: hit.url || '',
      _highlightResult: highlightResult,
      _snippetResult: highlightResult,
    }

    for (const i in hit.hierarchy) {
      if (hit.hierarchy[i]) {
        adaptedHit[`hierarchy_lvl${i}`] = hit.hierarchy[i]
      }
    }

    for (const i in hit.hierarchyRadio) {
      if (hit.hierarchyRadio[i]) {
        adaptedHit[`hierarchy_radio_lvl${i}`] = hit.hierarchyRadio[i]
        break
      }
    }

    return adaptedHit
  })

  return {
    results: [
      {
        index: 'rfd',
        hitsPerPage: results.limit,
        page: 0,
        facets: {},
        nbPages: 1,
        nbHits: results.limit,
        processingTimeMS: 0,
        query: results.query,
        hits,
      },
    ],
  }
}
