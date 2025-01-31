/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */
export const PRESENCE_COLORS = [
  { fg: 'var(--base-green-800)', bg: 'var(--base-green-200)' },
  { fg: 'var(--base-yellow-800)', bg: 'var(--base-yellow-200)' },
  { fg: 'var(--base-blue-800)', bg: 'var(--base-blue-200)' },
  { fg: 'var(--base-purple-800)', bg: 'var(--base-purple-200)' },
] as const

/*
  Get a hash from users name and pick a colour from it
  For easy deterministic user colours
 */
export const getPresenceColor = (name: string) => {
  const hash = name.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc)
  }, 0)
  return PRESENCE_COLORS[Math.abs(hash) % PRESENCE_COLORS.length]
}
