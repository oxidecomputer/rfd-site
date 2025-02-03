/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */
import { EditorState } from '@codemirror/state'
import { useRoom } from '@liveblocks/react/suspense'
import { LiveblocksYjsProvider } from '@liveblocks/yjs'
import { createTheme, type CreateThemeOptions } from '@uiw/codemirror-themes'
import { basicSetup, EditorView } from 'codemirror'
import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from 'react'
import { yCollab } from 'y-codemirror.next'
import * as Y from 'yjs'

import { getPresenceColor } from './Presence'

const themeSettings: CreateThemeOptions['settings'] = {
  background: 'var(--surface-raise)',
  foreground: 'var(--content-raise)',
  caret: 'var(--base-neutral-800)',
  selection: 'rgba(255, 255, 255, 0.1)',
  selectionMatch: 'rgba(255, 255, 255, 0.2)',
  gutterBackground: 'var(--base-neutral-200)',
  gutterForeground: 'var(--base-neutral-600)',
  gutterBorder: 'transparent',
  lineHighlight: 'rgba(255, 255, 255, 0.1)',
}

export const theme = (options?: Partial<CreateThemeOptions>) => {
  const { theme = 'dark' } = options || {}
  return createTheme({
    theme: theme,
    settings: {
      ...themeSettings,
    },
    styles: [],
  })
}

const EditorWrapper = ({
  userId,
  userName,
  onUpdate,
}: {
  userId: string
  userName: string
  onUpdate: Dispatch<SetStateAction<string>>
}) => {
  const room = useRoom()
  const [element, setElement] = useState<HTMLElement>()

  const ref = useCallback((node: HTMLElement | null) => {
    if (!node) return
    setElement(node)
  }, [])

  useEffect(() => {
    let provider: LiveblocksYjsProvider<any, any, any, any>
    let ydoc: Y.Doc
    let view: EditorView

    if (!element || !room) {
      return
    }

    ydoc = new Y.Doc()
    provider = new LiveblocksYjsProvider(room as any, ydoc)
    const ytext = ydoc.getText('codemirror')
    const undoManager = new Y.UndoManager(ytext)

    const { fg } = getPresenceColor(userId)

    provider.awareness.setLocalStateField('user', {
      name: userName,
      color: fg,
    })

    const state = EditorState.create({
      doc: ytext.toString(),
      extensions: [
        basicSetup,
        yCollab(ytext, provider.awareness, { undoManager }),
        theme(),
        EditorView.lineWrapping,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onUpdate(update.state.doc.toString())
          }
        }),
      ],
    })

    view = new EditorView({
      state,
      parent: element,
    })

    return () => {
      ydoc?.destroy()
      provider?.destroy()
      view?.destroy()
    }
  }, [element, room, onUpdate, userName, userId])

  return <div ref={ref} className="h-full" />
}

export default EditorWrapper
