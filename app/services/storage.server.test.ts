/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import { afterEach, describe, expect, it } from 'vitest'

import { getStorageProvider, getUrlTtl, signGcsUrl, signUrl } from './storage.server'

const expiration = 1665719939
const keyName = 'key-name'
const key = 'random-key-string'

describe('GCS url signing', () => {
  it('Handles simple filenames', () => {
    const url = 'https://oxide.computer/file.png'

    const signedUrl = signGcsUrl(url, expiration, key, keyName)

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

    const signedUrl = signGcsUrl(url, expiration, key, keyName)
    const signedEncodedUrl = signGcsUrl(encodedUrl, expiration, key, keyName)

    // Verify that the baseline url was signed correctly and encoded
    expect(signedUrl).toBe(
      'https://oxide.computer/file%20with%20spaces.png?Expires=1665719939&KeyName=key-name&Signature=kRxwhT3suBNu1giRQoVL_sabtVo',
    )

    // Verify that both the baseline url and the pre-encode url result in the same signed url
    expect(signedUrl).toBe(signedEncodedUrl)
  })

  it('signUrl is an alias for signGcsUrl', () => {
    expect(signUrl).toBe(signGcsUrl)
  })
})

describe('getStorageProvider', () => {
  const originalEnv = process.env.STORAGE_PROVIDER

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.STORAGE_PROVIDER
    } else {
      process.env.STORAGE_PROVIDER = originalEnv
    }
  })

  it('defaults to gcs when not set', () => {
    delete process.env.STORAGE_PROVIDER
    expect(getStorageProvider()).toBe('gcs')
  })

  it('returns gcs when set to gcs', () => {
    process.env.STORAGE_PROVIDER = 'gcs'
    expect(getStorageProvider()).toBe('gcs')
  })

  it('returns s3 when set to s3', () => {
    process.env.STORAGE_PROVIDER = 's3'
    expect(getStorageProvider()).toBe('s3')
  })

  it('is case insensitive', () => {
    process.env.STORAGE_PROVIDER = 'S3'
    expect(getStorageProvider()).toBe('s3')

    process.env.STORAGE_PROVIDER = 'GCS'
    expect(getStorageProvider()).toBe('gcs')
  })

  it('defaults to gcs for unknown values', () => {
    process.env.STORAGE_PROVIDER = 'azure'
    expect(getStorageProvider()).toBe('gcs')
  })
})

describe('getUrlTtl', () => {
  const originalEnv = process.env.STORAGE_URL_TTL

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.STORAGE_URL_TTL
    } else {
      process.env.STORAGE_URL_TTL = originalEnv
    }
  })

  it('returns default when not set', () => {
    delete process.env.STORAGE_URL_TTL
    expect(getUrlTtl(3600)).toBe(3600)
  })

  it('returns env value when set', () => {
    process.env.STORAGE_URL_TTL = '7200'
    expect(getUrlTtl(3600)).toBe(7200)
  })

  it('returns default for invalid values', () => {
    process.env.STORAGE_URL_TTL = 'invalid'
    expect(getUrlTtl(3600)).toBe(3600)

    process.env.STORAGE_URL_TTL = '-100'
    expect(getUrlTtl(3600)).toBe(3600)

    process.env.STORAGE_URL_TTL = '0'
    expect(getUrlTtl(3600)).toBe(3600)
  })
})
