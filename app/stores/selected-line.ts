/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */
import { create } from 'zustand'

export interface SelectionState {
  /**
   * The line number in the source file. Useful for sending comments to the
   * GitHub API.
   */
  lineNumber: number
  /**
   * The target of the _parent_ of the selection that has an actual line number
   * on it. This is superior to the literal selection because it shows the user
   * where the comment would land in GitHub.
   */
  numberedAnchor: HTMLElement
}

export const useSelectedLine = create<{ selection: SelectionState | null }>(() => ({
  selection: null,
}))

export const clearSelection = () => useSelectedLine.setState({ selection: null })
export const setSelection = (selection: SelectionState) =>
  useSelectedLine.setState({ selection })
