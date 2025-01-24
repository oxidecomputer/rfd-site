/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import { type LoaderFunctionArgs } from '@remix-run/node'
import { Outlet, type ShouldRevalidateFunction } from '@remix-run/react'
import cn from 'classnames'
import { useState, type ReactNode } from 'react'

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

export type NotesOutletContext = {
  sidebarOpen: boolean
  setSidebarOpen: (isOpen: boolean) => void
}

export const shouldRevalidate: ShouldRevalidateFunction = ({
  formAction,
  defaultShouldRevalidate,
}) => {
  // Always revalidate when creating, editing, or deleting notes
  if (
    formAction?.includes('/notes/new') ||
    formAction?.includes('/notes/edit') ||
    formAction?.includes('/notes/delete') ||
    formAction?.includes('/notes/publish')
  ) {
    return true
  }

  return defaultShouldRevalidate
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await isAuthenticated(request)
  const redirectResponse = handleNotesAccess(user)
  if (redirectResponse) return redirectResponse

  const response = await fetch(`${process.env.NOTES_API}/user/${user?.id}`, {
    headers: {
      'x-api-key': process.env.NOTES_API_KEY || '',
    },
  })

  if (!response.ok) {
    throw new Error(`Error fetching: ${response.statusText}`)
  }
  const data = await response.json()

  return {
    notes: data,
    user,
  }
}

export default function Notes() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const context: NotesOutletContext = {
    sidebarOpen,
    setSidebarOpen,
  }

  return (
    <div
      className={cn(
        'purple-theme grid h-[100dvh] overflow-hidden',
        sidebarOpen ? 'grid-cols-[14.25rem,minmax(0,1fr)]' : 'grid-cols-[minmax(0,1fr)]',
      )}
    >
      {sidebarOpen && <Sidebar />}
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
