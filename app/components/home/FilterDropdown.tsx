/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import * as Ariakit from '@ariakit/react'
import { Checkbox } from '@oxide/design-system/ui'
import cn from 'classnames'
import { startTransition, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'

import Icon from '~/components/Icon'
import { useRootLoaderData } from '~/root'
import { fuzz } from '~/utils/fuzz'

type FilterOption = {
  value: string
  label: string
  searchText: string
  count: number
}

const FilterDropdown = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const { rfds, authors, labels } = useRootLoaderData()

  const authorOptions = useMemo<FilterOption[]>(() => {
    const counts = new Map<string, number>()
    for (const rfd of rfds) {
      for (const author of rfd.authors || []) {
        if (!author.email) continue
        counts.set(author.email, (counts.get(author.email) || 0) + 1)
      }
    }
    return authors
      .filter((a) => a.email)
      .map((a) => ({
        value: a.email,
        label: a.name,
        searchText: `${a.name} ${a.email}`,
        count: counts.get(a.email) || 0,
      }))
  }, [rfds, authors])

  const labelOptions = useMemo<FilterOption[]>(() => {
    const counts = new Map<string, number>()
    for (const rfd of rfds) {
      for (const label of rfd.labels || []) {
        const trimmed = label.trim()
        counts.set(trimmed, (counts.get(trimmed) || 0) + 1)
      }
    }
    return labels.map((label) => ({
      value: label,
      label,
      searchText: label,
      count: counts.get(label) || 0,
    }))
  }, [rfds, labels])

  const selectedAuthors = useMemo(
    () => searchParams.getAll('author'),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searchParams.toString()],
  )
  const selectedLabels = useMemo(
    () => searchParams.getAll('label'),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searchParams.toString()],
  )

  const setSelectedAuthors = (values: string[]) => {
    startTransition(() => {
      const next = new URLSearchParams(searchParams)
      next.delete('author')
      next.delete('authorEmail')
      next.delete('authorName')
      for (const v of values) next.append('author', v)
      setSearchParams(next, { replace: true })
    })
  }

  const setSelectedLabels = (values: string[]) => {
    startTransition(() => {
      const next = new URLSearchParams(searchParams)
      next.delete('label')
      for (const v of values) next.append('label', v)
      setSearchParams(next, { replace: true })
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <FilterChip
        iconName="person"
        label="Author"
        options={authorOptions}
        selected={selectedAuthors}
        onChange={setSelectedAuthors}
        placeholder="Search authors"
      />
      <FilterChip
        iconName="tags"
        label="Label"
        options={labelOptions}
        selected={selectedLabels}
        onChange={setSelectedLabels}
        placeholder="Search labels"
        className="purple-theme"
      />
    </div>
  )
}

const FilterChip = ({
  iconName,
  label,
  options,
  selected,
  onChange,
  placeholder,
  className,
}: {
  iconName: 'tags' | 'person'
  label: string
  options: FilterOption[]
  selected: string[]
  onChange: (values: string[]) => void
  placeholder: string
  className?: string
}) => {
  const [searchValue, setSearchValue] = useState('')

  const matches = useMemo(() => {
    const trimmed = searchValue.trim()
    if (!trimmed) return options
    const haystack = options.map((o) => o.searchText)
    const idxs = fuzz.filter(haystack, trimmed)
    if (!idxs || idxs.length === 0) return []
    return idxs.map((i) => options[i])
  }, [options, searchValue])

  const hasSelection = selected.length > 0
  const selectedLabel = useMemo(() => {
    if (selected.length === 0) return null
    if (selected.length < 3) {
      return selected.map((v) => options.find((o) => o.value === v)?.label ?? v).join(', ')
    }
    return `${selected.length} selected`
  }, [selected, options])

  const clearSelection = () => onChange([])

  return (
    <Ariakit.ComboboxProvider
      resetValueOnHide
      setValue={(val) => startTransition(() => setSearchValue(val))}
    >
      <Ariakit.SelectProvider value={selected} setValue={onChange}>
        <div className={cn('relative', className)}>
          <Ariakit.Select
            className={cn(
              'text-sans-sm inline-flex h-7 items-center rounded-md px-2 ring ring-current/15 ring-inset',
              hasSelection
                ? 'bg-accent hover:bg-accent-hover text-accent-secondary pr-6'
                : 'text-secondary hover:bg-secondary',
            )}
          >
            <Icon
              name={iconName}
              size={16}
              className={cn(
                'mr-1.5 size-3 transition-transform',
                hasSelection ? 'text-accent-tertiary' : 'text-quaternary',
              )}
            />
            <span>{label}</span>
            {hasSelection && (
              <span className="text-accent max-w-[220px] truncate">: {selectedLabel}</span>
            )}
          </Ariakit.Select>
          {hasSelection && (
            <button
              type="button"
              onClick={clearSelection}
              aria-label={`Clear ${label} filter`}
              className="hover:text-default hover:bg-accent-inverse/10 absolute top-1.5 right-1 flex size-4 items-center justify-center rounded-l-md"
            >
              <Icon name="close" size={8} className="text-accent" />
            </button>
          )}
        </div>
        <Ariakit.SelectPopover
          gutter={12}
          hideOnInteractOutside
          className="filter-popover shadow-menu"
        >
          <div className="filter-popover-search">
            <Ariakit.Combobox
              autoSelect
              placeholder={placeholder}
              className="text-sans-sm text-default placeholder:text-tertiary min-w-0 flex-1 bg-transparent outline-none"
            />
          </div>
          <Ariakit.ComboboxList className="filter-popover-list">
            {matches.length === 0 ? (
              <div className="text-tertiary text-sans-sm px-3 py-3 text-center">
                No results
              </div>
            ) : (
              matches.map((option) => (
                <Ariakit.SelectItem
                  key={option.value}
                  value={option.value}
                  hideOnClick={false}
                  className="filter-popover-item"
                  render={<Ariakit.ComboboxItem />}
                >
                  <Checkbox checked={selected.includes(option.value)} readOnly />
                  <span className="flex-1 truncate">{option.label}</span>
                  <span className="text-tertiary text-mono-xs shrink-0">
                    {option.count}
                  </span>
                </Ariakit.SelectItem>
              ))
            )}
          </Ariakit.ComboboxList>
          {hasSelection && (
            <button type="button" onClick={clearSelection} className="filter-popover-clear">
              Clear filters
            </button>
          )}
        </Ariakit.SelectPopover>
      </Ariakit.SelectProvider>
    </Ariakit.ComboboxProvider>
  )
}

export default FilterDropdown
