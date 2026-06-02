/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */
import {
  inlineOverrides as baseInlineOverrides,
  loadAsciidoctor,
} from '@oxide/design-system/asciidoc'
import { type InlineOverrides } from '@oxide/react-asciidoc'

import { InlineImage } from '~/components/AsciidocBlocks/Image'
import RfdLink from '~/components/AsciidocBlocks/RfdLink'

const attrs = {
  sectlinks: 'true',
  stem: 'latexmath',
  stylesheet: false,
}

const ad = loadAsciidoctor({})

const inlineOverrides: InlineOverrides = {
  ...baseInlineOverrides,
  image: InlineImage,
  anchor: RfdLink,
}

export { ad, attrs, inlineOverrides }
