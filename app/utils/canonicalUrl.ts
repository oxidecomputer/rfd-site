/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

export const SITE_URL = 'https://rfd.shared.oxide.computer'

/**
 * Format an RFD number as a zero-padded 4-digit string (e.g., 53 -> "0053")
 */
export const formatRfdNum = (num: number): string => num.toString().padStart(4, '0')

/**
 * Generate the canonical URL for an RFD page
 */
export const canonicalRfdUrl = (num: number): string =>
  `${SITE_URL}/rfd/${formatRfdNum(num)}`

/**
 * Generate a canonical URL for a given path (strips query params)
 */
export const canonicalUrl = (path: string): string => `${SITE_URL}${path}`
