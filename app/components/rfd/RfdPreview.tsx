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
import { Link, useNavigate, useNavigation } from 'react-router'

import { useRootLoaderData } from '~/root'
import type { RfdListItem } from '~/services/rfd.server'

dayjs.extend(relativeTime)

interface Path {
  pathname: string
  search: string
  hash: string
}

type To = string | Partial<Path>

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

interface RfdPreviewState {
  rfd: RfdListItem
  position: { left: number; top: number }
  anchor: HTMLAnchorElement
}

interface RfdPreviewProps {
  currentRfd: number
  nodeRef: React.RefObject<HTMLElement | null>
}

const RfdPreview = ({ currentRfd, nodeRef }: RfdPreviewProps) => {
  const navigate = useNavigate()
  const navigation = useNavigation()
  const isNavigating = navigation.state !== 'idle'
  const { rfds } = useRootLoaderData()
  const [preview, setPreview] = useState<RfdPreviewState | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const previewRef = useRef<HTMLDivElement>(null)

  const clearHoverTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  useEffect(() => {
    setPreview(null)
  }, [currentRfd])

  useEffect(() => {
    const node = nodeRef.current
    if (!node) return

    const handleClick = (event: MouseEvent) => {
      if (!(event.target instanceof HTMLElement)) return

      const a = event.target.closest('a')

      if (
        a &&
        a.hasAttribute('href') &&
        event.button === 0 &&
        (!a.target || a.target === '_self') &&
        !(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey)
      ) {
        const href = a.getAttribute('href') || ''
        const rfdNum = extractRfdNumber(href)

        if (rfdNum !== null) {
          event.preventDefault()
          clearHoverTimeout()
          setPreview(null)
          const formattedNumber = rfdNum.toString().padStart(4, '0')
          navigate(`/rfd/${formattedNumber}`)
          return
        }

        if (a.host === window.location.host) {
          event.preventDefault()
          const { pathname, search, hash } = a
          navigate({ pathname, search, hash } as To)
        }
      }
    }

    const handleMouseOver = (event: MouseEvent) => {
      if (isNavigating) return
      if (!(event.target instanceof HTMLElement)) return

      const anchor = event.target.closest('a')
      if (!anchor) return

      const href = anchor.getAttribute('href') || ''
      const rfdNum = extractRfdNumber(href)

      if (rfdNum === null || rfdNum === currentRfd) return

      const matchedRfd = rfds.find((rfd) => rfd.number === rfdNum)
      if (!matchedRfd) return

      if (timeoutRef.current) return

      timeoutRef.current = setTimeout(() => {
        const offset = calcOffset(anchor)
        setPreview({
          rfd: matchedRfd,
          position: offset,
          anchor,
        })
        timeoutRef.current = null
      }, 125)
    }

    const handleMouseOut = (event: MouseEvent) => {
      if (!(event.target instanceof HTMLElement)) return

      const anchor = event.target.closest('a')
      if (anchor) {
        clearHoverTimeout()
      }
    }

    node.addEventListener('click', handleClick)
    node.addEventListener('mouseover', handleMouseOver)
    node.addEventListener('mouseout', handleMouseOut)

    return () => {
      node.removeEventListener('click', handleClick)
      node.removeEventListener('mouseover', handleMouseOver)
      node.removeEventListener('mouseout', handleMouseOut)
      clearHoverTimeout()
    }
  }, [navigate, nodeRef, currentRfd, rfds, clearHoverTimeout, isNavigating])

  useEffect(() => {
    if (!preview) return

    type Point = [number, number]
    type Polygon = Point[]

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
        setPreview(null)
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
      className="overlay-shadow bg-raise border-secondary absolute z-10 flex w-[24rem] rounded-lg border p-3"
      style={{ top: preview.position.top + 32, left: preview.position.left }}
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

export default RfdPreview
