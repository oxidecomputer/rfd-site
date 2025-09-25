/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import { createHmac } from 'crypto'

export function getExpiringUrl(path: string, ttlInSeconds: number): string {
  const expiration = Math.floor(Date.now() / 1000) + ttlInSeconds
  const storageUrl = process.env.STORAGE_URL
  const signingKey = process.env.STORAGE_KEY
  const signingKeyName = process.env.STORAGE_KEY_NAME
  const url = storageUrl + '/' + path

  return signUrl(url, expiration, signingKey, signingKeyName)
}

// The signing process is described by https://cloud.google.com/cdn/docs/using-signed-urls#programmatically_creating_signed_urls
export function signUrl(
  url: string,
  expiration: number,
  signingKey: string | undefined,
  signingKeyName: string | undefined,
): string {
  if (!signingKey) {
    throw new Error('Unable to generate image urls without a SIGNING_KEY configured')
  }

  if (!signingKeyName) {
    throw new Error('Unable to generate image urls without a SIGNING_KEY_NAME configured')
  }

  const key = Buffer.from(signingKey, 'base64')
  const encodedUrl = encodeURI(decodeURI(url))

  const urlToSign = `${encodedUrl}?Expires=${expiration}&KeyName=${signingKeyName}`
  const sig = createHmac('sha1', key).update(urlToSign).digest('base64')
  const cleanedSignature = sig.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')

  return `${urlToSign}&Signature=${cleanedSignature}`
}
