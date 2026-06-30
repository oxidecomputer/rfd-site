/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import { describe, expect, it } from 'vitest'

import { sanitizeRedirect } from './auth.server'

describe('sanitizeRedirect', () => {
  it('allows RFD paths', () => {
    expect(sanitizeRedirect('/rfd/1')).toBe('/rfd/1')
    expect(sanitizeRedirect('/rfd/0001')).toBe('/rfd/0001')
  })

  it('allows RFD sub-paths', () => {
    expect(sanitizeRedirect('/rfd/0001/discussion')).toBe('/rfd/0001/discussion')
    expect(sanitizeRedirect('/rfd/0001/raw')).toBe('/rfd/0001/raw')
    expect(sanitizeRedirect('/rfd/0001/pdf')).toBe('/rfd/0001/pdf')
  })

  it('allows RFD paths with query params', () => {
    expect(sanitizeRedirect('/rfd/0001?arg=value')).toBe('/rfd/0001?arg=value')
    expect(sanitizeRedirect('/rfd/0001/discussion?arg=value')).toBe(
      '/rfd/0001/discussion?arg=value',
    )
  })

  it('allows index query params', () => {
    expect(sanitizeRedirect('?q=search term&label=foo')).toBe('/?q=search+term&label=foo')
  })

  it('allows encoded paths', () => {
    expect(sanitizeRedirect('%2Frfd%2F0001')).toBe('/rfd/0001')
    expect(sanitizeRedirect('%3Fq%3Dsearch%2520term')).toBe('/?q=search+term')
  })

  it('rejects non-RFD paths', () => {
    expect(sanitizeRedirect('/search')).toBe('/')
    expect(sanitizeRedirect('/rfd')).toBe('/')
    expect(sanitizeRedirect('/rfd/')).toBe('/')
  })

  it('rejects malformed RFD paths', () => {
    expect(sanitizeRedirect('/rfd/00001')).toBe('/')
    expect(sanitizeRedirect('/rfd/0001/')).toBe('/')
  })

  it('rejects external redirects', () => {
    expect(sanitizeRedirect('https://oxide.computer')).toBe('/')
    expect(sanitizeRedirect('//oxide.computer')).toBe('/')
  })

  it('rejects malformed percent encoding', () => {
    expect(sanitizeRedirect('/rfd/1%')).toBe('/')
    expect(sanitizeRedirect('\uFFFD%A')).toBe('/')
  })
})
