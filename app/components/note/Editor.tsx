/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */
import { EditorView } from '@codemirror/view'
import { createTheme, type CreateThemeOptions } from '@uiw/codemirror-themes'
import CodeMirror from '@uiw/react-codemirror'

const themeSettings: CreateThemeOptions['settings'] = {
  background: 'var(--surface-raise)',
  foreground: 'var(--content-default)',
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
  body,
  onChange,
}: {
  body: string
  onChange: (string: string | undefined) => void
}) => {
  return (
    <CodeMirror
      value={body}
      onChange={onChange}
      extensions={[
        EditorView.theme({
          '&': {
            fontSize: '13px',
            fontFamily: 'GT America Mono',
          },
          '.cm-line': {
            paddingLeft: '12px',
          },
          '.cm-content': {
            paddingTop: '8px',
            paddingBottom: '8px',
          },
        }),
        EditorView.lineWrapping,
      ]}
      theme={theme()}
      basicSetup={{
        lineNumbers: true,
        highlightActiveLine: true,
        foldGutter: false,
        dropCursor: true,
        allowMultipleSelections: true,
        indentOnInput: true,
        bracketMatching: true,
        closeBrackets: true,
        autocompletion: false,
      }}
      className="h-full"
    />
  )
}

export default EditorWrapper
