/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

/** only match and parse 1-4 digit numbers */
export const parseRfdNum = (s: string | undefined): number | null =>
  s && /^[0-9]{1,4}$/.test(s) ? parseInt(s, 10) : null

/** only match and parse 1-6 digit numbers */
export const parsePullNum = (s: string | undefined): number | null =>
  s && /^[0-9]{1,6}$/.test(s) ? parseInt(s, 10) : null
