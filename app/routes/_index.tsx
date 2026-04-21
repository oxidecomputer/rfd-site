/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import { Badge, Button } from '@oxide/design-system/ui'
import { useWindowVirtualizer } from '@tanstack/react-virtual'
import cn from 'classnames'
import dayjs from 'dayjs'
import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  Link,
  redirect,
  useFetcher,
  useLoaderData,
  useLocation,
  useNavigate,
  useSearchParams,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
  type ShouldRevalidateFunctionArgs,
} from 'react-router'

import { ClientOnly } from '~/components/ClientOnly'
import Container from '~/components/Container'
import { SortArrowBottom, SortArrowTop } from '~/components/CustomIcons'
import Header from '~/components/Header'
import FilterDropdown, { DEFAULT_RFD_STATES } from '~/components/home/FilterDropdown'
import Icon from '~/components/Icon'
import StatusBadge from '~/components/StatusBadge'
import { ExactMatch, SuggestedAuthors, SuggestedLabels } from '~/components/Suggested'
import { useKey } from '~/hooks/use-key'
import { useRootLoaderData } from '~/root'
import { rfdSortCookie } from '~/services/cookies.server'
import type { RfdListItem } from '~/services/rfd.server'
import { sortBy } from '~/utils/array'
import { canonicalUrl } from '~/utils/canonicalUrl'
import { fuzz } from '~/utils/fuzz'
import { parseSortOrder, type SortAttr } from '~/utils/rfdSortOrder.server'

export const links = () => [{ rel: 'canonical', href: canonicalUrl('/') }]

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const cookieHeader = request.headers.get('Cookie')
  return parseSortOrder(await rfdSortCookie.parse(cookieHeader))
}

export function shouldRevalidate({
  currentUrl,
  nextUrl,
  formMethod,
  defaultShouldRevalidate,
}: ShouldRevalidateFunctionArgs) {
  if (!formMethod && currentUrl.pathname === nextUrl.pathname) {
    return false
  }
  return defaultShouldRevalidate
}

// only for setting the sort order cookie
export const action = async ({ request }: ActionFunctionArgs) => {
  const body = await request.formData()
  const newCookie = parseSortOrder(Object.fromEntries(body))
  // redirect to same URL to preserve query params
  return redirect(request.url, {
    headers: {
      'Set-Cookie': await rfdSortCookie.serialize(newCookie),
    },
  })
}

