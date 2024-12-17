import { Editor, useMonaco } from '@monaco-editor/react'
import { shikiToMonaco } from '@shikijs/monaco'
import { useEffect } from 'react'
import { getHighlighter } from 'shiki'

import theme from './oxide-dark.json'

const EditorWrapper = ({
  body,
  onChange,
}: {
  body: string
  onChange: (string: string | undefined) => void
}) => {
  const monaco = useMonaco()

  useEffect(() => {
    if (!monaco) {
      return
    }

    const highlight = async () => {
      const highlighter = await getHighlighter({
        themes: [theme],
        langs: ['asciidoc'],
      })

      monaco.languages.register({ id: 'asciidoc' })
      shikiToMonaco(highlighter, monaco)
    }

    highlight()
  }, [monaco])

  return (
    <Editor
      value={body}
      onChange={onChange}
      theme="oxide-dark"
      language="asciidoc"
      options={{
        minimap: { enabled: false },
        fontFamily: 'GT America Mono',
        fontSize: 13,
        wordWrap: 'on',
        quickSuggestions: false,
        suggestOnTriggerCharacters: false,
        acceptSuggestionOnEnter: 'off',
        snippetSuggestions: 'none',
      }}
    />
  )
}

export default EditorWrapper
