/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import { type LoaderFunctionArgs } from '@remix-run/node'

import { auth } from '~/services/authn.server'
import { apiRequest } from '~/services/rfdApi.server'

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await auth.isAuthenticated(request)
  const url = new URL(request.url)

  const validParams = ['q', 'attributes_to_crop', 'highlight_pre_tag', 'highlight_post_tag']
  const query = new URLSearchParams()

  for (const [key, value] of url.searchParams.entries()) {
    if (validParams.includes(key)) {
      query.set(key, value)
    }
  }

  return adaptResults(await apiRequest(`rfd-search?${query.toString()}`, user?.token))
}

type SearchResults = {
  hits: SearchResultHit[]
  query: string
  limit: number | null
  offset: number | null
}

type SearchResultHit = {
  hierarchy: (string | null)[]
  hierarchy_radio: (string | null)[]
  content: string
  object_id: string
  rfd_number: number
  anchor: string | null
  url: string | null
  formatted: FormattedSearchResultHit | null
}

type FormattedSearchResultHit = {
  hierarchy: (string | null)[]
  hierarchy_radio: (string | null)[]
  content: string | null
  object_id: string
  rfd_number: number
  anchor: string | null
  url: string | null
}

function adaptResults(results: SearchResults) {
  const hits = results.hits.map((hit) => {
    const highlightResult: any = {
      content: {
        value: hit.formatted?.content,
      },
      objectID: {
        value: hit.formatted?.object_id,
      },
      rfd_number: {
        value: `${hit.formatted?.rfd_number}`,
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

    if (hit.formatted?.hierarchy_radio) {
      for (const i in hit.formatted?.hierarchy_radio) {
        if (hit.formatted?.hierarchy_radio[i]) {
          highlightResult[`hierarchy_radio_lvl${i}`] = {
            value: hit.formatted?.hierarchy_radio[i],
          }
          break
        }
      }
    }

    const adaptedHit: any = {
      content: hit.content,
      objectID: hit.object_id,
      rfd_number: hit.rfd_number,
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

    for (const i in hit.hierarchy_radio) {
      if (hit.hierarchy_radio[i]) {
        adaptedHit[`hierarchy_radio_lvl${i}`] = hit.hierarchy_radio[i]
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
