/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import { AsciiDocBlocks } from '@oxide/design-system/components/dist'
import { getText, type AdocTypes, type Options } from '@oxide/react-asciidoc'

import CustomDocument, { ui } from './Document'
import Image from './Image'
import Listing from './Listing'
import Section from './Section'

export const opts: Options = {
  overrides: {
    admonition: AsciiDocBlocks.Admonition,
    table: AsciiDocBlocks.Table,
    image: Image,
    listing: Listing,
    section: Section,
  },
  customDocument: CustomDocument,
}

/**
 * Adds word break opportunities (<wbr/>) after slashes in text, except within HTML tags.
 * This function is used to improve line breaks for long paths or URLs in rendered content.
 * *
 * renderWithBreaks('/path/to/long/file.txt')
 * '/<wbr/>path/<wbr/>to/<wbr/>long/<wbr/>file.txt'
 */
export const renderWithBreaks = (text: string): string => {
  return text
    .split(/(<[^>]*>)/g)
    .map((segment) => {
      // if the segment is an HTML tag, leave it unchanged
      if (segment.startsWith('<') && segment.endsWith('>')) {
        return segment
      }
      // replace slashes that are not surrounded by spaces
      return segment.replace(/(?:^|(?<=\S))\/(?=\S)/g, '/<wbr/>')
    })
    .join('')
}

// prettier-ignore
const QUOTE_TAGS: {[key: string]: [string, string, boolean?]} = {
  "monospaced": ['<code>', '</code>', true],
  "emphasis": ['<em>', '</em>', true],
  "strong": ['<strong>', '</strong>', true],
  "double": ['&#8220;', '&#8221;'],
  "single": ['&#8216;', '&#8217;'],
  "mark": ['<mark>', '</mark>', true],
  "superscript": ['<sup>', '</sup>', true],
  "subscript": ['<sub>', '</sub>', true],
  "unquoted": ['<span>', '</span>', true],
  "asciimath": ['\\$', '\\$'],
  "latexmath": ['\\(', '\\)'],
}

const chop = (str: string) => str.substring(0, str.length - 1)

const convertInlineQuoted = (node: AdocTypes.Inline) => {
  const type = node.getType()
  const quoteTag = QUOTE_TAGS[type]
  const [open, close, tag] = quoteTag || ['', '']

  let text = getText(node)

  // Add <wbr> for line breaks with long paths
  // Ignores a / if there's a space before it
  if (type === 'monospaced') {
    text = renderWithBreaks(text)
  }

  const idAttr = node.getId() ? `id="${node.getId()}"` : ''
  const classAttr = node.getRole() ? `class="${node.getRole()}"` : ''

  if (tag) {
    return `${chop(open)} ${idAttr} ${classAttr}>${text}${close}`
  } else {
    return `<span ${idAttr} ${classAttr}>${open}${text}${close}</span>`
  }
}

function convertInlineCallout(node: AdocTypes.Inline): string {
  let text = getText(node)

  return `<i class="conum" data-value="${text}"></i>`
}

export { ui, convertInlineQuoted, convertInlineCallout }
