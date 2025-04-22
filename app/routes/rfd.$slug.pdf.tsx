/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import { redirect, type LoaderFunction } from '@remix-run/node'

import { isAuthenticated } from '~/services/authn.server'
import { fetchRfdPdf } from '~/services/rfd.server'
import { parseRfdNum } from '~/utils/parseRfdNum'

export let loader: LoaderFunction = async ({ request, params: { slug } }) => {
  const num = parseRfdNum(slug)
  if (!num) throw new Response('Not Found', { status: 404 })

  const user = await isAuthenticated(request)
  const rfd = await fetchRfdPdf(num, user)

  if (!rfd || rfd.content.length === 0) throw new Response('Not Found', { status: 404 })

  throw redirect(rfd.content[0].link)
}
