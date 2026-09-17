/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */
import { Content, type DocumentBlock } from '@oxide/react-asciidoc'

const CustomDocument = ({ document }: { document: DocumentBlock }) => (
  // Rendered as a semantic <article> (rather than a <div>) so that reader
  // modes (Safari Reader, Firefox Reader View) have an unambiguous content
  // boundary to use instead of falling back to heuristic scoring, which can
  // otherwise pick a single densely-scored section (e.g. one containing a
  // large table) as the "top candidate" and drop earlier sibling sections.
  <article
    id="content"
    className="asciidoc-body 800:overflow-visible 800:pr-10 1200:w-[calc(100%-var(--toc-width))] 1200:pr-16 max-w-full shrink overflow-hidden print:p-0"
  >
    <Content blocks={document.blocks} />
  </article>
)

export { CustomDocument }
