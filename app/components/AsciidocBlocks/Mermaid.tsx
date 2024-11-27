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
  theme: 'dark',
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
