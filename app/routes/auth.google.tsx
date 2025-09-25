/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import { redirect, type ActionFunction, type LoaderFunction } from 'react-router'

import { auth } from '~/services/auth.server'

export const loader: LoaderFunction = () => redirect('/login')

export const action: ActionFunction = ({ request }) => {
  return auth.authenticate('rfd-google', request)
}
