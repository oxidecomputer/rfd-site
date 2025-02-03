/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */
import { json, type ActionFunction } from '@remix-run/node'

import { handleNotesAccess, isAuthenticated } from '~/services/authn.server'
import { client } from '~/services/notes.server'

export const action: ActionFunction = async ({ request, params }) => {
  const user = await isAuthenticated(request)
  handleNotesAccess(user)

  const { publish } = await request.json()

  await client.updateRoom(params.id!, {
    metadata: {
      published: publish,
      updated: new Date().toISOString(),
    },
  })

  return json({ status: 200 })
}
