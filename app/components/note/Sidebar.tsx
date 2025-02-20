/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */
import { buttonStyle } from '@oxide/design-system'
import { Link, NavLink } from '@remix-run/react'
import { useQuery } from '@tanstack/react-query'
import cn from 'classnames'
import { type ReactNode } from 'react'

import Icon from '~/components/Icon'

interface Note {
  id: string
  metadata: {
    title: string
    published: string
  }
  user: string
}

export function useNotes() {
  return useQuery<Note[]>({
    queryKey: ['notesList'],
    queryFn: async () => {
      const response = await fetch('/notes/list')
      return response.json()
    },
    refetchInterval: 30000, // refetch every 30 seconds
  })
}

const navLinkStyles = ({ isActive }: { isActive: boolean }) => {
  const activeStyle = isActive
    ? 'bg-accent-secondary hover:!bg-accent-secondary-hover text-accent'
    : null
  return `block text-sans-md text-secondary hover:bg-hover px-2 py-1 rounded flex items-center group justify-between ${activeStyle}`
}

const Divider = ({ className }: { className?: string }) => (
  <div className={cn('mb-3 h-[1px] border-t border-secondary 800:-mx-[2rem]', className)} />
)

const BackToRfds = () => (
  <div className="mt-0 flex h-14 items-center border-b px-4 border-secondary">
    <Link to="/" className="flex items-center gap-2 text-sans-md text-secondary">
      <Icon name="prev-arrow" size={12} className="text-tertiary" /> Back to RFDs
    </Link>
  </div>
)

export const Sidebar = () => {
  const { data: notes, isLoading } = useNotes()

  const isEmpty = isLoading || !notes || notes.length === 0

  const publishedNotes = notes
    ? notes.filter((note) => note.metadata.published === 'true')
    : []
  const draftNotes = notes
    ? notes.filter((note) => note.metadata.published === 'false')
    : []

  return (
    <nav className="300:max-800:max-w-[400px] 300:w-[80vw] flex h-full w-full flex-col space-y-6 border-r pb-4 bg-raise border-secondary elevation-2 800:elevation-0 print:hidden">
      {isEmpty ? (
        <>
          <BackToRfds />
          <div className="flex flex-grow flex-col  justify-between p-4 pb-0">
            <div className="relative flex flex-col gap-2">
              <div className="h-4 w-32 rounded bg-tertiary" />
              <div className="h-4 w-20 rounded bg-tertiary" />
              <div className="h-4 w-24 rounded bg-tertiary" />
            </div>
            <div className="h-8 w-full rounded bg-tertiary" />
          </div>
        </>
      ) : (
        <>
          <div className="flex h-full flex-col">
            <div className="relative space-y-6 overflow-y-auto overflow-x-hidden pb-8">
              <BackToRfds />

              {publishedNotes.length > 0 && (
                <>
                  <LinkSection label="Published">
                    {publishedNotes.map((note) => (
                      <NavLink
                        key={note.id}
                        to={`/notes/${note.id}`}
                        className={navLinkStyles}
                      >
                        <div className="line-clamp-2 text-ellipsis">
                          {note.metadata.title}
                        </div>
                      </NavLink>
                    ))}
                  </LinkSection>
                  <Divider />
                </>
              )}

              <LinkSection label="Drafts">
                {draftNotes.map((note) => (
                  <NavLink key={note.id} to={`/notes/${note.id}`} className={navLinkStyles}>
                    <div className="line-clamp-2 text-ellipsis">{note.metadata.title}</div>
                  </NavLink>
                ))}
              </LinkSection>
            </div>
          </div>

          <div className="flex-shrink-0 px-4">
            <Link
              to="/notes/new"
              className={cn(buttonStyle({ variant: 'secondary', size: 'sm' }), 'w-full')}
            >
              <div className="flex items-center gap-1">
                <Icon name="add-roundel" size={12} className="text-quaternary" /> New
              </div>
            </Link>
          </div>
        </>
      )}
    </nav>
  )
}

const LinkSection = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="px-4">
    <div className="mb-1 text-mono-sm text-quaternary">{label}</div>
    <ul>{children}</ul>
  </div>
)
