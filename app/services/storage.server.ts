/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { createHmac } from 'crypto'

export type StorageProvider = 'gcs' | 's3'

/**
 * Get the configured storage provider from environment.
 * Defaults to 'gcs' for backwards compatibility.
 */
export function getStorageProvider(): StorageProvider {
  const provider = process.env.STORAGE_PROVIDER?.toLowerCase()
  if (provider === 's3') return 's3'
  return 'gcs'
}

/**
 * Get the configured URL TTL in seconds from environment.
 * Falls back to the provided default if not set.
 */
export function getUrlTtl(defaultTtl: number): number {
  const envTtl = process.env.STORAGE_URL_TTL
  if (envTtl) {
    const parsed = parseInt(envTtl, 10)
    if (!isNaN(parsed) && parsed > 0) {
      return parsed
    }
  }
  return defaultTtl
}

/**
 * Generate a pre-signed URL for accessing a storage object.
 * Uses the configured STORAGE_PROVIDER to determine which backend to use.
 */
export async function getExpiringUrl(path: string, ttlInSeconds: number): Promise<string> {
  const provider = getStorageProvider()
  const ttl = getUrlTtl(ttlInSeconds)

  if (provider === 's3') {
    return getS3ExpiringUrl(path, ttl)
  } else {
    return getGcsExpiringUrl(path, ttl)
  }
}

/**
 * Generate a pre-signed URL for S3.
 * Uses the default AWS credential chain and standard AWS environment variables
 * for region (AWS_REGION) and endpoint (AWS_ENDPOINT_URL).
 *
 * Required environment variables:
 * - S3_BUCKET: The S3 bucket name
 */
export async function getS3ExpiringUrl(path: string, ttlInSeconds: number): Promise<string> {
  const bucket = process.env.S3_BUCKET

  if (!bucket) {
    throw new Error('Unable to generate S3 URLs without S3_BUCKET configured')
  }

  const client = new S3Client({})

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: path,
  })

  return getSignedUrl(client, command, { expiresIn: ttlInSeconds })
}

/**
 * Generate a pre-signed URL for GCS CDN.
 * This is the original implementation using HMAC-SHA1 signing.
 */
export function getGcsExpiringUrl(path: string, ttlInSeconds: number): string {
  const expiration = Math.floor(Date.now() / 1000) + ttlInSeconds
  const storageUrl = process.env.STORAGE_URL
  const signingKey = process.env.STORAGE_KEY
  const signingKeyName = process.env.STORAGE_KEY_NAME
  const url = storageUrl + '/' + path

  return signGcsUrl(url, expiration, signingKey, signingKeyName)
}

// The signing process is described by https://cloud.google.com/cdn/docs/using-signed-urls#programmatically_creating_signed_urls
export function signGcsUrl(
  url: string,
  expiration: number,
  signingKey: string | undefined,
  signingKeyName: string | undefined,
): string {
  if (!signingKey) {
    throw new Error('Unable to generate image urls without a STORAGE_KEY configured')
  }

  if (!signingKeyName) {
    throw new Error('Unable to generate image urls without a STORAGE_KEY_NAME configured')
  }

  const key = Buffer.from(signingKey, 'base64')
  const encodedUrl = encodeURI(decodeURI(url))

  const urlToSign = `${encodedUrl}?Expires=${expiration}&KeyName=${signingKeyName}`
  const sig = createHmac('sha1', key).update(urlToSign).digest('base64')
  const cleanedSignature = sig.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')

  return `${urlToSign}&Signature=${cleanedSignature}`
}

/**
 * @deprecated Use signGcsUrl instead. Kept for backwards compatibility with tests.
 */
export const signUrl = signGcsUrl
