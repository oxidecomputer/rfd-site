/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import { Dialog, DialogDismiss } from '@ariakit/react'
import {
  instantMeiliSearch,
  type AlgoliaMultipleQueriesQuery,
  type InstantMeiliSearchInstance,
} from '@meilisearch/instant-meilisearch'
import { Link, useNavigate } from '@remix-run/react'
import { useQuery } from '@tanstack/react-query'
import cn from 'classnames'
import dayjs from 'dayjs'
import type { BaseHit, Hit } from 'instantsearch.js'
import { createRef, Fragment, useEffect, useRef, useState } from 'react'
import {
  Configure,
  Highlight,
  InstantSearch,
  Snippet,
  useHits,
  useSearchBox,
} from 'react-instantsearch'

import Icon from '~/components/Icon'
import StatusBadge from '~/components/StatusBadge'
import { useSteppedScroll } from '~/hooks/use-stepped-scroll'
import type { RfdItem } from '~/services/rfd.server'

const Search = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  let searchClient = useRef<InstantMeiliSearchInstance>()

  useEffect(() => {
    const client: InstantMeiliSearchInstance = instantMeiliSearch(
      'https://search.rfd.shared.oxide.computer',
    )

    // Overriding search function to implement our custom search backend. We provide a search route
    // that proxies out to the RFD API search endpoint. This route accepts slightly different
    // argument names compared to those provided by instant-search directly.
    //
    // Additionally we are adding short circuiting logic so that we do not perform search requests
    // until N characters have been submitted
    // https://www.algolia.com/doc/guides/building-search-ui/going-further/conditional-requests/react/#implementing-a-proxy
    searchClient.current = {
      ...client,

      // We cheat with the any type here so that we do not need to bother with the extensive fields
      // that are required by the response type
      search: async function search(
        requests: readonly AlgoliaMultipleQueriesQuery[],
      ): Promise<{ results: any[] }> {
        // If the query is too short, immediately return empty results
        if (
          requests.every(
            ({ params }) => !params || !params.query || params.query?.length < 3,
          )
        ) {
          return Promise.resolve({
            results: requests.map(() => ({
              hits: [],
              nbHits: 0,
              nbPages: 0,
              page: 0,
              processingTimeMS: 0,
            })),
          })
        }

        // Otherwise take the incoming instant-search request and transform it into a request that
        // can be sent to our search route. The search route will then forward this request on to
        // the RFD API backend
        const request = requests[0]
        return fetch(
          `/search?q=${
            request.params?.query
          }&attributesToCrop=${request.params?.attributesToSnippet?.join(
            ',',
          )}&highlightPostTag=${
            request.params?.highlightPostTag
          }&highlightPreTag=${request.params?.highlightPreTag}`,
        ).then(async (resp) => {
          const data = await resp.json()
          return data
        })
      },
    }
  }, [])

  if (searchClient.current) {
    return (
      <>
        <Dialog
          open={open}
          onClose={onClose}
          className="overlay-shadow fixed left-1/2 top-4 z-20 w-[calc(100%-2.5rem)] -translate-x-1/2 rounded-lg border p-0 bg-raise border-secondary 600:top-[calc(10%+var(--header-height))] 600:w-[calc(100%-5rem)] 1000:w-[820px]"
          aria-label="Search"
          backdrop={<div className="backdrop" />}
        >
          <InstantSearch searchClient={searchClient.current} indexName="rfd">
            <Configure attributesToSnippet={['content:15']} />
            <SearchWrapper
              dismissSearch={onClose}
              // nuke the whole thing on state toggle, most importantly clearing the input state
            />
          </InstantSearch>
        </Dialog>
      </>
    )
  }

  return null
}

