/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import { isLocalMode } from './rfd.server'

export function getRfdApiUrl(): string {
  // If we are loading in local mode, then the API is not used, and it is fine to return
  // and invalid value
  if (isLocalMode) {
    return ''
  }

  // Otherwise crash the system if we do not have an API target set
  if (!process.env.RFD_API) {
    throw Error('Env var RFD_API must be set when not running in local mode')
  }

  return process.env.RFD_API
}

export async function apiRequest<T>(
  path: string,
  accessToken: string | undefined,
): Promise<T> {
  let headers: HeadersInit = {
    'content-type': 'application/json',
  }

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`
  }

  const url = `${getRfdApiUrl()}/${path.replace(/^\//, '')}`
  const response = await fetch(url, { headers })

  if (!response.ok) {
    const error = await response.text()
    console.error(
      'Request to the RFD API failed',
      response.statusText,
      response.status,
      error,
    )
    throw new Response(response.statusText, { status: response.status })
  }

  return await response.json()
}