export default function Index() {
  const [searchParams, setSearchParams] = useSearchParams()

  const searchParamsKey = searchParams.toString()
  const authorEmails = useMemo(() => {
    const emails = new Set(searchParams.getAll('author'))
    const legacyEmail = searchParams.get('authorEmail')
    if (legacyEmail) emails.add(legacyEmail)
    return Array.from(emails)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParamsKey])
  const authorNames = useMemo(() => {
    const legacyName = searchParams.get('authorName')
    return legacyName ? [legacyName] : []
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParamsKey])
  const labelValues = useMemo(
    () => searchParams.getAll('label'),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searchParamsKey],
  )
  const stateValues = useMemo(() => {
    const urlStates = searchParams.getAll('state')
    return urlStates.length > 0 ? urlStates : DEFAULT_RFD_STATES
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParamsKey])

  const allRfds = useRootLoaderData().rfds
  const rfds = useMemo(() => {
    let filtered = allRfds

    if (authorEmails.length > 0 || authorNames.length > 0) {
      filtered = filtered.filter((rfd) => {
        if (!rfd.authors) return false
        return rfd.authors.some(
          (author) =>
            authorEmails.includes(author.email) || authorNames.includes(author.name),
        )
      })
    }

    if (labelValues.length > 0) {
      filtered = filtered.filter((rfd) => {
        if (!rfd.labels) return false
        const trimmed = rfd.labels.map((l) => l.trim())
        return labelValues.some((l) => trimmed.includes(l))
      })
    }

    const stateSet = new Set(stateValues)
    filtered = filtered.filter((rfd) => rfd.state !== null && stateSet.has(rfd.state))

    return filtered
  }, [allRfds, authorEmails, authorNames, labelValues, stateValues])

  const authors = useRootLoaderData().authors
  const labels = useRootLoaderData().labels

  const { sortAttr, sortDir } = useLoaderData<typeof loader>()

  const [input, setInput] = useState('')
  const inputEl = useRef<HTMLInputElement>(null)

  const [matchedItems, exactMatch] = useMemo(() => {
    const parsedInput = parseInt(input)

    if (!input.trim()) {
      const sortedRfds = sortBy(rfds, (rfd) => {
        const sortVal =
          sortAttr === 'number'
            ? rfd.number
            : rfd.latestMajorChangeAt
              ? rfd.latestMajorChangeAt.getTime()
              : new Date().getTime()
        const mult = sortDir === 'asc' ? 1 : -1
        return sortVal * mult
      })

      return [sortedRfds, undefined]
    }

    const haystack = rfds.map((rfd) => {
      const authorString = rfd.authors
        ? rfd.authors.map((a) => `${a.name} ${a.email}`).join(' ')
        : ''
      return `${rfd.number} ¦ ${rfd.title || ''} ¦ ${authorString}`
    })
    const idxs = fuzz.filter(haystack, input)

    let filteredRfds: RfdListItem[] = []

    if (idxs) {
      filteredRfds = idxs.map((i) => rfds[i])
    }

    const exactMatch = rfds.find(
      (rfd) => !isNaN(parsedInput) && rfd.number === parsedInput && rfd,
    )

    const sortedRfds = sortBy(filteredRfds, (rfd) => {
      const sortVal =
        sortAttr === 'number'
          ? rfd.number
          : rfd.latestMajorChangeAt
            ? rfd.latestMajorChangeAt.getTime()
            : new Date().getTime()
      const mult = sortDir === 'asc' ? 1 : -1
      return sortVal * mult
    })

    return [sortedRfds, exactMatch]
  }, [input, rfds, sortAttr, sortDir])

  const matchedAuthors = useMemo(() => {
    if (input.length > 2) {
      const nameHaystack = authors.map((author) => author.name)
      const emailHaystack = authors.map((author) => author.email)

      const nameIdxs = fuzz.filter(nameHaystack, input) || []
      const emailIdxs = fuzz.filter(emailHaystack, input) || []

      // Combine and deduplicate
      const uniqueIdxs = [...new Set([...nameIdxs, ...emailIdxs])]
      const matches = uniqueIdxs.map((idx) => authors[idx])

      if (matches.length > 3) {
        return undefined
      }

      return matches.slice(0, 4)
    }

    return []
  }, [authors, input])

  const matchedLabels = useMemo(() => {
    if (input.length > 2 && labels.length > 0) {
      const idxs = fuzz.filter(labels, input) || []
      const matches = idxs.map((idx) => labels[idx])

      if (matches.length > 3) {
        return undefined
      }

      return matches.slice(0, 4)
    }

    return []
  }, [labels, input])

  // memoized to avoid render churn in useKey
  const focusInput = useCallback(() => {
    if (inputEl && inputEl.current) inputEl.current.focus()
    return false
  }, [inputEl])

  useKey('/', focusInput)

  const fetcher = useFetcher()
  const submitSortOrder = (newSortAttr: SortAttr) => {
    // toggle direction only if we're already sorted by the attr clicked on
    const newSortDir: 'asc' | 'desc' =
      newSortAttr === sortAttr ? (sortDir === 'asc' ? 'desc' : 'asc') : sortDir

    fetcher.submit({ sortAttr: newSortAttr, sortDir: newSortDir }, { method: 'post' })
  }

  const navigate = useNavigate()

  const hasFilters =
    authorEmails.length > 0 || authorNames.length > 0 || labelValues.length > 0

  const clearAllFilters = () => {
    const next = new URLSearchParams(searchParams)
    next.delete('author')
    next.delete('authorEmail')
    next.delete('authorName')
    next.delete('label')
    next.delete('state')
    setSearchParams(next, { replace: true })
    setInput('')
  }

  const { state, pathname, hash } = useLocation()

  useEffect(() => {
    // Author filter link sets `shouldClearInput: true` we check if it's been
    // set and clear the input so that the user can search RFDs from a user
    // without needing to delete the name from the input box. Done this way
    // instead of a callback because it should only happen after the nav,
    // otherwise we get a flash of the unfiltered list.
    if (state && state.shouldClearInput) {
      setInput('')
    }
  }, [state])

  useEffect(() => {
    focusInput()
  }, [focusInput])

  const listRef = useRef<HTMLDivElement>(null)
  const [listOffset, setListOffset] = useState(0)

  useLayoutEffect(() => {
    if (listRef.current) setListOffset(listRef.current.offsetTop)
  }, [matchedAuthors?.length, matchedLabels?.length, exactMatch?.number])

  const rowVirtualizer = useWindowVirtualizer({
    count: matchedItems.length,
    estimateSize: () => 92,
    overscan: 5,
    scrollMargin: listOffset,
  })

  return (
    <>
      {/* key makes the search dialog close on selection */}
      <Header key={pathname + hash} homeInputEl={inputEl} />
      <div className="pt-4">
        <Container>
          <div className="600:pt-[calc(299/1200*100%)] max-600:my-4 relative w-full">
            <img
              alt=""
              src="/svgs/header-grid.svg"
              className="light:invert light:opacity-40 max-600:hidden absolute top-0 -left-[2.7777777778%] z-0 h-auto w-[calc(100%+5.5555555556%)] max-w-none"
              style={{
                maskImage: 'url(/img/header-grid-mask.png)',
                WebkitMaskImage: 'url(/img/header-grid-mask.png)',
              }}
            />

            <div className="1000:translate-0 600:absolute 600:top-1/2 600:-translate-y-1/2 1200:top-[97px] relative flex w-full flex-col items-center justify-start">
              <h1 className="text-sans-2xl text-raise 800:text-sans-3xl text-center">
                Requests for Discussion
              </h1>

              <div className="800:w-[calc(100%/36*16+4px)] relative mt-[22px] h-[40px] w-full rounded">
                <input
                  value={input}
                  ref={inputEl}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (matchedItems.length === 0 || !matchedItems) {
                      return
                    }

                    if (e.key === 'Enter') {
                      navigate(
                        `/rfd/${
                          exactMatch
                            ? exactMatch.formattedNumber
                            : matchedItems[0].formattedNumber
                        }`,
                      )
                    }
                  }}
                  className="mousetrap placeholder:text-tertiary text-sans-md bg-raise border-secondary focus:ring-accent-secondary h-full w-full rounded border p-3 focus:ring-2 focus:outline-offset-0 focus:outline-none"
                  placeholder="Filter by title, number or author"
                />
                <div className="text-mono-xs text-default border-default pointer-events-none absolute top-1/2 right-3 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded border">
                  /
                </div>
              </div>

              <div className="800:absolute 800:top-[120px] 800:mt-0 800:w-[calc(100%/36*16+4px)] mt-3 flex w-full flex-col gap-2">
                {matchedAuthors && <SuggestedAuthors authors={matchedAuthors} />}
                {matchedLabels && <SuggestedLabels labels={matchedLabels} />}
                {exactMatch && matchedItems.length > 1 && <ExactMatch rfd={exactMatch} />}
              </div>
            </div>
          </div>
        </Container>
        <Container className="max-600:flex-col 600:items-end mt-4 mb-4 flex justify-between">
          <FilterDropdown />
          <div className="text-mono-xs text-default max-600:mt-3 flex">
            <div className="text-tertiary mr-1 block">Results:</div>
            <span data-testid="rfd-count">{matchedItems.length}</span>
          </div>
        </Container>
        <Container
          isGrid
          className="text-mono-xs text-secondary bg-raise border-secondary 800:grid mb-3 hidden h-10 items-center rounded-lg border px-3"
        >
          <button
            className="800:col-span-5 group col-span-12 flex cursor-pointer content-start pl-2 select-none"
            data-testid="sort-number"
            onClick={() => submitSortOrder('number')}
          >
            <div className="text-mono-xs group-hover:bg-tertiary -ml-1 flex items-center rounded p-1">
              Number <span className="text-quaternary mx-1 inline-block">/</span> Title
              <SortIcon isActive={sortAttr === 'number'} direction={sortDir} />
            </div>
          </button>

          <div className="1000:col-span-2 col-span-3">State</div>

          <button
            className="text-mono-xs 1000:col-span-2 group col-span-3 flex cursor-pointer content-start select-none"
            onClick={() => submitSortOrder('updated')}
          >
            <div className="group-hover:bg-tertiary -ml-1 flex items-center rounded p-1">
              Updated
              <SortIcon isActive={sortAttr === 'updated'} direction={sortDir} />
            </div>
          </button>

          <div className="1000:block col-span-2 hidden">Labels</div>
        </Container>

        <div
          ref={listRef}
          className="relative"
          style={{ height: rowVirtualizer.getTotalSize() }}
          data-testid="rfd-list"
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const rfd = matchedItems[virtualRow.index]
            return (
              <RfdRow
                key={rfd.formattedNumber}
                rfd={rfd}
                ref={rowVirtualizer.measureElement}
                dataIndex={virtualRow.index}
                offset={virtualRow.start - rowVirtualizer.options.scrollMargin}
              />
            )
          })}
        </div>
        {matchedItems.length === 0 && (hasFilters || input) && (
          <Container className="border-secondary mt-3 flex items-center justify-center border p-10">
            <div className="m-4 flex max-w-[18rem] flex-col items-center text-center">
              <div className="text-accent bg-accent mb-4 rounded-md p-1 leading-0">
                <Icon name="document" size={16} />
              </div>
              <h3 className="text-sans-lg text-default">No RFDs match your filters</h3>
              <Button onClick={clearAllFilters} variant="ghost" size="sm" className="mt-3">
                Clear filters
              </Button>
            </div>
          </Container>
        )}
      </div>
    </>
  )
}

