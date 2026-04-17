/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import { Badge, type BadgeColor } from '@oxide/design-system/ui'
import { type ReactNode } from 'react'
import { useSearchParams } from 'react-router'

import * as DropdownMenu from '~/components/Dropdown'
import Icon from '~/components/Icon'
import { useRootLoaderData } from '~/root'
import { classed } from '~/utils/classed'

const Outline = classed.div`absolute left-0 top-0 z-10 h-[calc(100%+1px)] w-full rounded border border-accent pointer-events-none`

const FilterDropdown = () => {
  const [searchParams, setSearchParams] = useSearchParams()

  const authors = useRootLoaderData().authors
  const labels = useRootLoaderData().labels

  const authorNameParam = searchParams.get('authorName')
  const authorEmailParam = searchParams.get('authorEmail')
  const labelParam = searchParams.get('label')

  const handleFilterAuthor = (email: string, name: string) => {
    const sEmail = searchParams.get('authorEmail')
    const sName = searchParams.get('authorName')

    if (sEmail === email || sName === name) {
      searchParams.delete('authorEmail')
      searchParams.delete('authorName')
    } else {
      searchParams.set('authorEmail', email)
      searchParams.set('authorName', name)
    }
    setSearchParams(searchParams, { replace: true })
  }

  const clearAuthor = () => {
    searchParams.delete('authorEmail')
    searchParams.delete('authorName')
    setSearchParams(searchParams, { replace: true })
  }

  const handleFilterLabel = (label: string) => {
    if (labelParam === label) {
      searchParams.delete('label')
    } else {
      searchParams.set('label', label)
    }
    setSearchParams(searchParams, { replace: true })
  }

  const clearLabel = () => {
    searchParams.delete('label')
    setSearchParams(searchParams, { replace: true })
  }

  return (
    <div className="text-mono-sm text-default flex h-4 items-center">
      <DropdownMenu.Root>
        <DropdownMenu.Trigger className="-m-2 ml-0 p-2">
          <Icon name="filter" size={12} className="shrink-0" />
        </DropdownMenu.Trigger>

        <DropdownMenu.Content align="start">
          <DropdownMenu.Submenu>
            <DropdownMenu.SubmenuTrigger>Authors</DropdownMenu.SubmenuTrigger>
            <DropdownMenu.SubContent>
              {authors
                .filter((a) => a.email)
                .map((author) => {
                  const selected =
                    authorNameParam === author.name || authorEmailParam === author.email

                  return (
                    <DropdownFilterItem
                      key={author.name}
                      selected={selected}
                      onSelect={() => handleFilterAuthor(author.email, author.name)}
                    >
                      {author.name}
                    </DropdownFilterItem>
                  )
                })}
            </DropdownMenu.SubContent>
          </DropdownMenu.Submenu>
          <DropdownMenu.Submenu>
            <DropdownMenu.SubmenuTrigger>Labels</DropdownMenu.SubmenuTrigger>
            <DropdownMenu.SubContent>
              {labels.map((label) => {
                const selected = labelParam === label

                return (
                  <DropdownFilterItem
                    key={label}
                    selected={selected}
                    onSelect={() => handleFilterLabel(label)}
                  >
                    {label}
                  </DropdownFilterItem>
                )
              })}
            </DropdownMenu.SubContent>
          </DropdownMenu.Submenu>
        </DropdownMenu.Content>
      </DropdownMenu.Root>

      {(authorNameParam || authorEmailParam) && (
        <>
          <div className="text-tertiary mr-1 ml-3 block">Author:</div>
          <FilterBadge onClick={clearAuthor} color="purple">
            {authorNameParam || authorEmailParam}
          </FilterBadge>
        </>
      )}

      {labelParam && (
        <>
          <div className="text-tertiary mr-1 ml-3 block">Label:</div>
          <FilterBadge onClick={clearLabel} color="blue">
            {labelParam}
          </FilterBadge>
        </>
      )}
    </div>
  )
}

const DropdownFilterItem = ({
  onSelect,
  selected,
  children,
}: {
  onSelect: () => void
  selected: boolean
  children: ReactNode
}) => (
  <DropdownMenu.Item
    onSelect={onSelect}
    className={selected ? 'bg-accent text-accent' : ''}
  >
    {selected && <Outline />}
    <div className="flex items-center justify-between">
      <div className="max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap">
        {children}
      </div>
    </div>
  </DropdownMenu.Item>
)

const FilterBadge = ({
  children,
  onClick,
  color = 'default',
}: {
  children: ReactNode
  onClick: () => void
  color?: BadgeColor
}) => (
  <Badge className="[&>span]:flex [&>span]:items-center" color={color}>
    <div className="mr-1">{children}</div>
    <button className="-m-4 p-4" onClick={onClick}>
      <Icon name="close" size={8} className={`text-${color}`} />
    </button>
  </Badge>
)

export default FilterDropdown
