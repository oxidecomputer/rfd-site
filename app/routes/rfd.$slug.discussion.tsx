/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import { redirect, type LoaderFunctionArgs } from '@remix-run/node'

import { isAuthenticated } from '~/services/authn.server'
import { fetchRfd } from '~/services/rfd.server'
import { parseRfdNum } from '~/utils/parseRfdNum'

import { resp404 } from './rfd.$slug'

export async function loader({ request, params: { slug } }: LoaderFunctionArgs) {
  const num = parseRfdNum(slug)
  if (!num) throw resp404()

  const user = await isAuthenticated(request)
  const rfd = await fetchRfd(num, user)

  // !rfd covers both non-existent and private RFDs for the logged-out user. In
  // both cases, once they log in, if they have permission to read it, they'll
  // get the redirect, otherwise they will get 404.
  if (!rfd && !user) throw redirect(`/login?returnTo=/rfd/${num}/discussion`)

  // If you don't see an RFD but you are logged in, you can't tell whether you
  // don't have access or it doesn't exist. That's fine.
  if (!rfd || !rfd.discussion_link) throw resp404()

  return redirect(rfd.discussion_link)
}
