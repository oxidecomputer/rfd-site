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
import { Fragment, useEffect, useRef } from 'react'
import { Link } from 'react-router'

import { closeRfdPreview, useRfdPreviewStore } from '~/stores/rfd-preview'

dayjs.extend(relativeTime)

const rfdLinkRegexes = [
  /#rfd[-_]?([0-9]{1,4})/i,
  /^https:\/\/rfd\.shared\.oxide\.computer\/rfd\/(\d+)/,
  /^https:\/\/([0-9]+)\.rfd\.oxide\.computer/,
  /(oxide).*rfd\/(\d+)/,
]

export function extractRfdNumber(href: string): number | null {
  for (const regex of rfdLinkRegexes) {
    const match = href.match(regex)?.at(-1)
    if (match) {
      const num = parseInt(match, 10)
      if (!Number.isNaN(num)) return num
    }
  }
  return null
}

// Gets offset top for nested elements
// e.g. anchors inside tables
export function calcOffset(element: HTMLAnchorElement | HTMLElement) {
  let el: HTMLAnchorElement | HTMLElement | null = element

  let x = el.offsetLeft
  let y = el.offsetTop

  while ((el = el.offsetParent as HTMLElement)) {
    if (el.nodeName === 'MAIN') {
      break
    }
    x += el.offsetLeft
    y += el.offsetTop
  }

  return { left: x, top: y }
}

const RfdPreview = ({ currentRfd }: { currentRfd: number }) => {
  const preview = useRfdPreviewStore((state) => state.preview)
  const previewRef = useRef<HTMLDivElement>(null)

  // Dismiss any open preview when navigating to a different RFD
  useEffect(() => closeRfdPreview, [currentRfd])

  useEffect(() => {
    if (!preview) return

    type Point = [number, number]
    type Polygon = Point[]

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
    const getPolygon = (anchorRect: DOMRect, floatingRect: DOMRect): Polygon => {
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
          yi >= y !== yj >= y && x <= ((xj - xi) * (y - yi)) / (yj - yi) + xi
        if (intersect) {
          isInside = !isInside
        }
      }
      return isInside
    }

    const handleMouseMove = (event: MouseEvent) => {
      if (!previewRef.current) return

      const cursor: Point = [event.clientX, event.clientY]
      const floatingRect = previewRef.current.getBoundingClientRect()
      const anchorRect = preview.anchor.getBoundingClientRect()

      const polygon = getPolygon(anchorRect, floatingRect)
      const isInside = isPointInPolygon(cursor, polygon)

      if (!isInside) {
        closeRfdPreview()
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [preview])

  if (!preview) return null

  const { title, number, state, latestMajorChangeAt, formattedNumber } = preview.rfd
  const authors = preview.rfd.authors || []

  return (
    <div
      ref={previewRef}
      className="shadow-tooltip bg-raise absolute z-10 mt-8 flex w-[24rem] rounded-lg p-3"
      style={{ top: preview.position.top, left: preview.position.left }}
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
                to={author.email ? `/?author=${encodeURIComponent(author.email)}` : ''}
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

export default RfdPreview
