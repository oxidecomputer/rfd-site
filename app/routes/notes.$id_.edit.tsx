/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */
import { LiveObject } from '@liveblocks/client'
import {
  ClientSideSuspense,
  LiveblocksProvider,
  RoomProvider,
} from '@liveblocks/react/suspense'
import { type LoaderFunctionArgs } from '@remix-run/node'
import { useLoaderData, useOutletContext } from '@remix-run/react'

import { NoteForm, TypingIndicator } from '~/components/note/NoteForm'
import { isAuthenticated } from '~/services/authn.server'
import { getNote } from '~/services/notes.server'
import { userIsInternal } from '~/utils/rfdApi'

import { PlaceholderWrapper } from './notes'

export const loader = async ({ params: { id }, request }: LoaderFunctionArgs) => {
  const user = await isAuthenticated(request)

  if (!id) {
    throw new Response('Not Found', { status: 404 })
  }

  const note = await getNote(id)

  if (!note) {
    throw new Response('Not Found', { status: 404 })
  }

  if (note.user === user?.id || (note.published && userIsInternal(user))) {
    return { user, note }
  } else {
    throw new Response('Not Found', { status: 404 })
  }
}

export type Presence = {
  cursor: { x: number; y: number } | null
  name: string
  userId: string
}

export const initialStorage = {
  meta: new LiveObject({ title: 'Untitled Note', lastUpdated: new Date().toISOString() }),
}

export default function NoteEdit() {
  const { user, note } = useLoaderData<typeof loader>()

  const { sidebarOpen, setSidebarOpen } = useOutletContext<{
    sidebarOpen: boolean
    setSidebarOpen: (isOpen: boolean) => void
  }>()

  if (!user) {
    return null
  }

  return (
    <LiveblocksProvider authEndpoint="/notes/liveblocks-auth">
      <RoomProvider id={note.id} initialStorage={initialStorage}>
        <ClientSideSuspense
          fallback={
            <PlaceholderWrapper>
              <TypingIndicator />
            </PlaceholderWrapper>
          }
        >
          <NoteForm
            id={note.id}
            userId={user.id}
            userName={user.displayName || 'Unknown'}
            isOwner={note.user === user.id}
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
