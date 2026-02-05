/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { getRfdApiFrontendUrl, getRfdApiUrl } from './rfd.remote.server'

describe('getRfdApiUrl', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
    // Clear relevant env vars
    delete process.env.RFD_API_BACKEND_URL
    delete process.env.RFD_API
    delete process.env.LOCAL_RFD_REPO
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('returns RFD_API_BACKEND_URL when set', () => {
    process.env.RFD_API_BACKEND_URL = 'https://backend.example.com'
    process.env.RFD_API = 'https://api.example.com'
    expect(getRfdApiUrl()).toBe('https://backend.example.com')
  })

  it('falls back to RFD_API when RFD_API_BACKEND_URL is not set', () => {
    process.env.RFD_API = 'https://api.example.com'
    expect(getRfdApiUrl()).toBe('https://api.example.com')
  })

  it('returns empty string in local mode', () => {
    process.env.LOCAL_RFD_REPO = '/path/to/rfd'
    expect(getRfdApiUrl()).toBe('')
  })

  it('throws error when neither RFD_API_BACKEND_URL nor RFD_API is set and not in local mode', () => {
    expect(() => getRfdApiUrl()).toThrowError(
      'Env var RFD_API_BACKEND_URL or RFD_API must be set when not running in local mode',
    )
  })
})

describe('getRfdApiFrontendUrl', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
    // Clear relevant env vars
    delete process.env.RFD_API_FRONTEND_URL
    delete process.env.RFD_API
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('returns RFD_API_FRONTEND_URL when set', () => {
    process.env.RFD_API_FRONTEND_URL = 'https://frontend.example.com'
    process.env.RFD_API = 'https://api.example.com'
    expect(getRfdApiFrontendUrl()).toBe('https://frontend.example.com')
  })

  it('falls back to RFD_API when RFD_API_FRONTEND_URL is not set', () => {
    process.env.RFD_API = 'https://api.example.com'
    expect(getRfdApiFrontendUrl()).toBe('https://api.example.com')
  })

  it('returns empty string when neither RFD_API_FRONTEND_URL nor RFD_API is set', () => {
    expect(getRfdApiFrontendUrl()).toBe('')
  })
})
