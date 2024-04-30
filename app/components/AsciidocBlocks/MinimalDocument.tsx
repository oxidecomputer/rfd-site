/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import { Content, type AdocTypes } from '@oxide/react-asciidoc'

export const MinimalDocument = ({ document }: { document: AdocTypes.Document }) => (
  <div id="content" className="asciidoc-body w-full max-w-[840px]">
    <Content blocks={document.getBlocks()} />
  </div>
)