const SearchWrapper = ({ dismissSearch }: { dismissSearch: () => void }) => {
  const navigate = useNavigate()

  const { items, results } = useHits()

  const [selectedIdx, setSelectedIdx] = useState(0)

  useEffect(() => {
    // Whenever number of groups changes ensure the index is not more than that
    setSelectedIdx((s) => (s > items.length ? items.length : s))
  }, [items])

  // Remove items without content
  const hitsWithoutEmpty = items.filter((hit) => hit.content !== '')

  // Group hits
  const groupedHits = groupBy(hitsWithoutEmpty as RFDHit[], (hit) => hit.rfd_number)

  // Score hits
  let scores: [number, number][] = []
  Object.values(groupedHits).forEach((group) => {
    let sum = 0

    group.forEach((item) => {
      sum += Math.pow(item.__position, 2)
    })

    scores.push([group[0].rfd_number, Math.sqrt(sum) / group.length])
  })

  scores = scores.sort((a, b) => a[1] - b[1])

  // Flatten using scores for order
  let flattenedHits: RFDHit[] = []
  scores.forEach((score) => {
    flattenedHits.push(...groupedHits[score[0]])
  })

  const noMatches =
    results &&
    results.query !== '' &&
    results.query !== undefined &&
    results.query !== null &&
    hitsWithoutEmpty.length === 0

  return (
    <div
      onKeyDown={(e) => {
        const lastIdx = hitsWithoutEmpty.length - 1
        if (e.key === 'Enter') {
          const selectedItem = flattenedHits[selectedIdx]
          if (!selectedItem) return
          navigate(`/rfd/${selectedItem.rfd_number}#${selectedItem.anchor}`)
          // needed despite key={pathname + hash} logic in case we navigate
          // to the page we're already on
          dismissSearch()
        } else if (e.key === 'ArrowDown') {
          const newIdx = selectedIdx < lastIdx ? selectedIdx + 1 : 0
          setSelectedIdx(newIdx)
          e.preventDefault() // Prevent it from moving input cursor
        } else if (e.key === 'ArrowUp') {
          const newIdx = selectedIdx === 0 ? lastIdx : selectedIdx - 1
          setSelectedIdx(newIdx)
          e.preventDefault()
        }
      }}
      role="combobox"
      tabIndex={-1}
      aria-controls="TODO"
      aria-expanded
      className="group"
    >
      <div
        className={cn(
          'flex h-12 items-center focus-visible:outline-none 600:h-16',
          (items.length > 0 || noMatches) && 'border-b border-b-secondary',
        )}
      >
        <SearchBox />

        <button
          className="hover:bg-raise-hover block h-full border-l px-4 text-mono-sm text-secondary border-l-secondary"
          onClick={dismissSearch}
        >
          <span className="hidden 600:block">Dismiss</span>
          <Icon name="close" size={12} className="block text-tertiary 600:hidden" />
        </button>
      </div>

      {(items.length > 0 || noMatches) && (
        <>
          <div className="flex h-[60vh] overflow-hidden 600:h-[32rem]">
            {noMatches ? (
              <div className="flex h-full w-full flex-col items-center justify-center py-12 600:py-0">
                <div className="mb-4 rounded p-1 bg-accent-secondary">
                  <Icon name="search" size={16} className="text-accent" />
                </div>
                <div className="text-secondary">
                  No results for “
                  <span className="text-sans-lg text-default">{results.query}</span>”
                </div>
              </div>
            ) : (
              <SearchResponse
                hasHits={items.length > 0}
                hits={flattenedHits}
                selectedIdx={selectedIdx}
              />
            )}
          </div>

          <div className="hidden justify-between rounded-b-lg px-4 py-2 text-default bg-tertiary 600:flex">
            <ActionMenuHotkey keys={['Enter']} action="submit" />
            <ActionMenuHotkey keys={['Arrow Up', 'Arrow Down']} action="select" />
            <ActionMenuHotkey keys={['Esc']} action="close" />
          </div>
        </>
      )}
    </div>
  )
}

