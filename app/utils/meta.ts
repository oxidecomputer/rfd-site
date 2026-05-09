/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import { canonicalUrl, SITE_URL } from '~/utils/canonicalUrl'

export type SitePath = `/${string}`

const resolveImage = (image: string): string =>
  image.startsWith('http') ? image : new URL(image, SITE_URL).toString()

/**
 * Build a consistent set of page meta tags (title, description, OpenGraph,
 * Twitter Card, and canonical link) for a `MetaFunction` return value.
 *
 * `image` is optional — when omitted, og:image / twitter:image are not
 * emitted. Pass a site-relative path (e.g. "/img/og.png") or a full URL.
 */
export const buildMeta = ({
  title,
  description,
  image,
  path,
  type = 'website',
}: {
  title: string
  description: string
  image?: string
  path: SitePath
  type?: 'website' | 'article'
}): Array<Record<string, string>> => {
  const url = canonicalUrl(path)
  const tags: Array<Record<string, string>> = [
    { title },
    { name: 'description', content: description },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:url', content: url },
    { property: 'og:type', content: type },
    { property: 'og:site_name', content: 'Oxide Computer Company' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:card', content: 'summary_large_image' },
    { tagName: 'link', rel: 'canonical', href: url },
  ]

  if (image) {
    const imageUrl = resolveImage(image)
    tags.push(
      { property: 'og:image', content: imageUrl },
      { name: 'twitter:image', content: imageUrl },
    )
  }

  return tags
}
