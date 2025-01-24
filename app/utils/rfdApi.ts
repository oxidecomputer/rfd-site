/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import { type User } from '~/services/authn.server'

export type RfdScope =
  | 'user:info:r'
  | 'user:info:w'
  | 'user:provider:w'
  | 'user:token:r'
  | 'user:token:w'
  | 'group:info:r'
  | 'group:info:w'
  | 'group:membership:w'
  | 'mapper:r'
  | 'mapper:w'
  | 'rfd:content:r'
  | 'rfd:discussion:r'
  | 'search'
  | 'oauth:client:r'
  | 'oauth:client:w'
  | 'mlink:client:r'
  | 'mlink:client:w'

export type RfdApiProvider = 'google' | 'github'

// This is an incomplete type, it contains only the permission types that we need to perform
// internal checks against
export type RfdApiPermission =
  | 'GetDiscussionsAll'
  | { GetRfd: number }
  | { GetRfds: number[] }
  | 'GetRfdsAll'
  | 'SearchRfds'

export type RfdResponse = {
  id: string
  rfd_number: number
  link: string | null
  discussion: string | null
  title: string
  state: string
  authors: string
  labels: string
  content: string
  sha: string
  commit: string
  committed_at: string
  pdfs: {
    source: string
    link: string
  }[]
  visibility: 'private' | 'public'
}

export type RfdListResponseItem = {
  id: string
  rfd_number: number
  link: string | null
  discussion: string | null
  title: string
  state: string
  authors: string
  labels: string
  sha: string
  commit: string
  committed_at: string
  visibility: 'private' | 'public'
}

export type GroupResponse = {
  id: string
  name: string
  permissions: RfdApiPermission[]
  created_at: string
  updated_at: string
  deleted_at: string
}

export const userIsInternal = (user: User | null) =>
  user ? user.groups.some((group) => group === 'oxide-employee') : false
