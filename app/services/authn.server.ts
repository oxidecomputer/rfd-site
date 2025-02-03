/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import type { RfdPermission } from '@oxide/rfd.ts/client'
import { redirect } from '@remix-run/server-runtime'
import { Authenticator } from 'remix-auth'

import { sessionStorage } from '~/services/session.server'
import { isTruthy } from '~/utils/isTruthy'
import { userIsInternal, type RfdScope } from '~/utils/rfdApi'
import {
  RfdApiStrategy,
  type RfdApiAccessToken,
  type RfdApiProfile,
} from '~/utils/rfdApiStrategy'

import { returnToCookie } from './cookies.server'
import { getUserRedirect } from './redirect.server'
import { isLocalMode } from './rfd.local.server'
import { client, fetchGroups, getGroups, getRfdApiUrl } from './rfd.remote.server'

export type AuthenticationService = 'github' | 'google' | 'local'

const scope: RfdScope[] = [
  'group:info:r',
  'rfd:content:r',
  'rfd:discussion:r',
  'search',
  'user:info:r',
]

export type User = {
  id: string
  authenticator: AuthenticationService
  email: string | null
  displayName: string | null
  token: string
  permissions: RfdPermission[]
  groups: string[]
  expiresAt: number
}

export type Group = {
  id: string
  name: string
  permissions: RfdPermission[]
}

export async function getUserPermissions(user: User): Promise<RfdPermission[]> {
  const groups = (await fetchGroups(user)).filter((group) =>
    user.groups.includes(group.name),
  )
  const allPermissions = user.permissions.concat(
    groups.flatMap((group) => group.permissions),
  )
  return allPermissions
}

async function parseUser(
  service: AuthenticationService,
  accessToken: string,
  profile: RfdApiProfile,
): Promise<User> {
  const parsedToken: RfdApiAccessToken = JSON.parse(
    Buffer.from(accessToken.split('.')[1] || '', 'base64').toString('utf8'),
  )
  const rfdClient = client(accessToken)
  const groups = await getGroups(rfdClient)

  return {
    id: profile._raw.info.id,
    authenticator: service,
    email: profile.emails?.[0].value || '',
    displayName: profile.displayName ?? null,
    token: accessToken,
    permissions: profile._raw.info.permissions,
    groups: profile._raw.info.groups
      .map((groupId) => {
        return groups.find((group) => group.id === groupId)?.name
      })
      .filter(isTruthy),
    expiresAt: parsedToken.exp,
  }
}

const auth = new Authenticator<User>(sessionStorage)

auth.use(
  new RfdApiStrategy(
    {
      host: getRfdApiUrl(),
      clientID: process.env.RFD_API_CLIENT_ID || '',
      clientSecret: process.env.RFD_API_CLIENT_SECRET || '',
      callbackURL: process.env.RFD_API_GOOGLE_CALLBACK_URL || '',
      remoteProvider: 'google',
      scope,
    },
    async ({ accessToken, profile }) => {
      return parseUser('google', accessToken, profile)
    },
  ),
)

auth.use(
  new RfdApiStrategy(
    {
      host: getRfdApiUrl(),
      clientID: process.env.RFD_API_CLIENT_ID || '',
      clientSecret: process.env.RFD_API_CLIENT_SECRET || '',
      callbackURL: process.env.RFD_API_GITHUB_CALLBACK_URL || '',
      remoteProvider: 'github',
      scope,
    },
    async ({ accessToken, profile }) => {
      return parseUser('github', accessToken, profile)
    },
  ),
)

async function isAuthenticated(
  request: Request,
  options?: {
    successRedirect?: never
    failureRedirect?: never
  },
): Promise<User | null>
async function isAuthenticated(
  request: Request,
  options: {
    successRedirect: string
    failureRedirect?: never
  },
): Promise<null>
async function isAuthenticated(
  request: Request,
  options: {
    successRedirect?: never
    failureRedirect: string
  },
): Promise<User>
async function isAuthenticated(request: Request, options: any): Promise<User | null> {
  if (isLocalMode()) {
    const user: User = {
      id: 'none',
      authenticator: 'local',
      email: 'local@oxide.computer',
      displayName: 'local',
      token: '',
      permissions: [],
      groups: [],
      expiresAt: 9999999999,
    }
    return Promise.resolve(user)
  } else {
    const user = await auth.isAuthenticated(request, options)
    return user
  }
}

function handleNotesAccess(user: User | null) {
  if (!user) {
    throw new Response('User not found', { status: 401 })
  }

  const isInternal = userIsInternal(user)
  if (!isInternal) {
    throw new Response('User not found', { status: 401 })
  }

  if (user?.authenticator === 'github') {
    return redirect('/notes/auth')
  }
  return null
}

async function handleAuthenticationCallback(provider: string, request: Request) {
  const cookie = request.headers.get('Cookie')
  const returnTo: string | null = await returnToCookie.parse(cookie)

  return auth.authenticate(provider, request, {
    successRedirect: getUserRedirect(returnTo),
    failureRedirect: '/login',
  })
}

export { auth, isAuthenticated, handleAuthenticationCallback, handleNotesAccess }
