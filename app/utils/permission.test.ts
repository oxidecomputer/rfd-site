/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import type { AccessGroup_for_RfdPermission } from '@oxide/rfd.ts/client'
import { describe, expect, it } from 'vitest'

import { can } from './permission'

type TestGroup = Omit<Omit<AccessGroup_for_RfdPermission, 'createdAt'>, 'updatedAt'>

describe('Group Permissions', () => {
  it('Validates group has non value permission', () => {
    const group: TestGroup = {
      id: 'test',
      name: 'Test',
      permissions: ['GetRfdsAll'],
    }

    expect(can(group.permissions, { GetRfd: 123 })).toBe(true)
  })

  it('Validates group has simple value permission', () => {
    const group: TestGroup = {
      id: 'test',
      name: 'Test',
      permissions: [{ GetRfd: 123 }],
    }

    expect(can(group.permissions, { GetRfd: 123 })).toBe(true)
  })

  it('Validates group has list value permission', () => {
    const group: TestGroup = {
      id: 'test',
      name: 'Test',
      permissions: [{ GetRfds: [123] }],
    }

    expect(can(group.permissions, { GetRfd: 123 })).toBe(true)
  })

  it('Validates group with multiple permissions', () => {
    const group: TestGroup = {
      id: 'test',
      name: 'Test',
      permissions: [{ GetRfd: 123 }, { GetRfds: [123] }, 'GetRfdsAll'],
    }

    expect(can(group.permissions, { GetRfd: 123 })).toBe(true)
  })

  it('Validates mapped group permission', () => {
    const group: TestGroup = {
      id: 'test',
      name: 'Test',
      permissions: ['GetDiscussionsAll'],
    }

    expect(can(group.permissions, 'GetDiscussionsAll')).toBe(true)
  })
})