const SearchBox = () => {
  const { refine } = useSearchBox()
  // can't use query and refine directly as value/onChange because `refine`
  // seems to block — it can't take input fast enough
  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    refine(inputValue)
  }, [refine, inputValue])

  return (
    <div className="relative w-full">
      <input
        ref={inputRef}
        value={inputValue}
        onChange={(event) => setInputValue(event.currentTarget.value)}
        autoFocus
        className="w-full bg-transparent px-4 text-sans-lg text-raise focus:!outline-none 600:text-sans-2xl"
        placeholder="Search RFD contents"
      />
      {inputValue !== '' && (
        <button
          className="absolute right-0 top-1/2 hidden -translate-y-1/2 p-4 600:block"
          onClick={() => setInputValue('')}
        >
          <Icon name="close" size={12} className="text-tertiary" />
        </button>
      )}
    </div>
  )
}

type RFDHit = Hit<BaseHit> & {
  anchor: string
  hierarchy_lvl0: string
  hierarchy_lvl1: string
  hierarchy_lvl2: string
  hierarchy_lvl3: string
  rfd_number: number
}

// Used to groups results by RFD
const groupBy = <T, K extends keyof any>(arr: T[], key: (i: T) => K) =>
  arr.reduce(
    (groups, item) => {
      const k = key(item)

      if (!groups[k]) {
        groups[k] = []
      }

      groups[k].push(item)

      return groups
    },
    {} as Record<K, T[]>,
  )

const SearchResponse = ({
  hasHits,
  hits,
  selectedIdx,
}: {
  hasHits: boolean
  hits: RFDHit[]
  selectedIdx: number
}) => {
  if (hasHits) {
    return (
      <>
        <Hits data={hits} selectedIdx={selectedIdx} />
        {hits[selectedIdx].rfd_number && (
          <RFDPreview number={hits[selectedIdx].rfd_number} />
        )}
      </>
    )
  }

  return null
}

const Hits = ({ data, selectedIdx }: { data: RFDHit[]; selectedIdx: number }) => {
  let prevRFD = -1

  const divRef = createRef<HTMLDivElement>()
  const ulRef = createRef<HTMLUListElement>()

  useSteppedScroll(divRef, ulRef, selectedIdx)

  return (
    <div
      className="h-full w-full overflow-y-auto border-r bg-secondary border-r-secondary 600:w-1/2"
      ref={divRef}
    >
      <ul ref={ulRef}>
        {data.map((hit, index) => {
          const isNewSection = hit.rfd_number !== prevRFD
          const sectionIsSelected = data[selectedIdx].rfd_number === hit.rfd_number
          prevRFD = hit.rfd_number

          return (
            <Fragment key={hit.objectID}>
              {isNewSection && (
                <h3
                  className={cn(
                    'line-clamp-1 h-6 rounded-t-sm px-3 !leading-6 text-mono-xs text-secondary bg-tertiary',
                    sectionIsSelected && '600:!text-inverse 600:!bg-accent',
                  )}
                >
                  {hit.hierarchy_lvl0}
                </h3>
              )}
              <HitItem hit={hit} isSelected={selectedIdx === index} />
            </Fragment>
          )
        })}
      </ul>
    </div>
  )
}

const HitItem = ({ hit, isSelected }: { hit: RFDHit; isSelected: boolean }) => {
  const subTitleAttribute = hit.hierarchy_lvl2 ? 'hierarchy_lvl2' : 'hierarchy_lvl1'

  return (
    <div className="relative border-b border-b-secondary">
      {isSelected && (
        <div
          className={cn(
            'pointer-events-none absolute top-0 z-20 hidden h-[calc(100%+1px)] w-full rounded-b-sm border border-accent 600:block',
          )}
        />
      )}
      <Link to={`/rfd/${hit.rfd_number}#${hit.anchor}`} className="block" prefetch="intent">
        <li
          className={cn(
            'px-4 py-4',
            isSelected ? '600:rounded-md 600:bg-accent-secondary' : '',
          )}
        >
          <DialogDismiss className="text-left text-sans-sm">
            <div>
              <Highlight
                attribute={subTitleAttribute}
                hit={hit}
                nonHighlightedTagName="span"
                highlightedTagName="span"
                classNames={{
                  root: `break-words ${
                    isSelected ? '600:text-accent-tertiary' : '600:text-secondary'
                  }`,
                  highlighted: isSelected ? 'text-accent 600:underline' : 'text-accent',
                  nonHighlighted: isSelected ? '600:text-accent' : 'text-default',
                }}
              />
            </div>
            <Snippet
              attribute={'content'}
              hit={hit}
              nonHighlightedTagName="span"
              highlightedTagName="span"
              classNames={{
                root: `break-words line-clamp-2 ${
                  isSelected ? '600:text-accent-tertiary' : '600:text-secondary'
                }`,
                highlighted: isSelected ? 'text-accent 600:underline' : 'text-accent',
                nonHighlighted: isSelected
                  ? 'text-secondary 600:text-accent-tertiary'
                  : 'text-secondary',
              }}
            />
          </DialogDismiss>
        </li>
      </Link>
    </div>
  )
}

