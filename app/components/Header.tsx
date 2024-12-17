/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import { buttonStyle } from '@oxide/design-system'
import * as Dropdown from '@radix-ui/react-dropdown-menu'
import { Link, useFetcher } from '@remix-run/react'
import { useCallback, useState } from 'react'

import Icon from '~/components/Icon'
import NewRfdButton from '~/components/NewRfdButton'
import { useKey } from '~/hooks/use-key'
import { useRootLoaderData } from '~/root'
import type { RfdItem, RfdListItem } from '~/services/rfd.server'

import { DropdownItem, DropdownMenu } from './Dropdown'
import { PublicBanner } from './PublicBanner'
import Search from './Search'
import SelectRfdCombobox from './SelectRfdCombobox'

export type SmallRfdItems = {
  [key: number]: RfdListItem
}

export default function Header({ currentRfd }: { currentRfd?: RfdItem }) {
  const { user, rfds, isLocalMode, inlineComments } = useRootLoaderData()

  const fetcher = useFetcher()

  const toggleTheme = () => {
    fetcher.submit({}, { method: 'post', action: '/user/toggle-theme' })
  }

  const toggleInlineComments = () => {
    fetcher.submit({}, { method: 'post', action: '/user/toggle-inline-comments' })
  }

  const logout = () => {
    fetcher.submit({}, { method: 'post', action: '/logout' })
  }

  const returnTo = currentRfd ? `/rfd/${currentRfd.number_string}` : '/'

  const [open, setOpen] = useState(false)

  // memoized to avoid render churn in useKey
  const toggleSearchMenu = useCallback(() => {
    setOpen(!open)
    return false // Returning false prevents default behaviour in Firefox
  }, [open])

  useKey('mod+k', toggleSearchMenu)

  return (
    <div className="sticky top-0 z-20">
      {!user && <PublicBanner />}
      <header className="flex h-14 items-center justify-between border-b px-3 bg-default border-secondary print:hidden">
        <div className="flex space-x-3">
          <Link
            to="/"
            prefetch="intent"
            className="flex h-8 w-8 items-center justify-center rounded border text-tertiary bg-secondary border-secondary elevation-1 hover:bg-hover"
            aria-label="Back to index"
          >
            <Icon name="logs" size={16} />
          </Link>
          <SelectRfdCombobox isLoggedIn={!!user} currentRfd={currentRfd} rfds={rfds} />
        </div>

        <div className="flex space-x-2">
          <button
            className="flex h-8 w-8 items-center justify-center rounded border text-tertiary bg-secondary border-secondary elevation-1 hover:bg-hover"
            onClick={toggleSearchMenu}
          >
            <Icon name="search" size={16} />
          </button>
          <Search open={open} onClose={() => setOpen(false)} />
          <Link
            to="/notes"
            className="flex h-8 w-8 items-center justify-center rounded border text-quaternary bg-secondary border-secondary elevation-1 hover:bg-hover"
          >
            <Icon name="edit" size={16} />
          </Link>
          <NewRfdButton />

          {user ? (
            <Dropdown.Root modal={false}>
              <Dropdown.Trigger className="flex h-8 w-8 items-center justify-center rounded border text-tertiary bg-secondary border-secondary elevation-1 hover:bg-hover 600:w-auto 600:px-3">
                <Icon name="profile" size={16} className="flex-shrink-0" />
                <span className="ml-2 hidden text-sans-sm text-default 600:block">
                  {user.displayName || user.email}
                </span>
              </Dropdown.Trigger>

              <DropdownMenu>
                <DropdownItem onSelect={toggleTheme}>Toggle theme</DropdownItem>
                <DropdownItem onSelect={toggleInlineComments}>
                  {inlineComments ? 'Hide' : 'Show'} inline comments
                </DropdownItem>
                {isLocalMode ? (
                  <></>
                ) : (
                  <DropdownItem onSelect={logout}>Log out</DropdownItem>
                )}
              </DropdownMenu>
            </Dropdown.Root>
          ) : (
            <Link
              to={`/login?returnTo=${returnTo}`}
              className={buttonStyle({ size: 'sm' })}
            >
              Sign in
            </Link>
          )}
        </div>
      </header>
    </div>
  )
}
