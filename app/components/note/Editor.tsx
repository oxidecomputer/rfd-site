/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */
import { useIsEditorReady, useLiveblocksExtension } from '@liveblocks/react-tiptap'
import DragHandle from '@tiptap-pro/extension-drag-handle-react'
import Document from '@tiptap/extension-document'
import Dropcursor from '@tiptap/extension-dropcursor'
import HardBreak from '@tiptap/extension-hard-break'
import Paragraph from '@tiptap/extension-paragraph'
import Placeholder from '@tiptap/extension-placeholder'
import Text from '@tiptap/extension-text'
import { EditorContent, useEditor } from '@tiptap/react'
import { type Dispatch, type SetStateAction } from 'react'

import { DragCursor } from '../CustomIcons'
import EditorToolbar from './EditorToolbar'

const EditorWrapper = ({ onUpdate }: { onUpdate: Dispatch<SetStateAction<string>> }) => {
  const liveblocks = useLiveblocksExtension()
  const editorReady = useIsEditorReady()

  const editor = useEditor({
    extensions: [
      Dropcursor,
      Document,
      Paragraph,
      Text,
      HardBreak,
      Placeholder.configure({
        placeholder: 'Write something …',
      }),
      liveblocks,
    ],
    editorProps: {
      attributes: {
        class: 'h-full p-6 pl-8 focus:outline-none',
      },
      handlePaste: () => {}, // todo: fix newlines pasting
    },
    onUpdate: ({ editor }) => {
      onUpdate(editor.getText())
    },
  })

  if (!editorReady || !editor) {
    return null
  }

  return (
    <div className="relative flex h-full flex-col">
      <EditorToolbar editor={editor} />
      <EditorContent editor={editor} className="h-full overflow-scroll" />

      <DragHandle tippyOptions={{ offset: [0, 6] }} editor={editor}>
        <DragCursor className="text-quaternary" />
      </DragHandle>
    </div>
  )
}

export default EditorWrapper
