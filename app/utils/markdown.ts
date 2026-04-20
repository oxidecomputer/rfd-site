/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import { marked, MarkedOptions } from 'marked'

export type MarkdownParser = (
  src: string,
  options?: MarkedOptions | null,
) => string | Promise<string>

export function parseMarkdownText(text: string, parser?: MarkdownParser) {
  const parserFn = parser ?? marked.parse
  try {
    return parserFn(text)
  } catch (error) {
    console.error(`Failed to parse markdown: ${error}`)
    return '<span>Failed to parse comment</span>'
  }
}
