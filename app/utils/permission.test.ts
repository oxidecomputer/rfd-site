/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import { describe, expect, it } from 'vitest'

import type { Group } from '~/services/authn.server'

import { can } from './permission'

describe('Group Permissions', () => {
  it('Validates group has non value permission', () => {
    const group: Group = {
      id: 'test',
      name: 'Test',
      permissions: ['GetRfdsAll'],
    }

    expect(can(group.permissions, { k: 'ReadRfd', v: 123 })).toBe(true)
  })

  it('Validates group has simple value permission', () => {
    const group: Group = {
      id: 'test',
      name: 'Test',
      permissions: [{ GetRfd: 123 }],
    }

    expect(can(group.permissions, { k: 'ReadRfd', v: 123 })).toBe(true)
  })

  it('Validates group has list value permission', () => {
    const group: Group = {
      id: 'test',
      name: 'Test',
      permissions: [{ GetRfds: [123] }],
    }

    expect(can(group.permissions, { k: 'ReadRfd', v: 123 })).toBe(true)
  })

  it('Validates group with multiple permissions', () => {
    const group: Group = {
      id: 'test',
      name: 'Test',
      permissions: [{ GetRfd: 123 }, { GetRfds: [123] }, 'GetRfdsAll'],
    }

    expect(can(group.permissions, { k: 'ReadRfd', v: 123 })).toBe(true)
  })

  it('Validates mapped group permission', () => {
    const group: Group = {
      id: 'test',
      name: 'Test',
      permissions: ['GetDiscussionsAll'],
    }

    expect(can(group.permissions, { k: 'ReadDiscussions' })).toBe(true)
  })
})