const SortIcon = ({
  isActive,
  direction,
}: {
  isActive: boolean
  direction: 'asc' | 'desc'
}) => (
  <div
    className={cn(
      'text-secondary ml-2 h-[14px] flex-col justify-between',
      isActive ? 'flex' : 'hidden group-hover:flex! group-hover:*:!opacity-40',
    )}
  >
    <SortArrowTop className={direction === 'asc' ? '' : 'opacity-40'} />
    <SortArrowBottom className={direction === 'desc' ? '' : 'opacity-40'} />
  </div>
)

const RfdRow = memo(
  ({
    rfd,
    ref,
    dataIndex,
    offset,
  }: {
    rfd: RfdListItem
    ref: (node: HTMLDivElement | null) => void
    dataIndex: number
    offset: number
  }) => {
    return (
      <div
        ref={ref}
        data-index={dataIndex}
        className="absolute top-0 left-0 w-full pb-3"
        style={{ transform: `translateY(${offset}px)` }}
      >
        <Container className="text-sans-md border-secondary 800:h-20 relative rounded-lg border">
          <div className="800:gap-6 800:py-0 grid h-full w-full grid-cols-12 items-center gap-2 px-5 py-4">
            <Link
              to={`/rfd/${rfd.formattedNumber}`}
              key={rfd.formattedNumber}
              prefetch="intent"
              className="text-sans-lg 600:col-span-8 800:order-1 800:col-span-5 800:text-sans-md group order-2 col-span-12 -m-4 p-4 pr-10"
            >
              <div className="800:group-hover:bg-hover -m-2 inline-flex flex-col rounded-lg p-2">
                <div>RFD {rfd.number}</div>
                <div className="text-default line-clamp-2">{rfd.title}</div>
              </div>
            </Link>

            <div className="800:order-2 800:col-span-3 1000:col-span-2 order-1 col-span-12 flex flex-col items-start">
              {rfd.state && <StatusBadge label={rfd.state} />}
            </div>

            <div
              className="text-sans-md text-default 800:col-span-3 800:block 800:space-x-0 1000:col-span-2 order-3 col-span-12 flex space-x-2"
              data-testid="timestamp"
            >
              <ClientOnly
                fallback={
                  <>
                    <div className="bg-tertiary h-4 w-24 rounded" />
                    <div className="bg-tertiary 800:block mt-1 hidden h-4 w-12 rounded"></div>
                  </>
                }
              >
                {() => (
                  <>
                    <div className="text-secondary 800:text-default">
                      {rfd.latestMajorChangeAt &&
                        dayjs(rfd.latestMajorChangeAt).format('MMM D, YYYY')}
                    </div>
                    <div className="text-quaternary 800:hidden">/</div>
                    <div className="text-secondary 800:text-tertiary">
                      {rfd.latestMajorChangeAt &&
                        dayjs(rfd.latestMajorChangeAt).format('h:mm A')}
                    </div>
                  </>
                )}
              </ClientOnly>
            </div>

            {rfd.labels && <Labels labels={rfd.labels} />}
          </div>
        </Container>
      </div>
    )
  },
)

