/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import { AsciiDocBlocks } from '@oxide/design-system/components'
import { type Options } from '@oxide/react-asciidoc'

import { CustomDocument } from './Document'
import { Image } from './Image'
import Listing from './Listing'

export const opts: Options = {
  overrides: {
    admonition: AsciiDocBlocks.Admonition,
    table: AsciiDocBlocks.Table,
    image: Image,
    section: AsciiDocBlocks.Section,
    listing: Listing,
  },
  customDocument: CustomDocument,
}
