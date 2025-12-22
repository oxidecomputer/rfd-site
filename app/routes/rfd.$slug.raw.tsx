/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import { RfdWithRaw } from '@oxide/rfd.ts/client'
import { redirect, type LoaderFunctionArgs } from 'react-router'

import { authenticate } from '~/services/auth.server'
import { fetchLocalRfd, isLocalMode, LocalRfd } from '~/services/rfd.local.server'
import { fetchRemoteRfd } from '~/services/rfd.remote.server'
import { parseRfdNum } from '~/utils/parseRfdNum'

import { resp404 } from './rfd.$slug'

export async function loader({ request, params: { slug } }: LoaderFunctionArgs) {
  const num = parseRfdNum(slug)
  if (!num) throw resp404()

  const user = await authenticate(request)
  let rfd: LocalRfd | RfdWithRaw | undefined

  // We're replicating some functionality from `fetchRfd` but here we just
  // want the raw content and I don't want to bloat the returned object
  try {
    if (isLocalMode()) {
      const localRfd = fetchLocalRfd(num)
      rfd = localRfd
    } else {
      const remoteRfd = await fetchRemoteRfd(num, user)
      rfd = remoteRfd
    }
  } catch (err) {
    console.error('Failed to fetch RFD', err)
    throw resp404()
  }

  // If someone goes to a private RFD but they're not logged in, they will
  // want to log in and see it.
  if (!rfd && !user) throw redirect(`/login?returnTo=/rfd/${num}`)

  // If you don't see an RFD but you are logged in, you can't tell whether you
  // don't have access or it doesn't exist. That's fine.
  if (!rfd) throw resp404()

  return new Response(rfd.content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  })
}
