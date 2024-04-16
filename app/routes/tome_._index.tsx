/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import { EmptyMessage } from '@oxide/design-system'
import { redirect, type LoaderArgs } from '@remix-run/node'
import { Link, useLoaderData } from '@remix-run/react'

import Container from '~/components/Container'
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

  if (data.length > 0) {
    return redirect(`/tome/${data[0].id}/edit`)
  } else {
    return redirect('/tome/new')
  }
}

export type Tome = {
  id: string
  title: string
  user: string
  body: string
  created: string
  updated: string
}
