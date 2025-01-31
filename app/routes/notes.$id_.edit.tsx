/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */
import {
  ClientSideSuspense,
  LiveblocksProvider,
  RoomProvider,
} from '@liveblocks/react/suspense'
import { json, type ActionFunction, type LoaderFunctionArgs } from '@remix-run/node'
import { useLoaderData, useOutletContext } from '@remix-run/react'

import { NoteForm, TypingIndicator } from '~/components/note/NoteForm'
import { handleNotesAccess, isAuthenticated } from '~/services/authn.server'
import { getNote, updateNote } from '~/services/notes.server'

import { PlaceholderWrapper } from './notes'

export const loader = async ({ params: { id }, request }: LoaderFunctionArgs) => {
  const user = await isAuthenticated(request)

  if (!id) {
    throw new Response('Not Found', { status: 404 })
  }

  const note = await getNote(id)

  if (note.user !== user?.id) {
    throw new Response('Not Found', { status: 404 })
  }

  return { user, note }
}

export const action: ActionFunction = async ({ request, params }) => {
  try {
    const formData = await request.formData()
    const title = formData.get('title') as string

    const user = await isAuthenticated(request)
    handleNotesAccess(user)

    const note = await getNote(params.id!)
    if (note.user !== user?.id) {
      throw new Response('Not Found', { status: 404 })
    }

    await updateNote(params.id!, title, note.published)
    return json({ status: 'success', message: 'Note updated successfully' })
  } catch (error) {
    if (error instanceof Response) {
      return json({ status: 'error', error: await error.text() }, { status: error.status })
    }
    return json({ status: 'error', error: 'An unexpected error occurred' }, { status: 500 })
  }
}

export type Presence = {
  cursor: { x: number; y: number } | null
  name: string
  userId: string
}

export default function NoteEdit() {
  const { user, note } = useLoaderData<typeof loader>()

  const { sidebarOpen, setSidebarOpen } = useOutletContext<{
    sidebarOpen: boolean
    setSidebarOpen: (isOpen: boolean) => void
  }>()

  return (
    <LiveblocksProvider authEndpoint="/notes/liveblocks-auth">
      <RoomProvider id={note.id}>
        <ClientSideSuspense
          fallback={
            <PlaceholderWrapper>
              <TypingIndicator />
            </PlaceholderWrapper>
          }
        >
          <NoteForm
            id={note.id}
            userName={user.displayName || 'Unknown'}
            isOwner={note.user === user.id}
            initialTitle={note.title}
            published={note.published}
            key={note.id}
            sidebarOpen={sidebarOpen}
            setSidebarOpen={(bool) => setSidebarOpen(bool)}
          />
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  )
}
