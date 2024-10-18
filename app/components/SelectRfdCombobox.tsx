/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import { Link, useNavigate } from '@remix-run/react'
import cn from 'classnames'
import fuzzysort from 'fuzzysort'
import { useCallback, useEffect, useRef, useState } from 'react'

import Icon from '~/components/Icon'
import { useKey } from '~/hooks/use-key'
import { useSteppedScroll } from '~/hooks/use-stepped-scroll'
import type { RfdItem, RfdListItem } from '~/services/rfd.server'
import { classed } from '~/utils/classed'

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

  useKey('mod+/', toggleCombobox)

  const handleDismiss = () => setOpen(false)

  return (
    <div className="flex items-center">
      <div>
        <div className="text-mono-xs text-quaternary">
          RFD {currentRfd ? currentRfd.number : ''}
        </div>
        <div
          className={cn(
            'truncate !leading-[14px] text-sans-sm text-secondary 600:max-w-[240px]',
            isLoggedIn ? 'max-w-[160px]' : 'max-w-[100px]',
          )}
        >
          {currentRfd ? currentRfd.title : 'Select a RFD'}
        </div>
      </div>
      <button
        onClick={toggleCombobox}
        className="ml-2 flex h-[32px] w-[18px] items-center justify-center rounded border text-quaternary border-secondary hover:bg-hover 600:ml-6"
        aria-label="Select a RFD"
      >
        <Icon name="select-arrows" size={6} className="flex-shrink-0" height={14} />
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

  const matchedItems: Fuzzysort.KeysResults<RfdListItem> = fuzzysort.go(input, rfds, {
    threshold: -10000,
    all: true, // If true, returns all results for an empty search
    keys: ['title', 'number_string'],
    scoreFn: (a) => {
      const rfdNumber = a[1] ? parseInt(a[1].target) : null
      const parsedInput = parseInt(input)

      let scoreOffset = 0
      if (!isNaN(parsedInput) && rfdNumber === parsedInput) {
        scoreOffset = Infinity
      }

      return Math.max(
        a[0] ? a[0].score : -Infinity,
        a[1] ? a[1].score + scoreOffset : -Infinity,
      )
    },
  })

  const [selectedIdx, setSelectedIdx] = useState(0)
  const selectedItem: RfdListItem | undefined = matchedItems[selectedIdx]?.obj

  const handleDismiss = () => {
    setInput('')
    onDismiss()
  }

  const divRef = useRef<HTMLDivElement>(null)
  const ulRef = useRef<HTMLUListElement>(null)

  useSteppedScroll(divRef, ulRef, selectedIdx)

  return (
    <div className={open ? 'visible' : 'pointer-events-none invisible'}>
      <div
        className={cn(
          'fixed bottom-0 left-0 right-0 top-0 bg-default 600:bg-transparent',
          open ? 'opacity-80 ' : 'opacity-0',
        )}
        onClick={() => handleDismiss()}
      />
      <div
        className="group absolute left-4 right-4 top-4 600:right-auto 600:top-[calc(var(--header-height)+8px)] 600:w-[16rem]"
        onKeyDown={(e) => {
          const lastIdx = matchedItems.length - 1
          if (e.key === 'Enter') {
            if (!selectedItem) return
            navigate(`/rfd/${selectedItem.number_string}`)
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
        <div className="overlay flex rounded border shadow bg-raise border-secondary focus-within:ring-2 focus-within:ring-accent-secondary">
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
            className="mousetrap h-12 w-full appearance-none rounded border-none px-3 text-sans-lg text-default bg-raise focus:outline-none focus:outline-offset-0 600:h-auto 600:py-3 600:text-sans-md"
          />
          <button
            className="hover:bg-raise-hover block border-l px-4 text-mono-sm text-tertiary border-l-secondary 600:hidden"
            onClick={handleDismiss}
          >
            <Icon name="close" size={12} className="text-quaternary" />
          </button>
        </div>
        <div
          ref={divRef}
          className="overlay-shadow mt-3 max-h-[60vh] overflow-y-auto rounded border bg-raise border-secondary"
        >
          <ul
            ref={ulRef}
            className={cn('min-w-[12rem] [&>*:last-child_.menu-item]:border-b-0')}
          >
            {matchedItems.length > 0 ? (
              matchedItems.map((rfd: Fuzzysort.KeysResult<RfdListItem>, index: number) => {
                return (
                  <ComboboxItem
                    key={rfd.obj.number_string}
                    rfd={rfd.obj}
                    selected={selectedIdx === index}
                    isDirty={input.length > 0}
                    onClick={() => handleDismiss()}
                  />
                )
              })
            ) : (
              <div className="px-3 py-2 text-center text-sans-sm text-secondary">
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
      to={`/rfd/${rfd.number_string}`}
      onClick={onClick}
      prefetch={shouldPrefetch ? 'render' : 'intent'}
    >
      <li
        className={cn(
          'menu-item relative cursor-pointer border-b px-3 py-2 pr-6 text-sans-sm border-secondary',
          selected
            ? 'text-accent bg-accent-secondary hover:bg-accent-secondary-hover'
            : 'hover:bg-raise-hover text-secondary',
        )}
      >
        {selected && <Outline />}
        <div>RFD {rfd.number}</div>
        <div className={cn(selected ? 'text-accent-secondary' : 'text-tertiary')}>
          {rfd.title}
        </div>
      </li>
    </Link>
  )
}

export default SelectRfdCombobox
