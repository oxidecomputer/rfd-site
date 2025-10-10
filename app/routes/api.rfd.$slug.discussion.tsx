/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import { data, type LoaderFunctionArgs } from 'react-router'

import { authenticate } from '~/services/auth.server'
import { fetchDiscussion } from '~/services/github-discussion.server'
import { parseRfdNum } from '~/utils/parseRfdNum'

export async function loader({ request, params: { slug } }: LoaderFunctionArgs) {
  const num = parseRfdNum(slug)
  if (!num) {
    throw new Response('Missing pull request number', { status: 400 })
  }

  const user = await authenticate(request)

  try {
    const discussion = await fetchDiscussion(num, num, user)

    if (!discussion) {
      return null
    }

    return discussion
  } catch (error) {
    console.error('Error fetching discussion:', error)
    return data({ error: 'Failed to fetch discussion' }, { status: 500 })
  }
}
