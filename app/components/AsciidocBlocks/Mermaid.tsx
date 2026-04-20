/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import mermaid from 'mermaid'
import { memo, useEffect, useId, useRef, useState } from 'react'

import { useResolvedTheme } from '~/stores/theme'

const Mermaid = memo(function Mermaid({ content }: { content: string }) {
  const [showSource, setShowSource] = useState(false)
  const id = `mermaid-diagram-${useId().replace(/:/g, '_')}`
  const theme = useResolvedTheme()
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!ref.current || showSource) return
    mermaid.initialize({
      startOnLoad: false,
      theme: theme === 'light' ? 'default' : 'dark',
      fontFamily:
        'SuisseIntl, -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif',
    })
    mermaid.render(id, content).then(({ svg }) => {
      if (ref.current) ref.current.innerHTML = svg
    })
  }, [content, theme, id, showSource])

  return (
    <>
      <button
        className="text-mono-xs text-tertiary absolute top-2 right-2"
        onClick={() => setShowSource(!showSource)}
      >
        {showSource ? 'Hide' : 'Show'} Source <span className="text-quaternary">|</span>{' '}
        Mermaid
      </button>
      {!showSource ? <code ref={ref} className="w-full" /> : <code>{content}</code>}
    </>
  )
})

export default Mermaid
