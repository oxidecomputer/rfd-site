/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import type { LoaderFunction } from 'react-router'

import { authenticate } from '~/services/auth.server'
import { fetchRfd } from '~/services/rfd.server'
import { parseRfdNum } from '~/utils/parseRfdNum'

export let loader: LoaderFunction = async ({ request, params: { slug } }) => {
  const num = parseRfdNum(slug)
  if (!num) throw new Response('Not Found', { status: 404 })

  const user = await authenticate(request)
  const rfd = await fetchRfd(num, user)

  if (!rfd) throw new Response('Not Found', { status: 404 })

  return rfd
}
