/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import { describe, expect, test } from 'vitest'

import { SITE_URL } from './canonicalUrl'
import { buildMeta } from './meta'

const descriptionTags = (content: string) => [
  { name: 'description', content },
  { property: 'og:description', content },
  { name: 'twitter:description', content },
]

describe('buildMeta', () => {
  test('builds the required tags with defaults', () => {
    expect(buildMeta({ title: 'RFDs', path: '/rfd/0001' })).toEqual([
      { title: 'RFDs' },
      { property: 'og:title', content: 'RFDs' },
      { property: 'og:url', content: `${SITE_URL}/rfd/0001` },
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: 'Oxide Computer Company' },
      { name: 'twitter:title', content: 'RFDs' },
      { tagName: 'link', rel: 'canonical', href: `${SITE_URL}/rfd/0001` },
    ])
  })

  test('supports article metadata and removes query parameters from canonical URLs', () => {
    const tags = buildMeta({
      title: 'An RFD',
      path: '/rfd/0001?from=search',
      type: 'article',
    })

    expect(tags).toContainEqual({ property: 'og:type', content: 'article' })
    expect(tags).toContainEqual({ property: 'og:url', content: `${SITE_URL}/rfd/0001` })
    expect(tags).toContainEqual({
      tagName: 'link',
      rel: 'canonical',
      href: `${SITE_URL}/rfd/0001`,
    })
  })

  test('omits optional tags when their values are absent', () => {
    const tags = buildMeta({ title: 'RFDs', description: '', path: '/' })

    expect(tags).not.toContainEqual(expect.objectContaining({ name: 'description' }))
    expect(tags).not.toContainEqual(expect.objectContaining({ property: 'og:description' }))
    expect(tags).not.toContainEqual(expect.objectContaining({ property: 'og:image' }))
    expect(tags).not.toContainEqual(expect.objectContaining({ name: 'twitter:card' }))
  })

  test('collapses whitespace in descriptions', () => {
    const tags = buildMeta({ title: 'Test', description: '  Hello\n\tworld  ', path: '/' })

    expect(tags).toEqual(expect.arrayContaining(descriptionTags('Hello world')))
  })

  test('uses the same truncated description in every description tag', () => {
    const description = `${'word '.repeat(40)}finish`
    const tags = buildMeta({ title: 'Test', description, path: '/' })
    const expected = `${'word '.repeat(31).trim()}…`

    expect(expected).toHaveLength(155)
    expect(tags).toEqual(expect.arrayContaining(descriptionTags(expected)))
  })

  test('truncates a long description without spaces at the character limit', () => {
    const tags = buildMeta({ title: 'Test', description: 'x'.repeat(161), path: '/' })
    const expected = `${'x'.repeat(159)}…`

    expect(expected).toHaveLength(160)
    expect(tags).toEqual(expect.arrayContaining(descriptionTags(expected)))
  })

  test.each([
    ['/img/rfd.png', `${SITE_URL}/img/rfd.png`],
    ['https://images.example.com/rfd.png', 'https://images.example.com/rfd.png'],
  ])('resolves image URL %s', (image, expected) => {
    const tags = buildMeta({ title: 'Test', image, path: '/' })

    expect(tags).toEqual(
      expect.arrayContaining([
        { property: 'og:image', content: expected },
        { name: 'twitter:image', content: expected },
        { name: 'twitter:card', content: 'summary_large_image' },
      ]),
    )
  })
})
