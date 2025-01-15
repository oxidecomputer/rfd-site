/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */
import { Content, type DocumentBlock } from '@oxide/react-asciidoc'

// add styles for main
// max-w-full flex-shrink overflow-hidden 800:overflow-visible 800:pr-10 1200:w-[calc(100%-var(--toc-width))] 1200:pr-16 print:p-0
const CustomDocument = ({ document }: { document: DocumentBlock }) => (
  <div
    id="content"
    className="asciidoc-body max-w-full flex-shrink overflow-hidden 800:overflow-visible 800:pr-10 1200:w-[calc(100%-var(--toc-width))] 1200:pr-16 print:p-0"
  >
    <Content blocks={document.blocks} />
  </div>
)

export { CustomDocument }
