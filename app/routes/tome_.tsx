/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import { type LoaderArgs } from '@remix-run/node'
import { Outlet } from '@remix-run/react'
import { useEffect } from 'react'

import { isAuthenticated } from '~/services/authn.server'

export const loader = async ({ request }: LoaderArgs) => {
  const user = await isAuthenticated(request)

  if (!user) throw new Response('Not authorized', { status: 401 })

  const response = await fetch(`http://localhost:8080/user/${user.id}`, {
    headers: {
      'x-api-key': process.env.TOME_API_KEY || '',
    },
  })
  if (!response.ok) {
    throw new Error(`Error fetching: ${response.statusText}`)
  }
  const data = await response.json()
  return data
}

export type TomeItem = {
  id: string
  title: string
  user: string
  body: string
  created: string
  updated: string
}

export default function Tome() {
  useEffect(() => {
    document.body.classList.add('tome')
    document.body.classList.add('purple-theme')
  }, [])

  return <Outlet />
}
