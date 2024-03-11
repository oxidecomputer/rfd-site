/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

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

  const url = `${process.env.RFD_API}/${path.replace(/^\//, '')}`
  console.info(`Requesting ${url} from the RFD API`)

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
