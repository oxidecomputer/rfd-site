/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */
import { json, redirect, type ActionArgs, type LoaderArgs } from '@remix-run/node'

import { isAuthenticated } from '~/services/authn.server'

export async function action({ request }: ActionArgs) {
  const user = await isAuthenticated(request)

  if (!user) throw new Response('User not found', { status: 401 })

  const response = await fetch('http://localhost:8080/tome', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.TOME_API_KEY || '',
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify({ title: 'Untitled', user: user.id, body: '' }),
  })

  const result = await response.json()

  if (response.ok) {
    return redirect(`/tome/${result.id}/edit`)
  } else {
    return json({ error: result.error }, { status: response.status })
  }
}

export async function loader(args: LoaderArgs) {
  return action(args)
}
