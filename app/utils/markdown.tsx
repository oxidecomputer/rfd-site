/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import { marked } from 'marked'
import { renderToString } from 'react-dom/server'
import diff from 'simple-text-diff'

export function parseMarkdownText(text: string, isOverlay: boolean, original: string) {
  const renderer = {
    code({ text, lang }: { text: string; lang?: string }) {
      const langString = (lang || '').match(/\S*/)?.[0] || ''
      const _code = text.replace(/\n$/, '') + '\n'

      if (langString === 'suggestion') {
        return renderToString(
          <CodeSuggestion original={original} suggestion={_code} isOverlay={isOverlay} />,
        )
      }

      const cls = langString ? `class="lang-${langString}"` : ''

      return `<pre><code ${cls}>${_code}</code></pre>\n`
    },
  }

  marked.use({ renderer })

  try {
    return marked.parse(text)
  } catch (error) {
    console.error(`Failed to parse markdown: ${error}`)
    return '<span>Failed to parse comment</span>'
  }
}

const CodeSuggestion = ({
  original,
  suggestion,
  isOverlay,
}: {
  original: string
  suggestion: string
  isOverlay: boolean
}) => {
  const textDiff = diff.diffPatchBySeparator(original, suggestion, ' ')
  return (
    <div
      className={cn(
        'text-raise border-secondary overflow-hidden rounded-lg border',
        isOverlay ? 'bg-default' : 'bg-raise',
      )}
    >
      <div className="text-mono-xs text-tertiary border-b-secondary w-full border-b px-2 py-2">
        Suggestion
      </div>
      <CodeLine change="remove" code={textDiff.before} />
      <CodeLine change="add" code={textDiff.after} />
    </div>
  )
}
