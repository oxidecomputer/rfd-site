/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */
import { json, redirect, type ActionFunction, type LoaderFunction } from '@remix-run/node'

import { isAuthenticated } from '~/services/authn.server'

export const action: ActionFunction = async ({ request }) => {
  const user = await isAuthenticated(request)

  if (!user) throw new Response('User not found', { status: 401 })

  const response = await fetch('${process.env.NOTES_API}/notes', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.NOTES_API_KEY || '',
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify({ title: 'Untitled', user: user.id, body: '' }),
  })

  const result = await response.json()

  if (response.ok) {
    return redirect(`/notes/${result.id}/edit`)
  } else {
    return json({ error: result.error }, { status: response.status })
  }
}

export const loader: LoaderFunction = async (args) => {
  return action(args)
}
