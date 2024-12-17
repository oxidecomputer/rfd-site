/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */
import { json, type ActionArgs } from '@remix-run/node'

import { isAuthenticated } from '~/services/authn.server'

export async function action({ request, params }: ActionArgs) {
  const user = await isAuthenticated(request)

  if (!user) throw new Response('User not found', { status: 401 })

  const { publish } = await request.json()

  const response = await fetch(`http://localhost:8000/notes/${params.id}/publish`, {
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
