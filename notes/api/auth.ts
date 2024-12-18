/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */
if (!process.env.API_KEYS) {
  throw new Error('API_KEYS environment variable is required')
}

export const API_KEYS = new Set(process.env.API_KEYS.split(','))
