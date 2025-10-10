/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import { createCookie } from 'react-router'

export const returnToCookie = createCookie('_return_to', {
  sameSite: 'lax',
  path: '/',
  httpOnly: true,
  secrets: ['s3cr3t'],
  maxAge: 60 * 10, // 10 minutes
  secure: process.env.NODE_ENV === 'production',
})

export const themeCookie = createCookie('_theme', {
  sameSite: 'lax',
  path: '/',
  httpOnly: true,
  secrets: ['s3cr3t'],
  secure: process.env.NODE_ENV === 'production',
  maxAge: 60 * 60 * 24 * 365, // Keep cookie for a year
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
  secrets: ['s3cr3t'],
  secure: process.env.NODE_ENV === 'production',
  maxAge: 60 * 60 * 24 * 365, // Keep cookie for a year
})
