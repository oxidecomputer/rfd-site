/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import { Badge } from '@oxide/design-system'
import { redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from '@remix-run/node'
import {
  Link,
  useFetcher,
  useLoaderData,
  useLocation,
  useNavigate,
  useSearchParams,
} from '@remix-run/react'
import cn from 'classnames'
import dayjs from 'dayjs'
import fuzzysort from 'fuzzysort'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { ClientOnly } from '~/components/ClientOnly'
import Container from '~/components/Container'
import { SortArrowBottom, SortArrowTop } from '~/components/CustomIcons'
import Header from '~/components/Header'
import FilterDropdown from '~/components/home/FilterDropdown'
import StatusBadge from '~/components/StatusBadge'
import { ExactMatch, SuggestedAuthors, SuggestedLabels } from '~/components/Suggested'
import { useIsOverflow } from '~/hooks/use-is-overflow'
import { useKey } from '~/hooks/use-key'
import { useRootLoaderData } from '~/root'
import { rfdSortCookie } from '~/services/cookies.server'
import type { RfdListItem } from '~/services/rfd.server'
import { sortBy } from '~/utils/array'
import { parseSortOrder, type SortAttr } from '~/utils/rfdSortOrder.server'

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const cookieHeader = request.headers.get('Cookie')
  return parseSortOrder(await rfdSortCookie.parse(cookieHeader))
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
  const [searchParams] = useSearchParams()

  // Check for email and name
  // Helps catch when people use email aliases
  // Supports both email and name, none or either
  const authorEmailParam = searchParams.get('authorEmail')
  const authorNameParam = searchParams.get('authorName')
  const labelParam = searchParams.get('label')

  const allRfds = useRootLoaderData().rfds
  const rfds = useMemo(() => {
    let rfds = allRfds

    if (!authorEmailParam && !authorNameParam && !labelParam) {
      return rfds
    }

    if (authorEmailParam || authorNameParam) {
      rfds = rfds.filter((rfd) => {
        if (!rfd.authors) {
          return false
        }

        let isMatch = false

        if (
          authorEmailParam &&
          rfd.authors?.some((author) => author.email === authorEmailParam)
        ) {
          isMatch = true
        }

        if (
          authorNameParam &&
          rfd.authors?.some((author) => author.name === authorNameParam)
        ) {
          isMatch = true
        }

        return isMatch
      })
    }

    if (labelParam) {
      rfds = rfds.filter((rfd) => {
        if (!rfd.labels) {
          return false
        }

        return rfd.labels.map((label) => label.trim()).includes(labelParam)
      })
    }

    return rfds
  }, [allRfds, authorEmailParam, authorNameParam, labelParam])

  const authors = useRootLoaderData().authors
  const labels = useRootLoaderData().labels

  const { sortAttr, sortDir } = useLoaderData<typeof loader>()

  const [input, setInput] = useState('')
  const inputEl = useRef<HTMLInputElement>(null)

  const [matchedItems, exactMatch] = useMemo(() => {
    const parsedInput = parseInt(input)

    const filteredRfds = fuzzysort
      .go(input, rfds, {
        threshold: -10000,
        all: true, // If true, returns all results for an empty search
        keys: ['title', 'formattedNumber', 'authors.name', 'authors.email'],
      })
      .map((result) => {
        return result.obj
      })

    const exactMatch = filteredRfds.find(
      (rfd) => !isNaN(parsedInput) && rfd.number === parsedInput && rfd,
    )

    const sortedRfds = sortBy(filteredRfds, (rfd) => {
      const sortVal =
        sortAttr === 'number'
          ? rfd.number
          : rfd.committedAt
            ? rfd.committedAt.getTime()
            : new Date().getTime()
      const mult = sortDir === 'asc' ? 1 : -1
      return sortVal * mult
    })

    return [sortedRfds, exactMatch]
  }, [input, rfds, sortAttr, sortDir])

  const matchedAuthors = useMemo(() => {
    if (input.length > 2) {
      const match = fuzzysort
        .go(input, authors, {
          threshold: -10000,
          keys: ['name', 'email'],
        })
        .map((result) => result.obj)

      if (match.length > 3) {
        return undefined
      }

      return match.slice(0, 4)
    }

    return []
  }, [authors, input])

  const matchedLabels = useMemo(() => {
    if (input.length > 2 && labels.length > 0) {
      const match = fuzzysort
        .go(input, labels, {
          threshold: -10000,
        })
        .map((result) => result.target)

      if (match.length > 3) {
        return undefined
      }

      return match.slice(0, 4)
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

  let { state, pathname, hash } = useLocation()

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
    if (inputEl.current) {
      inputEl.current.focus()
    }
  }, [])

  return (
    <>
      {/* key makes the search dialog close on selection */}
      <Header key={pathname + hash} />
      <div className="pt-[1rem]">
        <Container>
          <div className="relative my-12 w-full 600:pt-[calc(299/1200*100%)]">
            <img
              alt=""
              src="/svgs/header-grid.svg"
              className="absolute -left-[2.7777777778%] top-0 z-0 h-auto w-[calc(100%+5.5555555556%)] max-w-none !filter-none"
              style={{
                maskImage: 'url(/img/header-grid-mask.png)',
                WebkitMaskImage: 'url(/img/header-grid-mask.png)',
              }}
            />

            <div className="1000:translate-0 relative flex w-full flex-col items-center justify-start 600:absolute 600:top-1/2 600:-translate-y-1/2 1200:top-[150px]">
              <h1 className="text-center text-sans-2xl text-raise 800:text-sans-3xl">
                Requests for Discussion
              </h1>

              <div className="relative mt-[22px] h-[40px] w-full 800:w-[calc(100%/36*16+4px)]">
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
                  className="mousetrap overlay-shadow h-full w-full rounded border p-3 text-sans-md bg-raise border-secondary focus:outline-none focus:outline-offset-0 focus:ring-2 focus:ring-accent-secondary"
                  placeholder="Filter by title, number or author"
                />
                <div className="pointer-events-none absolute right-3 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded border text-mono-xs text-default border-default">
                  /
                </div>
              </div>

              <div className="mt-3 flex w-full flex-col gap-2 800:absolute 800:top-[120px] 800:mt-0 800:w-[calc(100%/36*16+4px)]">
                {matchedAuthors && <SuggestedAuthors authors={matchedAuthors} />}
                {matchedLabels && <SuggestedLabels labels={matchedLabels} />}
                {exactMatch && matchedItems.length > 1 && <ExactMatch rfd={exactMatch} />}
              </div>
            </div>
          </div>
        </Container>
        <Container className="mb-4 mt-4 flex justify-between">
          <FilterDropdown />
          <div className="flex text-mono-sm text-default">
            <div className="mr-1 block text-tertiary">Results:</div>
            {matchedItems.length}
          </div>
        </Container>
        <ul className="space-y-3">
          <Container
            isGrid
            className="hidden h-10 items-center rounded-lg border px-3 text-mono-xs text-secondary bg-raise border-secondary 800:grid"
          >
            <div
              className="group col-span-12 flex cursor-pointer select-none content-start pl-2 800:col-span-5"
              onClick={() => submitSortOrder('number')}
            >
              <div className="-ml-1 flex items-center rounded p-1 group-hover:bg-tertiary">
                Number <span className="mx-1 inline-block text-quaternary">/</span> Title
                <SortIcon isActive={sortAttr === 'number'} direction={sortDir} />
              </div>
            </div>

            <div className="col-span-3 1000:col-span-2">State</div>

            <div
              className="group col-span-3 flex cursor-pointer select-none content-start 1000:col-span-2"
              onClick={() => submitSortOrder('updated')}
            >
              <div className="-ml-1 flex items-center rounded p-1 group-hover:bg-tertiary">
                Updated
                <SortIcon isActive={sortAttr === 'updated'} direction={sortDir} />
              </div>
            </div>

            <div className="col-span-2 hidden 1000:block">Labels</div>
          </Container>

          {matchedItems.map((rfd) => (
            <RfdRow key={rfd.formattedNumber} rfd={rfd} />
          ))}
        </ul>
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
      'ml-2 h-[14px] flex-col justify-between text-secondary',
      isActive ? 'flex' : 'hidden group-hover:!flex group-hover:children:!opacity-40',
    )}
  >
    <SortArrowTop className={direction === 'asc' ? '' : 'opacity-40'} />
    <SortArrowBottom className={direction === 'desc' ? '' : 'opacity-40'} />
  </div>
)

