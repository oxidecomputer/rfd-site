/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import { data, type LoaderFunctionArgs } from 'react-router'

import { authenticate, logoutStaleSession } from '~/services/auth.server'
import { fetchDiscussion } from '~/services/github-discussion.server'
import { AuthenticationError } from '~/services/rfd.remote.server'
import { fetchRfd } from '~/services/rfd.server'
import { parsePullNumFromUrl, parseRfdNum } from '~/utils/parseRfdNum'

export async function loader({ request, url, params: { slug } }: LoaderFunctionArgs) {
  const num = parseRfdNum(slug)
  if (!num) {
    throw new Response('Missing RFD number', { status: 400 })
  }

  const user = await authenticate(request)

  try {
    // Fetching the RFD as the current user enforces read access and yields the
    // discussion URL, from which the pull request number is taken. RFD and PR
    // numbers differ: permissions are checked by RFD, GitHub is queried by PR.
    const rfd = await fetchRfd(num, user)
    const pullNumber = parsePullNumFromUrl(rfd?.discussion)
    if (!pullNumber) {
      return null
    }

    const discussion = await fetchDiscussion(num, pullNumber, user)

    if (!discussion) {
      return null
    }

    return discussion
  } catch (error) {
    if (error instanceof AuthenticationError) await logoutStaleSession(request, url)
    console.error('Error fetching discussion:', error)
    return data({ error: 'Failed to fetch discussion' }, { status: 500 })
  }
}
