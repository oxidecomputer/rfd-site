/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import { createCookie } from 'react-router'

const cookieSecret = process.env.COOKIE_SECRET || 's3cr3t'

export const returnToCookie = createCookie('_return_to', {
  sameSite: 'lax',
  path: '/',
  httpOnly: true,
  secrets: [cookieSecret],
  maxAge: 60 * 10, // 10 minutes
  secure: process.env.NODE_ENV === 'production',
})

export const rfdSortCookie = createCookie('rfdSort', {
  sameSite: 'lax',
  path: '/',
  httpOnly: true,
  maxAge: 60 * 60 * 24 * 365, // Keep cookie for a year
})

export const inlineCommentsCookie = createCookie('_inline_comments', {
  sameSite: 'lax',
  path: '/',
  httpOnly: true,
  secrets: [cookieSecret],
  secure: process.env.NODE_ENV === 'production',
  maxAge: 60 * 60 * 24 * 365, // Keep cookie for a year
})
