/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import { redirect, type LoaderArgs } from '@remix-run/node'

import { isAuthenticated } from '~/services/authn.server'

export const loader = async ({ request }: LoaderArgs) => {
  const user = await isAuthenticated(request)

  if (!user) throw new Response('Not authorized', { status: 401 })

  console.log(`http://localhost:8000/user/${user.id}`)

  const response = await fetch(`http://localhost:8000/user/${user.id}`, {
    headers: {
      'x-api-key': process.env.NOTES_API_KEY || '',
    },
  })
  if (!response.ok) {
    throw new Error(`Error fetching: ${response.statusText}`)
  }
  const data = await response.json()

  if (data.length > 0) {
    return redirect(`/notes/${data[0].id}/edit`)
  } else {
    return redirect('/notes/new')
  }
}

export type Note = {
  id: string
  title: string
  user: string
  body: string
  created: string
  updated: string
}
