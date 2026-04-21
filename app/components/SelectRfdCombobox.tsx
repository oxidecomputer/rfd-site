/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import { useVirtualizer } from '@tanstack/react-virtual'
import cn from 'classnames'
import { AnimatePresence, motion } from 'motion/react'
import {
  memo,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Link, useNavigate } from 'react-router'

import Icon from '~/components/Icon'
import { useKey } from '~/hooks/use-key'
import type { RfdItem, RfdListItem } from '~/services/rfd.server'
import { classed } from '~/utils/classed'
import { fuzz } from '~/utils/fuzz'

const Outline = classed.div`absolute left-0 top-0 z-10 h-full w-full rounded border border-accent pointer-events-none`

const EASE_OUT_QUAD = { duration: 0.15, ease: [0.5, 1, 0.89, 1] } as const

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

  const handleDismiss = useCallback(() => setOpen(false), [])

  return (
    <div className="flex items-center">
      <button
        onClick={toggleCombobox}
        aria-label="Select an RFD"
        className="group flex items-center text-left"
      >
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
            {currentRfd ? currentRfd.title : 'Select an RFD'}
          </div>
        </div>
        <div className="text-tertiary border-secondary group-hover:bg-hover 600:ml-6 ml-2 flex h-[32px] w-[18px] items-center justify-center rounded border">
          <Icon name="select-arrows" size={6} className="shrink-0" height={14} />
        </div>
      </button>

      <ComboboxWrapper open={open} rfds={rfds} onDismiss={handleDismiss} />
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
  // Defers list filtering so typing stays responsive with 600+ items.
  const deferredInput = useDeferredValue(input)

  const inputRef = (node: HTMLInputElement) => {
    if (node) node.focus()
  }

  const matchedItems = useMemo(() => {
    const parsedInput = parseInt(deferredInput)

    if (!deferredInput.trim()) {
      return rfds
    }

    const haystack = rfds.map((rfd) => `${rfd.number} ¦ ${rfd.title || ''}`)
    const idxs = fuzz.filter(haystack, deferredInput)

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
  }, [deferredInput, rfds])

  const [selectedIdx, setSelectedIdx] = useState(0)
  const selectedItem: RfdListItem | undefined = matchedItems[selectedIdx]

  const handleDismiss = useCallback(() => {
    setInput('')
    onDismiss()
  }, [onDismiss])

  const isDirty = deferredInput.length > 0

  const divRef = useRef<HTMLDivElement>(null)

  const rowVirtualizer = useVirtualizer({
    count: matchedItems.length,
    getScrollElement: () => divRef.current,
    estimateSize: () => 50,
    overscan: 8,
  })

  useEffect(() => {
    if (matchedItems.length === 0) return
    rowVirtualizer.scrollToIndex(selectedIdx, { align: 'auto' })
  }, [selectedIdx, matchedItems.length, rowVirtualizer])

  return (
    <AnimatePresence>
      {open && (
        <div className="z-10">
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={EASE_OUT_QUAD}
            className="bg-default 600:bg-transparent fixed top-0 right-0 bottom-0 left-0 cursor-default!"
            onClick={() => handleDismiss()}
          />
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={EASE_OUT_QUAD}
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
            <div className="overlay bg-raise shadow-border focus-within:ring-accent-secondary flex rounded focus-within:ring-2">
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
                className="hover:bg-hover text-mono-sm text-secondary border-l-secondary 600:hidden block border-l px-4"
                onClick={handleDismiss}
              >
                <Icon name="close" size={12} className="text-tertiary" />
              </button>
            </div>
            <div
              ref={divRef}
              className="shadow-menu bg-raise mt-3 max-h-[60vh] overflow-y-auto rounded"
            >
              {matchedItems.length > 0 ? (
                <ul
                  className="relative min-w-48"
                  style={{ height: rowVirtualizer.getTotalSize() }}
                >
                  {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    const rfd = matchedItems[virtualRow.index]
                    const isLast = virtualRow.index === matchedItems.length - 1
                    return (
                      <ComboboxItem
                        key={rfd.formattedNumber}
                        ref={rowVirtualizer.measureElement}
                        dataIndex={virtualRow.index}
                        offset={virtualRow.start}
                        rfd={rfd}
                        selected={selectedIdx === virtualRow.index}
                        isDirty={isDirty}
                        onClick={handleDismiss}
                        isLast={isLast}
                      />
                    )
                  })}
                </ul>
              ) : (
                <div className="text-sans-sm text-default px-3 py-2 text-center">
                  No matches found
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

const ComboboxItem = memo(
  ({
    rfd,
    selected,
    onClick,
    isDirty,
    offset,
    dataIndex,
    isLast,
    ref,
  }: {
    rfd: RfdListItem
    selected: boolean
    onClick: () => void
    isDirty: boolean
    offset: number
    dataIndex: number
    isLast: boolean
    ref: (node: HTMLAnchorElement | null) => void
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
        prefetch={shouldPrefetch ? 'render' : 'none'}
        ref={ref}
        data-index={dataIndex}
        className="absolute top-0 left-0 w-full"
        style={{ transform: `translateY(${offset}px)` }}
      >
        <li
          className={cn(
            'menu-item text-sans-sm border-secondary relative cursor-pointer border-b px-3 py-2 pr-6',
            isLast && 'border-b-0',
            selected
              ? 'text-accent bg-accent hover:bg-accent-hover'
              : 'hover:bg-hover text-default',
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
  },
)

export default SelectRfdCombobox
