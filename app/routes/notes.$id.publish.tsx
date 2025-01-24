/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */
import { json, type ActionFunction } from '@remix-run/node'

import { handleNotesAccess, isAuthenticated } from '~/services/authn.server'

export const action: ActionFunction = async ({ request, params }) => {
  const user = await isAuthenticated(request)
  handleNotesAccess(user)

  const noteResponse = await fetch(`${process.env.NOTES_API}/notes/${params.id}`, {
    headers: {
      'x-api-key': process.env.NOTES_API_KEY || '',
    },
  })
  const noteData = await noteResponse.json()
  if (noteData.user !== user?.id) {
    throw new Response('Not Found', { status: 404 })
  }

  const { publish } = await request.json()

  const response = await fetch(`${process.env.NOTES_API}/notes/${params.id}/publish`, {
    method: 'POST',
    headers: {
      'x-api-key': process.env.NOTES_API_KEY || '',
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify({ publish }),
  })

  if (response.ok) {
    return json({ status: response.status })
  } else {
    const result = await response.json()
    return json({ error: result.error }, { status: response.status })
  }
}
