/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */
import { json, redirect, type ActionFunction } from '@remix-run/node'

import { isAuthenticated } from '~/services/authn.server'

export const action: ActionFunction = async ({ request, params }) => {
  const user = await isAuthenticated(request)

  if (!user) throw new Response('User not found', { status: 401 })

  const response = await fetch(`http://localhost:8000/notes/${params.id}`, {
    method: 'DELETE',
    headers: {
      'x-api-key': process.env.NOTES_API_KEY || '',
    },
  })

  if (response.ok) {
    return redirect(`/notes`)
  } else {
    const result = await response.json()
    return json({ error: result.error }, { status: response.status })
  }
}
