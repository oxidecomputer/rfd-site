/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import { describe, expect, it } from 'vitest'

import { signUrl } from './storage.server'

const expiration = 1665719939
const keyName = 'key-name'
const key = 'random-key-string'

describe('Image url signing', () => {
  it('Handles simple filenames', () => {
    const url = 'https://oxide.computer/file.png'

    const signedUrl = signUrl(url, expiration, key, keyName)

    expect(signedUrl).toBe(
      'https://oxide.computer/file.png?Expires=1665719939&KeyName=key-name&Signature=jAfxkbTs53ZhIWxq9G8qEXKyiRo',
    )
  })

  it('Generates the same url independent of source url encoding', () => {
    // Use both the non-encoded and the encoded form of this url to ensure that either one can be
    // run through the signing step to generate the same valid url
    const url = 'https://oxide.computer/file with spaces.png'

    // This is the result of running `url` through `encodeURI`
    const encodedUrl = 'https://oxide.computer/file%20with%20spaces.png'

    const signedUrl = signUrl(url, expiration, key, keyName)
    const signedEncodedUrl = signUrl(encodedUrl, expiration, key, keyName)

    // Verify that the baseline url was signed correctly and encoded
    expect(signedUrl).toBe(
      'https://oxide.computer/file%20with%20spaces.png?Expires=1665719939&KeyName=key-name&Signature=kRxwhT3suBNu1giRQoVL_sabtVo',
    )

    // Verify that both the baseline url and the pre-encode url result in the same signed url
    expect(signedUrl).toBe(signedEncodedUrl)
  })
})
