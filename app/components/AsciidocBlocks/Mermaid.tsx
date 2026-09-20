/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import * as Ariakit from '@ariakit/react'
import { buttonStyle } from '@oxide/design-system/ui'
import mermaid from 'mermaid'
import {
  memo,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from 'react'

import { useResolvedTheme } from '~/stores/theme'

const ZOOM_STEP = 25

function parseSvgNaturalDims(
  html: string,
): { width: number; height: number } | null {
  const doc = new DOMParser().parseFromString(html, 'image/svg+xml')
  const svg = doc.querySelector('svg')
  if (!svg) return null

  const vb = svg.viewBox.baseVal
  if (vb.width > 0 && vb.height > 0) {
    return { width: vb.width, height: vb.height }
  }

  const w = svg.width.baseVal.value
  const h = svg.height.baseVal.value
  if (w > 0 && h > 0) return { width: w, height: h }

  return null
}

function MermaidExpanded({ svgHtml, onClose }: { svgHtml: string; onClose: () => void }) {
  const naturalDims = useMemo(() => parseSvgNaturalDims(svgHtml), [svgHtml])
  const [zoom, setZoom] = useState(100)
  const scrollRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)
  const dragStart = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 })

  const onMouseDown = (e: ReactMouseEvent) => {
    const scrollEl = scrollRef.current
    if (!scrollEl) return
    dragging.current = true
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      scrollLeft: scrollEl.scrollLeft,
      scrollTop: scrollEl.scrollTop,
    }
    scrollEl.style.cursor = 'grabbing'
  }

  useEffect(() => {
    const onMouseMove = (e: globalThis.MouseEvent) => {
      if (!dragging.current) return
      const scrollEl = scrollRef.current
      if (!scrollEl) return
      const dx = e.clientX - dragStart.current.x
      const dy = e.clientY - dragStart.current.y
      scrollEl.scrollLeft = dragStart.current.scrollLeft - dx
      scrollEl.scrollTop = dragStart.current.scrollTop - dy
    }

    const onMouseUp = () => {
      dragging.current = false
      const scrollEl = scrollRef.current
      if (scrollEl) scrollEl.style.cursor = ''
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [])

  const renderedW = naturalDims ? naturalDims.width * (zoom / 100) : undefined
  const renderedH = naturalDims ? naturalDims.height * (zoom / 100) : undefined

  return (
    <Ariakit.Dialog
      open
      onClose={onClose}
      aria-label="Expanded diagram"
      className="bg-default border-secondary fixed inset-2 z-50 flex flex-col rounded-lg border"
      backdrop={<div className="backdrop" />}
    >
      <div className="border-secondary flex items-center justify-end gap-2 border-b px-4 py-2">
        <div className="bg-secondary border-secondary elevation-1 flex h-8 items-center overflow-hidden rounded border">
          <button
            aria-label="Zoom out"
            className="text-mono-sm text-tertiary hover:bg-hover flex h-full items-center px-2"
            onClick={() => setZoom((z) => Math.max(25, z - ZOOM_STEP))}
          >
            −
          </button>
          <button
            className="text-mono-sm text-tertiary border-secondary hover:bg-hover flex h-full w-14 items-center justify-center border-x"
            onClick={() => setZoom(100)}
          >
            {zoom}%
          </button>
          <button
            aria-label="Zoom in"
            className="text-mono-sm text-tertiary hover:bg-hover flex h-full items-center px-2"
            onClick={() => setZoom((z) => z + ZOOM_STEP)}
          >
            +
          </button>
        </div>
        <Ariakit.DialogDismiss
          className={buttonStyle({ size: 'sm', variant: 'secondary' })}
        >
          Close
        </Ariakit.DialogDismiss>
      </div>

      <div
        ref={scrollRef}
        data-scroll-container
        className="grid flex-1 cursor-grab place-items-center overflow-auto"
        onMouseDown={onMouseDown}
      >
        <div
          className="select-none [&_svg]:!block [&_svg]:!h-full [&_svg]:!max-h-none [&_svg]:!w-full [&_svg]:!max-w-none"
          style={
            renderedW && renderedH ? { width: renderedW, height: renderedH } : undefined
          }
          dangerouslySetInnerHTML={{ __html: svgHtml }}
        />
      </div>
    </Ariakit.Dialog>
  )
}

const Mermaid = memo(function Mermaid({ content }: { content: string }) {
  const [showSource, setShowSource] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [svgHtml, setSvgHtml] = useState('')
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
      setSvgHtml(svg)
    })
  }, [content, theme, id, showSource])

  return (
    <>
      <div className="absolute top-2 right-2 flex items-center gap-2">
        {!showSource && (
          <>
            <button
              className="text-mono-xs text-tertiary"
              onClick={() => svgHtml && setExpanded(true)}
              aria-label="Expand diagram"
            >
              Expand
            </button>
            <span className="text-quaternary">|</span>
          </>
        )}
        <button
          className="text-mono-xs text-tertiary"
          onClick={() => setShowSource(!showSource)}
        >
          {showSource ? 'Hide' : 'Show'} Source <span className="text-quaternary">|</span>{' '}
          Mermaid
        </button>
      </div>
      {!showSource ? <code ref={ref} className="w-full" /> : <code>{content}</code>}
      {expanded && <MermaidExpanded svgHtml={svgHtml} onClose={() => setExpanded(false)} />}
    </>
  )
})

export default Mermaid
