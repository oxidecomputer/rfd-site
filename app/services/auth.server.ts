/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import {
  RfdOAuthStrategy,
  type ExpiringUser,
  type RfdVerifyCallback,
} from '@oxide/remix-auth-rfd'
import type { RfdPermission } from '@oxide/rfd.ts/client'
import { decode } from 'jsonwebtoken'
import { redirect } from 'react-router'
import { Authenticator } from 'remix-auth'

import { isTruthy } from '~/utils/isTruthy'

import { returnToCookie } from './cookies.server'
import { client, fetchRemoteGroups, handleApiResponse } from './rfd.remote.server'
import { sessionStorage } from './session.server'

export type User = {
  id: string
  email?: string
  displayName?: string
  token: string
  permissions: RfdPermission[]
  groups: string[]
} & ExpiringUser

const auth = new Authenticator<User>()

const verify: RfdVerifyCallback<User> = async ({ tokens }) => {
  const accessToken = tokens.accessToken()

  // We are decoding the token here without verifying. This is safe to do as we are not relying
  // on it for anything user facing. The only value we are interested in is the expiration. If
  // an externally controlled token were to be provided (ignoring the fact that it would fail on
  // calls to rfd), the only effect it could have is to change to session expiration. This
  // is not an issue as the actual expiration check occurs on the rfd server
  const decodedToken = decode(accessToken, { complete: true, json: true })

  try {
    const rfd = client(accessToken)
    const apiUser = handleApiResponse(await rfd.methods.getSelf({}))
    const groups = handleApiResponse(await await rfd.methods.getGroups({}))

    const emails = [...new Set(apiUser.providers.flatMap((provider) => provider.emails))]
    const email = emails[0]
    const displayNames = [
      ...new Set(apiUser.providers.flatMap((provider) => provider.displayNames)),
    ]
    const displayName = displayNames[0]

    if (typeof decodedToken?.payload === 'string') {
      throw new Error('Invalid token payload')
    }

    const expiresAt = new Date((decodedToken?.payload.exp ?? 0) * 1000)

    let user: User = {
      id: apiUser.info.id,
      email,
      displayName,
      token: accessToken,
      permissions: apiUser.info.permissions,
      groups: apiUser.info.groups
        .map((groupId) => {
          return groups.find((group) => group.id === groupId)?.name
        })
        .filter(isTruthy),
      expiresAt,
    }

    return user
  } catch (err) {
    console.error('Failed to generate user', err)
    throw err
  }
}

const googleOAuth = new RfdOAuthStrategy(
  {
    host: process.env.RFD_HOST || '',
    clientId: process.env.RFD_API_CLIENT_ID || '',
    clientSecret: process.env.RFD_API_CLIENT_SECRET || '',
    redirectURI: process.env.RFD_API_GOOGLE_CALLBACK_URL || '',
    remoteProvider: 'google',
    scopes: ['group:info:r', 'rfd:content:r', 'rfd:discussion:r', 'search', 'user:info:r'],
  },
  verify,
)
auth.use(googleOAuth)

const githubOAuth = new RfdOAuthStrategy(
  {
    host: process.env.RFD_HOST || '',
    clientId: process.env.RFD_API_CLIENT_ID || '',
    clientSecret: process.env.RFD_API_CLIENT_SECRET || '',
    redirectURI: process.env.RFD_API_GITHUB_CALLBACK_URL || '',
    remoteProvider: 'github',
    scopes: ['group:info:r', 'rfd:content:r', 'rfd:discussion:r', 'search', 'user:info:r'],
  },
  verify,
)
auth.use(githubOAuth)

export async function getUserFromSession(request: Request): Promise<User | null> {
  const session = await sessionStorage.getSession(request.headers.get('Cookie'))
  const user = session.get('user')
  return user
}

export async function authenticate(request: Request) {
  return await getUserFromSession(request)
}

export async function logout(request: Request, redirectTo: string) {
  const session = await sessionStorage.getSession(request.headers.get('Cookie'))
  session.unset('user')
  throw redirect(redirectTo, {
    headers: { 'Set-Cookie': await sessionStorage.commitSession(session) },
  })
}

async function handleAuthenticationCallback(provider: string, request: Request) {
  const session = await sessionStorage.getSession(request.headers.get('cookie'))
  let user

  try {
    user = await auth.authenticate(provider, request)
    session.set('user', user)
  } catch (err) {
    console.error('Failed to authenticate', err)
    throw redirect('/login')
  }

  const cookie = request.headers.get('Cookie')
  const returnTo: string | null = await returnToCookie.parse(cookie)

  throw redirect(returnTo ? sanitizeRedirect(returnTo) : '/', {
    headers: {
      'Set-Cookie': await sessionStorage.commitSession(session, {
        expires: user.expiresAt,
      }),
    },
  })
}

export { auth, handleAuthenticationCallback }

const RFD_PATH = /^\/rfd\/[0-9]{0-3}\??.*$/

function sanitizeRedirect(path: string): string {
  const decoded = decodeURIComponent(path)

  // Allow direct links to RFDs
  if (RFD_PATH.test(decoded)) {
    return decoded
  }

  // Allow url params for the index
  if (decoded.startsWith('?')) {
    let params = new URLSearchParams(decoded)
    return `/?${params.toString()}`
  }

  // If all else fails return to the index
  return '/'
}

export async function getUserPermissions(user: User): Promise<RfdPermission[]> {
  const groups = (await fetchRemoteGroups(user)).filter((group) =>
    user.groups.includes(group.name),
  )
  const allPermissions = user.permissions.concat(
    groups.flatMap((group) => group.permissions),
  )
  return allPermissions
}
