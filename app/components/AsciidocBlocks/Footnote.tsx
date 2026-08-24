/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import {
  Context,
  inlineHtml,
  parse,
  useConverterContext,
  type Inline,
} from '@oxide/react-asciidoc'
import { type ReactNode } from 'react'

import { useHoverCard } from '~/components/rfd/use-hover-card'

/**
 * Footnote inline override. Keeps the stock `[n]` superscript marker, but shows
 * the footnote body in a hover card so it can be read — and its inner links
 * clicked — without scrolling down to the footnotes section.
 */
const Footnote = ({
  node,
  children,
}: {
  node: Inline.FootnoteNode
  children: ReactNode
}) => {
  // The body (`children`) is already rendered with our inline overrides, so RFD
  // links inside a footnote keep their own previews. It renders in the card,
  // which lives outside the <Asciidoc> tree — re-provide the converter context
  // so those nested overrides don't lose it.
  const ctx = useConverterContext()
  const hasBody = (node.text?.length ?? 0) > 0

  const { ref, onMouseEnter, onMouseLeave } = useHoverCard<HTMLSpanElement>(() =>
    hasBody
      ? {
          key: `footnote-${node.index ?? node.id ?? ''}`,
          content: (
            // `footnotes` + the same text container the footnotes section uses,
            // so links / code / text inherit the identical treatment.
            <Context.Provider value={ctx}>
              <div className="footnotes text-sans-md text-default">
                <p className="m-0">{children}</p>
              </div>
            </Context.Provider>
          ),
        }
      : null,
  )

  // Stock marker (`<sup class="footnote">[n]</sup>`) — round-tripped so it stays
  // identical to the default renderer.
  const marker = parse(inlineHtml([node]).__html)
  if (!hasBody) return <>{marker}</>

  return (
    <span
      ref={ref}
      className="[&_a]:target-2"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {marker}
    </span>
  )
}

export default Footnote
