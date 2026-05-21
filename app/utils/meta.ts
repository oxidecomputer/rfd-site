/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import { type MetaDescriptor } from 'react-router'

import { canonicalUrl, SITE_URL } from '~/utils/canonicalUrl'

export type SitePath = `/${string}`

const MAX_DESCRIPTION_LENGTH = 160

const resolveImage = (image: string): string =>
  image.startsWith('http') ? image : new URL(image, SITE_URL).toString()

const normalizeDescription = (description: string): string => {
  const normalized = description
    .replace(/<[^>]*>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()

  if (normalized.length <= MAX_DESCRIPTION_LENGTH) return normalized

  const truncated = normalized.slice(0, MAX_DESCRIPTION_LENGTH - 1)
  const lastSpace = truncated.lastIndexOf(' ')
  return `${truncated.slice(0, lastSpace > 0 ? lastSpace : undefined).trim()}…`
}

/**
 * Build a consistent set of page meta tags (title, description, OpenGraph,
 * Twitter Card, and canonical link) for a `MetaFunction` return value.
 *
 * Omit `description` to leave description tags out entirely (lets search
 * engines synthesize from content rather than emitting a low-quality
 * duplicate of the title). Pass `image` as a site-relative path
 * (e.g. "/img/og.png") or a full URL.
 */
export const buildMeta = ({
  title,
  description,
  image,
  path,
  type = 'website',
}: {
  title: string
  description?: string
  image?: string
  path: SitePath
  type?: 'website' | 'article'
}): MetaDescriptor[] => {
  const url = canonicalUrl(path)
  const tags: MetaDescriptor[] = [
    { title },
    { property: 'og:title', content: title },
    { property: 'og:url', content: url },
    { property: 'og:type', content: type },
    { property: 'og:site_name', content: 'Oxide Computer Company' },
    { name: 'twitter:title', content: title },
    { tagName: 'link', rel: 'canonical', href: url },
  ]

  if (description) {
    const normalized = normalizeDescription(description)
    tags.push(
      { name: 'description', content: normalized },
      { property: 'og:description', content: normalized },
      { name: 'twitter:description', content: normalized },
    )
  }

  if (image) {
    const imageUrl = resolveImage(image)
    tags.push(
      { property: 'og:image', content: imageUrl },
      { name: 'twitter:image', content: imageUrl },
      { name: 'twitter:card', content: 'summary_large_image' },
    )
  }

  return tags
}
