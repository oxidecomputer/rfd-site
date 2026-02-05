/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import { redirect, type LoaderFunctionArgs } from 'react-router'

import { handleAuthenticationCallback, isProviderEnabled } from '~/services/auth.server'

export const loader = async ({ request }: LoaderFunctionArgs) => {
  if (!isProviderEnabled('github')) {
    throw redirect('/login')
  }
  return handleAuthenticationCallback('rfd-github', request)
}
