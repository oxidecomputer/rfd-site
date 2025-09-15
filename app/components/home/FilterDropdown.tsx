/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import { Badge, type BadgeColor } from '@oxide/design-system'
import * as Dropdown from '@radix-ui/react-dropdown-menu'
import { useSearchParams } from '@remix-run/react'
import { type ReactNode } from 'react'

import {
  DropdownItem,
  DropdownMenu,
  DropdownSubMenu,
  DropdownSubTrigger,
} from '~/components/Dropdown'
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
      <Dropdown.Root modal={false}>
        <Dropdown.Trigger className="-m-2 ml-0 p-2">
          <Icon name="filter" size={12} className="shrink-0" />
        </Dropdown.Trigger>

        <DropdownMenu align="start">
          <Dropdown.Sub>
            <DropdownSubTrigger>Authors</DropdownSubTrigger>
            <DropdownSubMenu>
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
            </DropdownSubMenu>
          </Dropdown.Sub>
          <Dropdown.Sub>
            <DropdownSubTrigger>Labels</DropdownSubTrigger>
            <DropdownSubMenu>
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
            </DropdownSubMenu>
          </Dropdown.Sub>
        </DropdownMenu>
      </Dropdown.Root>

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
  <DropdownItem
    onSelect={onSelect}
    classNames={selected ? 'bg-accent-secondary text-accent' : ''}
  >
    {selected && <Outline />}
    <div className="flex items-center justify-between">
      <div className="max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap">
        {children}
      </div>
    </div>
  </DropdownItem>
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
