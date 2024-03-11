/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import type { User } from '~/services/authn.server'
import { fetchGroups } from '~/services/rfd.server'

import type { RfdApiPermission } from './rfdApi'

export type Permission = { k: 'ReadDiscussions' } | { k: 'ReadRfd'; v: number }

export async function canUser(user: User, permission: Permission): Promise<boolean> {
  const groups = (await fetchGroups(user)).filter((group) =>
    user.groups.includes(group.name),
  )
  const allPermissions = user.permissions.concat(
    groups.flatMap((group) => group.permissions),
  )
  return can(allPermissions, permission)
}

export function can(allPermissions: RfdApiPermission[], permission: Permission): boolean {
  const checks = createChecks(permission)
  const allowed = checks.some((check) => performCheck(allPermissions, check))

  return allowed
}

function createChecks(permission: Permission): RfdApiPermission[] {
  const checks: RfdApiPermission[] = []
  switch (permission.k) {
    case 'ReadDiscussions':
      checks.push({ kind: 'GetDiscussionsAll' })
      break
    case 'ReadRfd':
      checks.push({ kind: 'GetRfd', value: permission.v })
      checks.push({ kind: 'GetRfds', value: [permission.v] })
      checks.push({ kind: 'GetRfdsAll' })
      break
  }

  return checks
}

function performCheck(permissions: RfdApiPermission[], check: RfdApiPermission): boolean {
  return (
    simplePermissionCheck(permissions, check) || listPermissionCheck(permissions, check)
  )
}

function simplePermissionCheck(
  permissions: RfdApiPermission[],
  check: RfdApiPermission,
): boolean {
  return permissions.some(
    (p) => p.kind === check.kind && permissionValue(p) === permissionValue(check),
  )
}

function listPermissionCheck(
  permissions: RfdApiPermission[],
  check: RfdApiPermission,
): boolean {
  return permissions.some((p) => {
    if (p.kind === check.kind) {
      const existing = permissionValue(p)
      const expected = permissionValue(check)

      return (
        Array.isArray(existing) &&
        Array.isArray(expected) &&
        expected.every((value) => existing.includes(value))
      )
    } else {
      return false
    }
  })
}

function permissionValue(permission: RfdApiPermission): any | undefined {
  switch (permission.kind) {
    case 'GetDiscussionsAll':
    case 'GetRfdsAll':
      return undefined
    case 'GetRfd':
      return permission.value
    case 'GetRfds':
      return permission.value
  }
}
