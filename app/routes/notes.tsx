/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import { type LoaderFunctionArgs } from '@remix-run/node'
import { isRouteErrorResponse, Outlet, useRouteError } from '@remix-run/react'
import cn from 'classnames'
import { useState, type ReactNode } from 'react'

import { ErrorPage } from '~/components/ErrorPage'
import { Sidebar } from '~/components/note/Sidebar'
import { handleNotesAccess, isAuthenticated } from '~/services/authn.server'
import { classed } from '~/utils/classed'

export type NoteItem = {
  id: string
  title: string
  user: string
  body: string
  created: string
  updated: string
  published: boolean
}

export type WindowMode = 'default' | 'focus' | 'preview'

export type NotesOutletContext = {
  mode: WindowMode
  setMode: (mode: WindowMode) => void
}

export function ErrorBoundary() {
  const error = useRouteError()

  if (isRouteErrorResponse(error)) {
    return (
      <ErrorPage>
        <h1 className="text-sans-2xl">
          {error.status === 404 ? 'Page not found' : error.statusText}
        </h1>
        <p className="text-sans-lg text-secondary">{error.data}</p>
      </ErrorPage>
    )
  }

  return (
    <ErrorPage>
      <h1 className="text-sans-2xl">Something went wrong</h1>
      <p className="text-sans-lg text-secondary">An unexpected error occurred</p>
    </ErrorPage>
  )
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await isAuthenticated(request)
  const redirectResponse = handleNotesAccess(user)
  if (redirectResponse) return redirectResponse

  if (!user || !user.id) {
    throw new Response('User not Found', { status: 401 })
  }

  return { user }
}

export default function Notes() {
  const [mode, setMode] = useState<WindowMode>('default')

  const context: NotesOutletContext = {
    mode,
    setMode,
  }

  const showSidebar = mode === 'default'

  return (
    <div
      className={cn(
        'purple-theme grid h-[100dvh] overflow-hidden',
        showSidebar ? 'grid-cols-[14.25rem,minmax(0,1fr)]' : 'grid-cols-[minmax(0,1fr)]',
      )}
    >
      {showSidebar && <Sidebar />}
      <Outlet context={context} />
    </div>
  )
}

export const PlaceholderWrapper = ({ children }: { children: ReactNode }) => (
  <div className="relative">
    <div className="absolute inset-0 flex">
      <div className="w-1/2 border-r bg-raise border-secondary"></div>
      <div className="w-1/2"></div>
    </div>
    <div className="backdrop absolute inset-0" />
    <div className="relative flex h-full w-full items-center justify-center">
      {children}
    </div>
  </div>
)

export const EMBody = classed.p`mt-1 text-balance text-sans-md text-default`