const fetchRFD = (number: number) => {
  return fetch(`/rfd/${number}/fetch`, {
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then((response) => response.json())
    .catch((err) => console.log(err))
}

const RFDPreview = ({ number }: { number: number }) => {
  // Requests are cached with React Query
  const query = useQuery(['rfd', number], () => fetchRFD(number), {
    staleTime: 30000,
    enabled: !!number,
  })

  const rfd: RfdItem | null = query.data as RfdItem

  return (
    <div className="hidden h-full w-1/2 overflow-scroll 600:block">
      {rfd ? (
        <>
          <div className="flex h-6 items-center border-b px-3 text-mono-xs border-b-secondary">
            <div className="text-quaternary">Updated:</div>
            <div className="ml-1 text-default">
              {dayjs(rfd.latestMajorChangeAt).format('YYYY/MM/DD h:mm A')}
            </div>
          </div>

          <div className="flex w-full flex-col items-start p-6">
            {rfd.state && <StatusBadge label={rfd.state} />}
            <div className="mt-2 !text-[32px] !leading-[1.15] text-sans-3xl text-raise">
              {rfd.title}
            </div>
            <ul className="mt-6 w-full">
              {rfd.toc &&
                rfd.toc.map(
                  (item) =>
                    item.level === 1 && (
                      <div className="w-full border-b py-2 border-b-default" key={item.id}>
                        <Link
                          to={`/rfd/${rfd.number}#${item.id}`}
                          className="block"
                          prefetch="intent"
                        >
                          <DialogDismiss className="text-left">
                            <li
                              className="text-sans-sm text-default hover:text-default children:!text-sans-sm"
                              dangerouslySetInnerHTML={{ __html: item.title }}
                            />
                          </DialogDismiss>
                        </Link>
                      </div>
                    ),
                )}
            </ul>
          </div>
        </>
      ) : (
        <>
          <div className="flex h-6 items-center border-b px-3 text-mono-xs border-b-secondary">
            <div className="h-3 w-[180px] rounded bg-tertiary" />
          </div>

          <div className="flex w-full flex-col items-start p-6">
            <div className="h-4 w-[65px] rounded bg-tertiary" />
            <div className="mt-2 h-6 w-[200px] rounded bg-tertiary" />
            <ul className="mt-6 w-full">
              <li className="mb-2 h-6 w-full rounded bg-tertiary" />
              <li className="mb-2 h-6 w-full rounded bg-tertiary" />
              <li className="mb-2 h-6 w-full rounded bg-tertiary" />
              <li className="mb-2 h-6 w-full rounded bg-tertiary" />
              <li className="mb-2 h-6 w-full rounded bg-tertiary" />
            </ul>
          </div>
        </>
      )}
    </div>
  )
}

interface ActionMenuHotkeyProps {
  keys: Array<string>
  action: string
}

export const ActionMenuHotkey = ({ keys, action }: ActionMenuHotkeyProps) => (
  <div>
    <div className="mr-1 inline-block">
      {keys.map((hotkey) => (
        <kbd
          key={hotkey}
          className="mr-1 inline-block rounded px-2 py-1 text-mono-xs text-default bg-secondary"
        >
          {hotkey}
        </kbd>
      ))}
    </div>
    <span className="text-sans-sm text-secondary">to {action}</span>
  </div>
)

export default Search