const Labels = ({ labels }: { labels: string[] }) => (
  <div className="1000:flex order-4 col-span-3 hidden max-h-10">
    <ClientOnly
      fallback={
        <>
          <div className="bg-tertiary h-4 w-16 rounded" />
          <div className="bg-tertiary 800:block ml-1 hidden h-4 w-12 rounded"></div>
        </>
      }
    >
      {() => <LabelsInner labels={labels} />}
    </ClientOnly>
  </div>
)

const LabelsInner = ({ labels }: { labels: string[] }) => {
  const containerEl = useRef<HTMLDivElement>(null)
  // const { isOverflow } = useIsOverflow(containerEl)
  return (
    <div
      ref={containerEl}
      className="text-tertiary relative flex shrink flex-wrap gap-1 overflow-hidden pr-8"
    >
      {labels ? (
        labels.map((label) => (
          <Link key={label} to={`/?label=${encodeURIComponent(label.trim())}`}>
            <Badge color="neutral">{label.trim()}</Badge>
          </Link>
        ))
      ) : (
        <div className="text-sans-md text-quaternary">-</div>
      )}

      {/* todo: replace with something clearer */}
      {/*{isOverflow && (
        <div className="text-mono-sm text-tertiary absolute top-1/2 right-6 -translate-y-1/2">
          +
        </div>
      )}*/}
    </div>
  )
}
