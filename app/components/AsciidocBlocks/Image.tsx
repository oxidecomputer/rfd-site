/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import * as Ariakit from '@ariakit/react'
import {
  Title,
  useConverterContext,
  type ImageBlock,
  type Inline,
} from '@oxide/react-asciidoc'
import { useState } from 'react'

const InlineImage = ({ node }: { node: Inline.ImageNode }) => {
  const { document } = useConverterContext()
  const docAttrs = document.attributes || {}

  const url = `/rfd/image/${docAttrs.rfdnumber}/${node.target}`

  let img = <img src={url} alt={node.alt} width={node.width} height={node.height} />

  if (node.link) {
    img = (
      <a className="image" href={node.link}>
        {img}
      </a>
    )
  }

  return (
    <span className={`image ${node.float ? node.float : ''} ${node.role ? node.role : ''}`}>
      {img}
    </span>
  )
}

const Image = ({ node }: { node: ImageBlock }) => {
  const { document } = useConverterContext()
  const docAttrs = document.attributes || {}

  let url = ''

  const [lightboxOpen, setLightboxOpen] = useState(false)

  url = `/rfd/image/${docAttrs.rfdnumber}/${node.imageUri}`

  let img = (
    <img
      src={url}
      alt={node.attributes['alt'].toString()}
      width={node.attributes['width']}
      height={node.attributes['height']}
      className="1000:cursor-zoom-in"
    />
  )

  if (node.attributes['link']) {
    img = (
      <a className="image" href={node.attributes['link'].toString()}>
        {img}
      </a>
    )
  }

  return (
    <>
      <button
        className={`imageblock ${
          node.attributes['align'] ? 'text-' + node.attributes['align'] : ''
        } ${node.attributes['float'] ? node.attributes['float'] : ''} ${
          node.role ? node.role : ''
        }`}
        onClick={() => setLightboxOpen(true)}
      >
        <div className="content">{img}</div>
        <Title text={node.title || ''} />
      </button>
      <Ariakit.Dialog
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        className="fixed [&_img]:mx-auto"
        backdrop={<div className="backdrop" />}
      >
        <Ariakit.DialogDismiss className="fixed top-1/2 left-1/2 flex h-full w-full -translate-x-1/2 -translate-y-1/2 cursor-zoom-out p-20">
          <img
            src={url}
            className={`max-h-full max-w-full rounded object-contain`}
            alt={node.attributes['alt'].toString()}
          />
        </Ariakit.DialogDismiss>
      </Ariakit.Dialog>
    </>
  )
}

export { Image, InlineImage }
