import { Editor, useMonaco } from '@monaco-editor/react'
import { shikiToMonaco } from '@shikijs/monaco'
import { useEffect } from 'react'
import { getHighlighter } from 'shiki'

// import asciidocLang from './asciidoc-lang.json'
import theme from './oxide-dark.json'

const EditorWrapper = ({
  body,
  onChange,
}: {
  body: string
  onChange: (string) => void
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
      theme="vs-dark"
      language="asciidoc"
      options={{ minimap: { enabled: false }, fontFamily: 'GT America Mono', fontSize: 13 }}
    />
  )
}

export default EditorWrapper

// import loader from '@monaco-editor/loader'
// import { shikiToMonaco } from '@shikijs/monaco'
// import { type editor } from 'monaco-editor'
// import type * as Monaco from 'monaco-editor/esm/vs/editor/editor.api'
// import { useCallback, useEffect, useRef, useState } from 'react'
// import { getHighlighter } from 'shiki'

// const Editor = () => {
//   const containerRef = useRef<HTMLDivElement>(null)
//   const monacoRef = useRef<typeof Monaco | null>(null)
//   const [isMonacoMounting, setIsMonacoMounting] = useState(true)
//   const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
//   const preventCreation = useRef(false)
//   const [isEditorReady, setIsEditorReady] = useState(false)

//   useEffect(() => {
//     const cancelable = loader.init()

//     cancelable
//       .then((monaco) => (monacoRef.current = monaco) && setIsMonacoMounting(false))
//       .catch(
//         (error) =>
//           error?.type !== 'cancelation' &&
//           console.error('Monaco initialization: error:', error),
//       )

//     return () => (editorRef.current ? editorRef.current!.dispose() : cancelable.cancel())
//   }, [containerRef])

//   const createEditor = useCallback(() => {
//     if (!containerRef.current || !monacoRef.current) return
//     if (!preventCreation.current) {
//       editorRef.current = monacoRef.current?.editor.create(containerRef.current, {
//         automaticLayout: true,
//       })

//       monacoRef.current.editor.setTheme('vs-dark')

//       setIsEditorReady(true)
//       preventCreation.current = true
//     }
//   }, [])

//   useEffect(() => {
//     !isMonacoMounting && !isEditorReady && createEditor()
//   }, [isMonacoMounting, isEditorReady, createEditor])

//   console.log(monacoRef, containerRef)

//   return (
//     <div className="h-full w-full">
//       <div ref={containerRef} className="h-full w-full" />
//     </div>
//   )
// }

// export default Editor
