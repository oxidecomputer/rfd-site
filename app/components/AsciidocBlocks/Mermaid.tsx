/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import mermaid from 'mermaid'
import { useEffect, useId, useState } from 'react'

mermaid.initialize({
  startOnLoad: false,
  // @ts-ignore The types are wrong here. Base is available and is what's required for theming
  theme: 'base',
  themeVariables: {
    darkMode: true,
    background: '#080F11',
    primaryColor: '#1C2225',
    primaryTextColor: '#E7E7E8',
    primaryBorderColor: '#238A5E',
    fontFamily:
      'SuisseIntl, -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif',
    lineColor: '#7E8385',
  },
  flowchart: {
    curve: 'cardinal',
  },
})

const Mermaid = ({ content }: { content: string }) => {
  const [html, setHtml] = useState<string>('')
  const [showSource, setShowSource] = useState(false)
  const id = `mermaid-diagram-${useId().replace(/:/g, '_')}`

  useEffect(() => {
    const renderMermaid = async () => {
      const { svg } = await mermaid.render(id, content)
      setHtml(svg)
    }
    renderMermaid()
  }, [id, content, setHtml])

  return (
    <>
      <button
        className="absolute right-2 top-2 text-mono-xs text-tertiary"
        onClick={() => setShowSource(!showSource)}
      >
        {showSource ? 'Hide' : 'Show'} Source <span className="text-quinary">|</span>{' '}
        Mermaid
      </button>
      {html && !showSource ? (
        <code className="w-full" dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        <code>{content}</code>
      )}
    </>
  )
}

export default Mermaid
