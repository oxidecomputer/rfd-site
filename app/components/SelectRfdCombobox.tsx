/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import cn from 'classnames'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'

import Icon from '~/components/Icon'
import { useKey } from '~/hooks/use-key'
import { useSteppedScroll } from '~/hooks/use-stepped-scroll'
import type { RfdItem, RfdListItem } from '~/services/rfd.server'
import { classed } from '~/utils/classed'
import { fuzz } from '~/utils/fuzz'

const Outline = classed.div`absolute left-0 top-0 z-10 h-full w-full rounded border border-accent pointer-events-none`

const SelectRfdCombobox = ({
  rfds,
  currentRfd,
  isLoggedIn,
}: {
  rfds: RfdListItem[]
  currentRfd: RfdItem | undefined
  isLoggedIn: boolean
}) => {
  const [open, setOpen] = useState(false)

  // memoized to avoid render churn in useKey
  const toggleCombobox = useCallback(() => setOpen(!open), [setOpen, open])

  useKey('mod+/', toggleCombobox, { global: true })

  const handleDismiss = () => setOpen(false)

  return (
    <div className="flex items-center">
      <div>
        <div className="text-mono-xs text-tertiary">
          RFD {currentRfd ? currentRfd.number : ''}
        </div>
        <div
          className={cn(
            'text-sans-sm text-default 600:max-w-[240px] truncate leading-[14px]!',
            isLoggedIn ? 'max-w-[160px]' : 'max-w-[100px]',
          )}
        >
          {currentRfd ? currentRfd.title : 'Select a RFD'}
        </div>
      </div>
      <button
        onClick={toggleCombobox}
        className="text-tertiary border-secondary hover:bg-hover 600:ml-6 ml-2 flex h-[32px] w-[18px] items-center justify-center rounded border"
        aria-label="Select a RFD"
      >
        <Icon name="select-arrows" size={6} className="shrink-0" height={14} />
      </button>

      <ComboboxWrapper open={open} rfds={open ? rfds : []} onDismiss={handleDismiss} />
    </div>
  )
}

