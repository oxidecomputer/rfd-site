/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import cn from 'classnames'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'

import { useRootLoaderData } from '~/root'
import type { RfdListItem } from '~/services/rfd.server'

dayjs.extend(relativeTime)

const regexes = [
  /#rfd[-_]?([0-9]{1,4})/,
  /^https:\/\/rfd\.shared\.oxide\.computer\/rfd\/(\d+)/,
  /^https:\/\/([0-9]+)\.rfd\.oxide\.computer/,
  /(oxide).*rfd\/(\d+)/,
]

// Gets offset top for nested elements
// e.g. anchors inside tables
export function calcOffset(element: HTMLAnchorElement | HTMLElement) {
  let el: HTMLAnchorElement | HTMLElement | null = element

  let x = el.offsetLeft
  let y = el.offsetTop

  while ((el = el.offsetParent as HTMLElement)) {
    // We want to stop when we reach the parent to the <RfdPreview /> element
    if (el.nodeName === 'MAIN') {
      break
    }
    x += el.offsetLeft
    y += el.offsetTop
  }

  return { left: x, top: y }
}

const RfdPreview = ({ currentRfd }: { currentRfd: number }) => {
  const [rfdPreview, setRfdPreview] = useState<RfdListItem | null>(null)
  const [rfdAnchor, setRfdAnchor] = useState<HTMLAnchorElement | null>(null)
  const [rfdPreviewPos, setRfdPreviewPos] = useState<{ left: number; top: number }>({
    left: 0,
    top: 0,
  })
  const { rfds } = useRootLoaderData()

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const showRfdHover = useCallback(
    (e: MouseEvent, href: string) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      const showRfdPreview = () => {
        const el = e.target as HTMLAnchorElement // making a little assumption here
        let hrefMatch: string | null = null

        for (const regex of regexes) {
          const match = href.match(regex)?.at(-1)

          if (match) {
            hrefMatch = match
            break
          }
        }

        const rfdNum = hrefMatch ? parseInt(hrefMatch, 10) : null
        if (!rfdNum || Number.isNaN(rfdNum) || rfdNum === currentRfd) return // sort of validate that assumption

        const matchedRfd = rfds.find((rfd) => rfd.number === rfdNum)
        if (!matchedRfd) return

        const offset = calcOffset(el)

        setRfdPreview(matchedRfd)
        setRfdPreviewPos({ left: offset.left, top: offset.top })
        setRfdAnchor(el)
      }

      // Adds a delay of 125ms before opening the preview
      // Avoids opening accidentally as a user scans through the text
      timeoutRef.current = setTimeout(showRfdPreview, 125)
    },
    [rfds, currentRfd],
  )

  const floatingEl = useRef<HTMLDivElement>(null)

  type Point = [number, number]
  type Polygon = Point[]

  const handleHover = useCallback(
    (event: MouseEvent) => {
      if (!rfdAnchor || !floatingEl || !floatingEl.current) {
        return
      }

      // 1┌────────────┐2
      //  └────────────┘\
      //  |              \
      //  ┌───────────────┐3
      //  │               │
      // 5└───────────────┘4
      //
      // Returns a set of points for each corner of a polygon
      // that the cursor can safely be within without closing
      // the floating preview. Plus a buffer of 10px to avoid
      // it being too sensitive
      const getPolygon = (anchorRect: DOMRect, floatingRect: DOMRect): Array<Point> => {
        const buffer = 10
        const p1: Point = [anchorRect.left - buffer, anchorRect.top - buffer]
        const p2: Point = [
          anchorRect.left + anchorRect.width + buffer,
          anchorRect.top + anchorRect.height - buffer,
        ]
        const p3: Point = [
          floatingRect.left + floatingRect.width + buffer,
          floatingRect.top - buffer,
        ]
        const p4: Point = [
          floatingRect.left + floatingRect.width + buffer,
          floatingRect.top + floatingRect.height + buffer,
        ]
        const p5: Point = [
          floatingRect.left - buffer,
          floatingRect.top + floatingRect.height + buffer,
        ]
        return [p1, p2, p3, p4, p5]
      }

      const isPointInPolygon = (point: Point, polygon: Polygon) => {
        const [x, y] = point
        let isInside = false
        const length = polygon.length
        for (let i = 0, j = length - 1; i < length; j = i++) {
          const [xi, yi] = polygon[i] || [0, 0]
          const [xj, yj] = polygon[j] || [0, 0]
          const intersect =
            // prettier-ignore
            (yi >= y) !== (yj >= y) && x <= ((xj - xi) * (y - yi)) / (yj - yi) + xi
          if (intersect) {
            isInside = !isInside
          }
        }
        return isInside
      }

      const cursor: Point = [event.clientX, event.clientY]
      const floatingRect = floatingEl.current.getBoundingClientRect()
      const anchorRect = rfdAnchor.getBoundingClientRect()

      const polygon: Polygon = getPolygon(anchorRect, floatingRect)

      const isInside = isPointInPolygon(cursor, polygon)

      if (!isInside) {
        setRfdPreview(null)
        window.removeEventListener('mousemove', handleHover)
      }
    },
    [rfdAnchor],
  )

  useEffect(() => {
    if (!rfdPreview) {
      return
    }

    window.addEventListener('mousemove', handleHover)
    return () => window.removeEventListener('mousemove', handleHover)
  }, [rfdPreview, handleHover])

  useEffect(() => {
    const links = document.querySelectorAll<HTMLAnchorElement>('.asciidoc-body#content a')

    function handleClearTimeout() {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }

    const removes: (() => void)[] = []

    links.forEach((el) => {
      const showHover = (e: MouseEvent) => showRfdHover(e, el.href)
      el.addEventListener('mouseover', showHover)
      el.addEventListener('mouseout', handleClearTimeout)
      removes.push(() => {
        el.removeEventListener('mouseover', showHover)
        el.removeEventListener('mouseout', handleClearTimeout)
      })
    })

    return () => removes.forEach((remove) => remove())
  }, [showRfdHover])

  if (!rfdPreview) return null

  const { title, number, state, latestMajorChangeAt, formattedNumber } = rfdPreview
  const authors = rfdPreview.authors || []
  return (
    <div
      ref={floatingEl}
      className="overlay-shadow bg-raise border-secondary absolute z-10 mt-8 flex w-[24rem] rounded-lg border p-3"
      style={{ top: rfdPreviewPos.top, left: rfdPreviewPos.left }}
    >
      <Link
        prefetch="intent"
        to={`/rfd/${formattedNumber}`}
        className="text-sans-lg text-accent-tertiary hover:text-accent-secondary mr-2 block"
      >
        {number}
      </Link>
      <div>
        <Link
          prefetch="intent"
          to={`/rfd/${formattedNumber}`}
          className="text-sans-lg hover:text-default mb-1 block"
        >
          {title}
        </Link>
        <div className="text-sans-sm text-tertiary">
          {authors.map((author, index) => (
            <Fragment key={author.name}>
              <Link
                className={cn(
                  'hover:text-default inline-block',
                  !author.email && 'pointer-events-none',
                )}
                to={
                  author.email
                    ? `/?authorEmail=${author.email}&authorName=${author.name}`
                    : ''
                }
              >
                {author.name}
              </Link>
              {index < authors.length - 1 && ', '}
            </Fragment>
          ))}
        </div>
        <div className="text-sans-sm text-tertiary flex space-x-1">
          {state && <div>{state.charAt(0).toUpperCase() + state.slice(1)}</div>}
          <span className="text-quaternary">•</span>
          <div>{dayjs(latestMajorChangeAt).fromNow()}</div>
        </div>
      </div>
    </div>
  )
}

export type Author = {
  name: string
  email: string
}

export const generateAuthors = (authors: string): Author[] => {
  // Officially asciidoc uses the semicolon for multiple authors
  // we are using commas in most the documents I have seen
  // chose to parse both rather than update the RFDs since that would
  // be tedious work for little gain. This does means that a user cannot
  // mix both methods. But what kind of person would do such a thing.
  let splitChar = ','

  if (authors.includes(';')) {
    splitChar = ';'
  }

  const array = authors.split(splitChar).map((author) => {
    const regex = /<(.+)>/
    const matches = author.match(regex)
    const name = author.replace(regex, '').trim()
    const email = matches ? matches[1] : ''

    return { name, email }
  })

  // Remove extra items
  // Fixes empty item when a single author has a ; or , at the end
  return array.filter((author) => author.name !== '')
}

export default RfdPreview
