/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */
import { type ActionFunction } from '@remix-run/node'

import { isAuthenticated } from '~/services/authn.server'
import { client } from '~/services/notes.server'
import { userIsInternal } from '~/utils/rfdApi'

export const action: ActionFunction = async ({ request }) => {
  const user = await isAuthenticated(request)

  if (!user) {
    throw new Response('Not Found', { status: 404 })
  }

  const isInternal = userIsInternal(user)

  const { status, body } = await client.identifyUser(
    {
      userId: user.id,
      groupIds: isInternal ? ['internal'] : [],
    },
    { userInfo: { name: user.displayName || user.email || '' } },
  )

  return new Response(body, { status })
}
