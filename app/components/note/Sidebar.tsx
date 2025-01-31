/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */
import { buttonStyle } from '@oxide/design-system'
import { Link, NavLink, useMatches } from '@remix-run/react'
import cn from 'classnames'
import { type ReactNode } from 'react'

import Icon from '~/components/Icon'
import { type User } from '~/services/authn.server'

const navLinkStyles = ({ isActive }: { isActive: boolean }) => {
  const activeStyle = isActive
    ? 'bg-accent-secondary hover:!bg-accent-secondary-hover text-accent'
    : null
  return `block text-sans-md text-secondary hover:bg-hover px-2 py-1 rounded flex items-center group justify-between ${activeStyle}`
}

const Divider = ({ className }: { className?: string }) => (
  <div className={cn('mb-3 h-[1px] border-t border-secondary 800:-mx-[2rem]', className)} />
)

export const SidebarIcon = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 12 12"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="text-quaternary"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M1.75 0C1.33579 0 1 0.335786 1 0.75V11.25C1 11.6642 1.33579 12 1.75 12H10.25C10.6642 12 11 11.6642 11 11.25V0.75C11 0.335786 10.6642 0 10.25 0H1.75ZM8.75 1.5H4V10.5H8.75C9.16421 10.5 9.5 10.1642 9.5 9.75V2.25C9.5 1.83579 9.16421 1.5 8.75 1.5Z"
      fill="currentColor"
    />
  </svg>
)

const BackToRfds = () => (
  <div className="mt-0 flex h-14 items-center border-b px-4 border-secondary">
    <Link to="/" className="flex items-center gap-2 text-sans-md text-secondary">
      <Icon name="prev-arrow" size={12} className="text-tertiary" /> Back to RFDs
    </Link>
  </div>
)

interface HandleData {
  notes: {
    id: string
    metadata: {
      title: string
      published: string
    }
  }[]
  user: User | null
}

export const Sidebar = () => {
  const matches = useMatches()
  const data = matches[1]?.data as HandleData
  const notes = data?.notes

  const isEmpty = !notes || notes.length === 0 || data.user?.authenticator === 'github'

  const publishedNotes = notes
    ? notes.filter((note) => note.metadata.published === 'true')
    : []
  const draftNotes = notes
    ? notes.filter((note) => note.metadata.published === 'false')
    : []

  return (
    <nav className="300:max-800:max-w-[400px] 300:w-[80vw] flex h-full w-full flex-col space-y-6 border-r pb-4 border-secondary elevation-2 800:elevation-0 print:hidden">
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
                        to={`/notes/${note.id}/edit`}
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
                  <NavLink
                    key={note.id}
                    to={`/notes/${note.id}/edit`}
                    className={navLinkStyles}
                  >
                    <div className="line-clamp-2 text-ellipsis">{note.metadata.title}</div>{' '}
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
