/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */
import { json, type ActionArgs, type LoaderArgs } from '@remix-run/node'
import { useFetcher, useLoaderData } from '@remix-run/react'

import { Sidebar } from '~/components/tome/Sidebar'
import { TomeForm } from '~/components/tome/TomeForm'
import { isAuthenticated } from '~/services/authn.server'

export async function loader({ params: { id } }: LoaderArgs) {
  const response = await fetch(`http://localhost:8080/tome/${id}`, {
    headers: {
      'x-api-key': process.env.TOME_API_KEY || '',
    },
  })
  if (!response.ok) {
    throw new Response('Not Found', { status: 404 })
  }
  const data = await response.json()
  return data
}

export async function action({ request, params }: ActionArgs) {
  const formData = await request.formData()
  const title = formData.get('title')
  const body = formData.get('body')

  const user = await isAuthenticated(request)

  if (!user) throw new Response('User not found', { status: 401 })

  const response = await fetch(`http://localhost:8080/tome/${params.id}`, {
    method: 'PUT',
    headers: {
      'x-api-key': process.env.TOME_API_KEY || '',
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify({ title, body }),
  })

  if (response.ok) {
    return json({ status: response.status })
  } else {
    const result = await response.json()
    return json({ error: result.error }, { status: response.status })
  }
}

export default function TomeEdit() {
  const data = useLoaderData()
  const fetcher = useFetcher()

  const handleSave = (title: string, body: string) => {
    fetcher.submit({ title, body }, { method: 'post' })
  }

  return (
    <>
      <Sidebar />
      <div className="content h-[100dvh] max-h-screen w-full overflow-hidden 800:-mr-8 800:ml-[15rem] 800:w-[calc(100%-15rem)] 1200:mr-0">
        <TomeForm
          key={data.id}
          initialTitle={data.title}
          initialBody={data.body}
          updated={data.updated}
          onSave={handleSave}
        />
      </div>
    </>
  )
}