const ComboboxWrapper = ({
  rfds,
  onDismiss,
  open,
}: {
  rfds: RfdListItem[]
  onDismiss: () => void
  open: boolean
}) => {
  const navigate = useNavigate()

  const [input, setInput] = useState('')

  const inputRef = (node: HTMLInputElement) => {
    if (node) node.focus()
  }

  const matchedItems = useMemo(() => {
    const parsedInput = parseInt(input)

    if (!input.trim()) {
      return rfds
    }

    const haystack = rfds.map((rfd) => `${rfd.number} ¦ ${rfd.title || ''}`)
    const idxs = fuzz.filter(haystack, input)

    let filteredRfds: RfdListItem[] = []

    if (idxs) {
      // Sort by exact match first, then by normal score
      filteredRfds = idxs
        .map((i) => {
          const rfd = rfds[i]
          return {
            ...rfd,
            _exactMatch: !isNaN(parsedInput) && rfd.number === parsedInput,
          }
        })
        .sort((a, b) => {
          // Prioritize exact matches
          if (a._exactMatch && !b._exactMatch) return -1
          if (!a._exactMatch && b._exactMatch) return 1
          // Fall back to sorting by number
          return a.number - b.number
        })
    }

    return filteredRfds
  }, [input, rfds])

  const [selectedIdx, setSelectedIdx] = useState(0)
  const selectedItem: RfdListItem | undefined = matchedItems[selectedIdx]

  const handleDismiss = () => {
    setInput('')
    onDismiss()
  }

  const divRef = useRef<HTMLDivElement>(null)
  const ulRef = useRef<HTMLUListElement>(null)

  useSteppedScroll(divRef, ulRef, selectedIdx)

  return (
    <div className={cn(open ? 'visible' : 'pointer-events-none invisible', 'z-10')}>
      <button
        className={cn(
          'bg-default 600:bg-transparent fixed top-0 right-0 bottom-0 left-0',
          open ? 'opacity-80' : 'opacity-0',
        )}
        onClick={() => handleDismiss()}
      />
      <div
        className="group 600:right-auto 600:top-[calc(var(--header-height)+8px)] 600:w-[16rem] absolute top-4 right-4 left-4"
        onKeyDown={(e) => {
          const lastIdx = matchedItems.length - 1
          if (e.key === 'Enter') {
            if (!selectedItem) return
            navigate(`/rfd/${selectedItem.formattedNumber}`)
            handleDismiss()
          } else if (e.key === 'ArrowDown') {
            const newIdx = selectedIdx === lastIdx ? 0 : selectedIdx + 1
            setSelectedIdx(newIdx)
            e.preventDefault() // Prevent it from moving input cursor
          } else if (e.key === 'ArrowUp') {
            const newIdx = selectedIdx === 0 ? lastIdx : selectedIdx - 1
            setSelectedIdx(newIdx)
            e.preventDefault()
          } else if (e.key === 'Escape') {
            handleDismiss()
          }
        }}
        role="combobox"
        tabIndex={-1}
        aria-controls="TODO"
        aria-expanded
      >
        <div className="overlay bg-raise border-secondary focus-within:ring-accent-secondary flex rounded border shadow focus-within:ring-2">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setSelectedIdx(0)
              setInput(e.target.value)
            }}
            onBlur={(e) => {
              // Dismiss if the users focus moves to the
              // other input on the homepage
              if (e.relatedTarget?.nodeName === 'INPUT') {
                handleDismiss()
              }
            }}
            placeholder="Search"
            spellCheck="false"
            className="placeholder:text-tertiary text-sans-lg text-raise bg-raise 600:h-auto 600:py-3 600:text-sans-md h-12 w-full appearance-none rounded border-none px-3 focus:outline-offset-0 focus:outline-none"
          />
          <button
            className="hover:bg-raise-hover text-mono-sm text-secondary border-l-secondary 600:hidden block border-l px-4"
            onClick={handleDismiss}
          >
            <Icon name="close" size={12} className="text-tertiary" />
          </button>
        </div>
        <div
          ref={divRef}
          className="overlay-shadow bg-raise border-secondary mt-3 max-h-[60vh] overflow-y-auto rounded border"
        >
          <ul ref={ulRef} className={cn('min-w-48 [&>*:last-child_.menu-item]:border-b-0')}>
            {matchedItems.length > 0 ? (
              matchedItems.map((rfd: RfdListItem, index: number) => {
                return (
                  <ComboboxItem
                    key={rfd.formattedNumber}
                    rfd={rfd}
                    selected={selectedIdx === index}
                    isDirty={input.length > 0}
                    onClick={() => handleDismiss()}
                  />
                )
              })
            ) : (
              <div className="text-sans-sm text-default px-3 py-2 text-center">
                No matches found
              </div>
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}

const ComboboxItem = ({
  rfd,
  selected,
  onClick,
  isDirty,
}: {
  rfd: RfdListItem
  selected: boolean
  onClick: () => void
  isDirty: boolean
}) => {
  const [shouldPrefetch, setShouldPrefetch] = useState(false)

  const timer = useRef<NodeJS.Timeout | null>(null)

  function clear() {
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
  }

  // Programmatically prefetching items in the jump to menu
  // Only if the user has typed something, with a timeout to
  // avoid prefetching everything
  useEffect(() => {
    if (selected && isDirty) {
      timer.current = setTimeout(() => setShouldPrefetch(true), 250)
    } else {
      clear()
      setShouldPrefetch(false)
    }

    return clear
  }, [selected, isDirty])

  return (
    <Link
      to={`/rfd/${rfd.formattedNumber}`}
      onClick={onClick}
      prefetch={shouldPrefetch ? 'render' : 'intent'}
    >
      <li
        className={cn(
          'menu-item text-sans-sm border-secondary relative cursor-pointer border-b px-3 py-2 pr-6',
          selected
            ? 'text-accent bg-accent-secondary hover:bg-accent-secondary-hover'
            : 'hover:bg-raise-hover text-default',
        )}
      >
        {selected && <Outline />}
        <div>RFD {rfd.number}</div>
        <div className={cn(selected ? 'text-accent-secondary' : 'text-secondary')}>
          {rfd.title}
        </div>
      </li>
    </Link>
  )
}

export default SelectRfdCombobox
