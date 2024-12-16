/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import type { RfdApiPermission } from './rfdApi'

export type Permission = { k: 'ReadDiscussions' } | { k: 'ReadRfd'; v: number }

export function can(allPermissions: RfdApiPermission[], permission: Permission): boolean {
  const checks = createChecks(permission)
  const allowed = checks.some((check) => performCheck(allPermissions, check))

  return allowed
}

function createChecks(permission: Permission): RfdApiPermission[] {
  const checks: RfdApiPermission[] = []
  switch (permission.k) {
    case 'ReadDiscussions':
      checks.push('GetDiscussionsAll')
      break
    case 'ReadRfd':
      checks.push({ 'GetRfd': permission.v })
      checks.push({ 'GetRfds': [permission.v] })
      checks.push('GetRfdsAll')
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
    (p) => {
      switch (typeof p) {
        case 'string':
          return p === check
        case 'object':
          return Object.keys(p)[0] === Object.keys(check)[0] && permissionValue(p) === permissionValue(check)
        default:
          return false
      }
    }
  )
}

function listPermissionCheck(
  permissions: RfdApiPermission[],
  check: RfdApiPermission,
): boolean {
  return permissions.some((p) => {
    switch (typeof p) {
        case 'string':
          return false
        case 'object':
          if (Object.keys(p)[0] === Object.keys(check)[0]) {
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
        default:
          return false
      }
  })
}

function permissionValue(permission: RfdApiPermission): any[] | undefined {
  switch (typeof permission) {
    case 'string':
      return undefined
    case 'object':
      return Object.values(permission)[0]
    default:
      return undefined
  }
}
