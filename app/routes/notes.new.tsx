/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */
import { redirect, type ActionFunction, type LoaderFunction } from '@remix-run/node'

import { handleNotesAccess, isAuthenticated } from '~/services/authn.server'
import { addNote } from '~/services/notes.server'

export const action: ActionFunction = async ({ request }) => {
  const user = await isAuthenticated(request)
  const redirectResponse = handleNotesAccess(user)
  if (redirectResponse) return redirectResponse

  if (!user || !user.id) {
    throw new Response('User not Found', { status: 401 })
  }

  const id = await addNote('Untitled', user.id, '')
  return redirect(`/notes/${id}/edit`)
}

export const loader: LoaderFunction = async (args) => {
  return action(args)
}
