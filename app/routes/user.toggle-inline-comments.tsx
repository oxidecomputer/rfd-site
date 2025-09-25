/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import { data, type ActionFunction } from 'react-router'

import { inlineCommentsCookie } from '~/services/cookies.server'

export const action: ActionFunction = async ({ request }) => {
  let showInlineComments =
    (await inlineCommentsCookie.parse(request.headers.get('Cookie'))) ?? true

  let headers = new Headers({ 'Cache-Control': 'no-cache' })
  const newVal = await inlineCommentsCookie.serialize(showInlineComments === false)
  headers.append('Set-Cookie', newVal)

  return data(null, { headers })
}
