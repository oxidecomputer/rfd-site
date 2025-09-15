/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */
import { Title, useConverterContext, type LiteralBlock } from '@oxide/react-asciidoc'
import cn from 'classnames'

import Mermaid from './Mermaid'

const Listing = ({ node }: { node: LiteralBlock }) => {
  const { document } = useConverterContext()

  const docAttrs = document.attributes || {}
  const nowrap = node.attributes.nowrap || docAttrs['prewrap'] === undefined

  if (node.style === 'source') {
    const lang = node.language

    return (
      <div
        className="listingblock"
        {...(node.lineNumber ? { 'data-lineno': node.lineNumber } : {})}
      >
        <Title text={node.title} />
        <div className="content">
          <pre className={cn('highlight', nowrap ? ' nowrap' : '')}>
            {lang && lang === 'mermaid' ? (
              <Mermaid content={node.source || ''} />
            ) : (
              <code
                className={lang && `language-${lang}`}
                data-lang={lang || undefined}
                dangerouslySetInnerHTML={{
                  __html: node.content || '',
                }}
              />
            )}
          </pre>
        </div>
      </div>
    )
  } else {
    // Regular listing blocks are wrapped only in a `pre` tag
    return (
      <div
        className="listingblock"
        {...(node.lineNumber ? { 'data-lineno': node.lineNumber } : {})}
      >
        <Title text={node.title} />
        <div className="content">
          <pre
            className={cn('highlight block!', nowrap ? 'nowrap' : '')}
            dangerouslySetInnerHTML={{
              __html: node.content || '',
            }}
          />
        </div>
      </div>
    )
  }
}

export default Listing
