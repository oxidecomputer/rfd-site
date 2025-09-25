/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import { createCookieSessionStorage } from 'react-router'

function getSecrets(): string[] {
  // Locally we don't do authentication, so a hard-coded secret is fine. I
  // generated a nice one anyway. See `isAuthenticated` in auth.server.ts.
  if (process.env.NODE_ENV !== 'production') return ['kVP73HUTzqw2bNGYZ.rPmV']

  // in prod, crash if the session secret isn't defined
  if (!process.env.SESSION_SECRET) {
    throw Error('Env var SESSION_SECRET must be set in production')
  }

  return [process.env.SESSION_SECRET]
}

function sessionMaxAge(): number {
  if (process.env.SESSION_DURATION) {
    return parseInt(process.env.SESSION_DURATION)
  }

  return 60 * 60 * 24 * 14 // two weeks in seconds
}

export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: '_session',
    sameSite: 'lax', // this helps with CSRF
    path: '/', // remember to add this so the cookie will work in all routes
    httpOnly: true,
    secrets: getSecrets(),
    secure: process.env.NODE_ENV === 'production',
    maxAge: sessionMaxAge(),
  },
})
