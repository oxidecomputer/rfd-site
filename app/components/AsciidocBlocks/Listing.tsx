/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import {
  CaptionedTitle,
  getContent,
  getLineNumber,
  type AdocTypes,
} from '@oxide/react-asciidoc'
import cn from 'classnames'
import hljs from 'highlight.js'
import { decode } from 'html-entities'

import Mermaid from './Mermaid'

// Custom highlight.js language definition to support TLA+
// Reference: https://github.com/highlightjs/highlight.js/pull/1658
hljs.registerLanguage('tla', function (hljs) {
  return {
    keywords: {
      keyword:
        'ASSUME ASSUMPTION AXIOM BOOLEAN CASE CONSTANT CONSTANTS ELSE EXCEPT EXTENDS FALSE ' +
        'IF IN INSTANCE LET LOCAL MODULE OTHER STRING THEN THEOREM LEMMA PROPOSITION COROLLARY ' +
        'TRUE VARIABLE VARIABLES WITH CHOOSE ENABLED UNCHANGED SUBSET UNION DOMAIN BY OBVIOUS ' +
        'HAVE QED TAKE DEF HIDE RECURSIVE USE DEFINE PROOF WITNESS PICK DEFS PROVE SUFFICES ' +
        'NEW LAMBDA STATE ACTION TEMPORAL ONLY OMITTED ',
    },
    contains: [
      hljs.QUOTE_STRING_MODE,
      hljs.COMMENT('\\(\\*', '\\*\\)'),
      hljs.COMMENT('\\\\\\*', '$'),
      hljs.C_NUMBER_MODE,
      { begin: /\/\\/ }, // relevance booster
    ],
  }
})

hljs.registerLanguage('oxql', function (hljs) {
  return {
    keywords: {
      keyword: 'get join align filter group_by',
    },
    contains: [
      hljs.QUOTE_STRING_MODE,
      {
        // 30s, 20m, etc
        className: 'number',
        match: /\d+[smhdw]/,
        relevance: 0,
      },
      {
        // 2024-05-27T00:00:00
        className: 'number',
        match: /@\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
        relevance: 0,
      },
      {
        // @now()
        className: 'number',
        match: /@now\(\)/,
        relevance: 0,
      },
      hljs.C_NUMBER_MODE,
    ],
  }
})

// Inspired by the HTML5 listing convert function
// https://github.com/asciidoctor/asciidoctor/blob/82c5044d1ae5a45a83a8c82d26d5b5b86fcbc179/lib/asciidoctor/converter/html5.rb#L653-L678
const Listing = ({ node }: { node: AdocTypes.Block }) => {
  const document = node.getDocument()
  const attrs = node.getAttributes()
  const nowrap = node.isOption('nowrap') || !document.hasAttribute('prewrap')
  const content = getContent(node)
  const decodedContent = decode(content) || content // unescape the html entities

  // Function to replace callouts with placeholders
  const replaceCallouts = (content: string) => {
    const calloutRegex = /<i class="conum" data-value="\d+"><\/i>/g
    const callouts: string[] = []
    let placeholderContent = content.replace(calloutRegex, (match) => {
      callouts.push(match)
      return `__CALLOUT_PLACEHOLDER_${callouts.length - 1}__`
    })
    return { placeholderContent, callouts }
  }

  // Function to restore callouts from placeholders
  const restoreCallouts = (highlightedContent: string, callouts: string[]) => {
    return highlightedContent.replace(
      /__CALLOUT_PLACEHOLDER_(\d+)__/g,
      (_, index) => callouts[parseInt(index)],
    )
  }

  const { placeholderContent, callouts } = replaceCallouts(decodedContent)

  // Listing blocks of style `source` are source code, should have their syntax
  // highlighted (where we have language support) and be inside both a `pre` and `code` tag
  if (node.getStyle() === 'source') {
    const lang = attrs.language
    return (
      <div className="listingblock" {...getLineNumber(node)}>
        <CaptionedTitle node={node} />
        <div className="content">
          <pre className={cn('highlight', nowrap ? ' nowrap' : '')}>
            {lang && lang === 'mermaid' ? (
              <Mermaid content={decodedContent} />
            ) : (
              <code
                className={`language-${lang || ''}`}
                data-lang={lang}
                dangerouslySetInnerHTML={{
                  __html:
                    (hljs.getLanguage(lang) &&
                      restoreCallouts(
                        hljs.highlight(placeholderContent, { language: lang }).value,
                        callouts,
                      )) ||
                    decodedContent,
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
      <div className="listingblock" {...getLineNumber(node)}>
        <CaptionedTitle node={node} />
        <div className="content">
          <pre
            className={cn('highlight !block', nowrap ? 'nowrap' : '')}
            dangerouslySetInnerHTML={{
              __html: restoreCallouts(placeholderContent, callouts),
            }}
          />
        </div>
      </div>
    )
  }
}

export default Listing