const RfdRow = ({ rfd }: { rfd: RfdListItem }) => {
  return (
    <Container className="relative rounded-lg border text-sans-md border-secondary 800:h-20">
      <div className="grid h-full w-full grid-cols-12 items-center gap-2 px-5 py-4 800:gap-6 800:py-0">
        <Link
          to={`/rfd/${rfd.formattedNumber}`}
          key={rfd.formattedNumber}
          prefetch="intent"
          className="group order-2 col-span-12 -m-4 p-4 pr-10 text-sans-lg 600:col-span-8 800:order-1 800:col-span-5 800:text-sans-md"
        >
          <div className="-m-2 inline-flex flex-col rounded-lg p-2 800:group-hover:bg-hover">
            <div>RFD {rfd.number}</div>
            <div className="line-clamp-2 text-default">{rfd.title}</div>
          </div>
        </Link>

        <div className="order-1 col-span-12 flex flex-col items-start 800:order-2 800:col-span-3 1000:col-span-2">
          {rfd.state && <StatusBadge label={rfd.state} />}
        </div>

        <div className="order-3 col-span-12 flex space-x-2 text-sans-md text-default 800:col-span-3 800:block 800:space-x-0 1000:col-span-2">
          <ClientOnly
            fallback={
              <>
                <div className="h-4 w-24 rounded bg-tertiary" />
                <div className="mt-1 hidden h-4 w-12 rounded bg-tertiary 800:block"></div>
              </>
            }
          >
            {() => (
              <>
                <div className="text-secondary 800:text-default">
                  {rfd.committedAt && dayjs(rfd.committedAt).format('MMM D, YYYY')}
                </div>
                <div className="text-quaternary 800:hidden">/</div>
                <div className="text-secondary 800:text-tertiary">
                  {rfd.committedAt && dayjs(rfd.committedAt).format('h:mm A')}
                </div>
              </>
            )}
          </ClientOnly>
        </div>

        {rfd.labels && <Labels labels={rfd.labels} />}
      </div>
    </Container>
  )
}

const Labels = ({ labels }: { labels: string[] }) => (
  <div className="order-4 col-span-3 hidden max-h-[2.5rem] 1000:flex">
    <ClientOnly
      fallback={
        <>
          <div className="h-4 w-16 rounded bg-tertiary" />
          <div className="ml-1 hidden h-4 w-12 rounded bg-tertiary 800:block"></div>
        </>
      }
    >
      {() => <LabelsInner labels={labels} />}
    </ClientOnly>
  </div>
)

const LabelsInner = ({ labels }: { labels: string[] }) => {
  const containerEl = useRef<HTMLDivElement>(null)
  const { isOverflow } = useIsOverflow(containerEl)
  return (
    <div
      ref={containerEl}
      className="relative flex flex-shrink flex-wrap gap-1 overflow-hidden pr-8 text-tertiary"
    >
      {labels ? (
        labels.map((label) => (
          <Link key={label} to={`/?label=${label.trim()}`}>
            <Badge color="neutral">{label.trim()}</Badge>
          </Link>
        ))
      ) : (
        <div className="text-sans-md text-quaternary">-</div>
      )}

      {isOverflow && (
        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-mono-sm text-secondary">
          +
        </div>
      )}
    </div>
  )
}
