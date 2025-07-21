/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import { redirect, type ActionFunction, type LoaderFunction } from '@remix-run/node'

import { auth } from '~/services/auth.server'

export let loader: LoaderFunction = () => redirect('/login')

export let action: ActionFunction = ({ request }) => {
  return auth.authenticate('rfd-google', request)
}
