/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import * as Ariakit from '@ariakit/react'
import { type Block, type Inline } from '@asciidoctor/core'
import { Title, useConverterContext, type ImageBlock } from '@oxide/react-asciidoc'
import { useState } from 'react'

function nodeIsInline(node: Block | Inline): node is Inline {
  return node.isInline()
}

const InlineImage = ({ node }: { node: Block | Inline }) => {
  const documentAttrs = node.getDocument().getAttributes()

  let target = ''
  if (nodeIsInline(node)) {
    target = node.getTarget() || '' // Getting target on inline nodes
  } else {
    target = node.getAttribute('target') // Getting target on block nodes
  }

  const uri = node.getImageUri(target)
  let url = ''

  url = `/rfd/image/${documentAttrs.rfdnumber}/${uri}`

  let img = (
    <img
      src={url}
      alt={node.getAttribute('alt')}
      width={node.getAttribute('width')}
      height={node.getAttribute('height')}
    />
  )

  if (node.hasAttribute('link')) {
    img = (
      <a className="image" href={node.getAttribute('link')}>
        {img}
      </a>
    )
  }

  return (
    <div
      className={`image ${
        node.hasAttribute('align') ? 'text-' + node.getAttribute('align') : ''
      } ${node.hasAttribute('float') ? node.getAttribute('float') : ''} ${
        node.getRole() ? node.getRole() : ''
      }`}
    >
      {img}
    </div>
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
      <div
        className={`imageblock ${
          node.attributes['align'] ? 'text-' + node.attributes['align'] : ''
        } ${node.attributes['float'] ? node.attributes['float'] : ''} ${
          node.role ? node.role : ''
        }`}
        onClick={() => setLightboxOpen(true)}
      >
        <div className="content">{img}</div>
        <Title text={node.title || ''} />
      </div>
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
