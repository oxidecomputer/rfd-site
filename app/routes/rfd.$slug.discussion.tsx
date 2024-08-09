/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import { redirect, type LoaderArgs } from '@remix-run/node'

import { isAuthenticated } from '~/services/authn.server'
import { fetchRfd } from '~/services/rfd.server'
import { parseRfdNum } from '~/utils/parseRfdNum'

import { resp404 } from './rfd.$slug'

export async function loader({ request, params: { slug } }: LoaderArgs) {
  const num = parseRfdNum(slug)
  if (!num) throw resp404()

  const user = await isAuthenticated(request)

  const rfd = await fetchRfd(num, user)

  // If someone goes to a private RFD but they're not logged in, they will
  // want to log in and see it.
  if (!rfd && !user) throw redirect(`/login?returnTo=/rfd/${num}`)

  // If you don't see an RFD but you are logged in, you can't tell whether you
  // don't have access or it doesn't exist. That's fine.
  if (!rfd || !rfd.discussion_link) throw resp404()

  return redirect(rfd.discussion_link)
}
