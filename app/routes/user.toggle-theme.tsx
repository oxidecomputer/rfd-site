/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import { data, type ActionFunction } from 'react-router'

import { themeCookie } from '~/services/cookies.server'

export const action: ActionFunction = async ({ request }) => {
  const currentTheme =
    (await themeCookie.parse(request.headers.get('Cookie'))) ?? 'dark-mode'

  const headers = new Headers()
  headers.append('Cache-Control', 'no-cache')
  headers.append(
    'Set-Cookie',
    await themeCookie.serialize(currentTheme === 'light-mode' ? 'dark-mode' : 'light-mode'),
  )

  return data(null, { headers })
}
