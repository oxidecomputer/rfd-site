/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */
import { json, type ActionFunction, type LoaderFunction } from '@remix-run/node'
import { useFetcher, useLoaderData } from '@remix-run/react'
import { makePatches, stringifyPatches } from '@sanity/diff-match-patch'
import cn from 'classnames'
import { useState } from 'react'

import { NoteForm } from '~/components/note/NoteForm'
import { Sidebar } from '~/components/note/Sidebar'

// import { isAuthenticated } from '~/services/authn.server'

export const loader: LoaderFunction = async ({ params: { id } }) => {
  const response = await fetch(`${process.env.NOTES_API}/notes/${id}`, {
    headers: {
      'x-api-key': process.env.NOTES_API_KEY || '',
    },
  })
  if (!response.ok) {
    throw new Response('Not Found', { status: 404 })
  }
  const data = await response.json()
  return data
}

export const action: ActionFunction = async ({ request, params }) => {
  try {
    const formData = await request.formData()
    const title = formData.get('title')
    const body = formData.get('body')

    // const user = await isAuthenticated(request)
    const user = {
      id: process.env.NOTES_TEST_USER_ID || '',
    }
    if (!user) throw new Response('User not found', { status: 401 })

    const response = await fetch(`${process.env.NOTES_API}/notes/${params.id}`, {
      method: 'PUT',
      headers: {
        'x-api-key': process.env.NOTES_API_KEY || '',
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({ title, body }),
    })

    if (!response.ok) {
      const result = await response.json()
      throw new Response(result.error, { status: response.status })
    }

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

  const [sidebarOpen, setSidebarOpen] = useState(true)

  const handleSave = (title: string, body: string) => {
    const patches = makePatches(data.body, body)

    fetcher.submit({ title, body: stringifyPatches(patches) }, { method: 'post' })
  }

  return (
    <div
      className={cn(
        'purple-theme grid h-[100dvh] overflow-hidden',
        sidebarOpen ? 'grid-cols-[14.25rem,minmax(0,1fr)]' : 'grid-cols-[minmax(0,1fr)]',
      )}
    >
      {sidebarOpen && <Sidebar />}
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
    </div>
  )
}
