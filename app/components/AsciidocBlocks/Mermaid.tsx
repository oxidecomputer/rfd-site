/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import mermaid from 'mermaid'
import { memo, useId, useState } from 'react'

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  fontFamily: 'SuisseIntl, -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif',
})

const Mermaid = memo(function Mermaid({ content }: { content: string }) {
  const [showSource, setShowSource] = useState(false)
  const id = `mermaid-diagram-${useId().replace(/:/g, '_')}`

  const mermaidRef = async (node: HTMLElement | null) => {
    if (node) {
      const { svg } = await mermaid.render(id, content)
      node.innerHTML = svg
    }
  }

  return (
    <>
      <button
        className="absolute right-2 top-2 text-mono-xs text-tertiary"
        onClick={() => setShowSource(!showSource)}
      >
        {showSource ? 'Hide' : 'Show'} Source <span className="text-quaternary">|</span>{' '}
        Mermaid
      </button>
      {!showSource ? <code ref={mermaidRef} className="w-full" /> : <code>{content}</code>}
    </>
  )
})

export default Mermaid
