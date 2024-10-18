/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import * as Ariakit from '@ariakit/react'
import { CaptionedTitle, type AdocTypes } from '@oxide/react-asciidoc'
import { useState } from 'react'

function nodeIsInline(node: AdocTypes.Block | AdocTypes.Inline): node is AdocTypes.Inline {
  return node.isInline()
}

const Image = ({
  node,
  hasLightbox = true,
}: {
  node: AdocTypes.Block | AdocTypes.Inline
  hasLightbox?: boolean
}) => {
  const documentAttrs = node.getDocument().getAttributes()

  let target = ''
  if (nodeIsInline(node)) {
    target = node.getTarget() || '' // Getting target on inline nodes
  } else {
    target = node.getAttribute('target') // Getting target on block nodes
  }

  let uri = node.getImageUri(target)
  let url = ''

  const [lightboxOpen, setLightboxOpen] = useState(false)

  url = `/rfd/image/${documentAttrs.rfdnumber}/${uri}`

  let img = (
    <img
      src={url}
      alt={node.getAttribute('alt')}
      width={node.getAttribute('width')}
      height={node.getAttribute('height')}
      className={node.isBlock() && hasLightbox ? '1000:cursor-zoom-in' : ''}
    />
  )

  if (node.hasAttribute('link')) {
    img = (
      <a className="image" href={node.getAttribute('link')}>
        {img}
      </a>
    )
  }

  if (nodeIsInline(node)) {
    return (
      <span
        className={`image ${
          node.hasAttribute('align') ? 'text-' + node.getAttribute('align') : ''
        } ${node.hasAttribute('float') ? node.getAttribute('float') : ''} ${
          node.getRole() ? node.getRole() : ''
        }`}
      >
        {img}
      </span>
    )
  } else {
    return (
      <>
        <div
          className={`imageblock ${
            node.hasAttribute('align') ? 'text-' + node.getAttribute('align') : ''
          } ${node.hasAttribute('float') ? node.getAttribute('float') : ''} ${
            node.getRole() ? node.getRole() : ''
          }`}
          onClick={() => setLightboxOpen(true)}
        >
          <div className="content">{img}</div>
          <CaptionedTitle node={node} />
        </div>
        {hasLightbox && (
          <Ariakit.Dialog
            open={lightboxOpen}
            onClose={() => setLightboxOpen(false)}
            className="fixed [&_img]:mx-auto"
            backdrop={<div className="backdrop" />}
          >
            <Ariakit.DialogDismiss className="fixed left-1/2 top-1/2 flex h-full w-full -translate-x-1/2 -translate-y-1/2 cursor-zoom-out p-20">
              <img
                src={url}
                className={`max-h-full max-w-full rounded object-contain`}
                alt={node.getAttribute('alt')}
              />
            </Ariakit.DialogDismiss>
          </Ariakit.Dialog>
        )}
      </>
    )
  }
}

export default Image
