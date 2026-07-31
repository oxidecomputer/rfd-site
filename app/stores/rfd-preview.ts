/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */
import { create } from 'zustand'

import type { RfdListItem } from '~/services/rfd.server'

export interface RfdPreviewState {
  rfd: RfdListItem
  position: { left: number; top: number }
  anchor: HTMLAnchorElement
}

/**
 * Holds the RFD link that is currently being previewed on hover. Anchors
 * rendered inside the document (see the `anchor` inline override) write to
 * this store, and the single `RfdPreview` overlay subscribes to it. Using a
 * store rather than DOM event delegation means each link manages its own hover
 * state through ordinary React handlers.
 */
export const useRfdPreviewStore = create<{ preview: RfdPreviewState | null }>(() => ({
  preview: null,
}))

export const openRfdPreview = (preview: RfdPreviewState) =>
  useRfdPreviewStore.setState({ preview })

export const closeRfdPreview = () => useRfdPreviewStore.setState({ preview: null })
