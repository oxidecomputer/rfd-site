/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */
export const PRESENCE_COLORS = [
  { fg: '#48D597', bg: '#162322' }, // green-800, green-200
  { fg: '#F5B944', bg: '#292013' }, // yellow-800, yellow-200
  { fg: '#8BA1FF', bg: '#1E202D' }, // blue-800, blue-200
  { fg: '#BE95EB', bg: '#251F2B' }, // purple-800, purple-200
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
