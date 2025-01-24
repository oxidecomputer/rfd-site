/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */
import {
  Asciidoc,
  prepareDocument,
  type DocumentBlock,
  type Options,
} from '@oxide/react-asciidoc'
import { type LoaderFunction } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import { useMemo } from 'react'

import { opts } from '~/components/AsciidocBlocks'
import { MinimalDocument } from '~/components/AsciidocBlocks/Document'
import Container from '~/components/Container'
import { handleNotesAccess, isAuthenticated } from '~/services/authn.server'
import { ad } from '~/utils/asciidoctor'

const noteOpts: Options = {
  ...opts,
  customDocument: MinimalDocument,
}

export const loader: LoaderFunction = async ({ params: { id }, request }) => {
  const user = await isAuthenticated(request)
  const redirectResponse = handleNotesAccess(user)
  if (redirectResponse) return redirectResponse

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

export default function NoteView() {
  const data = useLoaderData<typeof loader>()

  const doc = useMemo(
    () =>
      prepareDocument(
        ad.load(data.body, {
          standalone: true,
          attributes: {
            sectnums: false,
          },
        }),
      ),
    [data],
  )

  return (
    <Container className="mt-12 800:mt-16 print:mt-0" isGrid>
      <div className="col-span-12 flex flex-col 800:col-span-10 800:col-start-2 1200:col-span-10 1200:col-start-3">
        <h1 className="mb-12 w-full pr-4 text-sans-2xl text-raise 600:pr-10 800:text-sans-3xl 1200:w-[calc(100%-var(--toc-width))] 1200:pr-16 print:pr-0 print:text-center">
          {data.title}
        </h1>
        <hr className="mb-8 hidden print:block" />
        <Asciidoc document={doc as DocumentBlock} options={noteOpts} />
      </div>
    </Container>
  )
}
