/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import { afterEach, describe, expect, it, vi } from 'vitest'

import { authenticate } from './auth.server'

vi.mock('./rfd.local.server', () => ({
  isLocalMode: vi.fn(),
}))

import { isLocalMode } from './rfd.local.server'

describe('authenticate', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.mocked(isLocalMode).mockReset()
  })

  it('returns mock user when LOCAL_DEV_USER is set and in local mode', async () => {
    vi.mocked(isLocalMode).mockReturnValue(true)
    vi.stubEnv('LOCAL_DEV_USER', '1')

    const request = new Request('http://localhost:3000')
    const user = await authenticate(request)

    expect(user).not.toBeNull()
    expect(user?.id).toBe('local-dev')
    expect(user?.displayName).toBe('Local Dev')
  })

  it('does not return mock user when LOCAL_DEV_USER is set but not in local mode', async () => {
    vi.mocked(isLocalMode).mockReturnValue(false)
    vi.stubEnv('LOCAL_DEV_USER', '1')

    const request = new Request('http://localhost:3000')
    const user = await authenticate(request)

    expect(user?.id).not.toBe('local-dev')
  })

  it('does not return mock user when in local mode but LOCAL_DEV_USER is not set', async () => {
    vi.mocked(isLocalMode).mockReturnValue(true)
    vi.stubEnv('LOCAL_DEV_USER', '')

    const request = new Request('http://localhost:3000')
    const user = await authenticate(request)

    expect(user?.id).not.toBe('local-dev')
  })
})
