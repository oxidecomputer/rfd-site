/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import { describe, expect, it } from 'vitest'

import { getUserRedirect } from './redirect.server'

describe('Redirect Validation', () => {
  it('Allows redirects to the index', () => {
    expect(getUserRedirect('/')).toBe('/')
  })

  it('Allows redirects to short RFD numbers', () => {
    expect(getUserRedirect('/rfd/1')).toBe('/rfd/1')
  })

  it('Allows redirects to full RFD numbers', () => {
    expect(getUserRedirect('/rfd/0001')).toBe('/rfd/0001')
  })

  it('Disallows redirects to RFD numbers with trailing slash', () => {
    expect(getUserRedirect('/rfd/0001/')).toBe('/')
  })

  it('Disallows redirects to missing RFD numbers', () => {
    expect(getUserRedirect('/rfd/')).toBe('/')
    expect(getUserRedirect('/rfd')).toBe('/')
  })

  it('Disallows redirects to invalid RFD numbers', () => {
    expect(getUserRedirect('/rfd/00001')).toBe('/')
  })

  it('Disallows redirects to with query params', () => {
    expect(getUserRedirect('/?arg=value')).toBe('/')
  })

  it('Disallows redirects to with RFD query params', () => {
    expect(getUserRedirect('/rfd/0001/?arg=value')).toBe('/')
  })

  it('Disallows redirects to external urls', () => {
    expect(getUserRedirect('https://oxide.computer')).toBe('/')
  })
})
