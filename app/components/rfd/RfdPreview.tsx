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
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Fragment, useEffect, useRef } from 'react'
import { Link } from 'react-router'

import type { RfdListItem } from '~/services/rfd.server'
import { closeHoverCard, useHoverCardStore } from '~/stores/hover-card'

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

/** The body of the hover card for an RFD link: number, title, authors, state. */
export const RfdPreviewCard = ({ rfd }: { rfd: RfdListItem }) => {
  const { title, number, state, latestMajorChangeAt, formattedNumber } = rfd
  const authors = rfd.authors || []

  return (
    <div className="flex w-[22rem]">
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

const EASE_OUT = [0.165, 0.84, 0.44, 1] as const

/**
 * The single floating hover card. It renders whatever a trigger (RFD link,
 * footnote, …) put in the store, positioned under that trigger, and closes when
 * the cursor leaves the safe polygon between the trigger and the card.
 */
const HoverCard = ({ currentRfd }: { currentRfd: number }) => {
  const card = useHoverCardStore((state) => state.card)
  const cardRef = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()

  // Dismiss any open card when navigating to a different RFD
  useEffect(() => closeHoverCard, [currentRfd])

  useEffect(() => {
    if (!card) return

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
    // the floating card. Plus a buffer of 10px to avoid
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
      if (!cardRef.current) return

      const cursor: Point = [event.clientX, event.clientY]
      const floatingRect = cardRef.current.getBoundingClientRect()
      const anchorRect = card.anchor.getBoundingClientRect()

      const polygon = getPolygon(anchorRect, floatingRect)
      const isInside = isPointInPolygon(cursor, polygon)

      if (!isInside) {
        closeHoverCard()
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [card])

  return (
    card && (
      <motion.div
        // Re-key per target so hopping between links cross-fades rather than
        // sliding the same card to a new position.
        key={card.key}
        ref={cardRef}
        // `break-words` (inherited) wraps long, unbreakable URLs so they
        // can't overflow past `max-w`.
        className="shadow-tooltip bg-raise absolute z-10 mt-6 w-max max-w-[24rem] rounded-lg p-3 break-words"
        style={{
          top: card.position.top,
          left: card.position.left,
          // Grow from the anchored top-left corner (under the trigger), not center.
          transformOrigin: 'top left',
          willChange: 'transform, opacity',
        }}
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: -4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98, y: -4 }}
        transition={{
          duration: 0.18,
          ease: EASE_OUT,
          // Exits ~20% quicker than entrances feel right.
          opacity: { duration: 0.14, ease: EASE_OUT },
        }}
      >
        {card.content}
      </motion.div>
    )
  )
}

export default HoverCard
