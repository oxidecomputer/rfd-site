/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

// TODO: Can Remix do this logic for us?
const RFD_PATH = /^\/rfd\/[0-9]{1,4}$/

/**
 * Return `path` if allowed, otherwise fall back to `'/'`. The only
 * user-controlled values we trust are the index or a specific RFD.
 */
export function getUserRedirect(path: string | null): string {
  return path && (path === '/' || RFD_PATH.test(path)) ? path : '/'
}
