/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import { type LoaderFunction } from '@remix-run/node'
import { Outlet } from '@remix-run/react'

import { isAuthenticated } from '~/services/authn.server'

export const loader: LoaderFunction = async ({ request }) => {
  const user = await isAuthenticated(request)

  if (!user) throw new Response('Not authorized', { status: 401 })

  const response = await fetch(`${process.env.NOTES_API}/user/${user.id}`, {
    headers: {
      'x-api-key': process.env.NOTES_API_KEY || '',
    },
  })

  if (!response.ok) {
    throw new Error(`Error fetching: ${response.statusText}`)
  }
  const data = await response.json()
  return {
    notes: data,
    user,
  }
}

export type NoteItem = {
  id: string
  title: string
  user: string
  body: string
  created: string
  updated: string
  published: 1 | 0
}

export default function Note() {
  return <Outlet />
}
