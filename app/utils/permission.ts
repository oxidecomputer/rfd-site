/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import type { RfdPermission } from '@oxide/rfd.ts/client'

export function can(allPermissions: RfdPermission[], permission: RfdPermission): boolean {
  const checks = createChecks(permission)
  const allowed = checks.some((check) => performCheck(allPermissions, check))

  return allowed
}

export function any(
  allPermissions: RfdPermission[],
  permissions: RfdPermission[],
): boolean {
  return permissions.some((permission) => can(allPermissions, permission))
}

function createChecks(permission: RfdPermission): RfdPermission[] {
  const checks: RfdPermission[] = []
  checks.push(permission)

  if (typeof permission === 'string') {
    switch (permission) {
      case 'GetDiscussionsAll':
        checks.push('GetDiscussionsAll')
        break
    }
  } else if (typeof permission === 'object') {
    const key = Object.keys(permission)[0]
    switch (key) {
      case 'GetDiscussion':
        checks.push({ GetDiscussions: [Object.values(permission)[0]] })
        checks.push('GetDiscussionsAll')
        break
      case 'GetDiscussions':
        checks.push('GetDiscussionsAll')
        break
      case 'GetRfd':
        checks.push({ GetRfds: [Object.values(permission)[0]] })
        checks.push('GetRfdsAll')
        break
      case 'GetRfds':
        checks.push('GetRfdsAll')
        break
    }
  }

  return checks
}

function performCheck(permissions: RfdPermission[], check: RfdPermission): boolean {
  return (
    simplePermissionCheck(permissions, check) || listPermissionCheck(permissions, check)
  )
}

function simplePermissionCheck(
  permissions: RfdPermission[],
  check: RfdPermission,
): boolean {
  return permissions.some((p) => {
    switch (typeof p) {
      case 'string':
        return p === check
      case 'object':
        return (
          Object.keys(p)[0] === Object.keys(check)[0] &&
          permissionValue(p) === permissionValue(check)
        )
      default:
        return false
    }
  })
}

function listPermissionCheck(permissions: RfdPermission[], check: RfdPermission): boolean {
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

function permissionValue(permission: RfdPermission): number | number[] | undefined {
  switch (typeof permission) {
    case 'string':
      return undefined
    case 'object':
      return Object.values(permission)[0]
    default:
      return undefined
  }
}
