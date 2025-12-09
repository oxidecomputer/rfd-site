/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import { afterEach, describe, expect, it, vi } from 'vitest'

import type { User } from './auth.server'

vi.mock('./rfd.local.server', () => ({
  isLocalMode: vi.fn(),
  fetchLocalRfd: vi.fn(),
  fetchLocalRfds: vi.fn(),
}))

import { fetchLocalRfd, fetchLocalRfds, isLocalMode } from './rfd.local.server'
import { fetchRfd, fetchRfds } from './rfd.server'

const mockUser: User = {
  id: 'test-user',
  email: 'test@example.com',
  displayName: 'Test User',
  token: 'test-token',
  permissions: [],
  groups: [],
  expiresAt: new Date(Date.now() + 86400000),
}

const mockPublicRfd = {
  number: 1,
  title: 'Public RFD',
  state: 'published',
  content: 'content',
  committedAt: new Date(),
  visibility: 'public' as const,
}

const mockPrivateRfd = {
  number: 2,
  title: 'Private RFD',
  state: 'discussion',
  content: 'content',
  committedAt: new Date(),
  visibility: 'private' as const,
}

describe('fetchRfd', () => {
  afterEach(() => {
    vi.mocked(isLocalMode).mockReset()
    vi.mocked(fetchLocalRfd).mockReset()
  })

  it('returns public RFD when user is not logged in', async () => {
    vi.mocked(isLocalMode).mockReturnValue(true)
    vi.mocked(fetchLocalRfd).mockReturnValue(mockPublicRfd)

    const rfd = await fetchRfd(1, null)

    expect(rfd).not.toBeUndefined()
    expect(rfd?.title).toBe('Public RFD')
  })

  it('returns private RFD when user is logged in', async () => {
    vi.mocked(isLocalMode).mockReturnValue(true)
    vi.mocked(fetchLocalRfd).mockReturnValue(mockPrivateRfd)

    const rfd = await fetchRfd(2, mockUser)

    expect(rfd).not.toBeUndefined()
    expect(rfd?.title).toBe('Private RFD')
  })

  it('does not return private RFD when user is not logged in', async () => {
    vi.mocked(isLocalMode).mockReturnValue(true)
    vi.mocked(fetchLocalRfd).mockReturnValue(mockPrivateRfd)

    const rfd = await fetchRfd(2, null)

    expect(rfd).toBeUndefined()
  })
})

describe('fetchRfds', () => {
  afterEach(() => {
    vi.mocked(isLocalMode).mockReset()
    vi.mocked(fetchLocalRfds).mockReset()
  })

  it('returns only public RFDs when user is not logged in', async () => {
    vi.mocked(isLocalMode).mockReturnValue(true)
    vi.mocked(fetchLocalRfds).mockReturnValue([mockPublicRfd, mockPrivateRfd])

    const rfds = await fetchRfds(null)

    expect(rfds).toHaveLength(1)
    expect(rfds?.[0].title).toBe('Public RFD')
  })

  it('returns all RFDs when user is logged in', async () => {
    vi.mocked(isLocalMode).mockReturnValue(true)
    vi.mocked(fetchLocalRfds).mockReturnValue([mockPublicRfd, mockPrivateRfd])

    const rfds = await fetchRfds(mockUser)

    expect(rfds).toHaveLength(2)
  })
})
