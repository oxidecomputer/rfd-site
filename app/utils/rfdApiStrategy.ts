/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import type { RfdPermission } from '@oxide/rfd.ts/client'
import { redirect, type SessionData, type SessionStorage } from '@remix-run/node'
import type { AuthenticateOptions, StrategyVerifyCallback } from 'remix-auth'
import {
  OAuth2Strategy,
  type OAuth2Profile,
  type OAuth2StrategyVerifyParams,
} from 'remix-auth-oauth2'

import type { RfdApiProvider, RfdScope } from './rfdApi'

export type RfdApiStrategyOptions = {
  host: string
  clientID: string
  clientSecret: string
  callbackURL: string
  remoteProvider: RfdApiProvider
  /**
   * @default "rfd:content:r rfd:discussion:r search user:info:r"
   */
  scope?: RfdScope[] | string
}

export type RfdApiAccessToken = {
  iss: string
  aud: string
  sub: string
  prv: string
  scp: string[]
  exp: number
  nbf: number
  jti: string
}

type RfdApiProfileResponse = {
  info: {
    id: string
    groups: string[]
    permissions: RfdPermission[]
    created_at: string
  }
  providers: {
    id: string
    api_user_id: string
    provider: string
    provider_id: string
    emails: string[]
    display_names: string[]
    created_at: string
    updated_at: string
  }[]
}

export type ExpiringUser = {
  expiresAt: number
}

export type RfdApiProfile = {
  _raw: RfdApiProfileResponse
} & OAuth2Profile

export type RfdApiExtraParams = {
  token_type: string
  expires_in: number
} & Record<string, string | number>

export const RfdApiStrategyScopeSeparator = ' '
export const RfdApiStrategyDefaultScopes = [
  'rfd:content:r',
  'rfd:discussion:r',
  'search',
  'user:info:r',
].join(RfdApiStrategyScopeSeparator)
export const RfdApiStrategyDefaultName = 'rfd-api'

export class RfdApiStrategy<User extends ExpiringUser> extends OAuth2Strategy<
  User,
  RfdApiProfile,
  RfdApiExtraParams
> {
  public name = `rfd-api`
  protected userInfoUrl = ``

  constructor(
    {
      host,
      clientID,
      clientSecret,
      callbackURL,
      remoteProvider,
      scope,
    }: RfdApiStrategyOptions,
    verify: StrategyVerifyCallback<
      User,
      OAuth2StrategyVerifyParams<RfdApiProfile, RfdApiExtraParams>
    >,
  ) {
    super(
      {
        clientID,
        clientSecret,
        callbackURL,
        authorizationURL: `${host}/login/oauth/${remoteProvider}/code/authorize`,
        tokenURL: `${host}/login/oauth/${remoteProvider}/code/token`,
      },
      verify,
    )
    this.name = `${this.name}-${remoteProvider}`
    this.scope = this.parseScope(scope)
    this.userInfoUrl = `${host}/self`
  }

  protected authorizationParams(): URLSearchParams {
    const params = new URLSearchParams()
    return params
  }

  protected async userProfile(accessToken: string): Promise<RfdApiProfile> {
    const response = await fetch(this.userInfoUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    const body: RfdApiProfileResponse = await response.json()
    const emails = [...new Set(body.providers.flatMap((provider) => provider.emails))]
    const displayNames = [
      ...new Set(body.providers.flatMap((provider) => provider.display_names)),
    ]

    const profile: RfdApiProfile = {
      provider: 'rfd-api',
      id: body.info.id,
      emails: emails.map((email) => ({ value: email })),
      displayName: displayNames[0],
      _raw: body,
    }

    return profile
  }

  // Allow users the option to pass a scope string, or typed array
  private parseScope(scope: RfdApiStrategyOptions['scope']) {
    if (!scope) {
      return RfdApiStrategyDefaultScopes
    } else if (Array.isArray(scope)) {
      return scope.join(RfdApiStrategyScopeSeparator)
    }

    return scope
  }

  protected async success(
    user: User,
    request: Request,
    sessionStorage: SessionStorage<SessionData, SessionData>,
    options: AuthenticateOptions,
  ): Promise<User> {
    // if a successRedirect is not set, we return the user
    if (!options.successRedirect) return user

    let session = await sessionStorage.getSession(request.headers.get('Cookie'))

    // if we do have a successRedirect, we redirect to it and set the user
    // in the session sessionKey
    session.set(options.sessionKey, user)
    session.set(options.sessionStrategyKey, options.name ?? this.name)
    throw redirect(options.successRedirect, {
      headers: {
        'Set-Cookie': await sessionStorage.commitSession(session, {
          // expiresAt is the point in time (in seconds) at which the user's session expires. We need
          // to turn this in to the number of seconds that this session is valid for. We also always
          // want the session token to expire before the user's api token expires
          maxAge: user.expiresAt - Date.now() / 1000 - 60,
        }),
      },
    })
  }
}
