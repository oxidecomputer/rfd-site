/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import type {
  AccessGroup_for_RfdPermission,
  Api,
  ApiResult,
  RfdWithoutContent,
  RfdWithRaw,
  SearchResults,
  SearchRfdsQueryParams,
} from '@oxide/rfd.ts/client'
import { ApiWithRetry } from '@oxide/rfd.ts/client-retry'

import type { User } from './authn.server'

export abstract class HttpError extends Error {
  public abstract readonly status: number
}

export class ApiError extends HttpError {
  public readonly status: number = 500
}
export class AuthenticationError extends Error {
  public readonly status: number = 401
}
export class AuthorizationError extends Error {
  public readonly status: number = 403
}
export class ClientError extends Error {}
export class InvalidArgumentError extends Error {
  public readonly status: number = 400
}
export class UnauthenticatedError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UnauthenticatedError'
  }
}

export function isHttpError(error: Error): error is HttpError {
  return !!(error as HttpError).status
}

export function getRfdApiUrl(): string {
  // Otherwise crash the system if we do not have an API target set
  if (!process.env.RFD_API) {
    throw Error('Env var RFD_API must be set when not running in local mode')
  }

  return process.env.RFD_API
}

export function client(token?: string): Api {
  return new ApiWithRetry({
    host: getRfdApiUrl(),
    token,
    baseParams: {
      headers: { Connection: 'keep-alive' },
    },
  })
}

export async function fetchGroups(
  user: User | null,
): Promise<AccessGroup_for_RfdPermission[]> {
  return await getGroups(client(user?.token || undefined))
}
export async function getGroups(rfdClient: Api): Promise<AccessGroup_for_RfdPermission[]> {
  const result = await rfdClient.methods.getGroups({})
  return handleApiResponse(result)
}

export async function fetchRemoteRfd(
  num: number,
  user: User | null,
): Promise<RfdWithRaw | undefined> {
  const rfdClient = client(user?.token || undefined)
  return await getRemoteRfd(rfdClient, num)
}
export async function getRemoteRfd(
  rfdClient: Api,
  num: number,
): Promise<RfdWithRaw | undefined> {
  const result = await rfdClient.methods.viewRfd({ path: { number: num.toString() } })

  if (result.response.status === 404) {
    return undefined
  } else {
    return handleApiResponse(result)
  }
}

export async function fetchRemoteRfds(user: User | null): Promise<RfdWithoutContent[]> {
  const rfdClient = client(user?.token || undefined)
  return await getRemoteRfds(rfdClient)
}
export async function getRemoteRfds(rfdClient: Api): Promise<RfdWithoutContent[]> {
  const result = await rfdClient.methods.listRfds({})
  return handleApiResponse(result)
}

export async function searchRfds(
  user: User | null,
  params: IterableIterator<[string, string]>,
): Promise<SearchResults> {
  const rfdClient = client(user?.token || undefined)
  const query: SearchRfdsQueryParams = { q: '' }

  for (let [k, v] of params) {
    switch (k) {
      case 'q':
        query.q = v
      case 'attributes_to_crop':
        query.attributesToCrop = v
      case 'highlight_pre_tag':
        query.highlightPreTag = v
      case 'highlight_post_tag':
        query.highlightPostTag = v
    }
  }

  const result = await rfdClient.methods.searchRfds({ query })
  return handleApiResponse(result)
}

function handleApiResponse<T>(response: ApiResult<T>): T {
  if (response.type === 'success') {
    return response.data
  } else if (response.type === 'client_error') {
    console.error('Failed attempting to send request to rfd server', response)
    throw response.error as ClientError
  } else {
    if (response.response.status === 401) {
      console.error('User is not authenticated', response)
      throw new AuthenticationError(response.data.message)
    } else if (response.response.status === 403) {
      console.error('User is not authorized', response)
      throw new AuthorizationError(response.data.message)
    } else {
      console.error('Request to rfd server failed', response)
      throw new ApiError(response.data.message)
    }
  }
}
