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

export const RFD_STATES = [
  'prediscussion',
  'ideation',
  'discussion',
  'published',
  'committed',
  'abandoned',
] as const

export const DEFAULT_RFD_STATES: readonly string[] = RFD_STATES.filter(
  (s) => s !== 'abandoned',
)

const sameSet = (a: string[], b: readonly string[]) => {
  if (a.length !== b.length) return false
  const set = new Set(a)
  return b.every((v) => set.has(v))
}

const FilterDropdown = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const { rfds, authors, labels } = useRootLoaderData()

  const searchParamsKey = searchParams.toString()

  const selectedAuthors = useMemo(
    () => searchParams.getAll('author'),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searchParamsKey],
  )

  const selectedLabels = useMemo(
    () => searchParams.getAll('label'),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searchParamsKey],
  )

  const urlStates = useMemo(
    () => searchParams.getAll('state'),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searchParamsKey],
  )

  // The state filter is "default" when no state params are present in the URL,
  // which implicitly means all non-abandoned states. `effectiveStates` is what
  // actually filters the list and drives the checkboxes in the dropdown.
  const hasStateDeviation = urlStates.length > 0
  const effectiveStates = hasStateDeviation ? urlStates : DEFAULT_RFD_STATES

  // Disjunctive facets: each group's counts reflect the filter set with that
  // group's own selection removed, so users see how many results adding an
  // option would yield rather than 0 everywhere once one option is picked.
  const rfdsFilteredByLabels = useMemo(() => {
    if (selectedLabels.length === 0) return rfds
    return rfds.filter((rfd) => {
      if (!rfd.labels) return false
      const trimmed = rfd.labels.map((l) => l.trim())
      return selectedLabels.some((l) => trimmed.includes(l))
    })
  }, [rfds, selectedLabels])

  const rfdsFilteredByAuthors = useMemo(() => {
    if (selectedAuthors.length === 0) return rfds
    return rfds.filter((rfd) => {
      if (!rfd.authors) return false
      return rfd.authors.some((a) => selectedAuthors.includes(a.email))
    })
  }, [rfds, selectedAuthors])

  const rfdsFilteredByStates = useMemo(() => {
    const allowed = new Set(effectiveStates)
    return rfds.filter((rfd) => rfd.state !== null && allowed.has(rfd.state))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rfds, effectiveStates.join(',')])

  const intersect = <T,>(a: T[], b: T[]) => {
    const setB = new Set(b)
    return a.filter((x) => setB.has(x))
  }

  const rfdsForAuthorCounts = useMemo(
    () => intersect(rfdsFilteredByLabels, rfdsFilteredByStates),
    [rfdsFilteredByLabels, rfdsFilteredByStates],
  )

  const rfdsForLabelCounts = useMemo(
    () => intersect(rfdsFilteredByAuthors, rfdsFilteredByStates),
    [rfdsFilteredByAuthors, rfdsFilteredByStates],
  )

  const rfdsForStateCounts = useMemo(
    () => intersect(rfdsFilteredByAuthors, rfdsFilteredByLabels),
    [rfdsFilteredByAuthors, rfdsFilteredByLabels],
  )

  const authorOptions = useMemo<FilterOption[]>(() => {
    const counts = new Map<string, number>()
    for (const rfd of rfdsForAuthorCounts) {
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
  }, [rfdsForAuthorCounts, authors])

  const labelOptions = useMemo<FilterOption[]>(() => {
    const counts = new Map<string, number>()
    for (const rfd of rfdsForLabelCounts) {
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
  }, [rfdsForLabelCounts, labels])

  const stateOptions = useMemo<FilterOption[]>(() => {
    const counts = new Map<string, number>()
    for (const rfd of rfdsForStateCounts) {
      if (rfd.state) counts.set(rfd.state, (counts.get(rfd.state) || 0) + 1)
    }
    return RFD_STATES.map((state) => ({
      value: state,
      label: state,
      searchText: state,
      count: counts.get(state) || 0,
    }))
  }, [rfdsForStateCounts])

  const setSelectedAuthors = (values: string[]) => {
    startTransition(() => {
      const next = new URLSearchParams(searchParams)
      next.delete('author')
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

  const setSelectedStates = (values: string[]) => {
    startTransition(() => {
      const next = new URLSearchParams(searchParams)
      next.delete('state')
      // Collapse back to the default (no params) when the user either clears
      // the filter or picks the exact default set, or ends up with nothing
      // selected (otherwise the UI would show zero results with no obvious
      // way back).
      const isDefault = values.length === 0 || sameSet(values, DEFAULT_RFD_STATES)
      if (!isDefault) {
        for (const v of values) next.append('state', v)
      }
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
        className="purple-theme"
      />
      <FilterChip
        iconName="tags"
        label="Label"
        options={labelOptions}
        selected={selectedLabels}
        onChange={setSelectedLabels}
        placeholder="Search labels"
        className="blue-theme"
      />
      <FilterChip
        iconName="hourglass"
        label="State"
        options={stateOptions}
        selected={effectiveStates as string[]}
        onChange={setSelectedStates}
        placeholder="Search states"
        hasSelectionOverride={hasStateDeviation}
        className="green-theme"
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
  hasSelectionOverride,
}: {
  iconName: 'tags' | 'person' | 'hourglass'
  label: string
  options: FilterOption[]
  selected: string[]
  onChange: (values: string[]) => void
  placeholder: string
  className?: string
  hasSelectionOverride?: boolean
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

  const hasSelection = hasSelectionOverride ?? selected.length > 0
  const selectedLabel = useMemo(() => {
    if (!hasSelection) return null
    if (selected.length === 0) return null
    if (selected.length < 3) {
      return selected.map((v) => options.find((o) => o.value === v)?.label ?? v).join(', ')
    }
    return `${selected.length} selected`
  }, [hasSelection, selected, options])

  const clearSelection = () => onChange([])

  return (
    <Ariakit.ComboboxProvider
      resetValueOnHide
      setValue={(val) => startTransition(() => setSearchValue(val))}
    >
      <Ariakit.SelectProvider value={selected} setValue={onChange}>
        <div className={cn('relative', className)}>
          <Ariakit.Select
            data-testid={`filter-${label.toLowerCase()}`}
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
            {hasSelection && selectedLabel && (
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
