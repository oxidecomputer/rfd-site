/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import { describe, expect, it } from 'vitest'

import { renderWithBreaks } from '~/components/AsciidocBlocks'

describe('renderWithBreaks', () => {
  it('adds <wbr/> after each slash in URLs and file paths', () => {
    expect(renderWithBreaks('/v1/disks/{disk}')).toBe('/<wbr/>v1/<wbr/>disks/<wbr/>{disk}')
    expect(renderWithBreaks('https://example.com/path/to/resource')).toBe(
      'https:/<wbr/>/<wbr/>example.com/<wbr/>path/<wbr/>to/<wbr/>resource',
    )
  })

  it('does not add <wbr/> to slashes within HTML-like tags', () => {
    expect(renderWithBreaks('<span class="test">Some/text</span>')).toBe(
      '<span class="test">Some/<wbr/>text</span>',
    )
  })

  it('handles mixed content correctly', () => {
    expect(renderWithBreaks('Text with <tag attr="value"/> and /path/to/file')).toBe(
      'Text with <tag attr="value"/> and /path/<wbr/>to/<wbr/>file',
    )
  })

  it('handles edge cases correctly', () => {
    expect(renderWithBreaks('/')).toBe('/')
    expect(renderWithBreaks('text / with spaces')).toBe('text / with spaces')
    expect(renderWithBreaks('/path/to/file')).toBe('/<wbr/>path/<wbr/>to/<wbr/>file')
    expect(renderWithBreaks('a/b/c')).toBe('a/<wbr/>b/<wbr/>c')
  })
})
