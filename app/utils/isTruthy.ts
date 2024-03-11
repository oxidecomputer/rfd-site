/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

type Truthy<T> = T extends false | '' | 0 | null | undefined ? never : T

/**
 * TS-friendly version of `Boolean` for when you want to filter for truthy
 * values. Use `.filter(isTruthy)` instead of `.filter(Boolean)`. See
 * [StackOverflow](https://stackoverflow.com/a/58110124/604986).
 */
export function isTruthy<T>(value: T): value is Truthy<T> {
  return !!value
}
