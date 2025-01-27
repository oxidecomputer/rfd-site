/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */
import { json, type ActionFunction, type LoaderFunction } from '@remix-run/node'
import { useFetcher, useLoaderData, useOutletContext } from '@remix-run/react'
import { makePatches, stringifyPatches } from '@sanity/diff-match-patch'

import { NoteForm } from '~/components/note/NoteForm'
import { handleNotesAccess, isAuthenticated } from '~/services/authn.server'
import { getNote, updateNote } from '~/services/notes.server'

export const loader: LoaderFunction = async ({ params: { id }, request }) => {
  const user = await isAuthenticated(request)
  const redirectResponse = handleNotesAccess(user)
  if (redirectResponse) return redirectResponse

  const note = await getNote(id!)
  if (!note) {
    throw new Response('Not Found', { status: 404 })
  }

  if (note.user !== user?.id) {
    throw new Response('Not Found', { status: 404 })
  }

  return note
}

export const action: ActionFunction = async ({ request, params }) => {
  try {
    const formData = await request.formData()
    const title = formData.get('title') as string
    const body = formData.get('body') as string

    const user = await isAuthenticated(request)
    handleNotesAccess(user)

    const note = await getNote(params.id!)
    if (note.user !== user?.id) {
      throw new Response('Not Found', { status: 404 })
    }

    await updateNote(params.id!, title, body)
    return json({ status: 'success', message: 'Note updated successfully' })
  } catch (error) {
    if (error instanceof Response) {
      return json({ status: 'error', error: await error.text() }, { status: error.status })
    }
    return json({ status: 'error', error: 'An unexpected error occurred' }, { status: 500 })
  }
}

export default function NoteEdit() {
  const data = useLoaderData<typeof loader>()
  const fetcher = useFetcher<typeof loader>()

  const { sidebarOpen, setSidebarOpen } = useOutletContext<{
    sidebarOpen: boolean
    setSidebarOpen: (isOpen: boolean) => void
  }>()

  const handleSave = (title: string, body: string) => {
    const patches = makePatches(data.body, body)

    fetcher.submit({ title, body: stringifyPatches(patches) }, { method: 'post' })
  }

  return (
    <NoteForm
      id={data.id}
      key={data.id}
      initialTitle={data.title}
      initialBody={data.body}
      updated={data.updated}
      published={data.published}
      onSave={handleSave}
      sidebarOpen={sidebarOpen}
      setSidebarOpen={(bool) => setSidebarOpen(bool)}
      fetcher={fetcher}
    />
  )
}
