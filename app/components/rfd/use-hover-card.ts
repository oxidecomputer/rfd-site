/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */
import { useEffect, useRef, type ReactNode } from 'react'
import { useNavigation } from 'react-router'

import { calcOffset } from '~/components/rfd/RfdPreview'
import { closeHoverCard, openHoverCard } from '~/stores/hover-card'

const HOVER_DELAY = 125

/**
 * Hover-intent wiring for an inline element (an RFD link, a footnote marker,
 * …) that opens a floating hover card after a short delay. `getCard` runs on
 * hover-in and returns the card's identity + body, or `null` to suppress it.
 * Returns a ref to put on the trigger plus the handlers to spread onto it, so
 * each trigger owns its hover state — no document-wide event delegation.
 */
export function useHoverCard<T extends HTMLElement>(
  getCard: () => { key: string; content: ReactNode } | null,
) {
  const ref = useRef<T>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const navigation = useNavigation()

  const clearHoverTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }

  useEffect(() => clearHoverTimeout, [])

  const onMouseEnter = () => {
    if (navigation.state !== 'idle' || timeoutRef.current) return

    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null
      const anchor = ref.current
      const card = anchor && getCard()
      if (anchor && card) {
        openHoverCard({ ...card, position: calcOffset(anchor), anchor })
      }
    }, HOVER_DELAY)
  }

  return { ref, onMouseEnter, onMouseLeave: clearHoverTimeout, onClick: closeHoverCard }
}
