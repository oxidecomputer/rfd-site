/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */
import type { ReactNode } from 'react'
import { create } from 'zustand'

export interface HoverCardState {
  /** Identity for the card. Changing it cross-fades between targets rather than
   *  sliding the same card to a new position. */
  key: string
  /** What to render inside the floating card. */
  content: ReactNode
  position: { left: number; top: number }
  /** The element the card is anchored to — used for the safe-polygon hit test. */
  anchor: HTMLElement
}

/**
 * The single floating card shown on hover of an RFD link, footnote, etc.
 * Triggers write to this store (see {@link useHoverCard}); the `HoverCard`
 * overlay subscribes to it. A store rather than DOM delegation means each
 * trigger manages its own hover state through ordinary React handlers.
 */
export const useHoverCardStore = create<{ card: HoverCardState | null }>(() => ({
  card: null,
}))

export const openHoverCard = (card: HoverCardState) => useHoverCardStore.setState({ card })

export const closeHoverCard = () => useHoverCardStore.setState({ card: null })
